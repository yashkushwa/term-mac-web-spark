
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    procps \
    vim \
    curl \
    wget \
    git \
    bash \
    sudo \
    openssh-client \
    ncurses-term \
    && rm -rf /var/lib/apt/lists/*

# Add a welcome message
RUN echo "echo -e '\033[1;32m Welcome to macOS Web Terminal! \033[0m'" >> /root/.bashrc && \
    echo "echo -e '\033[1;34m Commands you can try: ls, pwd, whoami, cat, etc. \033[0m'" >> /root/.bashrc && \
    echo "echo" >> /root/.bashrc

# Copy requirements and install them first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose port
EXPOSE 8080

# Make start script executable
RUN chmod +x start.sh

# Run the application
CMD ["python", "app.py"]
