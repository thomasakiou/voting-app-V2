# 🚀 Netlify Deployment Guide

This guide will help you deploy the SecureVote voting application to Netlify.

## 📋 Prerequisites

- A [Netlify account](https://app.netlify.com/signup) (free tier works fine)
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally (for testing the build)

## 🔧 Pre-Deployment Checklist

### 1. Test the Build Locally

Before deploying, make sure your app builds successfully:

```bash
npm run build
```

This should create a `dist` folder with your production-ready files.

### 2. Test the Production Build

Preview the production build locally:

```bash
npm run preview
```

Visit `http://localhost:4173` to test the built app.

## 🌐 Deploy to Netlify

### Option 1: Deploy via Netlify UI (Recommended for First Time)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Go to Netlify Dashboard**
   - Visit [https://app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"

3. **Connect Your Repository**
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your `voting_frontend` repository

4. **Configure Build Settings**
   
   Netlify should auto-detect these settings from `netlify.toml`, but verify:
   
   - **Base directory**: (leave empty or `.`)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 or higher

5. **Deploy!**
   - Click "Deploy site"
   - Netlify will build and deploy your app
   - You'll get a random URL like `https://random-name-123456.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Netlify in Your Project**
   ```bash
   netlify init
   ```
   
   Follow the prompts:
   - Create & configure a new site
   - Choose your team
   - Enter a site name (or leave blank for random)
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## 🔒 Environment Variables (Optional)

If you need to set environment variables (like API keys):

1. Go to your site in Netlify Dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add your variables:
   - `VITE_API_URL` (if you want to override the API URL)
   - `GEMINI_API_KEY` (if needed)

## 🎨 Custom Domain (Optional)

To use a custom domain instead of `*.netlify.app`:

1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

## 📝 Important Files Created

- **`netlify.toml`**: Netlify configuration file
  - Defines build settings
  - Sets up SPA redirects
  
- **`public/_redirects`**: Redirect rules for client-side routing
  - Ensures all routes work correctly in production

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Login page loads correctly
- [ ] Navigation works (no 404 errors on refresh)
- [ ] Dark mode toggle works
- [ ] Admin dashboard is accessible
- [ ] Voter dashboard is accessible
- [ ] API calls to backend work (check browser console)

## 🐛 Troubleshooting

### Build Fails

**Error: "Command failed with exit code 1"**
- Run `npm run build` locally to see the exact error
- Check for TypeScript errors
- Ensure all dependencies are in `package.json`

### Routes Return 404

**Problem: Refreshing the page shows 404**
- Verify `public/_redirects` file exists
- Check `netlify.toml` has the redirect rule

### API Calls Fail (CORS Errors)

**Problem: API requests are blocked**
- Your backend must allow requests from your Netlify domain
- Update backend CORS settings to include:
  ```python
  origins = [
      "https://your-site-name.netlify.app",
      "http://localhost:3000"
  ]
  ```

### Environment Variables Not Working

**Problem: `process.env.VARIABLE_NAME` is undefined**
- In Vite, use `import.meta.env.VITE_VARIABLE_NAME`
- Set variables in Netlify Dashboard under Environment variables
- Redeploy after adding variables

## 🔄 Continuous Deployment

Once connected to Git, Netlify automatically:
- Builds and deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Provides deploy previews for testing

## 📊 Monitoring

Access deployment logs and analytics:
- **Deploys**: See build logs and deployment history
- **Functions**: Monitor serverless function usage (if any)
- **Analytics**: View site traffic (requires Netlify Analytics add-on)

## 🎉 Success!

Your voting app should now be live at:
```
https://your-site-name.netlify.app
```

Share this URL with your users and start voting! 🗳️

---

## 📞 Need Help?

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community Forum](https://answers.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#netlify)
