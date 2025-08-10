# Google Maps API Key Setup

## 🚨 Important: API Key Required

The application is currently showing errors because a valid Google Maps API key is not configured.

## 🔑 How to Get a Free Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Maps JavaScript API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"
4. **Create credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your new API key

## 📝 Setup Instructions

1. **Create a `.env` file** in the `frontend` directory:
```bash
cd toll-mock-ui/toll-mock-upi/my-tolls/frontend
touch .env
```

2. **Add your API key** to the `.env` file:
```env
VITE_GOOGLE_MAPS_KEY=your_actual_api_key_here
```

3. **Restart the development server**:
```bash
npm run dev
```

## 💰 Free Tier Information

- **Google Maps API**: $200 credit per month (approximately 28,000 map loads)
- **For development/testing**: This is usually sufficient
- **For production**: Consider setting up billing alerts

## 🔒 Security Notes

- **Never commit your API key** to version control
- **The `.env` file is already in `.gitignore`**
- **Restrict your API key** to specific domains in Google Cloud Console

## 🧪 Testing Without API Key

If you want to test the application structure without setting up an API key:

1. The app will show warnings in the console
2. Map functionality will be limited
3. You can still test the UI components and routing logic

## 📱 Alternative: Use Demo Mode

For development purposes, you can temporarily use:
```env
VITE_GOOGLE_MAPS_KEY=DEMO_KEY
```

**Note**: This will show a watermark and have limited functionality, but it's useful for testing the app structure.

## 🚀 After Setup

Once you've added a valid API key:
1. The map should load without errors
2. Route calculation should work properly
3. No more "InvalidKeyMapError" messages
4. Full Google Maps functionality will be available 