FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p /data/repos

EXPOSE 3001

CMD ["node", "dist/index.js"]
