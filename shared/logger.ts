import fs from 'fs';
import path from 'path';

interface LogMeta {
  [key: string]: any;
}

interface ProgressMeta extends LogMeta {
  jobType?: string;
  inputFile?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  outputFiles?: string[];
  duration?: string;
  error?: string;
  stage?: string;
}

export class Logger {
  private service: string;
  private logsDir: string;

  constructor(service: string = 'app') {
    this.service = service;
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDir();
  }

  private ensureLogsDir(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta: LogMeta = {}): string {
    const timestamp = new Date().toISOString();
    const formattedMeta = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.service}] ${message} ${formattedMeta}\n`;
  }

  private writeToFile(filename: string, message: string): void {
    const filePath = path.join(this.logsDir, filename);
    fs.appendFileSync(filePath, message);
  }

  private log(level: string, message: string, meta: LogMeta = {}): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Write to console
    console.log(formattedMessage.trim());
    
    // Write to general log
    this.writeToFile('development.log', formattedMessage);
    
    // Write to service-specific log
    this.writeToFile(`${this.service}.log`, formattedMessage);
    
    // Write errors to error log
    if (level === 'error') {
      this.writeToFile('errors.log', formattedMessage);
    }
  }

  info(message: string, meta: LogMeta = {}): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta: LogMeta = {}): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta: LogMeta = {}): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta: LogMeta = {}): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // Progress logging for jobs
  progress(jobId: string, stage: string, progress: number, message: string = '', meta: ProgressMeta = {}): void {
    const progressData = {
      jobId,
      stage,
      progress: Math.round(progress),
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };

    const progressMessage = `JOB_PROGRESS: ${JSON.stringify(progressData)}`;
    
    // Log to console and general logs
    this.info(progressMessage);
    
    // Write to progress-specific log
    this.writeToFile('progress.log', this.formatMessage('progress', progressMessage));
  }

  // Job lifecycle logging
  jobStarted(jobId: string, jobType: string, inputFile: string): void {
    this.progress(jobId, 'started', 0, 'Job initiated', {
      jobType,
      inputFile,
      status: 'queued'
    });
  }

  jobProcessing(jobId: string, stage: string, progress: number = 0, message: string = ''): void {
    this.progress(jobId, stage, progress, message, {
      status: 'processing'
    });
  }

  jobCompleted(jobId: string, outputFiles: string[] = [], duration: number = 0): void {
    this.progress(jobId, 'completed', 100, 'Job completed successfully', {
      status: 'completed',
      outputFiles,
      duration: `${duration}ms`
    });
  }

  jobFailed(jobId: string, error: Error | string, stage: string = 'unknown'): void {
    this.progress(jobId, 'failed', -1, `Job failed: ${error}`, {
      status: 'failed',
      error: error instanceof Error ? error.message : error,
      stage
    });
  }
}

export default Logger;