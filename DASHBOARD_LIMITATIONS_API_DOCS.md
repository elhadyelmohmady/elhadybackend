# Dashboard Limitations API Documentation

This document outlines the API endpoints required for the dashboard frontend to manage order limitations.

## 1. Product Limitations (Min/Max Quantity per Product)

The `minOrderQty` and `maxOrderQty` limitations are tied directly to the `Product` model. To edit these limitations, you will use the existing product creation and update endpoints.

### Update Product
Update an existing product's limitations.

- **URL:** `/api/dashboard/products/:id`
- **Method:** `PUT`
- **Auth required:** Yes (Bearer Token)
- **Permission required:** `manageProducts`
- **Content-Type:** `multipart/form-data` (since it handles image uploads as well)

**Form Data Parameters (append these to existing product data):**
- `minOrderQty` (Number): The minimum quantity a user must order for this product. Default is `1`.
- `maxOrderQty` (Number): The maximum quantity a user can order for this product. Default is `100`.

**Example payload (JSON representation of form-data):**
```json
{
  "name": "Product Name",
  "price": 150,
  "minOrderQty": 2,
  "maxOrderQty": 10
}
```

### Create Product
You can also set these limitations when creating a new product.

- **URL:** `/api/dashboard/products`
- **Method:** `POST`
- **Auth required:** Yes (Bearer Token)
- **Permission required:** `manageProducts`
- **Content-Type:** `multipart/form-data`

**Form Data Parameters:**
- `minOrderQty` (Number) - Optional. Default is `1`.
- `maxOrderQty` (Number) - Optional. Default is `100`.

---

## 2. Global Order Limitations (Minimum Order Total)

The `minOrderTotal` limitation applies globally to all orders per user. This is managed via the Settings endpoints.

### Get Global Settings
Retrieve the current global settings, including the minimum order total.

- **URL:** `/api/dashboard/settings`
- **Method:** `GET`
- **Auth required:** Yes (Bearer Token)
- **Permission required:** `viewSettings`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb8b392...",
    "key": "general",
    "minOrderTotal": 100,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Global Settings
Update the global limitations.

- **URL:** `/api/dashboard/settings`
- **Method:** `PUT`
- **Auth required:** Yes (Bearer Token)
- **Permission required:** `manageSettings`
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "minOrderTotal": 150
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb8b392...",
    "key": "general",
    "minOrderTotal": 150,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
