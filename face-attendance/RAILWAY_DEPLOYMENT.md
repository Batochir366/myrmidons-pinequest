# Railway Deployment Guide

## 🚀 **Step-by-Step Railway Deployment**

### **Step 1: Create Railway Account**

1. Go to https://railway.app
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### **Step 2: Connect Your Repository**

1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `myrmidons` repository
4. Select the `face-attendance` folder

### **Step 3: Configure Environment Variables**

In Railway dashboard, go to your project → Variables tab:

```
MONGODB_URI=mongodb+srv://gbataa366_db_user:sXM3AMhScmviCN7c@kidsaving.dtylnys.mongodb.net/PineQuest
SECRET_KEY=your-secret-key-here
PORT=5000
```

### **Step 4: Deploy**

1. Railway will automatically detect the Dockerfile
2. Click "Deploy"
3. Wait for build to complete (5-10 minutes)
4. Your app will be live!

### **Step 5: Test Your App**

1. Railway will give you a URL like: `https://your-app-name.railway.app`
2. Test these endpoints:
   - `GET /` - Basic info
   - `GET /health` - Health check
   - `POST /login` - Face login
   - `POST /register` - User registration

## 🎯 **Why Railway is Better for Face Recognition:**

✅ **Better ML Support:** Handles dlib/face-recognition dependencies
✅ **Automatic Scaling:** Scales based on demand
✅ **Easy Environment Variables:** Simple configuration
✅ **GitHub Integration:** Auto-deploys on push
✅ **Free Tier:** 500 hours/month free

## 🔧 **Troubleshooting:**

If face recognition still doesn't work:

1. Check Railway logs for errors
2. Verify environment variables are set
3. Check if all dependencies installed correctly

## 📱 **Your App Will Be Live At:**

`https://your-app-name.railway.app`

## 🎉 **Success!**

Your face-attendance app with full face recognition will be working on Railway!
