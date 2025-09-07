import dotenv from 'dotenv';
import { pollForMessages, deleteMessage } from './services/sqs';
import { processRenderJob } from './services/processor';
import { Logger } from '../../../shared/logger';

dotenv.config();

const logger = new Logger('worker');

logger.info('ImmersaLab Renderer Worker starting...');

const pollQueue = async () => {
  try {
    logger.debug('Polling for render jobs...');
    const message = await pollForMessages();
    
    if (message) {
      logger.info(`Received job: ${message.jobId}`, {
        jobId: message.jobId,
        modelType: message.modelType,
        inputFileKey: message.inputFileKey
      });
      
      const startTime = Date.now();
      
      try {
        await processRenderJob(message);
        
        const duration = Date.now() - startTime;
        
        // Delete message from queue after successful processing
        if ((message as any).receiptHandle) {
          await deleteMessage((message as any).receiptHandle);
          logger.jobCompleted(message.jobId, [], duration);
          logger.info(`Job ${message.jobId} completed and removed from queue`, {
            duration: `${duration}ms`
          });
        }
      } catch (processingError) {
        const duration = Date.now() - startTime;
        logger.jobFailed(message.jobId, processingError as Error, 'processing');
        logger.error(`Job ${message.jobId} failed after ${duration}ms`, {
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
          duration: `${duration}ms`
        });
        // Message will remain in queue for retry or go to DLQ
      }
    }
  } catch (error) {
    logger.error('Error polling queue', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const main = async () => {
  logger.info('Worker initialized', {
    awsRegion: process.env.AWS_REGION,
    s3Bucket: process.env.S3_BUCKET_NAME,
    sqsQueue: process.env.SQS_QUEUE_URL ? 'configured' : 'not configured',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
  
  // Start polling for jobs
  let pollCount = 0;
  while (true) {
    pollCount++;
    if (pollCount % 60 === 0) { // Log every 60 polls (~1 minute)
      logger.debug(`Worker alive, completed ${pollCount} poll cycles`);
    }
    
    await pollQueue();
    // Short delay between polling cycles
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

main().catch((error) => {
  logger.error('Worker crashed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});