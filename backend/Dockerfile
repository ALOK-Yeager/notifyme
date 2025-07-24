FROM node:18-alpine

# Install dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Run as non-root user
USER node

# Start the application
CMD ["node", "index.js"]
