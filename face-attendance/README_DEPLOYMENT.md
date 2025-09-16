# Face Attendance Deployment Guide

## Render Deployment

### Prerequisites

1. A Render account
2. A MongoDB database (MongoDB Atlas recommended)
3. Git repository with this code

### Deployment Steps

1. **Connect Repository**

   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Select the `face-attendance` folder

2. **Configure Service**

   - **Name**: `face-attendance` (or your preferred name)
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
   - **Plan**: `Starter` (free tier)

3. **Environment Variables**
   Set these in the Render dashboard:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
   SECRET_KEY=your-secret-key-here
   PORT=5000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your service
   - Monitor the build logs for any issues

### Testing Deployment

Once deployed, test these endpoints:

- `GET /` - Basic health check
- `GET /health` - Detailed health status
- `POST /login` - Face login (requires image)
- `POST /logout` - Face logout (requires image)
- `POST /register` - User registration (requires image)

### Troubleshooting

1. **Build Failures**

   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `requirements.txt`
   - Verify Dockerfile syntax

2. **Runtime Errors**

   - Check the service logs
   - Verify MongoDB connection string
   - Ensure model files are present

3. **Face Recognition Not Working**
   - Check if all ML dependencies installed correctly
   - Verify model files are in the correct location
   - Check the `/health` endpoint for status

### Local Testing

To test locally before deployment:

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGODB_URI="your-mongodb-uri"
export SECRET_KEY="your-secret-key"

# Run the app
python app.py
```

### File Structure

```
face-attendance/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker configuration
├── render.yaml                     # Render configuration
├── start.sh                        # Startup script
├── test_installation.py           # Installation test
├── util.py                        # Utility functions
└── Silent_Face_Anti_Spoofing/     # Anti-spoofing models
    ├── resources/
    │   ├── anti_spoof_models/     # Model files (.pth)
    │   └── detection_model/       # Detection models
    └── src/                       # Source code
```

### Notes

- The service uses CPU-only PyTorch for compatibility with Render
- Face recognition may be slower on CPU but will work
- Model files are included in the repository
- The service gracefully handles missing dependencies
