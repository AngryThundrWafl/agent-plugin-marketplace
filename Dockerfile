# Agent Plugins Marketplace - Docker image for CI/validation
FROM node:22-alpine

WORKDIR /workspace

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Default command runs validation
ENTRYPOINT ["node", "scripts/validate.mjs"]