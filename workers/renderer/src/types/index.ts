export interface RenderMessage {
  jobId: string;
  modelType: 'hello' | 'studio' | 'turntable';
  inputFileKey: string;
  bucketName: string;
  timestamp: string;
}

export interface RenderOutput {
  hero?: string;
  turntable?: string;
  manifest: string;
  zip: string;
}

export interface JobManifest {
  jobId: string;
  modelType: string;
  createdAt: string;
  completedAt: string;
  input: {
    key: string;
    url: string;
  };
  outputs: {
    hero?: {
      key: string;
      url: string;
    };
    turntable?: {
      key: string;
      url: string;
    };
    zip: {
      key: string;
      url: string;
    };
  };
}