FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p /data/repos

EXPOSE 3001

CMD ["node", "dist/index.js"]
