# Emergency Piano Hotline - Admin Dashboard

Standalone admin dashboard for Emergency Piano Hotline.

## Setup

### 1. Deploy to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select this repository
4. Set build settings:
   - Base directory: `admin-site`
   - Build command: (leave empty or `echo "No build needed"`)
   - Publish directory: `.` (current directory)
5. Deploy!

### 2. Configure Custom Domain

1. In Netlify site settings → Domain management
2. Add custom domain: `admin.emergencypianohotline.com`
3. Follow Netlify's instructions to update DNS

### 3. Add to DNS (Hostinger)

1. Go to Hostinger DNS management
2. Add CNAME record:
   - Type: `CNAME`
   - Name: `admin`
   - Target: `[your-netlify-site].netlify.app`
   - TTL: 3600

### 4. Enable HTTPS

Netlify will automatically provision SSL certificate for `admin.emergencypianohotline.com`.

## Security

### IP Whitelist (Recommended)

Add your IP address to the admin-stats Supabase function for extra security.

See `SECURITY.md` for details.

## Usage

Simply visit `https://admin.emergencypianohotline.com` and log in with your admin credentials.

## Features

- Platform overview
- User management
- Content analytics
- Tutorial performance
- Revenue metrics (MRR, churn, LTV)
- Geographical analytics
- Session tracking
- Live stats

## Maintenance

### Updating Admin

1. Make changes to files in `admin-site/`
2. Commit and push to GitHub
3. Netlify auto-deploys

### Shared Backend

The admin site uses the same Supabase backend as the main members site. Admin API endpoints are shared.

## Support

For issues or questions, contact: hello@dntwig.com
