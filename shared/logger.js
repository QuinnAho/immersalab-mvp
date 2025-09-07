const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
  constructor(service = 'app') {
    this.service = service;
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const formattedMeta = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.service}] ${message} ${formattedMeta}\n`;
  }

  writeToFile(filename, message) {
    const filePath = path.join(this.logsDir, filename);
    fs.appendFileSync(filePath, message);
  }

  log(level, message, meta = {}) {
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

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // Progress logging for jobs
  progress(jobId, stage, progress, message = '', meta = {}) {
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
  jobStarted(jobId, jobType, inputFile) {
    this.progress(jobId, 'started', 0, 'Job initiated', {
      jobType,
      inputFile,
      status: 'queued'
    });
  }

  jobProcessing(jobId, stage, progress = 0, message = '') {
    this.progress(jobId, stage, progress, message, {
      status: 'processing'
    });
  }

  jobCompleted(jobId, outputFiles = [], duration = 0) {
    this.progress(jobId, 'completed', 100, 'Job completed successfully', {
      status: 'completed',
      outputFiles,
      duration: `${duration}ms`
    });
  }

  jobFailed(jobId, error, stage = 'unknown') {
    this.progress(jobId, 'failed', -1, `Job failed: ${error}`, {
      status: 'failed',
      error: error.message || error,
      stage
    });
  }
}

module.exports = Logger;