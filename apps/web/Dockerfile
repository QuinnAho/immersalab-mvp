FROM node:18-slim

# Install dependencies for native modules (including lightningcss)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Use monorepo root as working directory for workspace installs
WORKDIR /app

# Copy root lockfile and root package.json (workspace manifest)
COPY package.json package-lock.json ./

# Also copy the web package.json so npm can resolve the workspace
COPY apps/web/package.json ./apps/web/package.json

# Install only the web workspace (includes dev deps needed to build)
RUN npm ci --include-workspace-root=false --workspace web

# Reinstall lightningcss to ensure proper native binaries are built
RUN cd /app/apps/web && npm rebuild lightningcss

# Copy the rest of the web source
COPY apps/web/ ./apps/web/

# Build the application from the web workspace
WORKDIR /app/apps/web
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
