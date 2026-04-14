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
**Content-Type:** `multipart/form-data`

**Form Data Fields:**
- `name` (text, required): اسم المنتج
- `price` (number, required): السعر
- `stock` (number, required): المخزون
- `brand` (text, required): معرف العلامة التجارية
- `categories` (text, optional): معرفات التصنيفات (يمكن إرسالها كـ array)
- `keywords` (text, optional): الكلمات المفتاحية (يمكن إرسالها كـ array)
- `image` (file, optional): صورة المنتج (JPEG, PNG, GIF, WebP - max 5MB)
- `metadata` (text, optional): بيانات إضافية بصيغة JSON string

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/api/dashboard/products \
  -H "Authorization: Bearer <token>" \
  -F "name=منتج جديد" \
  -F "price=100" \
  -F "stock=50" \
  -F "brand=brand_id_here" \
  -F "categories=category_id_1" \
  -F "categories=category_id_2" \
  -F "keywords=كلمة1" \
  -F "keywords=كلمة2" \
  -F "image=@/path/to/product-image.jpg" \
  -F 'metadata={"description": "وصف المنتج"}'
```

**Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('name', 'منتج جديد');
formData.append('price', 100);
formData.append('stock', 50);
formData.append('brand', 'brand_id_here');
formData.append('categories', 'category_id_1');
formData.append('categories', 'category_id_2');
formData.append('keywords', 'كلمة1');
formData.append('keywords', 'كلمة2');
formData.append('image', fileInput.files[0]); // File from input
formData.append('metadata', JSON.stringify({ description: 'وصف المنتج' }));

const response = await fetch('/api/dashboard/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

#### Update Product
**Content-Type:** `multipart/form-data`

**Form Data Fields:**
- All fields are optional
- `name` (text): اسم جديد
- `price` (number): السعر الجديد
- `stock` (number): المخزون الجديد
- `brand` (text): معرف العلامة التجارية الجديد
- `categories` (text): معرفات التصنيفات الجديدة
- `keywords` (text): الكلمات المفتاحية الجديدة
- `image` (file): صورة جديدة (ستحل محل الصورة القديمة)
- `metadata` (text): بيانات إضافية بصيغة JSON string

**Example (cURL):**
```bash
curl -X PUT http://localhost:3000/api/dashboard/products/product_id \
  -H "Authorization: Bearer <token>" \
  -F "name=اسم جديد" \
  -F "price=150" \
  -F "image=@/path/to/new-image.jpg"
```

**Note:** When uploading a new image, the old image will be automatically deleted.

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
**Content-Type:** `multipart/form-data`

**Form Data Fields:**
- `name` (text, required): اسم العلامة التجارية
- `slug` (text, required): الرابط الفريد (slug)
- `description` (text, optional): وصف العلامة التجارية
- `logo` (file, optional): شعار العلامة التجارية (JPEG, PNG, GIF, WebP - max 5MB)

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/api/dashboard/brands \
  -H "Authorization: Bearer <token>" \
  -F "name=Samsung" \
  -F "slug=samsung" \
  -F "description=Samsung Electronics" \
  -F "logo=@/path/to/logo.png"
```

**Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('name', 'Samsung');
formData.append('slug', 'samsung');
formData.append('description', 'Samsung Electronics');
formData.append('logo', fileInput.files[0]); // File from input

const response = await fetch('/api/dashboard/brands', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

#### Update Brand
**Content-Type:** `multipart/form-data`

**Form Data Fields:**
- All fields are optional
- `name` (text): اسم جديد
- `slug` (text): رابط جديد (slug)
- `description` (text): وصف جديد
- `logo` (file): شعار جديد (سيحل محل الشعار القديم)

**Example (cURL):**
```bash
curl -X PUT http://localhost:3000/api/dashboard/brands/brand_id \
  -H "Authorization: Bearer <token>" \
  -F "name=New Brand Name" \
  -F "slug=new-slug" \
  -F "logo=@/path/to/new-logo.png"
```

**Note:** When uploading a new logo, the old logo will be automatically deleted.

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
# With image file
curl -X POST /api/dashboard/products \
  -H "Authorization: Bearer <token>" \
  -F "name=منتج جديد" \
  -F "price=99.99" \
  -F "stock=100" \
  -F "brand=brand_id" \
  -F "categories=category_id_1" \
  -F "image=@/path/to/image.jpg"

# Or using FormData in JavaScript
const formData = new FormData();
formData.append('name', 'منتج جديد');
formData.append('price', 99.99);
formData.append('stock', 100);
formData.append('brand', 'brand_id');
formData.append('categories', 'category_id_1');
formData.append('image', imageFile);

fetch('/api/dashboard/products', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' },
  body: formData
});
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
# With logo file
curl -X POST /api/dashboard/brands \
  -H "Authorization: Bearer <token>" \
  -F "name=Samsung" \
  -F "slug=samsung" \
  -F "description=Samsung Electronics" \
  -F "logo=@/path/to/logo.png"

# Or using FormData in JavaScript
const formData = new FormData();
formData.append('name', 'Samsung');
formData.append('slug', 'samsung');
formData.append('description', 'Samsung Electronics');
formData.append('logo', logoFile);

fetch('/api/dashboard/brands', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' },
  body: formData
});
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

## 📸 Image Upload System

### Supported Endpoints
Image uploads are supported for the following endpoints:
- **Products**: `POST/PUT /api/dashboard/products` (field: `image`)
- **Brands**: `POST/PUT /api/dashboard/brands` (field: `logo`)

