FROM node:18-alpine

WORKDIR /app

# Use root workspace lockfile for deterministic installs
COPY package.json package-lock.json ./

# Provide the api package manifest so npm can resolve the workspace
COPY services/api/package.json ./services/api/package.json

# Install only the api workspace (includes dev deps for build)
RUN npm ci --include-workspace-root=false --workspace api

# Copy source code and shared dependencies
COPY services/api/ ./services/api/
COPY shared/ ./shared/

# Build the application
WORKDIR /app/services/api
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
