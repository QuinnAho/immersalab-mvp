import { RenderJob } from '../types';

// In-memory job store for MVP - replace with Redis/Database in production
const jobs = new Map<string, RenderJob>();

export const saveJob = (job: RenderJob): void => {
  jobs.set(job.id, job);
};

export const getJob = (jobId: string): RenderJob | undefined => {
  return jobs.get(jobId);
};

export const updateJobStatus = (jobId: string, status: RenderJob['status'], updates?: Partial<RenderJob>): void => {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    if (updates) {
      Object.assign(job, updates);
    }
    jobs.set(jobId, job);
  }
};

export const getAllJobs = (): RenderJob[] => {
  return Array.from(jobs.values());
};