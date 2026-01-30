# Vytl Deployment Guide

This guide covers deploying Vytl to production using Vercel and Supabase.

## Prerequisites

- GitHub account
- Vercel account (free Hobby tier works)
- Supabase account (free tier works for beta - 500MB, 2 projects)
- Anthropic API key for AI features ($5 credit on signup)
- Custom domain (optional, recommended for production)

## Quick Start (15 minutes)

1. Push code to GitHub
2. Create Supabase project, get connection strings
3. Import to Vercel, set environment variables
4. Run database migration
5. Test deployment

---

## Step 1: Push Code to GitHub

### Create GitHub Repository

```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/vytl.git
git branch -M main
git push -u origin main
```

### Or Push Existing Repo

```bash
git push origin main
```

---

## Environment Variables Reference

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

## Step 2: Supabase Production Setup

### Supabase Free Tier Limits (Perfect for Beta)

| Resource | Free Tier Limit |
|----------|-----------------|
| Database size | 500 MB |
| Projects | 2 active |
| API requests | Unlimited |
| Auth users | Unlimited |
| Edge functions | 500K invocations/month |

### Create Production Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Select your organization (or create one)
4. Configure project:
   - **Name:** `vytl-production`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to users:
     - South Africa: `af-south-1`
     - EU: `eu-west-1` or `eu-central-1`
     - US: `us-east-1`
5. Click **"Create new project"**
6. Wait ~2 minutes for provisioning

### Get Connection Strings

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Copy **two** connection strings:

**Transaction pooler (for DATABASE_URL):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Session mode (for DIRECT_URL):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

4. Replace `[PASSWORD]` with your database password

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

## Step 3: Vercel Deployment

### Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find and select your `vytl` repository
4. Click **"Import"**

### Configure Environment Variables (BEFORE deploying)

**IMPORTANT:** Add these BEFORE clicking Deploy!

1. Expand **"Environment Variables"** section
2. Add each variable one by one:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your Supabase pooler URL (port 6543) | Production |
| `DIRECT_URL` | Your Supabase direct URL (port 5432) | Production |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (update later) | Production |
| `ANTHROPIC_API_KEY` | Your Claude API key | Production |

### Generate NEXTAUTH_SECRET

Run one of these commands locally:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Build Settings

Vercel auto-detects from `vercel.json`, but verify:
- **Framework Preset:** Next.js
- **Build Command:** `prisma generate && next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Deploy

1. Click **"Deploy"**
2. Wait for build (~2-3 minutes)
3. Note your deployment URL: `https://vytl-xxxx.vercel.app`

### Run Database Migration

After first deployment, run migrations:

```bash
# Set production environment variables locally
export DATABASE_URL="your-supabase-pooler-url"
export DIRECT_URL="your-supabase-direct-url"

# Push schema to production database
npx prisma db push

# Seed initial admin user (optional)
npx prisma db seed
```

**Seed creates:**
- Organisation: "Acme Corp"
- Admin user: `admin@acme.com` / `Password123!`

⚠️ **Change the admin password immediately after first login!**

---

## Step 4: Custom Domain Configuration

### Recommended Domain Setup

Use a subdomain like `app.yourcompany.com` or `risk.yourcompany.com`

### Add Domain in Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Domains**
3. Enter your domain: `app.yourcompany.com`
4. Click **Add**

### DNS Configuration

Add these records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**For subdomain (recommended):** `app.yourcompany.com`
```
Type:  CNAME
Name:  app
Value: cname.vercel-dns.com
TTL:   3600 (or Auto)
```

**For apex domain:** `yourcompany.com`
```
Type:  A
Name:  @
Value: 76.76.21.21
TTL:   3600 (or Auto)
```

### Update NEXTAUTH_URL (Critical!)

After domain is verified (green checkmark in Vercel):

1. Go to **Settings** → **Environment Variables**
2. Edit `NEXTAUTH_URL`
3. Change from `https://vytl-xxx.vercel.app` to `https://app.yourcompany.com`
4. Click **Save**
5. Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

### SSL Certificate

Vercel automatically provisions free SSL via Let's Encrypt. No action needed.

### DNS Propagation

- Changes take 5 minutes to 48 hours to propagate
- Check status: `dig app.yourcompany.com` or use [dnschecker.org](https://dnschecker.org)

---

## Step 5: Post-Deployment Testing Checklist

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

## Monitoring and Maintenance

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

## Scaling Considerations

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
