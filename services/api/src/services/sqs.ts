import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { JobRequest, RenderJob } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../../shared/logger';

const logger = new Logger('api-sqs');

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.SQS_ENDPOINT && {
    endpoint: process.env.SQS_ENDPOINT
  })
});

export const enqueueRenderJob = async (jobRequest: JobRequest): Promise<RenderJob> => {
  const jobId = uuidv4();
  const queueUrl = process.env.SQS_QUEUE_URL!;
  
  logger.info('Creating render job', {
    jobId,
    modelType: jobRequest.modelType,
    inputFileKey: jobRequest.inputFileKey
  });

  const job: RenderJob = {
    id: jobId,
    status: 'queued',
    inputUrl: `s3://${process.env.S3_BUCKET_NAME}/${jobRequest.inputFileKey}`,
    createdAt: new Date()
  };

  const message = {
    jobId,
    modelType: jobRequest.modelType,
    inputFileKey: jobRequest.inputFileKey,
    bucketName: process.env.S3_BUCKET_NAME,
    timestamp: new Date().toISOString()
  };

  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        jobType: {
          StringValue: jobRequest.modelType,
          DataType: 'String'
        }
      }
    });

    await sqsClient.send(command);
    
    logger.jobStarted(jobId, jobRequest.modelType, jobRequest.inputFileKey);
    logger.info('Job queued successfully', { jobId, queueUrl });
    
    return job;
  } catch (error) {
    logger.error('Failed to enqueue render job', {
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error',
      queueUrl
    });
    throw error;
  }
};