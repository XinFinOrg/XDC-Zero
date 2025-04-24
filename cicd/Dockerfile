FROM node:20-alpine

COPY . /app
WORKDIR /app/cicd
RUN yarn
WORKDIR /app/endpoint
RUN yarn
WORKDIR /app/applications/subswap/contract
RUN yarn
WORKDIR /app/cicd

ENTRYPOINT ["node"]