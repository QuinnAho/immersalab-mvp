import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true
  })
});

export const downloadFile = async (bucketName: string, key: string, localPath: string): Promise<void> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    const response = await s3Client.send(command);
    
    if (response.Body) {
      const writeStream = createWriteStream(localPath);
      await pipeline(response.Body as any, writeStream);
    }
  } catch (error) {
    console.error(`Error downloading file ${key}:`, error);
    throw error;
  }
};

export const uploadFile = async (bucketName: string, key: string, localPath: string, contentType?: string): Promise<string> => {
  try {
    const readStream = createReadStream(localPath);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: readStream,
      ContentType: contentType
    });

    await s3Client.send(command);
    
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error(`Error uploading file ${key}:`, error);
    throw error;
  }
};

export const uploadBuffer = async (bucketName: string, key: string, buffer: Buffer, contentType?: string): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    });

    await s3Client.send(command);
    
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error(`Error uploading buffer ${key}:`, error);
    throw error;
  }
};