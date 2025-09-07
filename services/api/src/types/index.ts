export interface RenderJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  inputUrl: string;
  outputUrls?: {
    hero?: string;
    turntable?: string;
    manifest?: string;
    zip?: string;
  };
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobRequest {
  modelType: 'hello' | 'studio' | 'turntable';
  inputFileKey: string;
}