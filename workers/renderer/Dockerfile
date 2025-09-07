FROM node:18-alpine

WORKDIR /app

# Install ffmpeg and other dependencies
RUN apk add --no-cache ffmpeg wget

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create directories for Glint CLI and assets
RUN mkdir -p /app/glint /app/assets/inputs /app/assets/outputs

# Download Glint CLI (placeholder - will be updated with actual download URL)
# RUN wget -O /app/glint/glint-cli <GLINT_CLI_DOWNLOAD_URL>
# RUN chmod +x /app/glint/glint-cli

# Add Glint CLI to PATH
ENV PATH="/app/glint:${PATH}"

# Start the worker
CMD ["npm", "start"]