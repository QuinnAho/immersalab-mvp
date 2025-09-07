import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const createZip = async (sourceDir: string, outputPath: string): Promise<void> => {
  try {
    // Use system zip command (available on most Docker images)
    const command = `cd "${sourceDir}" && zip -r "${outputPath}" .`;
    await execAsync(command);
    
    console.log(`ZIP created successfully: ${outputPath}`);
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw error;
  }
};