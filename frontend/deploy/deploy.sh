#!/bin/bash
# dime_base Frontend Deployment Script

set -e

# Configuration
SERVER_USER="root"           # SSH user
SERVER_HOST="194.146.13.133" # Server IP/domain
SERVER_PATH="/var/www/dime-base"  # Path on server
DOMAIN="dime-base.your-domain.com" # Your domain

echo "========================================="
echo "dime_base Frontend Deployment"
echo "========================================="

# Build for production
echo "[1/4] Building frontend..."
npm run build

# Create deployment package
echo "[2/4] Creating deployment package..."
cd dist
tar -czvf ../deploy/dime-base-dist.tar.gz .
cd ..

# Deploy to server
echo "[3/4] Deploying to server..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH/dist"

scp deploy/dime-base-dist.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

ssh $SERVER_USER@$SERVER_HOST << EOF
    cd $SERVER_PATH
    tar -xzvf dime-base-dist.tar.gz -C ./dist --strip-components=1 || (mkdir -p dist && tar -xzvf dime-base-dist.tar.gz -C ./dist --strip-components=1)
    rm dime-base-dist.tar.gz
    echo "Files deployed successfully"
EOF

# Configure nginx
echo "[4/4] Configuring nginx..."
scp deploy/nginx.conf $SERVER_USER@$SERVER_HOST:/tmp/dime-base-nginx.conf

ssh $SERVER_USER@$SERVER_HOST << EOF
    cp /tmp/dime-base-nginx.conf /etc/nginx/sites-available/dime-base
    ln -sf /etc/nginx/sites-available/dime-base /etc/nginx/sites-enabled/

    # Test nginx config
    nginx -t

    # Reload nginx
    systemctl reload nginx

    echo "Nginx configured successfully"
EOF

echo "========================================="
echo "Deployment complete!"
echo "========================================="
echo "Frontend URL: http://$SERVER_HOST"
echo "API: http://$SERVER_HOST/api"
echo ""
echo "Don't forget to:"
echo "1. Update 'server_name' in nginx.conf with your domain"
echo "2. Set up SSL: certbot --nginx -d $DOMAIN"
