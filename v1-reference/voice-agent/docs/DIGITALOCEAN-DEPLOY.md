# 🚀 Deploy to DigitalOcean App Platform

## Quick Deploy (5 Minutes)

### Prerequisites
- DigitalOcean account ([Sign up here](https://www.digitalocean.com/))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- GitHub repository (your code must be pushed to GitHub)

---

## Step 1: Push to GitHub

Make sure your business-voice code is pushed to a GitHub repository:

```bash
cd tribes/business-voice

# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/business-voice.git
git push -u origin main
```

---

## Step 2: Create App on DigitalOcean

### Option A: One-Click Deploy Button

1. Go to your GitHub repository
2. Add this button to your README (optional)
3. Click the button

```markdown
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/YOUR_USERNAME/business-voice/tree/main)
```

### Option B: Manual Setup

1. **Go to DigitalOcean Console**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub**
   - Choose "GitHub" as source
   - Authorize DigitalOcean to access your repo
   - Select your `business-voice` repository
   - Choose the `main` branch

3. **Configure App**
   - **Name**: `business-voice-agent`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Autodeploy**: ✅ Enabled

4. **Edit Plan**
   - Click "Edit Plan" next to your app
   - Choose: **Basic** plan
   - Instance size: **$5/month** (sufficient for demo/MVP)

5. **Environment Variables**
   Click "Edit" next to environment variables and add:

   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   NODE_ENV=production
   PORT=8080
   ```

   **IMPORTANT**: Replace `sk-proj-your-actual-key-here` with your real OpenAI API key!

6. **Review & Deploy**
   - Review settings
   - Click "Create Resources"
   - Wait 3-5 minutes for deployment

---

## Step 3: Access Your App

Once deployed, you'll see:

```
✅ App is live at: https://business-voice-agent-xxxxx.ondigitalocean.app
```

### Test It:

1. **Worker Interface**: `https://your-app.ondigitalocean.app/voice-realtime`
2. **Admin Panel**: `https://your-app.ondigitalocean.app/admin`
3. **Setup**: `https://your-app.ondigitalocean.app/setup`

---

## Step 4: Test on Your Friend's Phone

1. **Share the URL**:
   ```
   https://your-app.ondigitalocean.app/voice-realtime
   ```

2. **Worker selects role** (Warehouse, Delivery, Restaurant, Technician, Retail, General)

3. **Starts talking** with the AI assistant

4. **You view transcripts** at:
   ```
   https://your-app.ondigitalocean.app/admin
   ```

---

## ⚙️ App Configuration

### Build Settings (Already Configured)

DigitalOcean automatically detects these from `package.json`:

- **Build Command**: `npm install`
- **Run Command**: `npm run server`
- **HTTP Port**: `8080`

### Auto-Deploy on Git Push

Every time you push to GitHub, your app automatically redeploys!

```bash
# Make changes locally
git add .
git commit -m "Update voice agent"
git push

# App redeploys automatically in ~2 min
```

---

## 💰 Pricing

**Development/MVP**:
- Basic Plan: **$5/month**
- Good for 100-500 concurrent users
- Enough for testing and demos

**Production** (if scaling):
- Professional: $12/month (1 GB RAM)
- More instances for more traffic

---

## 🛠️ Troubleshooting

### App Won't Start

**Check Logs:**
1. Go to DigitalOcean Console
2. Click your app
3. Go to "Runtime Logs"
4. Look for errors

**Common Issues:**

1. **Missing OpenAI API Key**
   ```
   Error: OpenAI API key not configured
   ```
   **Fix**: Add `OPENAI_API_KEY` in environment variables

2. **Wrong Node Version**
   Add `engines` to `package.json`:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

3. **Port Issues**
   Make sure server listens on `process.env.PORT`:
   ```javascript
   const port = process.env.PORT || 3000;
   ```

### WebSocket Issues

If voice doesn't work, check that WebSocket is enabled:
- DigitalOcean App Platform supports WebSocket by default
- Make sure you're using `wss://` (not `ws://`) in production

---

## 🔒 Security Best Practices

### 1. Protect Admin Panel

Add simple password protection to `/admin`:

```javascript
// In src/server.js
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';

app.get('/admin', (req, res) => {
  const auth = req.headers.authorization;

  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.status(401).send('Unauthorized');
    return;
  }

  res.sendFile(path.join(__dirname, '../public/admin.html'));
});
```

Add to environment variables:
```
ADMIN_PASSWORD=your-secure-password-here
```

### 2. Rate Limiting

Already configured in nginx (if using Docker), but for DigitalOcean add:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. HTTPS

DigitalOcean automatically provides HTTPS with SSL certificate! ✅

---

## 📊 Monitoring

### View Metrics:
1. Go to DigitalOcean Console
2. Click your app
3. Go to "Insights" tab

You'll see:
- Request count
- Response time
- Memory usage
- CPU usage

### Set up Alerts:
1. Click "Alerts" in console
2. Add alert for high CPU/memory
3. Get notified via email/Slack

---

## 🔄 Custom Domain (Optional)

### Add Your Own Domain:

1. **In DigitalOcean Console:**
   - Go to your app
   - Click "Settings" → "Domains"
   - Click "Add Domain"
   - Enter: `voice.yourdomain.com`

2. **In Your Domain Registrar (Namecheap, GoDaddy, etc):**
   - Add CNAME record:
   ```
   Host: voice
   Value: business-voice-agent-xxxxx.ondigitalocean.app
   TTL: 3600
   ```

3. **Wait 10-30 minutes** for DNS propagation

4. **Access at**: `https://voice.yourdomain.com`

---

## 🚀 Scaling for Production

### When to Scale?

Scale when you see:
- High CPU usage (>80%)
- Slow response times (>2 seconds)
- Memory warnings

### How to Scale:

1. **Vertical Scaling** (bigger instance):
   - Go to app settings
   - Change to Professional plan ($12/month)
   - More RAM and CPU

2. **Horizontal Scaling** (more instances):
   - In "Resources" tab
   - Increase instance count to 2-3
   - DigitalOcean auto load-balances

---

## 📝 Deployment Checklist

Before sharing with users:

- [ ] OpenAI API key configured
- [ ] Tested on mobile device
- [ ] Admin panel accessible
- [ ] Transcripts saving correctly
- [ ] Voice recording works
- [ ] HTTPS enabled (automatic)
- [ ] Optional: Custom domain added
- [ ] Optional: Admin password set
- [ ] Logs checked for errors

---

## 🎯 Next Steps

### After Deployment:

1. **Test Everything**:
   ```
   ✅ Worker can talk to AI
   ✅ Transcripts save
   ✅ Admin panel shows conversations
   ✅ Works on mobile
   ```

2. **Share with Friend**:
   - Send them: `https://your-app.ondigitalocean.app/voice-realtime`
   - They select role
   - Start talking!
   - You check `/admin` for transcripts

3. **Iterate**:
   - Get feedback
   - Make improvements
   - Push to GitHub
   - Auto-deploys!

---

## 💡 Pro Tips

### 1. Environment-Based Configuration

Different settings for dev vs production:

```javascript
const isDev = process.env.NODE_ENV !== 'production';

const config = {
  logLevel: isDev ? 'debug' : 'info',
  corsOrigin: isDev ? '*' : 'https://your-domain.com'
};
```

### 2. Database Upgrade

For production, move from JSON files to database:

**Quick Option**: Add Supabase
```bash
npm install @supabase/supabase-js
```

**In DigitalOcean**: Add PostgreSQL database
- Go to "Create" → "Databases"
- Choose PostgreSQL
- Connect to your app

### 3. Analytics

Track usage:
```javascript
// Simple analytics
const analytics = {
  totalSessions: 0,
  totalMessages: 0,
  byRole: {}
};

app.get('/api/stats', (req, res) => {
  res.json(analytics);
});
```

---

## 🆘 Need Help?

### Resources:
- [DigitalOcean Docs](https://docs.digitalocean.com/products/app-platform/)
- [Node.js on App Platform](https://docs.digitalocean.com/products/app-platform/languages-frameworks/nodejs/)
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)

### Common Commands:

```bash
# View app logs
doctl apps logs <app-id>

# Restart app
doctl apps restart <app-id>

# List apps
doctl apps list
```

---

**You're all set!** 🎉

Deploy now and get your MVP running in 5 minutes!
