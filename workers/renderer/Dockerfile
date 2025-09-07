FROM node:18-alpine

WORKDIR /app

# Install ffmpeg and other dependencies
RUN apk add --no-cache ffmpeg wget

# Use root workspace lockfile for deterministic installs
COPY package.json package-lock.json ./

# Provide the worker package manifest so npm can resolve the workspace
COPY workers/renderer/package.json ./workers/renderer/package.json

# Install only the renderer workspace (includes dev deps for build)
RUN npm ci --include-workspace-root=false --workspace renderer

# Copy source code and shared dependencies
COPY workers/renderer/ ./workers/renderer/
COPY shared/ ./shared/

# Build the application
WORKDIR /app/workers/renderer
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Create directories for Glint CLI and assets
RUN mkdir -p /app/glint /app/assets/inputs /app/assets/outputs

# Add Glint CLI to PATH
ENV PATH="/app/glint:${PATH}"

# Start the worker
CMD ["npm", "start"]
