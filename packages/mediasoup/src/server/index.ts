import { types } from 'mediasoup';
import { MediaTypes, ProducerStatus } from '../types';

export interface ConnectTransportDto {
  transportId: string;
  dtlsParameters: types.DtlsParameters;
  roomId: string;
}

export interface CreateTransportDto {
  roomId: string;
}

export interface CreateProducerDto {
  transportId: string;
  kind: types.MediaKind;
  rtpParameters: types.RtpParameters;
  roomId: string;
  appData: { mediaTypes: MediaTypes };
}

export interface CreateConsumerDto {
  transportId: string;
  producerId: string;
  roomId: string;
  rtpCapabilities: types.RtpCapabilities;
}

export interface GetProducersDto {
  roomId: string;
}

export interface ChangeProducerStateDto {
  producerId: string;
  status: ProducerStatus;
  roomId: string;
}
