# Stage 1: build Vue SPA
FROM node:22-alpine AS web-builder
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile
COPY web/ ./web/
RUN pnpm --filter @aws-exam-site/web build

# Stage 2: build API
FROM node:22-alpine AS api-builder
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY api/package.json ./api/
RUN pnpm install --frozen-lockfile
COPY api/ ./api/
RUN pnpm --filter @aws-exam-site/api build

# Stage 3: production
FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY api/package.json ./api/
RUN pnpm install --frozen-lockfile --prod
COPY --from=api-builder /app/api/dist ./api/dist
COPY --from=web-builder /app/web/dist ./web/dist
ENV PORT=8080
CMD ["node", "api/dist/index.js"]
