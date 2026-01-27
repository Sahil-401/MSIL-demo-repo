FROM node:18-alpine

WORKDIR /app

# Copy server
COPY docker/server.js .

# Install redis client
RUN npm init -y && npm install redis

EXPOSE 3000

CMD ["node", "server.js"]
