# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build the app
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

# Copy built app and production dependencies (includes native better-sqlite3)
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./

# better-sqlite3 native addon needs libstdc++ at runtime
RUN apk add --no-cache libstdc++

# Switch to non-root user
USER sveltekit

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV ORIGIN=https://adamantium.online

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the app
CMD ["node", "build/index.js"]
