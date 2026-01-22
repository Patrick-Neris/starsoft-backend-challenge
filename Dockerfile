FROM node:22

RUN npm install -g @nestjs/cli@^10.0.0

USER node

WORKDIR /home/node/app