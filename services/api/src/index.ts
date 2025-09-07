import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadsRouter from './routes/uploads';
import jobsRouter from './routes/jobs';
import { Logger } from '../../../shared/logger';

dotenv.config();

const logger = new Logger('api');
const app = express();
const port = process.env.PORT || 3001;

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  logger.debug('Health check requested');
  res.json({ 
    status: 'ok', 
    service: 'immersalab-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/uploads', uploadsRouter);
app.use('/jobs', jobsRouter);

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error in ${req.method} ${req.path}`, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  logger.info('API server started', {
    port,
    environment: process.env.NODE_ENV || 'development',
    s3Bucket: process.env.S3_BUCKET_NAME,
    sqsQueue: process.env.SQS_QUEUE_URL ? 'configured' : 'not configured'
  });
});