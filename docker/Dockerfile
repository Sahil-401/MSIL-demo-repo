FROM node:18

# ---- proxy settings ----
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

WORKDIR /app

COPY app/package.json .
RUN npm install

COPY app/app.js .
EXPOSE 3000
CMD ["node", "app.js"]
