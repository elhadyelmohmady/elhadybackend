# Dashboard Documentation - الهادي موبايل

## Overview
This document covers the complete implementation of the dashboard system for الهادي موبايل, including:
- Backend API endpoints (`/api/dashboard`)
- Frontend application (React + TypeScript + Vite)
- Role-based access control and permissions
- Admin management system

---

## ✅ Completed Features

### Backend (Node.js + Express + MongoDB)

#### 1. **Admin Model Enhancements**
- Added `role` field with 4 levels:
  - `super_admin`: Full access to everything
  - `admin`: Standard admin access
  - `manager`: Limited management access
  - `support`: View-only access with limited permissions

- Added granular `permissions` system:
  ```javascript
  permissions: {
    viewDashboard: Boolean,      // View dashboard statistics
    viewOrders: Boolean,         // View orders list
    manageOrders: Boolean,       // Update order status
    viewUsers: Boolean,          // View users list
    manageUsers: Boolean,        // Toggle user active status
    viewProducts: Boolean,       // View products
    manageProducts: Boolean,     // Edit/create products
    viewCategories: Boolean,     // View categories
    manageCategories: Boolean,   // Edit/create categories
    viewBrands: Boolean,         // View brands
    manageBrands: Boolean,       // Edit/create brands
    manageAdmins: Boolean,       // Create/edit/delete admins
    viewSettings: Boolean,       // View settings
    manageSettings: Boolean      // Edit settings
  }
  ```

#### 2. **Authentication Middleware** (`src/middleware/dashboardAuth.js`)
- JWT-based authentication
- Permission checking middleware
- Role-based access control middleware

#### 3. **Dashboard Controller** (`src/controllers/dashboardController.js`)

**Authentication Endpoints:**
- `POST /api/dashboard/auth/login` - Admin login
- `GET /api/dashboard/auth/me` - Get current admin info

**Dashboard Statistics:**
- `GET /api/dashboard/stats` - Get comprehensive dashboard statistics
  - Total users, active users
  - Total orders, today's orders, this month's orders
  - Total products, low stock products
  - Total revenue, this month's revenue
  - Recent orders (last 5)
  - Total categories and brands

**Revenue Analytics:**
- `GET /api/dashboard/revenue?period=week|month|year` - Get revenue data over time

**Admin Management:** (requires `manageAdmins` permission)
- `GET /api/dashboard/admins` - List all admins
- `POST /api/dashboard/admins` - Create new admin
- `PUT /api/dashboard/admins/:id` - Update admin
- `DELETE /api/dashboard/admins/:id` - Delete admin

**User Management:** (requires `viewUsers` / `manageUsers` permissions)
- `GET /api/dashboard/users?page=1&limit=20&search=&isActive=` - Get users with pagination and filters
- `PUT /api/dashboard/users/:id/toggle-status` - Toggle user active status

**Order Management:** (requires `viewOrders` / `manageOrders` permissions)
- `GET /api/dashboard/orders?page=1&limit=20&status=&search=` - Get orders with filters
- `GET /api/dashboard/orders/:id` - Get single order details
- `PUT /api/dashboard/orders/:id/status` - Update order status

**Product Management:** (requires `viewProducts` permission)
- `GET /api/dashboard/products?page=1&limit=20&search=&brand=&category=&lowStock=` - Get products with filters

#### 4. **Routes Integration**
- Dashboard routes added to `app.js` at `/api/dashboard`
- All routes protected with JWT authentication
- Individual permission checks on each endpoint

---

### Frontend (React + TypeScript + Vite + Tailwind)

#### 1. **Project Setup** (`dashboard-frontend/`)
- **Vite** for fast development and building
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **RTL Support** with Cairo font

#### 2. **Architecture**
```
dashboard-frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # Dashboard layout with sidebar
│   │   └── ProtectedRoute.tsx      # Route protection component
│   ├── context/
│   │   └── AuthContext.tsx         # Authentication context
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── DashboardOverview.tsx   # Main dashboard with stats
│   │   ├── OrdersPage.tsx          # Orders management
│   │   ├── UsersPage.tsx           # Users management
│   │   ├── ProductsPage.tsx        # Products management
│   │   └── AdminsPage.tsx          # Admin management (super_admin only)
│   ├── services/
│   │   ├── api.ts                  # Axios instance with interceptors
│   │   ├── authService.ts          # Authentication service
│   │   └── dashboardService.ts     # Dashboard API service
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── App.tsx                     # Main app component with routing
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
```

#### 3. **Features Implemented**

