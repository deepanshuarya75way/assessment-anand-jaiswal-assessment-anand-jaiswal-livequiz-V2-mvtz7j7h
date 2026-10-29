# Base stage for caching dependencies
FROM node:22-alpine AS base
WORKDIR /app

# Cache dependencies separately by copying package.json only (avoid lockfile mismatch)
COPY package.json ./
RUN npm install

# Builder stage for compiling Next.js assets
FROM base AS builder
COPY . .

# Pass build-time environment variable arguments for Next.js compilation
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Build the Next.js production bundle
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

# Copy built assets and runner dependencies from builder stage
COPY --from=builder /app ./

# Configure runtime environment
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start Next.js server in production
CMD ["npm", "run", "start"]
