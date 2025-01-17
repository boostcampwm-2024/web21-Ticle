import { UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { types } from 'mediasoup';
import { Socket } from 'socket.io';
import { SOCKET_EVENTS, STREAM_STATUS } from '@repo/mediasoup';
import type { client, server } from '@repo/mediasoup';

import { MediasoupService } from '@/mediasoup/mediasoup.service';
import { RecordService } from '@/record/record.service';
import { RoomService } from '@/room/room.service';
import { WSExceptionFilter } from '@/wsException.filter';

@WebSocketGateway()
@UseFilters(WSExceptionFilter)
export class SignalingGateway implements OnGatewayDisconnect {
  constructor(
    private mediasoupService: MediasoupService,
    private recordService: RecordService,
    private roomService: RoomService
  ) {}

  @SubscribeMessage(SOCKET_EVENTS.createRoom)
  async handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody('roomId') roomId: string) {
    await this.mediasoupService.createRoom(roomId, client.id);
    return { roomId };
  }

  @SubscribeMessage(SOCKET_EVENTS.joinRoom)
  joinRoom(@ConnectedSocket() client: Socket, @MessageBody() joinRoomDto: server.JoinRoomDto) {
    const { roomId, nickname } = joinRoomDto;
    const rtpCapabilities = this.mediasoupService.joinRoom(roomId, client.id, nickname);
    client.join(roomId);
    client.to(roomId).emit(SOCKET_EVENTS.newPeer, { peerId: client.id, nickname });
    return { rtpCapabilities };
  }

  @SubscribeMessage(SOCKET_EVENTS.createTransport)
  async createTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() createTransportDto: server.CreateTransportDto
  ): Promise<client.CreateTransportRes> {
    const transportOptions = await this.mediasoupService.createTransport(
      createTransportDto.roomId,
      client.id
    );
    return transportOptions;
  }

  @SubscribeMessage(SOCKET_EVENTS.connectTransport)
  async connectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() connectTransportDto: server.ConnectTransportDto
  ) {
    const socketId = client.id;
    const { transportId, dtlsParameters, roomId } = connectTransportDto;

    await this.mediasoupService.connectTransport(dtlsParameters, transportId, roomId, socketId);

    return { message: 'success' };
  }

  @SubscribeMessage(SOCKET_EVENTS.produce)
  async handleProduce(
    @ConnectedSocket() client: Socket,
    @MessageBody() createProducerDto: server.CreateProducerDto
  ) {
    const { transportId, kind, rtpParameters, roomId, appData } = createProducerDto;

    const producerData = await this.mediasoupService.produce(
      client.id,
      kind,
      rtpParameters,
      transportId,
      roomId,
      appData
    );

    const createProducerRes = {
      producerId: producerData.producerId,
      peerId: client.id,
      nickname: producerData.nickname,
      kind,
      appData,
      paused: producerData.paused,
    };

    client.to(roomId).emit(SOCKET_EVENTS.newProducer, createProducerRes);

    return createProducerRes;
  }

  @SubscribeMessage(SOCKET_EVENTS.getProducers)
  getProducers(
    @ConnectedSocket() client: Socket,
    @MessageBody() getProducerDto: server.GetProducersDto
  ) {
    const { roomId } = getProducerDto;
    return this.mediasoupService.getProducers(roomId, client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const roomId = this.mediasoupService.disconnect(client.id);
    const isMaster = this.roomService.checkIsMaster(roomId, client.id);
    if (isMaster) {
      client.to(roomId).emit(SOCKET_EVENTS.roomClosed);
      this.recordService.stopRecord(roomId);
      this.mediasoupService.closeRoom(roomId);
      return;
    }

    const isOpen = this.roomService.checkRoomIsOpen(roomId);
    if (isOpen) {
      client.to(roomId).emit(SOCKET_EVENTS.peerLeft, { peerId: client.id });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.closeProducer)
  closeProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
    @MessageBody('producerId') producerId: string
  ) {
    this.mediasoupService.closeProducer(roomId, producerId, client.id);

    client.to(roomId).emit(SOCKET_EVENTS.producerClosed, { producerId });
  }

  @SubscribeMessage(SOCKET_EVENTS.producerStatusChange)
  pauseProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeProducerState: server.ChangeProducerStateDto
  ) {
    const { roomId, producerId, status } = changeProducerState;

    this.mediasoupService.changeProducerStatus(client.id, changeProducerState);

    if (status === STREAM_STATUS.pause) {
      client.to(roomId).emit(SOCKET_EVENTS.producerPaused, { producerId });
    } else {
      client.to(roomId).emit(SOCKET_EVENTS.producerResumed, { producerId });
    }

    return { producerId };
  }

  @SubscribeMessage(SOCKET_EVENTS.consume)
  async handleConsume(
    @ConnectedSocket() client: Socket,
    @MessageBody() createConsumerDto: server.CreateConsumerDto
  ): Promise<client.CreateConsumerRes> {
    return this.mediasoupService.consume(client.id, createConsumerDto);
  }

  @SubscribeMessage(SOCKET_EVENTS.createConsumers)
  async createConsumers(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
    @MessageBody('transportId') transportId: string,
    @MessageBody('rtpCapabilities') rtpCapabilities: types.RtpCapabilities
  ) {
    const producers = this.mediasoupService.getProducers(roomId, client.id);

    return this.mediasoupService.createConsumers({
      roomId,
      socketId: client.id,
      producers,
      rtpCapabilities,
      transportId,
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.pauseConsumers)
  pauseConsumers(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
    @MessageBody('consumerIds') consumerIds: string[]
  ) {
    return this.mediasoupService.pauseConsumers(client.id, roomId, consumerIds);
  }

  @SubscribeMessage(SOCKET_EVENTS.resumeConsumers)
  resumeConsumers(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
    @MessageBody('consumerIds') consumerIds: string[]
  ) {
    return this.mediasoupService.resumeConsumers(client.id, roomId, consumerIds);
  }

  @SubscribeMessage(SOCKET_EVENTS.closeRoom)
  closeMeetingRoom(@ConnectedSocket() client: Socket, @MessageBody('roomId') roomId: string) {
    client.to(roomId).emit(SOCKET_EVENTS.roomClosed);
    this.roomService.setRoomIsOpen(roomId, false);
  }

  @SubscribeMessage(SOCKET_EVENTS.startRecord)
  async startRecord(@ConnectedSocket() client: Socket, @MessageBody('roomId') roomId: string) {
    await this.recordService.startRecord(roomId, client.id);
  }

  @SubscribeMessage(SOCKET_EVENTS.stopRecord)
  stopRecord(@MessageBody('roomId') roomId: string) {
    this.recordService.stopRecord(roomId);
  }

  @SubscribeMessage(SOCKET_EVENTS.pauseRecord)
  pauseRecord(@MessageBody('roomId') roomId: string) {
    this.recordService.pauseRecord(roomId);
  }

  @SubscribeMessage(SOCKET_EVENTS.resumeRecord)
  resumeRecord(@MessageBody('roomId') roomId: string) {
    this.recordService.resumeRecord(roomId);
  }
  @SubscribeMessage(SOCKET_EVENTS.getIsRecording)
  getIsRecording(@MessageBody('roomId') roomId: string) {
    const isRecording = this.recordService.getIsRecording(roomId);
    return { isRecording };
  }

  @SubscribeMessage(SOCKET_EVENTS.changeConsumerPreferredLayers)
  changeConsumerPreferredLayers(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
    @MessageBody('networkQualities') data: server.NetworkQualityDto[]
  ) {
    return this.mediasoupService.changeConsumerPreferredLayers(client.id, roomId, data);
  }
}
