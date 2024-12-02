import * as fs from 'fs';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorMessage } from '@repo/types';

import { NcpConfig } from './ncp.config';

@Injectable()
export class NcpService {
  private s3: S3Client;

  constructor(
    private ncpConfig: NcpConfig,
    private configService: ConfigService
  ) {
    this.s3 = ncpConfig.s3Client;
  }

  async uploadFile(localFilePath: string, remoteFileName: string): Promise<string> {
    const bucketName = this.configService.get<string>('NCP_OBJECT_STORAGE_BUCKET');
    const endpoint = this.configService.get<string>('NCP_OBJECT_STORAGE_ENDPOINT');

    const fileStream = fs.createReadStream(localFilePath);
    const params = {
      Bucket: bucketName,
      Key: remoteFileName,
      Body: fileStream,
    };

    try {
      const uploadResponse = await this.s3.send(new PutObjectCommand(params));
      // console.log('File uploaded:', uploadResponse);

      const url = `${endpoint}/${bucketName}/${remoteFileName}`;
      // console.log('Uploaded file URL:', url);

      return remoteFileName;
    } catch (error) {
      throw new Error(ErrorMessage.FILE_UPLOAD_FAILED);
    }
  }
}
