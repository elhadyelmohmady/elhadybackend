# Dashboard API Documentation

## Base URL
```
/api/dashboard
```

## Authentication
All endpoints require JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Get token from: `POST /api/dashboard/auth/login`

---

## 📊 Endpoints Overview

### 1. **Orders Management** 👥
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/orders?page=1&limit=20&status=&search=` | `viewOrders` | قائمة الطلبات (مقسمة) |
| GET | `/api/dashboard/orders/:id` | `viewOrders` | تفاصيل طلب واحد |
| PUT | `/api/dashboard/orders/:id/status` | `manageOrders` | تغيير حالة طلب |

#### Change Order Status
**Body:**
```json
{
  "status": "processing" // pending | processing | shipped | delivered | cancelled
}
```

---

### 2. **Users Management** 👥
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/users?page=1&limit=20&search=&isActive=` | `viewUsers` | قائمة المستخدمين (مقسمة) |
| GET | `/api/dashboard/users/:id` | `viewUsers` | تفاصيل مستخدم واحد |
| POST | `/api/dashboard/users` | `manageUsers` | إضافة مستخدم جديد |
| PUT | `/api/dashboard/users/:id` | `manageUsers` | تعديل مستخدم |
| DELETE | `/api/dashboard/users/:id` | `manageUsers` | حذف مستخدم |
| PUT | `/api/dashboard/users/:id/toggle-status` | `manageUsers` | تفعيل/تعطيل مستخدم |

#### Create User
**Body:**
```json
{
  "username": "user123",
  "password": "password123",
  "fullName": "الاسم الكامل",
  "phoneNumber": "01234567890",
  "firstName": "الاسم الأول",
  "lastName": "اسم العائلة"
}
```

#### Update User
**Body:** (جميع الحقول اختيارية)
```json
{
  "username": "new_username",
  "fullName": "اسم جديد",
  "phoneNumber": "01234567890",
  "firstName": "اسم أول",
  "lastName": "اسم عائلة",
  "password": "new_password"
}
```

---

### 3. **Products Management** 📦
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/products?page=1&limit=20&search=&brand=&category=&lowStock=true` | `viewProducts` | قائمة المنتجات (مقسمة) |
| GET | `/api/dashboard/products/:id` | `viewProducts` | تفاصيل منتج واحد |
| POST | `/api/dashboard/products` | `manageProducts` | إضافة منتج جديد |
| PUT | `/api/dashboard/products/:id` | `manageProducts` | تعديل منتج |
| DELETE | `/api/dashboard/products/:id` | `manageProducts` | حذف منتج |

#### Create Product
**Body:**
```json
{
  "name": "اسم المنتج",
  "price": 100,
  "stock": 50,
  "brand": "brand_id_here",
  "categories": ["category_id_1", "category_id_2"],
  "keywords": ["كلمة1", "كلمة2"],
  "image": "https://example.com/image.jpg",
  "metadata": {
    "description": "وصف المنتج"
  }
}
```

#### Update Product
**Body:** (جميع الحقول اختيارية)
```json
{
  "name": "اسم جديد",
  "price": 150,
  "stock": 30,
  "brand": "new_brand_id",
  "categories": ["new_category_id"],
  "keywords": ["كلمة جديدة"],
  "image": "https://example.com/new-image.jpg",
  "metadata": {
    "description": "وصف جديد"
  }
}
```

---

### 4. **Categories Management** 📂
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/categories?page=1&limit=50&search=&isActive=` | `viewCategories` | قائمة التصنيفات (مقسمة) |
| GET | `/api/dashboard/categories/:id` | `viewCategories` | تفاصيل تصنيف واحد |
| POST | `/api/dashboard/categories` | `manageCategories` | إضافة تصنيف جديد |
| PUT | `/api/dashboard/categories/:id` | `manageCategories` | تعديل تصنيف |
| DELETE | `/api/dashboard/categories/:id` | `manageCategories` | حذف تصنيف |

#### Create Category
**Body:**
```json
{
  "name": "اسم التصنيف",
  "slug": "category-slug",
  "description": "وصف التصنيف",
  "image": "https://example.com/category.jpg",
  "parentCategory": "parent_category_id_or_null",
  "isActive": true
}
```

#### Update Category
**Body:** (جميع الحقول اختيارية)
```json
{
  "name": "اسم جديد",
  "slug": "new-slug",
  "description": "وصف جديد",
  "image": "https://example.com/new-image.jpg",
  "parentCategory": "parent_id_or_null",
  "isActive": false
}
```

---

