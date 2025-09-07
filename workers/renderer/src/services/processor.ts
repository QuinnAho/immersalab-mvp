import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { RenderMessage, JobManifest } from '../types';
import { downloadFile, uploadFile, uploadBuffer } from './s3';
import { renderHelloWorld, renderStudioHero, renderTurntable } from './glint';
import { createZip } from './zip';
import { Logger } from '../../../../shared/logger';

const logger = new Logger('processor');

export const processRenderJob = async (message: RenderMessage): Promise<void> => {
  const { jobId, modelType, inputFileKey, bucketName } = message;
  
  logger.jobProcessing(jobId, 'started', 0, 'Initializing job processing');
  
  // Create working directories
  const workDir = `/tmp/render-${jobId}`;
  const inputDir = path.join(workDir, 'input');
  const outputDir = path.join(workDir, 'output');
  
  try {
    logger.jobProcessing(jobId, 'setup', 5, 'Creating working directories');
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    // Download input file
    logger.jobProcessing(jobId, 'download', 10, 'Downloading input file from S3');
    const inputFileName = path.basename(inputFileKey);
    const inputPath = path.join(inputDir, inputFileName);
    await downloadFile(bucketName, inputFileKey, inputPath);
    
    logger.jobProcessing(jobId, 'download', 20, 'Input file downloaded successfully');
    
    // Render based on model type
    logger.jobProcessing(jobId, 'rendering', 25, `Starting ${modelType} rendering`);
    switch (modelType) {
      case 'hello':
        await renderHelloWorld(inputPath, outputDir);
        break;
      case 'studio':
        await renderStudioHero(inputPath, outputDir);
        break;
      case 'turntable':
        await renderTurntable(inputPath, outputDir);
        break;
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
    
    logger.jobProcessing(jobId, 'rendering', 60, `${modelType} rendering completed`);
    
    // Upload outputs to S3
    logger.jobProcessing(jobId, 'upload', 70, 'Uploading output files to S3');
    const outputKeys = await uploadOutputs(bucketName, jobId, outputDir);
    
    logger.jobProcessing(jobId, 'upload', 85, 'Creating manifest and ZIP file');
    // Create and upload manifest
    const manifest = createManifest(jobId, modelType, inputFileKey, outputKeys, bucketName);
    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));
    const manifestKey = `reports/jobs/${jobId}.json`;
    await uploadBuffer(bucketName, manifestKey, manifestBuffer, 'application/json');
    
    // Create and upload ZIP file
    const zipPath = path.join(workDir, `${jobId}.zip`);
    await createZip(outputDir, zipPath);
    const zipKey = `zips/${jobId}.zip`;
    await uploadFile(bucketName, zipKey, zipPath, 'application/zip');
    
    logger.jobProcessing(jobId, 'completed', 100, 'All outputs uploaded successfully');
    logger.info(`Job ${jobId} completed successfully`, {
      outputKeys: Object.keys(outputKeys),
      manifestKey,
      zipKey
    });
    
  } catch (error) {
    logger.error(`Job ${jobId} failed during processing`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Upload error report
    try {
      const errorReport = {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        stage: 'processing'
      };
      
      const errorBuffer = Buffer.from(JSON.stringify(errorReport, null, 2));
      const errorKey = `reports/errors/${jobId}.json`;
      await uploadBuffer(bucketName, errorKey, errorBuffer, 'application/json');
      
      logger.info(`Error report uploaded for job ${jobId}`, { errorKey });
    } catch (uploadError) {
      logger.warn(`Failed to upload error report for job ${jobId}`, {
        uploadError: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      });
    }
    
    throw error;
  } finally {
    // Cleanup work directory
    logger.jobProcessing(jobId, 'cleanup', -1, 'Cleaning up temporary files');
    try {
      await fs.rm(workDir, { recursive: true, force: true });
      logger.debug(`Cleaned up work directory for job ${jobId}`, { workDir });
    } catch (cleanupError) {
      logger.warn(`Failed to cleanup work directory for job ${jobId}`, {
        cleanupError: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
        workDir
      });
    }
  }
};

const uploadOutputs = async (bucketName: string, jobId: string, outputDir: string): Promise<Record<string, string>> => {
  const outputs: Record<string, string> = {};
  
  try {
    const files = await fs.readdir(outputDir);
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(file);
        const outputKey = `outputs/${jobId}/${file}`;
        
        const contentType = getContentType(ext);
        await uploadFile(bucketName, outputKey, filePath, contentType);
        
        outputs[path.basename(file, ext)] = outputKey;
      }
    }
  } catch (error) {
    console.error('Error uploading outputs:', error);
    throw error;
  }
  
  return outputs;
};

const createManifest = (
  jobId: string,
  modelType: string,
  inputKey: string,
  outputKeys: Record<string, string>,
  bucketName: string
): JobManifest => {
  const baseUrl = process.env.S3_ENDPOINT ? 
    `${process.env.S3_ENDPOINT}/${bucketName}` : 
    `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  
  return {
    jobId,
    modelType,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    input: {
      key: inputKey,
      url: `${baseUrl}/${inputKey}`
    },
    outputs: {
      ...(outputKeys.hero && {
        hero: {
          key: outputKeys.hero,
          url: `${baseUrl}/${outputKeys.hero}`
        }
      }),
      ...(outputKeys.turntable && {
        turntable: {
          key: outputKeys.turntable,
          url: `${baseUrl}/${outputKeys.turntable}`
        }
      }),
      zip: {
        key: `zips/${jobId}.zip`,
        url: `${baseUrl}/zips/${jobId}.zip`
      }
    }
  };
};

const getContentType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.json': 'application/json',
    '.zip': 'application/zip'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};