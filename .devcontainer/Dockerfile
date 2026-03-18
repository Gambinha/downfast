FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    curl \
    procps \
    build-essential \
    libssl-dev \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install global dev tools
RUN npm install -g ts-node ts-node-dev typescript

# Install Claude Code
RUN curl -fsSL https://claude.ai/install.sh | bash
RUN echo 'export PATH="$PATH:/root/.local/bin"' >> ~/.bashrc

WORKDIR /workspace
