# Backend Dockerfile for Party Collection
# Optimized for ARM64 deployment with multi-stage build

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove development dependencies to reduce final image size
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy built application and production dependencies from builder stage
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/package*.json ./

# Switch to non-root user
USER backend

# Expose port 3001 (matches backend default)
EXPOSE 3001

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3001

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the server
CMD ["node", "dist/index.js"]