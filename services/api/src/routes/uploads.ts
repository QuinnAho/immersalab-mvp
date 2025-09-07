import { Router } from 'express';
import { generatePresignedUploadUrl } from '../services/s3';

const router = Router();

router.post('/presign', async (req, res) => {
  try {
    const { fileExtension } = req.body;
    
    if (!fileExtension) {
      return res.status(400).json({ error: 'fileExtension is required' });
    }

    const allowedExtensions = ['glb', 'gltf', 'obj', 'fbx'];
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Unsupported file extension. Allowed: ' + allowedExtensions.join(', ') 
      });
    }

    const { uploadUrl, key, bucketName } = await generatePresignedUploadUrl(fileExtension);
    
    res.json({
      uploadUrl,
      key,
      bucketName
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

export default router;