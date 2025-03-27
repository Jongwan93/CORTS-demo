FROM node:18 as build-stage
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --configuration production

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/corts3 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
