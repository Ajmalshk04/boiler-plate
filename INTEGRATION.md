# API Integration Guide

This document outlines the complete integration between the backend API and both frontend applications (admin and website).

## 🏗️ Architecture Overview

```
├── server/          # Node.js/Express API
├── admin/           # React Admin Panel
└── website/         # React Public Website
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd server && npm install

# Admin Panel
cd admin && npm install

# Website
cd website && npm install
```

### 2. Environment Setup

```bash
# Server
cp server/.env.example server/.env

# Admin
cp admin/.env.example admin/.env

# Website  
cp website/.env.example website/.env
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend API
cd server && npm run dev

# Terminal 2 - Admin Panel (http://localhost:5173)
cd admin && npm run dev

# Terminal 3 - Website (http://localhost:5174)
cd website && npm run dev
```

## 🔐 Authentication Flow

### Admin Panel
1. Admin logs in with email/password
2. Receives secure cookies (`c_nw_t`, `c_nw_rt`)
3. Automatic token refresh on API calls
4. Full user management capabilities

### Website
1. User registers with enhanced form (Individual/Corporate)
2. Login with email/mobile + password OR OTP
3. Receives secure cookies (`_nw_t`, `_nw_rt`)
4. Profile management and session tracking

## 📡 API Integration

### Key Features
- **Axios Interceptors**: Automatic token refresh
- **React Query**: Caching and state management
- **TypeScript**: Full type safety
- **Error Handling**: Comprehensive error management
- **Loading States**: UI feedback for all operations

### Custom Components
- Components in `/components/custom/` folder
- No modifications to existing UI components
- Follows shadcn/ui patterns

## 🛡️ Security Features

- HttpOnly signed cookies
- CSRF protection with SameSite
- Rate limiting on auth endpoints
- Input validation and sanitization
- Automatic session management

## 📱 Usage Examples

### Admin Operations
```typescript
// Get users with advanced filtering
const { data: users } = useUsers({
  page: 1,
  limit: 10,
  role: 'user',
  status: 'active'
});

// Bulk update users
const { mutate: bulkUpdate } = useBulkUpdateUsers();
bulkUpdate({
  userIds: ['id1', 'id2'],
  updateData: { isActive: false }
});
```

### User Operations
```typescript
// Register with company details
const { mutate: register } = useRegister();
register({
  name: 'John Doe',
  email: 'john@company.com',
  mobile: '9876543210',
  accountType: 'Corporate',
  companyName: 'Tech Corp'
});

// Login with OTP
const { mutate: login } = useLogin();
login({
  contact: 'john@company.com',
  otp: '123456'
});
```

## 🔧 Customization

### Adding New API Endpoints
1. Add to appropriate API file (`auth-api.ts`, `users-api.ts`)
2. Create React Query hooks
3. Update TypeScript interfaces
4. Add to components

### Custom UI Components
- Create in `/components/custom/` folder
- Copy from existing UI components if needed
- Maintain consistent styling patterns

## 🚦 Development Guidelines

1. **Never modify** existing UI components in `/components/ui/`
2. Use custom components in `/components/custom/`
3. Follow TypeScript strict mode
4. Add proper error handling
5. Include loading states
6. Use React Query for API calls

## 📊 Available Hooks

### Authentication
- `useLogin()` - User/Admin login
- `useRegister()` - User registration
- `useProfile()` - Get current user
- `useUpdateProfile()` - Update profile
- `useLogout()` - Logout functionality

### User Management (Admin)
- `useUsers()` - List users with filtering
- `useSearchUsers()` - Search functionality
- `useUserStats()` - User statistics
- `useUpdateUserStatus()` - Status management
- `useBulkUpdateUsers()` - Bulk operations
- `useExportUsers()` - Data export

## 🎯 Production Deployment

### Environment Variables
```bash
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/myapp
ACCESS_TOKEN_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-secret
COOKIE_SECRET=your-secret
CLIENT_URL=https://yourapp.com

# Frontend
VITE_API_URL=https://api.yourapp.com/api
```

### Build Commands
```bash
# Server
npm run start

# Admin & Website
npm run build
npm run preview
```

This integration provides a complete, production-ready authentication and user management system with proper separation of concerns and security best practices.