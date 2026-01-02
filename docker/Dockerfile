FROM node:18
WORKDIR /app
COPY app/package.json .
RUN npm install
COPY app/app.js .
EXPOSE 3000
CMD ["node", "app.js"]
