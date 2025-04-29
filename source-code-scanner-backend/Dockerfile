# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for external tools
RUN apk add --no-cache python3 py3-pip git curl bash gcc g++ make

# Install semgrep
RUN pip3 install semgrep

# Install clang-tidy
RUN apk add --no-cache clang clang-extra-tools llvm

# Install snyk CLI
RUN npm install -g snyk

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm ci

# Create necessary directories
RUN mkdir -p uploads scans reports logs \
    src/rules/semgrep \
    src/rules/snyk \
    src/rules/clangtidy

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Run application
CMD ["node", "src/app.js"]