"use client";

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import JobStatus from '@/components/JobStatus';

interface Job {
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

export default function Home() {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  const handleJobCreated = (job: Job) => {
    setCurrentJob(job);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ImmersaLab MVP
          </h1>
          <p className="text-xl text-gray-600">
            Automated 3D product visualization service
          </p>
        </div>

        <div className="space-y-8">
          <FileUpload onJobCreated={handleJobCreated} />
          
          {currentJob && (
            <JobStatus job={currentJob} onJobUpdate={setCurrentJob} />
          )}
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500">
          Upload a 3D model (GLB, GLTF, OBJ) to generate hero images and turntable animations
        </div>
      </div>
    </div>
  );
}
