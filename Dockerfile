FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY package.json package-lock.json ./
COPY webapp/package.json webapp/
RUN npm ci
COPY . .

WORKDIR /app
RUN npm run build

EXPOSE 3000
CMD ["node", "./webapp/.next/standalone/webapp/server.js"]
