# Deployment Guide: Hostinger VPS (Full Stack)

This guide deploys the whole project to a Hostinger VPS (Ubuntu-based). It covers:
- Backend: Node/Express
- Frontend: Vite build served by Nginx
- Supabase env setup
- SMTP via Hostinger (or your domain mail)
- SSL via Let's Encrypt

## 0) Assumptions
- VPS OS: Ubuntu 22.04 (or similar)
- Domain: example.com (optional but recommended)
- Repo is on GitHub and you can SSH into VPS

## 0.1) Hostinger hPanel steps (click guide)

### A) Create / open VPS
1. Login to Hostinger hPanel.
2. Click VPS in the left sidebar.
3. Click Manage on your VPS plan.
4. In Operating System, pick Ubuntu 22.04.
5. Click Install OS (wait until status is Running).

### B) Get VPS access details
1. In the VPS dashboard, copy the IP Address.
2. Go to SSH Access or Access Details tab.
3. Set/Reset root password if asked.
4. Keep these ready: IP, SSH user (usually root), password.

### C) (Optional) Add domain to VPS
1. Go to Domains in hPanel.
2. Select your domain.
3. Click DNS / DNS Zone.
4. Add or edit A Record:
    - Name: @
    - Points to: your VPS IP
5. Add or edit CNAME:
    - Name: www
    - Points to: @
6. Save changes (DNS may take a few minutes to hours).

### D) (Optional) Create email account for SMTP
1. Go to Emails in hPanel.
2. Choose your domain.
3. Click Create Email Account.
4. Set email (e.g., noreply@yourdomain.com) and password.
5. After creation, click Manage -> Configure Mail Client.
6. Copy SMTP host, port, and encryption type.

## 1) Prepare VPS

### 1.0 Connect via SSH
From your local machine (PowerShell or Terminal):
```bash
ssh root@YOUR_VPS_IP
```
If asked, type yes and enter your VPS password.

### 1.1 Update packages
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Node.js (LTS) and tools
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git
```

Check:
```bash
node -v
npm -v
```

### 1.3 Install PM2 (process manager)
```bash
sudo npm install -g pm2
```

### 1.4 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 2) Clone Repository

```bash
cd /var/www
sudo mkdir project-sia
sudo chown -R $USER:$USER /var/www/project-sia
cd /var/www/project-sia

git clone https://github.com/VoidnessRez/SIA-Project .
```

## 3) Backend Setup (Express)

### 3.1 Install dependencies
```bash
cd /var/www/project-sia/project-sia/backend
npm install
```

### 3.2 Create production environment file
Create a new file:
```bash
nano /var/www/project-sia/project-sia/backend/.env
```

Example:
```env
PORT=5174
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
RECAPTCHA_SECRET=your_recaptcha_secret

# SMTP (Hostinger or your mail server)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password

# Email app config
EMAIL_TRANSPORT=smtp
EMAIL_FROM_NAME=Mejia Spareparts
EMAIL_FROM=noreply@yourdomain.com
EMAIL_ADMIN_FROM=noreply@yourdomain.com
EMAIL_ORDERS_FROM=noreply@yourdomain.com
```

Notes:
- Use port 587 for STARTTLS (`SMTP_SECURE=false`).
- Use port 465 for SSL (`SMTP_SECURE=true`).
- Port 25 is often blocked.

### 3.3 Start backend with PM2
```bash
cd /var/www/project-sia/project-sia/backend
pm2 start index.js --name project-sia-backend
pm2 save
pm2 startup
```

Test backend:
```bash
curl http://localhost:5174/api/health
```

## 4) Frontend Build and Serve

### 4.1 Install dependencies and build
```bash
cd /var/www/project-sia/project-sia/frontend
npm install
npm run build
```

This generates `frontend/dist`.

### 4.2 Configure Nginx
Create site config:
```bash
sudo nano /etc/nginx/sites-available/project-sia
```

Paste and update domain:
```nginx
server {
    listen 80;
    server_name 76.13.191.123;

    root /var/www/project-sia/project-sia/frontend/dist;
    index index.html;

    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5174/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/project-sia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5) SSL (HTTPS)

### 5.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Get certificate
```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Auto-renew:
```bash
sudo systemctl enable certbot.timer
```

## 6) Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 7) SMTP Notes (Hostinger)

- Check Hostinger email panel for SMTP host, user, and password.
- Recommended port: 587 (STARTTLS).
- Set SPF, DKIM, and DMARC in DNS for your domain to avoid spam.

## 8) Env Vars on Frontend

Set Vite env vars before build if needed.
Create `frontend/.env.production`:
```env
VITE_API_URL=https://example.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Then rebuild:
```bash
cd /var/www/project-sia/project-sia/frontend
npm run build
```

## 9) Deployment Checklist

- Backend health: `https://example.com/api/health`
- Frontend loads: `https://example.com`
- Signup/login works
- OTP email sends
- Order receipt sends

## 10) Common Issues

### A) Emails not sending
- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are correct.
- Check port 587/465 is allowed by VPS provider.
- Use `openssl s_client -starttls smtp -connect mail.yourdomain.com:587` to test.

### B) API returns 502
- Check PM2 status: `pm2 status`
- Check backend logs: `pm2 logs project-sia-backend`
- Ensure backend is on `127.0.0.1:5174`

### C) Frontend routes 404
- Ensure `try_files` SPA rule exists in Nginx.

## 11) Update / Redeploy

```bash
cd /var/www/project-sia/project-sia
git pull

# Backend
cd backend
npm install
pm2 restart project-sia-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```
