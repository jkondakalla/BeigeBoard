# Stage 1: build the Vite frontend
FROM node:20-slim AS build
WORKDIR /app
ARG VITE_JKOS_AUTH_URL=https://auth.jkos.net
ENV VITE_JKOS_AUTH_URL=$VITE_JKOS_AUTH_URL
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: compile backend native modules
FROM node:20-slim AS backend-build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev

# Stage 3: production image
FROM node:20-slim
WORKDIR /app
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY backend/server.js ./backend/server.js
COPY backend/package.json ./backend/package.json
COPY --from=build /app/dist ./dist

ENV PORT=3001
ENV DB_PATH=/data/beigeBoard.db
ENV STATIC_DIR=/app/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "backend/server.js"]
