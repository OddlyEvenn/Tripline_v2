#!/bin/bash

# Setup SSL certificates for Nginx inside Docker
# Copies Let's Encrypt certificates to the project directory with proper permissions.

DOMAIN="tripline.duckdns.org"
SSL_DIR="nginx/ssl"

echo "Creating Nginx SSL directory if it doesn't exist..."
mkdir -p "$SSL_DIR"

echo "Removing old symlinks/files..."
rm -f "$SSL_DIR/fullchain.pem"
rm -f "$SSL_DIR/privkey.pem"

echo "Copying certificates from /etc/letsencrypt/live/$DOMAIN/..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  cp -L "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/fullchain.pem"
  cp -L "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/privkey.pem"
  
  echo "Setting correct permissions..."
  chmod 644 "$SSL_DIR/fullchain.pem"
  chmod 644 "$SSL_DIR/privkey.pem"
  
  echo "SSL certificates successfully copied and configured!"
else
  echo "Error: /etc/letsencrypt/live/$DOMAIN does not exist!"
  echo "Make sure you generated the certificates using certbot first."
  exit 1
fi
