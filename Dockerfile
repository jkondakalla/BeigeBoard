# ── Stage 1: build React frontend ───────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /build

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ── Stage 2: production image ────────────────────────────────────────────
FROM node:20-slim
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --production

COPY backend/ ./
COPY --from=builder /build/frontend/build ./public

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
