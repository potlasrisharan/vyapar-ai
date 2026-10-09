# Multi-stage Dockerfile for VyaparAI Frontend & Prototype Service
# AVINYA 2K26 - Target Region: ap-southeast-2 (Sydney)

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Lightweight Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/out ./out
COPY --from=builder /app/package.json ./package.json

RUN npm install -g serve

USER nextjs
EXPOSE 3000

CMD ["serve", "out", "-l", "3000", "-s"]
