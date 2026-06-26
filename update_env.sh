#!/bin/bash

# Tripline EC2 Environment Updater
# Updates the .env file to use secure production settings.

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found in current directory!"
  exit 1
fi

echo "Backing up current .env to .env.bak..."
cp "$ENV_FILE" "${ENV_FILE}.bak"

echo "Updating FRONTEND_URL to https://tripline.duckdns.org..."
if grep -q "FRONTEND_URL" "$ENV_FILE"; then
  sed -i 's|^[[:space:]]*FRONTEND_URL[[:space:]]*=.*|FRONTEND_URL=https://tripline.duckdns.org|g' "$ENV_FILE"
else
  echo "FRONTEND_URL=https://tripline.duckdns.org" >> "$ENV_FILE"
fi

echo "Updating COOKIE_SECURE to true..."
if grep -q "COOKIE_SECURE" "$ENV_FILE"; then
  sed -i 's|^[[:space:]]*COOKIE_SECURE[[:space:]]*=.*|COOKIE_SECURE=true|g' "$ENV_FILE"
else
  echo "COOKIE_SECURE=true" >> "$ENV_FILE"
fi

echo "Successfully updated .env!"
echo "----------------------------------------"
grep -E "FRONTEND_URL|COOKIE_SECURE" "$ENV_FILE"
echo "----------------------------------------"
