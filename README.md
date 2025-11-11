# OAuth 2.0 Social Login - MERN Application

A comprehensive OAuth 2.0 implementation with social login support for Google, GitHub, and Facebook using the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

### ✅ Core OAuth Features
- **Multiple Providers**: Google, GitHub, and Facebook OAuth integration
- **PKCE Flow**: Proof Key for Code Exchange for enhanced security
- **State & Nonce Validation**: Protection against CSRF and replay attacks
- **Authorization Code Flow**: Secure OAuth 2.0 implementation

### 🔐 Security Features
- **JWT Authentication**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **HttpOnly Cookies**: Secure refresh token storage
- **Token Blacklist**: Server-side token invalidation on logout
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Express-validator for all API endpoints
- **Correlation IDs**: Request tracing for security monitoring

### 👤 User Management
- **Role-Based Access Control (RBAC)**: User and Admin roles
- **Account Linking/Unlinking**: Connect multiple OAuth providers to one account
- **Profile Sync**: Automatic avatar and name synchronization from providers
- **First-time User Provisioning**: Automatic account creation on first login
- **Account Settings Page**: Manage linked providers and profile

### 📊 Audit & Monitoring
- **Structured Logging**: Comprehensive auth event logging
- **Security Event Tracking**: Monitor suspicious activities
- **Metrics Dashboard**: Authentication statistics and metrics
- **Admin Panel**: View users, audit logs, and system metrics

## 📁 Project Structure

```
OAuth2.0 - Social Login/
├── client/                    # React frontend
│   ├── public/
│   └── src/
│       ├── api/
│       │   └── axios.js      # Axios configuration
│       ├── components/
│       │   └── ProtectedRoute.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── hooks/
│       │   └── useAxiosPrivate.js
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── ProfilePage.js
│       │   ├── AdminPage.js
│       │   ├── AuthCallbackPage.js
│       │   └── AccountSettingsPage.js
│       ├── pkceHelper.js     # PKCE utilities
│       └── App.js
│
└── server/                    # Express backend
    ├── middleware/
    │   └── authMiddleware.js # JWT & RBAC middleware
    ├── models/
    │   └── User.js           # MongoDB user schema
    ├── utils/
    │   ├── tokenBlacklist.js # Token invalidation
    │   └── auditLogger.js    # Security logging
    └── index.js              # Main server file
```

## 🛠️ Installation

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account or local MongoDB
- OAuth credentials from:
  - [Google Cloud Console](https://console.cloud.google.com/)
  - [GitHub Developer Settings](https://github.com/settings/developers)
  - [Facebook Developers](https://developers.facebook.com/)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd "OAuth2.0 - Social Login"
```

### 2. Server Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
JWT_ACCESS_SECRET=your_random_secret_key_for_access_token
JWT_REFRESH_SECRET=your_random_secret_key_for_refresh_token
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=5000
```

### 3. Client Setup
```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:
```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 4. Configure OAuth Redirect URIs

In each OAuth provider's console, add the following redirect URI:
```
http://localhost:3000/auth/callback
```

## 🚀 Running the Application

### Start the Server
```bash
cd server
node index.js
```
Server runs on: `http://localhost:5000`

### Start the Client
```bash
cd client
npm start
```
Client runs on: `http://localhost:3000`

## 🔑 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth login
- `POST /auth/github` - GitHub OAuth login
- `POST /auth/facebook` - Facebook OAuth login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and blacklist token

### User Management
- `GET /api/user/me` - Get current user profile
- `GET /api/user/providers` - Get linked OAuth providers
- `POST /api/user/link/:provider` - Link OAuth provider
- `DELETE /api/user/unlink/:provider` - Unlink OAuth provider

### Admin (Protected)
- `GET /api/admin/users` - List all users
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/metrics` - View system metrics

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS in Production**: Use HTTPS for all OAuth redirects
3. **Secure Cookies**: Set `secure: true` in production
4. **Token Expiration**: Use short-lived access tokens
5. **Rate Limiting**: Protect auth endpoints from abuse
6. **Input Validation**: Validate all user inputs
7. **CORS**: Configure proper CORS settings for production

## 🎨 Features Walkthrough

### Login Flow
1. User clicks "Continue with [Provider]"
2. PKCE challenge generated (for Google)
3. Redirected to OAuth provider
4. User authorizes application
5. Redirected back with authorization code
6. Backend exchanges code for tokens
7. User profile created/updated
8. JWT tokens issued
9. User logged in

### Account Linking
1. Navigate to Account Settings
2. Click "Link Account" for desired provider
3. Authorize with OAuth provider
4. Account linked to existing profile
5. Can now login with either provider

### Token Refresh
- Access token expires after 15 minutes
- Refresh token automatically exchanges for new access token
- Seamless user experience without re-login

## 📊 Audit Logging

All authentication events are logged with:
- Correlation ID (for tracing)
- Event type (login, logout, register, link_account)
- Provider used
- User information
- IP address and user agent
- Success/failure status
- Timestamp

## 🛡️ Security Events Tracked

- Failed login attempts
- CSRF attack attempts
- Replay attack detection (nonce validation)
- Invalid token usage
- Rate limit violations
- Account linking/unlinking

## 📝 User Model

```javascript
{
  email: String (required, unique),
  name: String,
  avatar: String (URL),
  role: String (enum: ['user', 'admin']),
  providers: {
    googleId: String,
    githubId: String,
    facebookId: String
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Token Flow

```
Access Token (15min) → Refresh Token (7 days)
│                      │
├─ Stored in memory   └─ Stored in httpOnly cookie
├─ Used for API calls
└─ Auto-refreshed when expired
```

## 🎯 Future Enhancements

- [ ] Add more OAuth providers (Microsoft, Apple, Twitter)
- [ ] Implement Redis for token blacklist (production)
- [ ] Add email verification
- [ ] Two-factor authentication (2FA)
- [ ] Password reset functionality
- [ ] Session management UI
- [ ] Export audit logs to external services
- [ ] Real-time notifications for security events
- [ ] Account deletion and data export (GDPR)

## 📚 Technologies Used

### Backend
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- Axios
- Express Validator
- Express Rate Limit
- CSURF
- Cookie Parser
- Morgan (Logging)

### Frontend
- React 19
- Material-UI (MUI)
- React Router DOM
- Axios
- Context API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Created with ❤️ by [Your Name]

## 🐛 Known Issues

- Facebook OAuth requires valid App ID (currently placeholder)
- Token blacklist uses in-memory storage (use Redis for production)
- CORS set to localhost (update for production)

## 💡 Tips

- Use incognito/private mode for testing multiple accounts
- Clear browser cache if experiencing OAuth issues
- Check console logs for detailed error messages
- Review audit logs for debugging authentication issues

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the audit logs for error details
- Review browser console for client-side errors

---

**Note**: This application is for educational purposes. For production use, implement additional security measures and use proper secret management systems.