**Login Page:**
- Beautiful RTL Arabic interface
- Username/password authentication
- Loading states
- Toast notifications
- Redirect to dashboard on success

**Dashboard Layout:**
- Collapsible sidebar (64px / 256px)
- Role badges displayed
- Navigation menu with icons
- Permission-based menu visibility
- User info section
- Logout functionality

**Dashboard Overview:**
- 4 stat cards with icons:
  - Total Users (with active count)
  - Total Orders (with today's count)
  - Total Revenue (with this month's revenue)
  - Total Products (with low stock warning)
- Recent orders table with:
  - Order number
  - Customer name
  - Amount
  - Status badges
  - Date
  - Color-coded statuses

**Orders Management:**
- Search by customer name/phone
- Filter by status
- Pagination support
- Detailed order modal with:
  - Customer info
  - Address details
  - Product list
  - Payment breakdown (total, paid, remaining)
  - Status update buttons
- Status badges with colors:
  - Pending (yellow)
  - Processing (blue)
  - Shipped (purple)
  - Delivered (green)
  - Cancelled (red)
  - Partially Paid (orange)

**Users Management:**
- Search by name/username/phone
- Filter by active status
- Toggle user active/inactive
- Pagination
- Clean table layout

**Products Management:**
- Grid card layout with images
- Search by name
- Low stock filter
- Product cards showing:
  - Image (or placeholder)
  - Name
  - Price
  - Stock count (color-coded)
  - Low stock warning
  - Brand name
  - Category tags
- Pagination

**Admin Management:** (Super Admin only)
- Create new admins with custom permissions
- Edit existing admins
- Delete admins
- Role selection (4 roles)
- 14 granular permission toggles
- Beautiful modal interface

**Protected Routes:**
- Permission-based access control
- Role-based access control
- Unauthorized access page
- Loading states
- Auto-redirect to login if not authenticated

**Toast Notifications:**
- Success messages (green)
- Error messages (red)
- Auto-dismiss after 3 seconds
- Top-center positioning
- Cairo font support

---

## 🚀 Setup Instructions

### Backend Setup

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Set environment variables** in `.env`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
ADMIN_COOKIE_SECRET=change_this_to_something_random
```

3. **Create first super admin** (using MongoDB directly or script):
```javascript
// Example script or use MongoDB Compass
db.admins.insertOne({
  username: "admin",
  password: "$2a$10$...", // Hash using bcrypt
  fullName: "System Administrator",
  role: "super_admin",
  permissions: {
    viewDashboard: true,
    viewOrders: true,
    manageOrders: true,
    viewUsers: true,
    manageUsers: true,
    viewProducts: true,
    manageProducts: true,
    viewCategories: true,
    manageCategories: true,
    viewBrands: true,
    manageBrands: true,
    manageAdmins: true,
    viewSettings: true,
    manageSettings: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

4. **Start the backend server**:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

---

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd dashboard-frontend
```

2. **Install dependencies** (already done):
```bash
npm install
```

3. **Create `.env` file** (optional):
```env
VITE_API_URL=http://localhost:5000/api/dashboard
VITE_API_BASE_URL=http://localhost:5000
```

4. **Start development server**:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

5. **Build for production**:
```bash
npm run build
```

6. **Preview production build**:
```bash
npm run preview
```

---

## 🔐 Permission System

### Role Presets

**Super Admin (`super_admin`):**
- All permissions enabled
- Can manage other admins
- Full system access

**Admin (`admin`):**
- View dashboard, orders, users, products
- Manage orders
- Cannot manage users or admins
- Cannot manage products/categories/brands

**Manager (`manager`):**
- View dashboard, orders, products
- Manage orders
- Cannot view/manage users
- Cannot manage admins

**Support (`support`):**
- View dashboard, orders, products
- Cannot manage anything
- Read-only access mostly

### Custom Permissions
Each admin can have custom permissions regardless of role. The role is just a label for organization.

---

## 📡 API Endpoints Reference

### Authentication
```
POST   /api/dashboard/auth/login
Body: { username: string, password: string }
Response: { success, data: { token, admin } }

GET    /api/dashboard/auth/me
Headers: Authorization: Bearer <token>
Response: { success, data: admin }
```

### Dashboard Stats
```
GET    /api/dashboard/stats
Headers: Authorization: Bearer <token>
Permission: viewDashboard
Response: { success, data: { totalUsers, activeUsers, totalOrders, ... } }
```

### Revenue
```
GET    /api/dashboard/revenue?period=month
Headers: Authorization: Bearer <token>
Permission: viewDashboard
Response: { success, data: [{ _id, revenue, orders }] }
```

### Orders
```
GET    /api/dashboard/orders?page=1&limit=20&status=pending&search=ahmed
Headers: Authorization: Bearer <token>
Permission: viewOrders

GET    /api/dashboard/orders/:id
Headers: Authorization: Bearer <token>
Permission: viewOrders

PUT    /api/dashboard/orders/:id/status
Body: { status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled' }
Headers: Authorization: Bearer <token>
Permission: manageOrders
```

### Users
```
GET    /api/dashboard/users?page=1&limit=20&search=ahmed&isActive=true
Headers: Authorization: Bearer <token>
Permission: viewUsers

PUT    /api/dashboard/users/:id/toggle-status
Headers: Authorization: Bearer <token>
Permission: manageUsers
```

### Products
```
GET    /api/dashboard/products?page=1&limit=20&search=iphone&lowStock=true
Headers: Authorization: Bearer <token>
Permission: viewProducts
```

### Admins
```
GET    /api/dashboard/admins
Headers: Authorization: Bearer <token>
Permission: manageAdmins

POST   /api/dashboard/admins
Body: { username, password, fullName, role, permissions }
Headers: Authorization: Bearer <token>
Permission: manageAdmins

PUT    /api/dashboard/admins/:id
Body: { username?, fullName?, role?, permissions? }
Headers: Authorization: Bearer <token>
Permission: manageAdmins

DELETE /api/dashboard/admins/:id
Headers: Authorization: Bearer <token>
Permission: manageAdmins
```

---

## 🎨 UI Components

### Status Badges
All statuses use color-coded badges:
- Yellow: Pending, waiting
- Blue: Processing, approved
- Purple: Shipped
- Green: Delivered, completed, active
- Red: Cancelled, inactive
- Orange: Partially paid

### Stat Cards
Dashboard overview uses 4 large stat cards with:
- Icon (colored background)
- Title
- Value (large, bold)
- Optional subtitle

### Tables
- Responsive design
- Hover effects
- RTL support
- Pagination footer
- Search and filter controls

### Modals
- Backdrop click to close
- Close button
- Responsive
- Scrollable content
- Form validation

---

## 🐛 Error Handling

**Backend:**
- JWT verification errors → 401 Unauthorized
- Permission denied → 403 Forbidden
- Not found → 404
- Validation errors → 400
- Server errors → 500

**Frontend:**
- 401 errors → Auto-redirect to login
- API errors → Toast notification with message
- Network errors → Toast error message
- Loading states on all async operations

---

## 📱 Responsive Design

- Desktop: Full sidebar (256px), multi-column grids
- Tablet: Collapsed sidebar (64px), 2-column grids
- Mobile: (Can be extended) Hamburger menu, single column

---

## 🔜 Next Steps / Possible Enhancements

### Missing / Future Features:
1. **Categories Management** - CRUD for product categories
2. **Brands Management** - CRUD for brands
3. **Settings Page** - Manage system settings
4. **Charts & Graphs** - Revenue charts, order trends
5. **Export to CSV/Excel** - Export orders, users, products
6. **Advanced Filters** - Date range, multiple statuses
7. **Bulk Actions** - Delete multiple, update status in bulk
8. **Notifications System** - In-app notifications
9. **Activity Log** - Track admin actions
10. **Profile Page** - Admin can edit their own profile
11. **Password Change** - Admin can change password
12. **Image Upload** - Upload product images from dashboard
13. **Real-time Updates** - WebSocket for live stats
14. **Dark Mode** - Toggle dark/light theme
15. **Multi-language** - English/Arabic toggle

---

## 📝 Notes

- All text is in Arabic with RTL layout
- Cairo font used for Arabic text
- MongoDB required for database
- Existing AdminJS dashboard still available at `/admin`
- New API dashboard at `/api/dashboard` (for frontend)
- Frontend proxies API requests to backend in dev mode
- Token expires after 24 hours
- Permissions checked on both frontend (UI) and backend (API)

---

## 👨‍💻 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcrypt for password hashing

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Axios
- React Hot Toast

---

## 🎯 Quick Start

1. Start backend: `npm run dev`
2. Start frontend: `cd dashboard-frontend && npm run dev`
3. Open browser: `http://localhost:3000`
4. Login with admin credentials
5. Explore dashboard!

---

**Last Updated:** April 14, 2026
**Version:** 1.0.0
**Developer:** AI Assistant
