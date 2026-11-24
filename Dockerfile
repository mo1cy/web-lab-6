FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY openapi.yaml ./
CMD ["node", "src/server.js"]