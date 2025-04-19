FROM node:20-alpine 

WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Start the app (only one CMD allowed)
CMD ["npm", "run", "start"]