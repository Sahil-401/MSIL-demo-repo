FROM node:18-alpine

WORKDIR /app

# Copy package.json from app folder
COPY app/package.json .

RUN npm install --production

# Copy application code
COPY app/app.js .
COPY app/index.html .

EXPOSE 3000

CMD ["npm", "start"]
