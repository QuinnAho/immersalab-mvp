import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true
  })
});

export const generatePresignedUploadUrl = async (fileExtension: string) => {
  const key = `inputs/${uuidv4()}.${fileExtension}`;
  const bucketName = process.env.S3_BUCKET_NAME!;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: getContentType(fileExtension)
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return {
    uploadUrl,
    key,
    bucketName
  };
};

const getContentType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'glb': 'model/gltf-binary',
    'gltf': 'model/gltf+json',
    'obj': 'application/octet-stream',
    'fbx': 'application/octet-stream'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};