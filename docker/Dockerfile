#FROM nginx:alpine
#COPY app/index.html /usr/share/nginx/html/index.html
#EXPOSE 80
#FROM node:18-alpine
FROM bom.ocir.io/oscemea006/demo-app-repo:v2
WORKDIR /app
COPY docker/server.js .
EXPOSE 3000
CMD ["node", "server.js"]
