FROM node:18-alpine

WORKDIR /app

# ---- proxy settings (for npm install only) ----
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

COPY app/package.json ./
RUN npm install --production

COPY app/app.js .

EXPOSE 3000

CMD ["node", "app.js"]
