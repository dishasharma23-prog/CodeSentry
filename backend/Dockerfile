FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && update-ca-certificates && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm run build

RUN mkdir -p /data/repos

EXPOSE 3001

CMD ["node", "dist/index.js"]
