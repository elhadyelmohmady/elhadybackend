# Mobile App Limitations API Documentation

This document outlines how the mobile app should handle order limitations (such as min/max product quantity and minimum total order amount) based on the backend API.

## 1. Product Limitations (Min/Max Quantity per Product)

When displaying products and allowing the user to add them to their cart, the mobile app must respect the `minOrderQty` and `maxOrderQty` defined for each product. 

These fields are automatically included in the product objects returned by the API.

### Get Products List
- **URL:** `/api/products`
- **Method:** `GET`
- **Auth required:** No (Public endpoint)

**Response Data Snippet:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb8b392...",
      "name": "Product Name",
      "price": 150,
      "stock": 50,
      "minOrderQty": 2, // The user cannot add less than 2 items to the cart
      "maxOrderQty": 10 // The user cannot add more than 10 items to the cart
    }
  ]
}
```

### Get Single Product
- **URL:** `/api/products/:id`
- **Method:** `GET`
- **Auth required:** No

**Response Data Snippet:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb8b392...",
    "name": "Product Name",
    "price": 150,
    "minOrderQty": 2,
    "maxOrderQty": 10
  }
}
```

**Mobile App Responsibility:**
- In the Cart or Product Details screen, restrict the quantity selector. The `-` button should disable when the quantity equals `minOrderQty`, and the `+` button should disable when the quantity reaches `maxOrderQty` or `stock` (whichever is lower).

---

## 2. Global Order Limitations (Minimum Order Total)

Before allowing the user to proceed to checkout, the mobile app must ensure that the total price of the items in the cart meets the minimum required order total.

### Fetch Order Settings (Before Checkout)
Call this endpoint when the user enters the cart or before they confirm checkout to get the minimum order amount.

- **URL:** `/api/orders/settings`
- **Method:** `GET`
- **Auth required:** Yes (Bearer Token)

**Success Response (200 OK):**
```json
{
  "data": {
    "minOrderTotal": 150, // The minimum total amount required to place an order
    "shippingTypes": [
      {
        "type": "normal",
        "min": 3,
        "max": 5,
        "label": "عادي (3-5 أيام)"
      }
    ]
  }
}
```

**Mobile App Responsibility:**
- Calculate the total cart value.
- If the cart total `< minOrderTotal`, disable the "Checkout" button and show a message to the user (e.g., "الحد الأدنى للطلب هو 150 جنيه").
- If the user bypasses this in the app, the `POST /api/orders` endpoint will still enforce this rule and return a `400 Bad Request` with an appropriate error message.
