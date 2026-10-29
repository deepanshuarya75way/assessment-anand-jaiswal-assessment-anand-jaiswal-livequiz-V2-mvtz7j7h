# Base stage for caching dependencies
FROM node:22-alpine AS base
WORKDIR /app

# Cache dependencies separately by copying package.json only (avoid lockfile mismatch)
COPY package.json ./
RUN npm install

# Builder stage for compiling TypeScript
FROM base AS builder
COPY . .
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner
WORKDIR /app

# Copy built dist files and production dependencies
COPY package.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

# Configure runtime environment
ENV PORT=8000
ENV NODE_ENV=production
EXPOSE 8000

# Start server using Node.js
CMD ["node", "dist/server.js"]
