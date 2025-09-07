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
(cd apps/web && npm install)

echo "📦 Installing API dependencies..."
(cd services/api && npm install)

echo "📦 Installing worker dependencies..."
(cd workers/renderer && npm install)

# Detect Docker Compose command
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose not found. Please install Docker Desktop or docker-compose"
    echo "💡 Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "🐳 Building and starting Docker services..."
echo "Using: $DOCKER_COMPOSE"

# Try to start Docker services with error handling (excluding web service due to Tailwind CSS v4 build issues)
if ! $DOCKER_COMPOSE up --build -d api worker localstack redis; then
    echo ""
    echo "❌ Docker services failed to start. This might be due to:"
    echo "   • Docker storage/I/O issues"
    echo "   • Insufficient disk space"
    echo "   • Docker Desktop needs restart"
    echo ""
    echo "🔧 Try these solutions:"
    echo "   1. Restart Docker Desktop"
    echo "   2. Run: docker system prune -f"
    echo "   3. Free up disk space"
    echo "   4. Or run services locally (see instructions below)"
    echo ""
    echo "🏃 To run locally instead:"
    echo "   Terminal 1: docker run --rm -p 4566:4566 -e SERVICES=s3,sqs localstack/localstack"
    echo "   Terminal 2: cd services/api && npm run dev"
    echo "   Terminal 3: cd workers/renderer && npm run dev" 
    echo "   Terminal 4: cd apps/web && npm run dev"
    echo ""
    
    # Ask if user wants to try local mode
    read -p "🤔 Would you like to try starting LocalStack alone for local development? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting LocalStack for local development..."
        if docker run --rm -d -p 4566:4566 -e SERVICES=s3,sqs --name localstack-dev localstack/localstack; then
            echo "✅ LocalStack started successfully!"
            echo "🔧 Now you can run the other services locally:"
            echo "   Terminal 1: cd services/api && npm run dev"
            echo "   Terminal 2: cd workers/renderer && npm run dev"
            echo "   Terminal 3: cd apps/web && npm run dev"
            echo ""
            echo "🌐 Access points:"
            echo "   - Web App: http://localhost:3000 (after starting web service)"
            echo "   - API: http://localhost:3001 (after starting api service)"
            echo "   - LocalStack: http://localhost:4566"
            echo ""
            echo "⏹️  To stop LocalStack later: docker stop localstack-dev"
        else
            echo "❌ Failed to start LocalStack. Please restart Docker Desktop and try again."
        fi
    fi
    exit 1
fi

echo "⏳ Waiting for services to be ready..."
sleep 15

echo "🔍 Checking service health..."
echo "API Health: http://localhost:3001/health"
echo "LocalStack: http://localhost:4566"

# Test API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service not responding - check logs with: $DOCKER_COMPOSE logs api"
fi

# Test LocalStack
if curl -f http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo "✅ LocalStack is healthy"
else
    echo "❌ LocalStack not responding - check logs with: $DOCKER_COMPOSE logs localstack"
fi

echo ""
echo "📝 Note: Web service needs to run locally due to Tailwind CSS v4 build issues"
echo "🚀 To start the web service locally:"
echo "   cd apps/web && npm run dev"

echo ""
echo "🎉 Setup complete! Your ImmersaLab MVP is ready for development."
echo ""
echo "📋 Quick commands:"
echo "  - Start services: $DOCKER_COMPOSE up"
echo "  - Stop services: $DOCKER_COMPOSE down"
echo "  - View logs: $DOCKER_COMPOSE logs [service-name]"
echo "  - Rebuild: $DOCKER_COMPOSE up --build"
echo ""
echo "🌐 Access points:"
echo "  - Web App: http://localhost:3000 (run locally: cd apps/web && npm run dev)"
echo "  - API: http://localhost:3001"
echo "  - Swagger Docs: http://localhost:3001/docs (if implemented)"
echo "  - LocalStack: http://localhost:4566"
echo ""
echo "Happy coding! 🎨"