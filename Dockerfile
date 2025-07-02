FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies and PM2 globally
RUN npm install && npm install -g pm2

# Copy the rest of the app
COPY . .

# Start the app with PM2 for production reliability
CMD ["pm2-runtime", "server.js"]