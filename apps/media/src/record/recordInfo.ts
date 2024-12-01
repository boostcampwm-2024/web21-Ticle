import { ChildProcess, spawn } from 'child_process';
import { Readable } from 'stream';

import { types } from 'mediasoup';

export class RecordInfo {
  private plainTransport: types.PlainTransport;
  private recordConsumer: types.Consumer;

  private port: number;

  private ffmpegProcess: ChildProcess;

  constructor(port: number) {
    this.port = port;
  }
  setPlainTransport(plainTransport: types.PlainTransport) {
    this.plainTransport = plainTransport;
  }

  getPlainTransport() {
    return this.plainTransport;
  }

  setRecordConsumer(recordConsumer: types.Consumer) {
    recordConsumer.on('producerclose', () => {
      this.cleanUp();
    });
    recordConsumer.on('transportclose', () => {
      this.cleanUp();
    });

    this.recordConsumer = recordConsumer;
  }

  getPort() {
    return this.port;
  }

  cleanUp() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGINT');
    }

    this.recordConsumer.close();
    this.plainTransport.close();
  }

  createFfmpegProcess(roomId: string) {
    const rtpParameter = this.recordConsumer.rtpParameters;
    const sdpString = this.createSdpText(this.port, rtpParameter);
    const sdpStream = this.convertStringToStream(sdpString);

    const filePath = `./record/${roomId}_${Date.now()}.mp3`;
    const ffmpegOption = this.createFfmpegOption(filePath);
    const ffmpegProcess = spawn('ffmpeg', ffmpegOption);

    ffmpegProcess.stderr.setEncoding('utf-8');
    ffmpegProcess.stdout.setEncoding('utf-8');

    //todo : 녹음 에러관련 로그, 예외처리
    ffmpegProcess.on('error', () => {
      this.cleanUp();
    });

    //todo: 녹음 종료 시 s3에 업로드
    ffmpegProcess.on('close', () => {
      console.log('ffmpeg process close');
    });

    sdpStream.pipe(ffmpegProcess.stdin);

    this.ffmpegProcess = ffmpegProcess;
  }

  createSdpText = (port: number, rtpParameters: types.RtpParameters) => {
    const { codecs } = rtpParameters;
    const payloadType = codecs[0].payloadType;
    return `v=0
o=- 0 0 IN IP4 127.0.0.1
s=FFmpeg
c=IN IP4 127.0.0.1
t=0 0
m=audio ${port} RTP/AVP ${payloadType}
a=rtpmap:${payloadType} opus/48000/2
a=fmtp:${payloadType} minptime=10;useinbandfec=1
a=receiveonly
`;
  };

  //todo : producer, consumer가 pause, resume에 따라 스트림 pause, resume
  convertStringToStream = (stringToConvert: string) => {
    const stream = new Readable({
      read() {
        this.push(stringToConvert);
        this.push(null);
      },
    });

    return stream;
  };

  createFfmpegOption(filePath: string) {
    //todo : loglevel 수정
    return [
      '-loglevel',
      'info',
      '-protocol_whitelist',
      'pipe,udp,rtp,file',
      '-f',
      'sdp',
      '-i',
      'pipe:0',
      '-acodec',
      'libmp3lame',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-ac',
      '2',
      filePath,
    ];
  }
}