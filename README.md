# ImmersaLab MVP

Automated 3D product visualization service powered by Glint3D.

## Overview

ImmersaLab's Phase 1 MVP is an automated product visualization service that transforms 3D models into high-quality marketing assets:

- **Input**: 3D models (GLB/GLTF/OBJ/FBX)
- **Output**: Hero images, 360° turntable animations, and structured assets
- **Value**: Reduces $1,000+ agency costs and weeks of turnaround to hours

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Web UI    │───▶│  API Server │───▶│ SQS Queue   │───▶│   Worker    │
│  (Next.js)  │    │ (Express)   │    │             │    │  (Glint)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                            │                                      │
                            ▼                                      ▼
                   ┌─────────────┐                        ┌─────────────┐
                   │   S3 Bucket │                        │  S3 Bucket  │
                   │  (Uploads)  │                        │ (Outputs)   │
                   └─────────────┘                        └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- AWS CLI (for production deployment)
- Terraform (for infrastructure)

### Local Development

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd immersalab-mvp
   cp .env.example .env
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd apps/web && npm install
   cd ../../services/api && npm install
   cd ../../workers/renderer && npm install
   ```

3. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Web UI: http://localhost:3000
   - API: http://localhost:3001
   - LocalStack (AWS services): http://localhost:4566

### Using individual services:

```bash
# Web frontend
npm run web:dev

# API server
npm run api:dev

# Worker
npm run worker:dev
```

## Project Structure

```
immersalab-mvp/
├── apps/
│   └── web/                 # Next.js frontend
├── services/
│   └── api/                 # Express API server
├── workers/
│   └── renderer/            # Glint rendering worker
├── engine/
│   └── glint-ops/          # Glint operation definitions
├── infra/
│   └── terraform/          # Infrastructure as code
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docker-compose.yml      # Local development
└── package.json           # Workspace configuration
```

## API Endpoints

### Upload Management
- `POST /uploads/presign` - Get pre-signed S3 upload URL
- `PUT <presigned-url>` - Upload file to S3

### Job Management
- `POST /jobs/hello` - Create hello world render job
- `POST /jobs` - Create render job with preset
- `GET /jobs/:id` - Get job status
- `GET /jobs` - List all jobs

### Job Status Flow
1. `queued` - Job created and waiting in SQS
2. `processing` - Worker picked up job
3. `completed` - Renders uploaded to S3
4. `failed` - Error occurred

## Environment Variables

### Required for Production:
```env
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue-name
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Local Development:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=immersalab-stg-assets
S3_ENDPOINT=http://localhost:4566
SQS_QUEUE_URL=http://localhost:4566/000000000000/render-jobs
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Week 1 MVP Goals ✅

- ✅ Monorepo with all services
- ✅ Docker containerization  
- ✅ Terraform infrastructure
- ✅ API endpoints for uploads and jobs
- ✅ Worker with Glint CLI integration
- ✅ Web UI with upload and status
- ✅ GitHub Actions CI/CD
- 🎯 **Ready for E2E demo**: Upload model → Generate renders → Download ZIP

## Development Commands

```bash
# Start all services locally
docker-compose up --build

# Individual service development
npm run web:dev      # Next.js frontend
npm run api:dev      # Express API 
npm run worker:dev   # Renderer worker

# Infrastructure
cd infra/terraform
terraform plan
terraform apply

# CI/CD
git push origin main  # Triggers deployment

# Logging & Monitoring
npm run logs               # View all logs
npm run logs:follow        # Follow logs in real-time
npm run logs:errors        # Show error logs only
npm run logs:progress      # Follow job progress
npm run monitor            # Show monitoring help
npm run monitor:realtime   # Real-time progress monitor
npm run monitor:summary    # Job statistics
npm run monitor:jobs       # List all jobs
```

## 📊 Logging & Monitoring

### Log Files

The application generates comprehensive logs in the `/logs` directory:

- `development.log` - All application logs
- `api.log` - API service logs  
- `worker.log` - Worker service logs
- `progress.log` - Job progress tracking
- `errors.log` - Error logs across all services

### Viewing Logs

```bash
# View all recent logs
npm run logs

# Follow logs in real-time
npm run logs:follow

# Show only errors
npm run logs:errors

# Monitor job progress
npm run logs:progress

# Show logs for specific service
./scripts/logs.sh -s api

# Show logs for specific job
./scripts/logs.sh -j <job-id>
```

### Progress Monitoring

```bash
# Real-time job progress with visual progress bars
npm run monitor:realtime

# Job statistics summary
npm run monitor:summary

# List all jobs with status
npm run monitor:jobs

# Show only failed jobs
./scripts/monitor.sh -f

# Show only completed jobs  
./scripts/monitor.sh -c
```

### Log Structure

Each log entry includes:
- **Timestamp** - ISO 8601 format
- **Level** - INFO, WARN, ERROR, DEBUG
- **Service** - api, worker, processor, etc.  
- **Message** - Human readable message
- **Metadata** - Structured data (JSON)

### Job Progress Tracking

Jobs are tracked through their complete lifecycle:

1. **started** (0%) - Job queued
2. **setup** (5%) - Working directories created  
3. **download** (10-20%) - Input file downloaded
4. **rendering** (25-60%) - Processing with Glint
5. **upload** (70-85%) - Uploading outputs
6. **completed** (100%) - Success
7. **failed** (-1%) - Error occurred
