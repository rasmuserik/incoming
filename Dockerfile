FROM node:latest

COPY . /app
WORKDIR /app
RUN apt-get install xz
ENTRYPOINT ["node", "incoming.js"]
EXPOSE 8888
