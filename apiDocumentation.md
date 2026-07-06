Here's the full API documentation:

---

# Al-Hadi Mobile API Documentation

**Base URL:** `http://localhost:5151`

---

## Authentication

| Method | Type |
|--------|------|
| **Bearer Token** | `Authorization: Bearer <JWT>` — for user endpoints |
| **API Key** | `X-API-Key: <key>` — for sync endpoints |

---

## 1. Auth (`/api/auth`)

### `POST /api/auth/login` — Login
**Public**

**Request:**
```json
{ "username": "string", "password": "string" }
```

**Response (200):**
```json
{
  "_id": "...",
  "username": "testuser",
  "fullName": "Test User",
  "phoneNumber": "01012345678",
  "token": "eyJhbGci..."
}
```
**Errors:** `401` Invalid credentials | `401` Account deactivated

> Token expires in **30 days**

---

## 2. Users (`/api/users`)

### `POST /api/users/create` — Register
**Public**

**Request:**
```json
{
  "username": "string",
  "password": "string",
  "fullName": "string",
  "phoneNumber": "string"
}
```

**Response (201):**
```json
{
  "_id": "...",
  "username": "newuser",
  "fullName": "New User",
  "phoneNumber": "01098765432",
  "isActive": true,
  "createdAt": "2026-04-02T..."
}
```
**Errors:** `409` Username or phone already exists | `400` Invalid data

---

### `GET /api/users` — List All Users
**Protected** (Bearer Token)

**Response (200):** Array of users (password excluded), sorted by newest first

---

## 3. Products (`/api`)

### `GET /api/products` — List Products
**Public**

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search by name / description |
| `category` | string | — | Category ID filter |
| `brand` | string | — | Brand ID filter |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "count": 2285,
  "pagination": { "total": 2285, "page": 1, "limit": 10, "pages": 229 },
  "data": [
    {
      "_id": "...",
      "name": "اريال جل 5جنية",
      "price": 5,
      "stock": 1000,
      "image": "product_images/اريال-جل-5جنية.webp",
      "minOrderQty": 1,
      "maxOrderQty": 100,
      "categories": [{ "_id": "...", "name": "منظفات" }],
      "brand": { "_id": "...", "name": "اريال" }
    }
  ]
}
```

---

### `GET /api/products/:id` — Product Detail
**Public**

**Response (200):**
```json
{ "success": true, "data": { /* full product with populated categories & brand */ } }
```
**Errors:** `404` Product not found

---

### `POST /api/sync/products` — Bulk Sync Products
**API Key Auth** (`X-API-Key` header)

**Request:** Array of products
```json
[
  { "local_id": "1001", "name": "...", "price": 25, "stock": 100, "category": "منظفات", "metadata": {} }
]
```

**Response (200):**
```json
{ "success": true, "data": { "matchedCount": 5, "upsertedCount": 3, "modifiedCount": 2 } }
```

---

## 4. Categories (`/api/categories`)

### `GET /api/categories` — List Active Categories
**Public**

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [{ "_id": "...", "name": "منظفات", "slug": "منظفات", "image": null, "isActive": true }]
}
```

---

### `GET /api/categories/:id/products` — Products by Category
**Public**

**Query Params:** `page` (default 1), `limit` (default 10)

**Response (200):**
```json
{
  "success": true,
  "category": { "_id": "...", "name": "منظفات", "slug": "منظفات" },
  "count": 150,
  "pagination": { "total": 150, "page": 1, "limit": 10, "pages": 15 },
  "data": [ /* products */ ]
}
```
**Errors:** `404` Category not found

---

## 5. Brands (`/api/brands`)

### `GET /api/brands` — List All Brands
**Public**

**Response (200):**
```json
{ "success": true, "count": 157, "data": [{ "_id": "...", "name": "اريال", "logo": null }] }
```

---

### `GET /api/brands/:id/products` — Products by Brand
**Public**

**Query Params:** `page` (default 1), `limit` (default 10)

**Response (200):**
```json
{
  "success": true,
  "brand": { "_id": "...", "name": "اريال", "logo": null },
  "count": 20,
  "pagination": { "total": 20, "page": 1, "limit": 10, "pages": 2 },
  "data": [ /* products */ ]
}
```
**Errors:** `404` Brand not found

---

## 6. Orders (`/api/orders`)

> All order endpoints require **Bearer Token** authentication

### `POST /api/orders` — Create Order
**Protected**

**Request:**
```json
{
  "items": [
    { "product": "product_id_here", "quantity": 5 },
    { "product": "product_id_here", "quantity": 3 }
  ]
}
```

**Validation rules:**
- All product IDs must exist
- `quantity` must be between product's `minOrderQty` and `maxOrderQty`
- Product must have sufficient `stock`
- Order `total` must be >= `Setting.minOrderTotal` (default 100 EGP)
- Price is **locked from DB** (client cannot set price)

**Response (201):**
```json
{
  "message": "تم إنشاء الطلب بنجاح",
  "data": {
    "_id": "...",
    "customer": { "_id": "...", "fullName": "Test User", "phoneNumber": "010..." },
    "items": [
      {
        "product": { "_id": "...", "name": "اريال", "price": 25, "image": "product_images/..." },
        "quantity": 5,
        "price": 25
      }
    ],
    "total": 125,
    "status": "pending",
    "createdAt": "2026-04-02T..."
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `بعض المنتجات غير موجودة` + `missing: [ids]` |
| `400` | `خطأ في الكميات` + `errors: [details]` |
| `400` | `الحد الأدنى لقيمة الطلب X جنيه. إجمالي طلبك: Y جنيه` |
| `409` | `تغيرت الكميات المتوفرة، يرجى المحاولة مرة أخرى` |

---

### `GET /api/orders` — My Orders
**Protected**

**Query Params:** `page` (default 1), `limit` (default 10)

**Response (200):**
```json
{
  "count": 3,
  "pagination": { "page": 1, "limit": 10, "pages": 1 },
  "data": [ /* orders with populated product name/image/price */ ]
}
```

---

### `GET /api/orders/:id` — Order Detail
**Protected** (owner only)

**Response (200):**
```json
{
  "data": {
    "_id": "...",
    "customer": { "fullName": "...", "phoneNumber": "..." },
    "items": [{ "product": { "name": "...", "image": "...", "price": 25, "brand": "..." }, "quantity": 5, "price": 25 }],
    "total": 125,
    "status": "pending"
  }
}
```
**Errors:** `404` الطلب غير موجود

---

### `PATCH /api/orders/:id/cancel` — Cancel Order
**Protected** (owner only, `pending` status only)

**Response (200):**
```json
{ "message": "تم إلغاء الطلب بنجاح", "data": { /* order with status: "cancelled" */ } }
```
**Errors:** `404` Order not found | `400` Can only cancel pending orders

> Stock is **automatically restored** on cancel.

---

### `GET /api/orders/settings` — Order Settings
**Protected**

**Response (200):**
```json
{ "data": { "minOrderTotal": 100 } }
```

---

## 7. Other Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check → `{ "status": "ok" }` |
| `GET /api-docs` | Swagger UI documentation |
| `/admin` | AdminJS dashboard (session auth) |
| `/product_images/*` | Static product images |

---

## Order Status Flow

```
pending → processing (admin approves) → shipped → delivered
pending → cancelled (user or admin cancels → stock restored)
```