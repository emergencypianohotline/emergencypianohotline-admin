# Security Configuration

## IP Whitelist for Admin Access

To restrict admin API access to your IP address only:

### 1. Get Your IP Address

Visit: https://whatismyipaddress.com/

### 2. Update Supabase Function

In `members-site/supabase/functions/admin-stats/index.ts`, add at the top:

```typescript
const ALLOWED_IPS = [
  'YOUR.IP.ADDRESS.HERE',  // Your home/office IP
  // Add more IPs as needed
];

// Check IP before processing request
const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                 req.headers.get('cf-connecting-ip');

if (!ALLOWED_IPS.includes(clientIP)) {
  return new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 3. Redeploy Function

```bash
cd members-site
supabase functions deploy admin-stats
```

## Additional Security Measures

### 2FA (Two-Factor Authentication)

Can be added via Supabase Auth settings.

### Audit Logging

All admin actions should be logged. See audit logging implementation in admin-stats function.

### Rate Limiting

Supabase Edge Functions have built-in rate limiting.

### Session Timeout

Admin sessions expire after inactivity. Configured in Supabase Auth settings.

## Monitoring

Check Supabase function logs regularly:
```bash
supabase functions logs admin-stats --tail
```

Look for:
- Failed authentication attempts
- 403 Forbidden responses (blocked IPs)
- Unusual activity patterns

## Incident Response

If you suspect unauthorized access:
1. Immediately change your admin password
2. Check Supabase logs for unauthorized access
3. Rotate API keys if needed
4. Review audit logs for any data changes

## Contact

Security concerns: hello@dntwig.com
