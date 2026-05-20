FROM node:20-slim

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package.json
RUN cd backend && npm install --omit=dev

# Copy app files
COPY backend/server.js backend/server.js
COPY index.html index.html
COPY src/ src/

ENV PORT=3001
ENV DB_PATH=/data/beigeBoard.db

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3001/ || exit 1

CMD ["node", "backend/server.js"]
