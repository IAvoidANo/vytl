# Vytl Deployment Guide

This guide covers deploying Vytl to production using Vercel and Supabase.

## Prerequisites

- GitHub repository with Vytl codebase
- Vercel account (free tier works)
- Supabase account (free tier works for beta)
- Anthropic API key for AI features
- Custom domain (optional)

---

## 1. Environment Variables

### Required Variables

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Authentication
NEXTAUTH_SECRET="your-secure-random-string-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# AI Features
ANTHROPIC_API_KEY="sk-ant-..."
```

### Generating NEXTAUTH_SECRET

```bash
# Option 1: Using openssl
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | Supabase pooled connection (port 6543) | postgresql://...6543/postgres?pgbouncer=true |
| DIRECT_URL | Supabase direct connection (port 5432) | postgresql://...5432/postgres |
| NEXTAUTH_SECRET | JWT signing secret (32+ chars) | Random base64 string |
| NEXTAUTH_URL | Your production URL | https://vytl.example.com |
| ANTHROPIC_API_KEY | Claude API key | sk-ant-api03-... |

---

## 2. Supabase Production Setup

### Create Production Project

1. Go to supabase.com and create a new project
2. Choose a region close to your users (e.g., aws-af-south-1 for South Africa)
3. Set a strong database password and save it securely
4. Wait for project provisioning (~2 minutes)

### Get Connection Strings

1. Go to Settings > Database > Connection string
2. Copy both connection strings:
   - Transaction pooler (port 6543) -> DATABASE_URL
   - Session pooler (port 5432) -> DIRECT_URL
3. Replace [YOUR-PASSWORD] with your database password

### Run Database Migrations

```bash
# Set environment variables locally
export DATABASE_URL="your-production-database-url"
export DIRECT_URL="your-production-direct-url"

# Push schema to production
npx prisma db push

# Verify tables were created
npx prisma studio
```

### Seed Initial Data (Optional)

```bash
# Create initial organisation and admin user
npx prisma db seed
```

This creates:
- Organisation: "Acme Corp"
- Admin user: admin@acme.com / Password123!

**Important:** Change the admin password immediately after first login.

---

## 3. Vercel Deployment

### Connect Repository

1. Go to vercel.com and click "Add New Project"
2. Import your GitHub repository
3. Vercel auto-detects Next.js configuration

### Configure Environment Variables

1. In project settings, go to Settings > Environment Variables
2. Add all required variables:

```
DATABASE_URL = postgresql://...
DIRECT_URL = postgresql://...
NEXTAUTH_SECRET = your-secret
NEXTAUTH_URL = https://your-vercel-domain.vercel.app
ANTHROPIC_API_KEY = sk-ant-...
```

3. Set variables for Production environment (and optionally Preview/Development)

### Build Settings

Vercel auto-detects these, but verify:
- Framework Preset: Next.js
- Build Command: npm run build (or prisma generate && next build)
- Output Directory: .next
- Install Command: npm install

### Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Verify deployment at the provided URL

### Post-Deployment Build Command

If Prisma client issues occur, update the build command:

```bash
prisma generate && next build
```

---

## 4. Custom Domain Configuration

### Add Domain in Vercel

1. Go to Settings > Domains
2. Add your domain (e.g., vytl.yourcompany.com)
3. Vercel provides DNS records to configure

### DNS Configuration

Add these records at your domain registrar:

For apex domain (yourcompany.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

For subdomain (vytl.yourcompany.com):
```
Type: CNAME
Name: vytl
Value: cname.vercel-dns.com
```

### Update NEXTAUTH_URL

After domain is verified, update the environment variable:

```
NEXTAUTH_URL = https://vytl.yourcompany.com
```

Redeploy for changes to take effect.

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. No action needed.

---

## 5. Post-Deployment Checklist

### Immediate Verification

- [ ] Homepage loads without errors
- [ ] Login page accessible at /login
- [ ] Can log in with seeded admin account
- [ ] Dashboard loads with widgets
- [ ] Can create a new risk
- [ ] Can view risk detail page

### Feature Testing

- [ ] Authentication
  - [ ] Login works
  - [ ] Logout redirects to login
  - [ ] Protected pages redirect unauthenticated users
  - [ ] Password reset flow works

- [ ] Risk Management
  - [ ] Create new risk with all fields
  - [ ] Edit existing risk
  - [ ] Delete risk (as RISK_MANAGER+)
  - [ ] Risk scoring calculates correctly
  - [ ] Heatmap view works

- [ ] AI Features
  - [ ] AI Analysis generates (requires valid ANTHROPIC_API_KEY)
  - [ ] AI suggestions appear in risk form (50+ char description)
  - [ ] Rate limiting works (10 requests/minute)

- [ ] Import
  - [ ] Excel import works
  - [ ] CSV import works
  - [ ] PDF/Word import with AI extraction works
  - [ ] Template download works

- [ ] User Management
  - [ ] Can invite new user
  - [ ] Invite acceptance works
  - [ ] Role changes work
  - [ ] User enable/disable works

- [ ] Settings
  - [ ] Profile update works
  - [ ] Password change works
  - [ ] Organisation settings save (ADMIN+)
  - [ ] POPIA settings save (ADMIN+)

- [ ] UX Features
  - [ ] Command palette opens (Cmd+K / Ctrl+K)
  - [ ] Sparklines show in risk table
  - [ ] Dashboard widgets are draggable (unlock mode)

### Performance Checks

- [ ] Page load times < 3 seconds
- [ ] No console errors in browser
- [ ] Images and assets load correctly

### Security Checks

- [ ] HTTPS enforced (redirects from HTTP)
- [ ] No sensitive data in browser console
- [ ] API routes return 401 for unauthenticated requests
- [ ] Role-based access control enforced

---

## 6. Monitoring and Maintenance

### Vercel Analytics

Enable in Vercel dashboard for:
- Page views and unique visitors
- Performance metrics (Web Vitals)
- Error tracking

### Database Monitoring

In Supabase dashboard:
- Monitor connection pool usage
- Check query performance
- Set up alerts for high usage

### Updating the Application

```bash
# Push changes to main branch
git push origin main

# Vercel auto-deploys on push
```

---

## 7. Scaling Considerations

### Database

- Free tier: 500MB storage, suitable for beta
- Pro tier: For production with more users

### Vercel

- Hobby: 100GB bandwidth/month
- Pro: For teams and higher limits

### Rate Limiting

Current in-memory rate limiting works for single-instance. For production scale, replace with Redis-based rate limiting using Upstash.

### Email (Future)

For password reset emails in production, add email service (Resend, SendGrid, etc.)

---

## Troubleshooting

### Build Failures

Prisma client not found:
```bash
# Add to build command
prisma generate && next build
```

### Database Connection Issues

Connection timeout:
- Check DATABASE_URL uses port 6543 (pooler)
- Verify password has no special characters needing encoding

### Authentication Issues

NEXTAUTH_URL mismatch:
- Ensure URL matches your deployment domain exactly
- Include https:// prefix, no trailing slash

### AI Features Not Working

API key invalid:
- Verify ANTHROPIC_API_KEY is correct
- Check Anthropic dashboard for usage/billing

---

*Last updated: January 2026*
