FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY index.js ./
COPY config.example.json ./config.json

RUN mkdir -p /app/data

VOLUME ["/app/data"]

CMD ["node", "index.js"]