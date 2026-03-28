FROM node:22-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN mkdir -p /app/data /app/uploads/thumbs
EXPOSE 3001
CMD ["node", "server.js"]
