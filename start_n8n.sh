#!/bin/bash

# Check if npx is installed
if ! command -v npx &> /dev/null; then
    echo "npx could not be found. Please ensure Node.js and npm are installed."
    exit 1
fi

echo "Starting n8n with tunnel..."
echo "This might take a while to download on the first run."
echo "Once started, press 'o' to open in the browser."

# Start n8n with tunnel to allow webhooks to work properly
npx n8n start --tunnel
