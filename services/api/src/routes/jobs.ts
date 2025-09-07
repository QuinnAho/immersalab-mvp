import { Router } from 'express';
import { enqueueRenderJob } from '../services/sqs';
import { saveJob, getJob, getAllJobs } from '../services/jobStore';

const router = Router();

router.post('/hello', async (req, res) => {
  try {
    const { inputFileKey } = req.body;
    
    if (!inputFileKey) {
      return res.status(400).json({ error: 'inputFileKey is required' });
    }

    const job = await enqueueRenderJob({
      modelType: 'hello',
      inputFileKey
    });

    saveJob(job);
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating hello job:', error);
    res.status(500).json({ error: 'Failed to create render job' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { modelType, inputFileKey } = req.body;
    
    if (!modelType || !inputFileKey) {
      return res.status(400).json({ error: 'modelType and inputFileKey are required' });
    }

    if (!['hello', 'studio', 'turntable'].includes(modelType)) {
      return res.status(400).json({ error: 'Invalid modelType' });
    }

    const job = await enqueueRenderJob({
      modelType,
      inputFileKey
    });

    saveJob(job);
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating render job:', error);
    res.status(500).json({ error: 'Failed to create render job' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = getJob(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.get('/', (req, res) => {
  try {
    const jobs = getAllJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;