# Hostinger Deployment Guide for DiziProducts Store

Your deployable zip packages for Hostinger have been created:
📦 **`diziproducts-store-hostinger-ready.zip`** (Pre-compiled production build included — Instant Start!)
📦 **`diziproducts-store-source-hostinger.zip`** (Clean source code without `.next` build)

Both packages include:
- `server.js` (Custom production HTTP server with `@next/env` auto loader)
- `.env.production` (Pre-configured production environment variables)
- Integrated Admin Portal at `/asdf` (and static dashboard at `/admin`)
- Pre-configured Razorpay & PayU payment gateway handlers

---

## 🚀 Option 1: Hostinger Managed Node.js (hPanel) — Recommended

If you are using Hostinger Cloud, Business Web Hosting, or Web Application Hosting with Node.js support:

### Step 1: Upload and Extract Files
1. Log into your **Hostinger hPanel**.
2. Go to **Websites** → Click **Manage** next to your domain.
3. Open **File Manager** (Files → File Manager).
4. Navigate to `public_html` (or your subdomain directory).
5. Upload `diziproducts-store-hostinger-ready.zip`.
6. Right-click the uploaded `.zip` and select **Extract**.
7. Delete the `.zip` file from File Manager after extraction.

### Step 2: Configure Node.js in hPanel
1. In hPanel, go to **Advanced** → **Node.js**.
2. Fill in the following details:
   - **Node.js Version**: `20.x` or `22.x` (LTS)
   - **Application Root**: `public_html` (or your installation path)
   - **Application Startup File**: `server.js`
   - **Application Mode**: `Production`
3. Click **Create** / **Save**.

### Step 3: Install Dependencies & Run
1. On the Node.js configuration page, click **Run NPM Install** (or run `npm install --omit=dev` via terminal).
2. Click **Start Application** (or **Restart**).
3. Visit your website domain — your store is now live! 🎉

---

## 🖥️ Option 2: Hostinger VPS Deployment (PM2 & Nginx)

If you are hosting on a Hostinger KVM VPS:

### Step 1: Upload & Extract
```bash
# Upload to your VPS via SCP:
scp diziproducts-store-hostinger-ready.zip root@<YOUR_VPS_IP>:/var/www/diziproducts

# On your VPS:
cd /var/www/diziproducts
unzip diziproducts-store-hostinger-ready.zip
```

### Step 2: Install Node.js & Dependencies
```bash
# Install Node.js 20 LTS (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs npm unzip

# Install production dependencies
npm install --omit=dev
```

### Step 3: Start with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start the application using server.js
pm2 start server.js --name "diziproducts-store"

# Enable auto-start on server reboot
pm2 startup
pm2 save
```

### Step 4: Reverse Proxy Configuration (Nginx)
In your Nginx site configuration, forward incoming traffic on port 80/443 to `http://127.0.0.1:3000`.

---

## ⚙️ Configuration & Credentials

### 1. Store URL & Domain
Open `.env.production` in Hostinger File Manager to update your live domain:
```ini
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. PayU Payment Gateway
To enable online payments via PayU, add your credentials in `.env.production`:
```ini
PAYU_KEY=your_payu_merchant_key
PAYU_SALT=your_payu_merchant_salt
PAYU_ENV=PRODUCTION
NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY=payu
```

### 3. Store Admin Panel
- **URL**: `https://your-domain.com/asdf` (or `https://your-domain.com/admin`)
- **Default Password**: `diziproducts@2026`

### 4. Telegram Alerts
- As requested, Telegram alerts are currently set to `TELEGRAM_ALERTS_ENABLED=false`.
- To turn them back on in the future, set `TELEGRAM_ALERTS_ENABLED=true` and add your bot token in `.env.production`.
