# 📘 Facebook OAuth Setup Guide

## Step-by-Step Instructions

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as the app type
4. Fill in:
   - **App Name**: Your app name (e.g., "OAuth Demo")
   - **App Contact Email**: Your email
5. Click "Create App"

### 2. Configure Facebook Login

1. In your app dashboard, find "Facebook Login" in the left sidebar
2. Click "Settings" under Facebook Login
3. Add the following to "Valid OAuth Redirect URIs":
   ```
   http://localhost:3000/auth/callback
   ```
4. Save changes

### 3. Get Your Credentials

1. Go to "Settings" → "Basic"
2. Copy your **App ID**
3. Click "Show" next to **App Secret** and copy it

### 4. Update Your Environment Files

**Server `.env` file:**
```env
FACEBOOK_APP_ID=YOUR_APP_ID_HERE
FACEBOOK_APP_SECRET=YOUR_APP_SECRET_HERE
```

**Client `.env` file:**
```env
REACT_APP_FACEBOOK_APP_ID=YOUR_APP_ID_HERE
```

### 5. Configure App Settings

1. Go to "Settings" → "Basic"
2. Scroll down to "App Domains" and add:
   ```
   localhost
   ```
3. Add a Privacy Policy URL (required for public apps)
4. Save changes

### 6. Set App to Development/Live

**For Development:**
- Your app is in "Development" mode by default
- Only you and test users can login
- Perfect for testing!

**For Production:**
- Switch to "Live" mode in the top bar
- Complete App Review for required permissions
- Add all required business information

### 7. Request Permissions (Optional)

For additional user data, you'll need to request:
- `email` - ✅ Already included (available by default)
- `public_profile` - ✅ Already included (available by default)
- `user_photos` - Requires App Review
- `user_birthday` - Requires App Review

### 8. Test the Integration

1. Restart your server with the new credentials
2. Click "Continue with Facebook" on the login page
3. Authorize the app
4. You should be logged in!

## 🔍 Troubleshooting

### Error: "App Not Set Up: This app is still in development mode"
**Solution**: Add yourself as a test user:
1. Go to "Roles" → "Test Users"
2. Add test users or use your account

### Error: "URL Blocked: Redirect URI is not whitelisted"
**Solution**: Double-check the redirect URI in Facebook Login settings:
- Must be exactly: `http://localhost:3000/auth/callback`
- No trailing slash
- Include the protocol (http://)

### Error: "Can't Load URL: The domain of this URL isn't included in the app's domains"
**Solution**: Add `localhost` to App Domains in Settings → Basic

### Error: "This app can't be used right now"
**Solution**: 
- Make sure you're logged into Facebook
- Check if your app is in Development mode
- Verify you're added as a test user or admin

### No Email Received from Facebook
**Solution**: 
- User must have a verified email on Facebook
- Check if user granted email permission
- Email might be private in Facebook settings

## 🚀 Production Checklist

Before going live:

- [ ] Switch app to "Live" mode
- [ ] Complete Facebook App Review for `email` permission
- [ ] Add production redirect URI (e.g., `https://yourdomain.com/auth/callback`)
- [ ] Update `.env` files with production URLs
- [ ] Add proper Privacy Policy URL
- [ ] Add Terms of Service URL
- [ ] Set up proper error logging
- [ ] Test with multiple Facebook accounts
- [ ] Verify email permission is granted
- [ ] Check account linking works correctly
- [ ] Test unlinking and re-linking

## 📝 Current Scopes Requested

```javascript
const SCOPE = 'email public_profile';
```

### What This Gives You:
- ✅ User's Facebook ID
- ✅ Name
- ✅ Email (if verified and public)
- ✅ Profile picture

### What This Does NOT Give You:
- ❌ Friends list
- ❌ Birthday
- ❌ Posts
- ❌ Photos (other than profile pic)

## 🔐 Security Notes

1. **Never commit** your Facebook App Secret to version control
2. **Validate state** parameter to prevent CSRF (already implemented)
3. **Use HTTPS** in production for redirect URIs
4. **Rotate secrets** regularly
5. **Monitor** suspicious login patterns in audit logs
6. **Limit permissions** to only what you need

## 📚 Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
- [App Review Guide](https://developers.facebook.com/docs/app-review)

## 🎯 Quick Test

After setup, test with this URL (replace YOUR_APP_ID):
```
https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=http://localhost:3000/auth/callback&scope=email%20public_profile&state=test123&response_type=code
```

If it redirects to Facebook login, your App ID is correct!

---

**Happy Coding! 🎉**
