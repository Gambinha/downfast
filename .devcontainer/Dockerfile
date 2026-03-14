FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install global dev tools
RUN npm install -g ts-node ts-node-dev typescript

# Install Claude Code
RUN curl -fsSL https://claude.ai/install.sh | bash

WORKDIR /workspace
