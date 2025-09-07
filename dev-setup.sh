#!/bin/bash

# ImmersaLab MVP Development Setup Script

echo "🚀 Setting up ImmersaLab MVP development environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file (please review and update as needed)"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install service dependencies
echo "📦 Installing web app dependencies..."
cd apps/web && npm install
cd ../..

echo "📦 Installing API dependencies..."
cd services/api && npm install
cd ../..

echo "📦 Installing worker dependencies..."
cd workers/renderer && npm install
cd ../..

echo "🐳 Building and starting Docker services..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🔍 Checking service health..."
echo "Web UI: http://localhost:3000"
echo "API Health: http://localhost:3001/health"
echo "LocalStack: http://localhost:4566"

# Test API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service not responding - check logs with: docker-compose logs api"
fi

echo ""
echo "🎉 Setup complete! Your ImmersaLab MVP is ready for development."
echo ""
echo "📋 Quick commands:"
echo "  - Start services: docker-compose up"
echo "  - Stop services: docker-compose down"
echo "  - View logs: docker-compose logs [service-name]"
echo "  - Rebuild: docker-compose up --build"
echo ""
echo "🌐 Access points:"
echo "  - Web App: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo "  - Swagger Docs: http://localhost:3001/docs (if implemented)"
echo ""
echo "Happy coding! 🎨"