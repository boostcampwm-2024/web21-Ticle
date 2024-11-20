import * as os from 'os';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as mediasoup from 'mediasoup';
import { types } from 'mediasoup';
import { Worker } from 'mediasoup/node/lib/types';

import { RoomService } from '@/room/room.service';

import { MediaTypes, PRODUCER_STATUS, server } from '@repo/mediasoup';
import { MediasoupConfig } from './config';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private nextWorkerIndex = 0;
  private workers: Worker[] = [];

  constructor(
    private roomService: RoomService,
    private mediasoupConfig: MediasoupConfig
  ) {}

  async onModuleInit() {
    const numWorkers = os.cpus().length;
    for (let i = 0; i < numWorkers; ++i) {
      await this.createWorker();
    }
  }

  private async createWorker() {
    const worker = await mediasoup.createWorker(this.mediasoupConfig.worker);

    worker.on('died', () => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000);
    });

    this.workers.push(worker);
    return worker;
  }

  getWorker() {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  async createRoom(roomId: string) {
    const isExistRoom = this.roomService.existRoom(roomId);
    if (isExistRoom) {
      return roomId;
    }

    const worker = this.getWorker();
    const router = await worker.createRouter({
      mediaCodecs: this.mediasoupConfig.router.mediaCodecs,
    });

    return this.roomService.createRoom(roomId, router);
  }

  joinRoom(roomId: string, socketId: string) {
    const room = this.roomService.getRoom(roomId);
    if (room.hasPeer(socketId)) {
      throw new WsException(`Peer ${socketId} already exists`);
    }
    room.addPeer(socketId);

    return room.getRouter().rtpCapabilities;
  }

  async createTransport(roomId: string, socketId: string) {
    const room = this.roomService.getRoom(roomId);
    const router = room.getRouter();
    const transport = await router.createWebRtcTransport(this.mediasoupConfig.webRtcTransport);
    room.getPeer(socketId).addTransport(transport);

    return {
      transportId: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async connectTransport(
    dtlsParameters: types.DtlsParameters,
    transportId: string,
    roomId: string,
    socketId: string
  ) {
    const room = this.roomService.getRoom(roomId);
    const peer = room.getPeer(socketId);
    const transport = peer.getTransport(transportId);
    await transport.connect({ dtlsParameters });
  }

  async produce(
    socketId: string,
    kind: types.MediaKind,
    rtpParameters: types.RtpParameters,
    transportId: string,
    roomId: string,
    appData: { mediaTypes: MediaTypes }
  ) {
    const room = this.roomService.getRoom(roomId);
    const peer = room.getPeer(socketId);
    const transport = peer.getTransport(transportId);

    const producer = await transport.produce({ kind, rtpParameters, appData });

    peer.addProducer(producer);
    return producer;
  }

  async consume(
    socketId: string,
    producerId: string,
    roomId: string,
    transportId: string,
    rtpCapabilities: types.RtpCapabilities
  ) {
    const room = this.roomService.getRoom(roomId);
    const peer = room.getPeer(socketId);
    const transport = peer.getTransport(transportId);
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    consumer.on('producerclose', () => {
      peer.consumers.delete(consumer.id);
      consumer.close();
    });

    peer.addConsumer(consumer);

    return {
      consumerId: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  async getProducers(roomId: string, socketId: string) {
    const room = this.roomService.getRoom(roomId);

    const peers = [...room.peers.values()];

    const filtered = peers.filter((peer) => peer.socketId !== socketId);

    const result = filtered.flatMap((peer) =>
      [...peer.producers.values()].map(({ id, kind, appData }) => ({
        producerId: id,
        kind,
        peerId: peer.socketId,
        appData: appData,
      }))
    );

    return [...new Set(result)];
  }

  disconnect(socketId: string) {
    const roomIds = this.roomService.deletePeer(socketId);

    return roomIds;
  }

  disconnectProducer(roomId: string, producerId: string, socketId: string) {
    const room = this.roomService.getRoom(roomId);
    const peer = room.peers.get(socketId);
    const producer = peer.getProducer(producerId);
    producer.close();
    return producerId;
  }

  changeProducerStatus(socketId: string, changeProducerState: server.ChangeProducerStateDto) {
    const { producerId, status, roomId } = changeProducerState;
    const room = this.roomService.getRoom(roomId);
    const peer = room.peers.get(socketId);
    const producer = peer.getProducer(producerId);

    status === PRODUCER_STATUS.pause ? producer.pause() : producer.resume();
    return producerId;
  }

  pauseConsumer(roomId: string, consumerId: string, socketId: string) {
    const room = this.roomService.getRoom(roomId);
    const peer = room.peers.get(socketId);
    const consumer = peer.getConsumer(consumerId);
    consumer.pause();
    return consumerId;
  }

  resumeConsumer(roomId: string, consumerId: string, socketId: string) {
    const room = this.roomService.getRoom(roomId);
    const peer = room.peers.get(socketId);
    const consumer = peer.getConsumer(consumerId);
    consumer.pause();
    return consumerId;
  }
}
