#!/bin/bash
# =====================================================================
# MedAssist AI — AWS EC2 Deployment Setup Script (Ubuntu)
# Wires Nginx reverse proxy, MySQL database, and Backend/Frontend services
# =====================================================================

set -e

echo "=== 1. System Updates & Prerequisites ==="
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y nginx git mysql-server python3-pip python3-venv nodejs npm

echo "=== 2. Setup MySQL database ==="
# Initialize database if needed (Ensure local root login or configure credentials)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS medassist_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'medassist_user'@'localhost' IDENTIFIED BY 'secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON medassist_db.* TO 'medassist_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "=== 3. Setup Python Backend Environment ==="
cd /home/ubuntu/medassist-ai/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations and seed database
export MYSQL_USER=medassist_user
export MYSQL_PASSWORD=secure_password
export MYSQL_DB=medassist_db
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
python -m app.db.seed

echo "=== 4. Setup Next.js Frontend ==="
cd /home/ubuntu/medassist-ai/frontend
npm install
npm run build

echo "=== 5. Configure Nginx Proxy ==="
sudo cp /home/ubuntu/medassist-ai/deploy/nginx.conf /etc/nginx/sites-available/medassist
sudo ln -sf /etc/nginx/sites-available/medassist /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "=== 6. Configure & Start Systemd Services ==="
sudo cp /home/ubuntu/medassist-ai/deploy/medassist-backend.service /etc/systemd/system/
sudo cp /home/ubuntu/medassist-ai/deploy/medassist-frontend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable medassist-backend.service
sudo systemctl start medassist-backend.service

sudo systemctl enable medassist-frontend.service
sudo systemctl start medassist-frontend.service

echo "=== MedAssist AI Deployment Complete! ==="
echo "Access the platform on HTTP port 80 of your EC2 Public IP."
