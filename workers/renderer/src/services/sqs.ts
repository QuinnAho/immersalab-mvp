import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { RenderMessage } from '../types';

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.SQS_ENDPOINT && {
    endpoint: process.env.SQS_ENDPOINT
  })
});

export const pollForMessages = async (): Promise<RenderMessage | null> => {
  const queueUrl = process.env.SQS_QUEUE_URL!;
  
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20, // Long polling
      VisibilityTimeout: 300 // 5 minutes to process
    });

    const result = await sqsClient.send(command);
    
    if (!result.Messages || result.Messages.length === 0) {
      return null;
    }

    const message = result.Messages[0];
    const body = JSON.parse(message.Body!);
    
    // Store receipt handle for deletion
    (body as any).receiptHandle = message.ReceiptHandle;
    
    return body as RenderMessage;
  } catch (error) {
    console.error('Error polling SQS:', error);
    return null;
  }
};

export const deleteMessage = async (receiptHandle: string): Promise<void> => {
  const queueUrl = process.env.SQS_QUEUE_URL!;
  
  try {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    });

    await sqsClient.send(command);
  } catch (error) {
    console.error('Error deleting SQS message:', error);
    throw error;
  }
};