### Image Specifications
- **Supported formats**: JPEG, JPG, PNG, GIF, WebP
- **Maximum file size**: 5MB
- **Product images**: Optimized to max 1200x1200px, converted to WebP (quality: 80)
- **Brand logos**: Optimized to max 500x500px, converted to WebP (quality: 85)

### How It Works

1. **Upload**: Send image via `multipart/form-data` in the appropriate field (`image` for products, `logo` for brands)
2. **Processing**: Images are automatically:
   - Validated (format and size)
   - Resized if exceeding maximum dimensions
   - Converted to WebP format for optimal performance
   - Saved with unique filenames
3. **Storage**: Images are stored in:
   - Products: `src/assets/product_images/`
   - Brands: `src/assets/brand_logos/`
4. **Database**: Relative paths are stored in the database (e.g., `src/assets/product_images/product-1234567890-123456789-optimized.webp`)
5. **Replacement**: When updating with a new image, the old image is automatically deleted

### Frontend Implementation

#### HTML Form Example
```html
<!-- Product Form -->
<form id="productForm" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Product Name" required>
  <input type="number" name="price" placeholder="Price" required>
  <input type="number" name="stock" placeholder="Stock" required>
  <input type="text" name="brand" placeholder="Brand ID" required>
  <input type="file" name="image" accept="image/*">
  <button type="submit">Create Product</button>
</form>

<!-- Brand Form -->
<form id="brandForm" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Brand Name" required>
  <input type="text" name="slug" placeholder="Slug" required>
  <input type="text" name="description" placeholder="Description">
  <input type="file" name="logo" accept="image/*">
  <button type="submit">Create Brand</button>
</form>
```

#### React Example
```jsx
import { useState } from 'react';

function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    brand: '',
    categories: [],
    keywords: []
  });
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('brand', formData.brand);
    
    formData.categories.forEach(cat => {
      data.append('categories', cat);
    });
    
    formData.keywords.forEach(keyword => {
      data.append('keywords', keyword);
    });
    
    if (image) {
      data.append('image', image);
    }

    const response = await fetch('/api/dashboard/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: data
    });

    const result = await response.json();
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Product Name"
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button type="submit">Create</button>
    </form>
  );
}
```

#### Vue.js Example
```vue
<template>
  <form @submit.prevent="submitForm" enctype="multipart/form-data">
    <input v-model="form.name" type="text" placeholder="Brand Name" required>
    <input v-model="form.slug" type="text" placeholder="Slug" required>
    <input @change="handleFileChange" type="file" accept="image/*">
    <button type="submit">Create Brand</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        slug: '',
        description: ''
      },
      logo: null
    };
  },
  methods: {
    handleFileChange(e) {
      this.logo = e.target.files[0];
    },
    async submitForm() {
      const formData = new FormData();
      formData.append('name', this.form.name);
      formData.append('slug', this.form.slug);
      formData.append('description', this.form.description);
      
      if (this.logo) {
        formData.append('logo', this.logo);
      }

      const response = await fetch('/api/dashboard/brands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      const result = await response.json();
      // Handle response
    }
  }
};
</script>
```

### Error Handling

The API returns appropriate error messages for upload failures:

**File too large:**
```json
{
  "success": false,
  "message": "File size too large. Maximum size is 5MB"
}
```

**Invalid file type:**
```json
{
  "success": false,
  "message": "Only image files (JPEG, PNG, GIF, WebP) are allowed"
}
```

**Processing error:**
```json
{
  "success": false,
  "message": "Failed to process product image"
}
```

### Important Notes

1. **Content-Type**: When sending files, you MUST use `multipart/form-data`, NOT `application/json`
2. **Field names**: Use `image` for products and `logo` for brands
3. **Multiple values**: For arrays (categories, keywords), send multiple fields with the same name
4. **Metadata**: Send JSON objects as stringified JSON in a text field
5. **Automatic cleanup**: Old images/logos are automatically deleted when replaced
6. **Image optimization**: All images are automatically optimized and converted to WebP for better performance
7. **Path Resolution**: Paths are stored relative to assets folder (e.g., `product_images/filename.webp`)

### Accessing Uploaded Images

Images are stored in `src/assets/` and served via static file serving configured in `app.js`:

```javascript
// app.js configuration
app.use('/product_images', express.static(path.join(__dirname, 'src/assets/product_images')));
app.use('/brand_logos', express.static(path.join(__dirname, 'src/assets/brand_logos')));
```

**Database stores:** `product_images/product-1234567890-optimized.webp`

**Access via URL:**
```
http://localhost:3000/product_images/product-1234567890-optimized.webp
http://localhost:3000/brand_logos/brand-1234567890-optimized.webp
```

**Frontend example:**
```javascript
// Convert database path to URL
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  // imagePath: "product_images/filename.webp"
  return `${BASE_URL}/${imagePath}`;
}

// Usage
<img src={getImageUrl(product.image)} alt={product.name} />
```

### Static File Serving Configuration

To access uploaded images in your frontend, configure static file serving in your Express app:

```javascript
// In app.js or server.js
import express from 'express';
import path from 'path';

const app = express();

// Serve uploaded images
app.use('/uploads/products', express.static(path.join(process.cwd(), 'src/assets/product_images')));
app.use('/uploads/brands', express.static(path.join(process.cwd(), 'src/assets/brand_logos')));
```

Then access images at:
- Products: `http://localhost:3000/uploads/products/filename.webp`
- Brands: `http://localhost:3000/uploads/brands/filename.webp`

---

For questions or issues, contact the backend team.
