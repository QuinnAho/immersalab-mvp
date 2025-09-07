"use client";

import { useState, useEffect } from 'react';

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

interface JobStatusProps {
  job: Job;
  onJobUpdate: (job: Job) => void;
}

export default function JobStatus({ job, onJobUpdate }: JobStatusProps) {
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (job.status === 'completed' || job.status === 'failed') {
      setIsPolling(false);
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`);
        if (response.ok) {
          const updatedJob = await response.json();
          const jobWithDates = {
            ...updatedJob,
            createdAt: new Date(updatedJob.createdAt),
            completedAt: updatedJob.completedAt ? new Date(updatedJob.completedAt) : undefined,
          };
          onJobUpdate(jobWithDates);

          if (jobWithDates.status === 'completed' || jobWithDates.status === 'failed') {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [job.id, job.status, onJobUpdate]);

  const getStatusColor = () => {
    switch (job.status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'queued':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Job Status</h2>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="ml-1 capitalize">{job.status}</span>
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Job ID:</span>
          <span className="ml-2 font-mono text-sm text-gray-900">{job.id}</span>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">Created:</span>
          <span className="ml-2 text-sm text-gray-900">
            {job.createdAt.toLocaleString()}
          </span>
        </div>

        {job.completedAt && (
          <div>
            <span className="text-sm font-medium text-gray-500">Completed:</span>
            <span className="ml-2 text-sm text-gray-900">
              {job.completedAt.toLocaleString()}
            </span>
          </div>
        )}

        {job.error && (
          <div>
            <span className="text-sm font-medium text-red-500">Error:</span>
            <span className="ml-2 text-sm text-red-700">{job.error}</span>
          </div>
        )}
      </div>

      {job.status === 'completed' && job.outputUrls && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {job.outputUrls.hero && (
              <a
                href={job.outputUrls.hero}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Hero Image</span>
              </a>
            )}
            
            {job.outputUrls.turntable && (
              <a
                href={job.outputUrls.turntable}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Turntable Video</span>
              </a>
            )}
            
            {job.outputUrls.zip && (
              <a
                href={job.outputUrls.zip}
                download
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors sm:col-span-2"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Download All Results (ZIP)</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}