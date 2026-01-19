#FROM nginx:alpine
#COPY app/index.html /usr/share/nginx/html/index.html
#EXPOSE 80
FROM node:18-alpine

WORKDIR /app

COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]
