# Build stage
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files (including package-lock.json)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for TypeScript build)
# Force installation regardless of NODE_ENV
RUN npm ci --include=dev

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files (including package-lock.json)
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

# Create directories for uploads and logs
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/server.js"]
