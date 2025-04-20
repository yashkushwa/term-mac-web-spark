
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
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "app.py"]
