# Stage 1: build the Vite frontend
FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve via Node backend
FROM node:20-slim
WORKDIR /app
COPY backend/package.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend/server.js ./backend/server.js
COPY --from=build /app/dist ./dist

ENV PORT=3001
ENV DB_PATH=/data/beigeBoard.db
ENV STATIC_DIR=/app/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3001/ || exit 1

CMD ["node", "backend/server.js"]
