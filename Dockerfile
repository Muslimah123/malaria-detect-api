# FROM node:16-alpine

# # Create app directory
# WORKDIR /app

# # Install app dependencies
# COPY package*.json ./
# RUN npm install

# # Install TensorFlow.js dependencies
# RUN apk add --no-cache \
#     python3 \
#     make \
#     g++ \
#     && npm rebuild @tensorflow/tfjs-node --build-from-source

# # Copy app source
# COPY . .

# # Create uploads and model directories
# RUN mkdir -p uploads/original uploads/thumbnails uploads/patches
# RUN mkdir -p models/cnn/thick_smear_model models/cnn/thin_smear_model

# # Expose port
# EXPOSE 5000

# # Set node to production
# ENV NODE_ENV=production

# # Command to run
# CMD ["npm", "start"]
# Dockerfile
FROM node:16-bullseye

# Install dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    build-essential \
    cmake \
    git \
    wget \
    unzip \
    yasm \
    pkg-config \
    libswscale-dev \
    libtbb2 \
    libtbb-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavformat-dev \
    libpq-dev \
    libgtk2.0-dev \
    libcairo2-dev \
    libcanberra-gtk-module \
    libatk-bridge2.0-0 \
    python3 \
    python3-pip

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm ci

# Copy app source
COPY . .

# Create necessary directories
RUN mkdir -p uploads/original uploads/thumbnails uploads/patches models/cnn/thick_smear_model models/cnn/thin_smear_model

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV OPENCV4NODEJS_DISABLE_AUTOBUILD=0

# Expose port
EXPOSE 5000

# Command to run
CMD ["node", "--max-old-space-size=4096", "src/server.js"]