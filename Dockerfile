# Stage 1: Build
FROM node:26-alpine AS build

WORKDIR /app

# Install dependencies first to leverage Docker layer cache
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build for production
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginx:1.27-alpine AS runtime

# Custom Nginx configuration for Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled static files
COPY --from=build /app/dist/cultivatech-front/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
