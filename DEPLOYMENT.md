# Admin Site Deployment Guide

## Step-by-Step Instructions

### Step 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Repository name: `emergency-piano-hotline-admin`
3. Description: "Admin dashboard for Emergency Piano Hotline"
4. Visibility: **Private** (recommended for security)
5. Click "Create repository"

### Step 2: Push Code to GitHub (2 minutes)

Run these commands in terminal:

```bash
cd /Volumes/Emergency\ Piano\ Hotline/Website/admin-site
git remote add origin https://github.com/YOUR-USERNAME/emergency-piano-hotline-admin.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

### Step 3: Deploy to Netlify (5 minutes)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select repository: `emergency-piano-hotline-admin`
5. Build settings:
   - **Base directory:** (leave empty)
   - **Build command:** (leave empty)
   - **Publish directory:** `.` (dot)
6. Click **"Deploy site"**

### Step 4: Configure Custom Domain (10 minutes)

#### In Netlify:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `admin.emergencypianohotline.com`
4. Netlify will show you DNS instructions

#### In Hostinger (your DNS provider):
1. Log in to Hostinger
2. Go to **Domains** → **emergencypianohotline.com** → **DNS Zone**
3. Add new record:
   - **Type:** CNAME
   - **Name:** admin
   - **Target:** [your-site-name].netlify.app (from Netlify)
   - **TTL:** 3600

4. Save and wait 5-60 minutes for DNS propagation

### Step 5: Enable HTTPS (Automatic)

Netlify automatically provisions SSL certificate once DNS is configured.
You'll see "HTTPS" status change from "Waiting" to "Secured" in Netlify.

### Step 6: Test

1. Visit `https://admin.emergencypianohotline.com`
2. Log in with your admin credentials
3. Verify all features work:
   - Overview stats
   - User list
   - Content analytics
   - Tutorial details
   - Billing metrics

### Step 7: Add IP Whitelist (Optional but Recommended)

See `SECURITY.md` for instructions on restricting access to your IP only.

## Troubleshooting

### DNS not resolving
- Wait up to 1 hour for DNS propagation
- Check DNS with: `dig admin.emergencypianohotline.com`
- Verify CNAME record is correct in Hostinger

### 404 errors
- Check Netlify deploy log for errors
- Verify `netlify.toml` is in repository root

### Admin won't load
- Check browser console for errors
- Verify Supabase credentials in `config.js`
- Check Netlify function logs

### Can't log in
- Verify your email is in Supabase `users` table with admin flag
- Check Supabase auth logs

## Next Steps

After successful deployment:

1. ✅ **Bookmark** `admin.emergencypianohotline.com`
2. ✅ **Remove admin from main site** (see separate instructions)
3. ✅ **Add IP whitelist** for extra security
4. ✅ **Set up audit logging** (optional)

## Support

Questions? hello@dntwig.com
