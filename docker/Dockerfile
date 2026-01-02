FROM node:18-alpine

# ---- proxy args ----
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

WORKDIR /app

COPY app/package.json .

# use new npm standard
RUN npm install --omit=dev

COPY app/app.js .
COPY app/index.html .

EXPOSE 3000
CMD ["npm", "start"]
