FROM node:20-alpine AS builder
WORKDIR /src/app
COPY . .
RUN npm install
RUN npm run build --configuration CORTS
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder src/app/dist/ /usr/share/nginx/html/
COPY nginx.dev.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
