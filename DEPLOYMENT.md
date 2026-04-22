# Stella Deployment Guide - Vercel + Render

## Overview
- **Frontend**: React app deployed to **Vercel** (free)
- **Backend**: Django API deployed to **Render** (free tier)
- **Database**: PostgreSQL on Render (free tier)

---

## Phase 1: Prepare & Push Code to GitHub

### 1. Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stella.git
git push -u origin main
```

### 2. Create `.env` File Locally (DON'T COMMIT)
```
SECRET_KEY=django-insecure-generated-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
GROQ_API_KEY=your-groq-key-here
```

---

## Phase 2: Deploy Backend to Render

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2. Create Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Fill in settings:
   - **Name**: `stella-api`
   - **Environment**: `Python 3.11`
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn Connect.wsgi:application --bind 0.0.0.0:8000`

### 3. Add Environment Variables
In Render dashboard, go to Environment:
```
SECRET_KEY=generate-new-random-key
DEBUG=False
ALLOWED_HOSTS=stella-api.onrender.com
DATABASE_URL=(will be set by PostgreSQL)
GROQ_API_KEY=your-actual-groq-key
```

### 4. Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Fill in:
   - **Name**: `stella`
   - **Database**: `stella_db`
3. Copy connection string
4. Paste in your web service's `DATABASE_URL` variable

### 5. Deploy
- Render will automatically deploy when you push to GitHub
- Wait for build to complete (3-5 minutes)
- Note your API URL: `https://stella-api.onrender.com`

**Note**: Free tier sleeps after 15 minutes of inactivity. First request will be slow.

---

## Phase 3: Deploy Frontend to Vercel

### 1. Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

### 2. Import Project
1. Click "Add New" → "Project"
2. Select your GitHub repository
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `Stella`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Add Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:
```
VITE_API_URL=https://stella-api.onrender.com/api
```

### 4. Deploy
- Click "Deploy"
- Wait for deployment (1-2 minutes)
- Your site is live at `https://stella-frontend.vercel.app`

---

## Phase 4: Connect Frontend to Backend

### 1. Update CORS in Backend Settings
In `Connect/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://stella-frontend.vercel.app",
    "http://localhost:5173",  # for local development
]
```

### 2. Test the Connection
1. Open your Vercel app
2. Try logging in or registering
3. Check browser console for errors
4. Check Render logs for backend errors

---

## Phase 5: Production Checklist

Before considering live:

- [ ] Database has SECRET_KEY environment variable set
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS includes your Render domain
- [ ] GROQ_API_KEY is set in Render env variables
- [ ] CORS_ALLOWED_ORIGINS includes Vercel domain
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Test login/registration works
- [ ] Test API endpoints work
- [ ] Check error logs regularly

---

## Troubleshooting

### Backend Not Responding
```bash
# Check Render logs
# Look for:
# - Database connection errors
# - Missing environment variables
# - Import errors
```

### Static Files Not Loading
```bash
# Re-run in Render dashboard:
python manage.py collectstatic --clear --noinput
```

### CORS Errors
```javascript
// Browser console shows CORS error
// Solution: Update CORS_ALLOWED_ORIGINS in settings.py
// Then push to GitHub - Render will auto-deploy
```

### Cold Start Slow
- Free tier sleeps after 15 minutes
- First request takes 30-60 seconds
- Solution: Upgrade to paid tier or accept the delay

---

## Local Development

Run both locally before deploying:

### Backend
```bash
cd Connect
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py runserver
```

### Frontend
```bash
cd Stella
npm install
npm run dev
```

Update `src/api.js`:
```javascript
const BASE = 'http://localhost:8000/api';  // for local
```

---

## Monitoring & Logs

### Render Logs
- Dashboard → Logs tab
- Shows all errors and output

### Vercel Logs
- Dashboard → Deployments → Build Logs
- Shows build errors

---

## Cost Summary

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Free | $0 |
| Render Web | Free | $0 (sleeps) |
| Render PostgreSQL | Free | $0 (limited) |
| **Total** | | **$0** |

When you outgrow free tier: ~$12/month minimum

---

## Next Steps

1. Push code to GitHub
2. Follow Phase 2 (Render backend)
3. Follow Phase 3 (Vercel frontend)
4. Test the connection
5. Monitor logs for errors
6. Share your live URL!

Good luck! 🚀