### 5. **Brands Management** 🏷️
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/brands?page=1&limit=50&search=` | `viewBrands` | قائمة العلامات التجارية (مقسمة) |
| GET | `/api/dashboard/brands/:id` | `viewBrands` | تفاصيل علامة تجارية واحدة |
| POST | `/api/dashboard/brands` | `manageBrands` | إضافة علامة تجارية جديدة |
| PUT | `/api/dashboard/brands/:id` | `manageBrands` | تعديل علامة تجارية |
| DELETE | `/api/dashboard/brands/:id` | `manageBrands` | حذف علامة تجارية |

#### Create Brand
**Body:**
```json
{
  "name": "اسم العلامة التجارية",
  "slug": "brand-slug",
  "description": "وصف العلامة التجارية",
  "logo": "https://example.com/logo.png"
}
```

#### Update Brand
**Body:** (جميع الحقول اختيارية)
```json
{
  "name": "اسم جديد",
  "slug": "new-slug",
  "description": "وصف جديد",
  "logo": "https://example.com/new-logo.png"
}
```

---

### 6. **Admin Management** 🔐
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/admins` | `manageAdmins` | قائمة الأدمنز |
| POST | `/api/dashboard/admins` | `manageAdmins` | إضافة أدمن جديد |
| PUT | `/api/dashboard/admins/:id` | `manageAdmins` | تعديل أدمن |
| DELETE | `/api/dashboard/admins/:id` | `manageAdmins` | حذف أدمن |

#### Create Admin
**Body:**
```json
{
  "username": "admin_user",
  "password": "admin_pass",
  "fullName": "الاسم الكامل",
  "role": "admin", // super_admin | admin | manager | support
  "permissions": {
    "viewDashboard": true,
    "viewOrders": true,
    "manageOrders": false,
    "viewUsers": true,
    "manageUsers": false,
    "viewProducts": true,
    "manageProducts": false,
    "viewCategories": true,
    "manageCategories": false,
    "viewBrands": true,
    "manageBrands": false,
    "manageAdmins": false,
    "viewSettings": true,
    "manageSettings": false
  }
}
```

---

### 7. **Dashboard & Stats** 📈
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/dashboard/stats` | `viewDashboard` | إحصائيات الداشبورد |
| GET | `/api/dashboard/revenue?period=month` | `viewDashboard` | إحصائيات الإيرادات |

**Revenue Periods:** `week`, `month`, `year`

---

### 8. **Authentication** 🔑
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| POST | `/api/dashboard/auth/login` | Public | تسجيل دخول |
| GET | `/api/dashboard/auth/me` | Authenticated | معلومات الأدمن الحالي |

#### Login
**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "admin": {
      "id": "...",
      "username": "admin",
      "fullName": "System Admin",
      "role": "super_admin",
      "permissions": { ... }
    }
  }
}
```

---

## 🔐 Permissions System

### Admin Roles:
- `super_admin` - All permissions automatically granted
- `admin` - Standard admin
- `manager` - Manager role
- `support` - Support role

### Available Permissions:
| Permission | Description |
|------------|-------------|
| `viewDashboard` | عرض الداشبورد والإحصائيات |
| `viewOrders` | عرض الطلبات |
| `manageOrders` | إدارة الطلبات وتغيير الحالات |
| `viewUsers` | عرض المستخدمين |
| `manageUsers` | إدارة المستخدمين (إضافة/تعديل/حذف) |
| `viewProducts` | عرض المنتجات |
| `manageProducts` | إدارة المنتجات (إضافة/تعديل/حذف) |
| `viewCategories` | عرض التصنيفات |
| `manageCategories` | إدارة التصنيفات (إضافة/تعديل/حذف) |
| `viewBrands` | عرض العلامات التجارية |
| `manageBrands` | إدارة العلامات التجارية (إضافة/تعديل/حذف) |
| `manageAdmins` | إدارة الأدمنز |
| `viewSettings` | عرض الإعدادات |
| `manageSettings` | تعديل الإعدادات |

---

## 📝 Response Format

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "رسالة الخطأ"
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## 💡 Usage Examples

### 1. Login and Get Token
```bash
POST /api/dashboard/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### 2. Get Users List
```bash
GET /api/dashboard/users?page=1&limit=20&search=ahmed
Authorization: Bearer <token>
```

### 3. Create New User
```bash
POST /api/dashboard/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "fullName": "مستخدم جديد",
  "phoneNumber": "01234567890"
}
```

### 4. Create Product
```bash
POST /api/dashboard/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "منتج جديد",
  "price": 99.99,
  "stock": 100,
  "brand": "brand_id",
  "categories": ["category_id_1"]
}
```

### 5. Update Order Status
```bash
PUT /api/dashboard/orders/order_id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped"
}
```

### 6. Create Category
```bash
POST /api/dashboard/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "إلكترونيات",
  "slug": "electronics",
  "description": "قسم الإلكترونيات",
  "isActive": true
}
```

### 7. Create Brand
```bash
POST /api/dashboard/brands
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Samsung",
  "slug": "samsung",
  "description": "Samsung Electronics",
  "logo": "https://example.com/samsung-logo.png"
}
```

---

## ⚠️ Important Notes

1. **Super Admin**: The `super_admin` role automatically has all permissions. No need to set them manually.
2. **Pagination**: All list endpoints support `page` and `limit` query parameters.
3. **Search**: Most list endpoints support `search` query parameter for filtering.
4. **Soft Deletes**: Deleting a user/admin/product is permanent.
5. **Unique Fields**: `username`, `phoneNumber` (users), `slug` (categories/brands) must be unique.
6. **Password Hashing**: Passwords are automatically hashed when creating/updating users/admins.

---

## 🚀 Quick Start for Frontend

1. **Login** → Get JWT token
2. **Store token** → localStorage/cookies
3. **Add token to headers** → `Authorization: Bearer <token>`
4. **Start making requests** → All endpoints above

---

For questions or issues, contact the backend team.
