FROM node:20-slim AS builder

WORKDIR /app

# Install everything including devDependencies
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy all source files
COPY . .

# Build the Angular app
RUN npm run build -- --output-path=dist/corts

# Optional: verify the build output
RUN ls -alh dist/corts

# --- Runtime Stage ---
FROM nginx:alpine

# Clean existing NGINX html folder
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder stage
COPY --from=builder /app/dist/corts/browser /usr/share/nginx/html

# Use a working NGINX config
COPY nginx.dev.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
