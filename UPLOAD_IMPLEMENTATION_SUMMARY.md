# 📸 Dashboard API - Image Upload Implementation

## ✅ Implementation Complete

Your dashboard APIs now fully support **multipart/form-data** for uploading images when creating or updating **Products** and **Brands**.

---

## 🎯 What Changed

### 1. **New Files Created**

| File | Purpose |
|------|---------|
| `src/middleware/uploadMiddleware.js` | Multer configuration for handling file uploads |
| `src/utils/imageUpload.js` | Image processing with Sharp (optimization, resizing, WebP conversion) |
| `IMAGE_UPLOAD_DOCS.md` | Quick reference documentation |

### 2. **Files Updated**

| File | Changes |
|------|---------|
| `src/routes/dashboardRoutes.js` | Added upload middleware to product/brand routes |
| `src/controllers/dashboardController.js` | Updated CRUD operations to handle file uploads |
| `DASHBOARD_API.md` | Complete API documentation with upload examples |
| `package.json` | Added `multer` dependency |

---

## 🚀 How to Use

### Products API

#### Create Product with Image
```javascript
// JavaScript Fetch Example
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('price', 99.99);
formData.append('stock', 100);
formData.append('brand', 'brand_id_here');
formData.append('categories', 'category_id_1');
formData.append('categories', 'category_id_2');
formData.append('keywords', 'keyword1');
formData.append('image', imageFile); // File object from <input type="file">

const response = await fetch('/api/dashboard/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

#### Update Product with New Image
```javascript
const formData = new FormData();
formData.append('name', 'Updated Name');
formData.append('price', 149.99);
formData.append('image', newImageFile); // New image replaces old one

const response = await fetch('/api/dashboard/products/PRODUCT_ID', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

### Brands API

#### Create Brand with Logo
```javascript
const formData = new FormData();
formData.append('name', 'Brand Name');
formData.append('slug', 'brand-slug');
formData.append('description', 'Brand Description');
formData.append('logo', logoFile); // Logo file

const response = await fetch('/api/dashboard/brands', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

#### Update Brand with New Logo
```javascript
const formData = new FormData();
formData.append('name', 'Updated Brand');
formData.append('logo', newLogoFile); // New logo replaces old one

const response = await fetch('/api/dashboard/brands/BRAND_ID', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

---

## 📋 API Endpoints Summary

| Method | Endpoint | File Field | Content-Type |
|--------|----------|------------|--------------|
| POST | `/api/dashboard/products` | `image` | `multipart/form-data` |
| PUT | `/api/dashboard/products/:id` | `image` | `multipart/form-data` |
| POST | `/api/dashboard/brands` | `logo` | `multipart/form-data` |
| PUT | `/api/dashboard/brands/:id` | `logo` | `multipart/form-data` |

---

## 🖼️ Image Specifications

### Supported Formats
- ✅ JPEG / JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP

### File Size Limits
- ⚠️ Maximum: **5MB** per file

### Automatic Processing
| Type | Max Dimensions | Output Format | Quality |
|------|----------------|---------------|---------|
| Product Images | 1200x1200px | WebP | 80% |
| Brand Logos | 500x500px | WebP | 85% |

---

## 💾 Storage Structure

```
src/assets/
├── product_images/
│   ├── product-1712345678901-123456789-optimized.webp
│   └── product-1712345679012-987654321-optimized.webp
└── brand_logos/
    ├── brand-1712345680123-456789012-optimized.webp
    └── brand-1712345681234-789012345-optimized.webp
```

**Database stores relative paths:**
```
src/assets/product_images/product-1712345678901-123456789-optimized.webp
```

---

## 🔧 Key Features

### ✨ Automatic Features
1. **Image Validation**: Checks format and size before upload
2. **Optimization**: Resizes large images to max dimensions
3. **Format Conversion**: Converts to WebP for better performance
4. **Old File Cleanup**: Deletes old images when replaced
5. **Unique Filenames**: Prevents conflicts with timestamp-based naming

### 🛡️ Error Handling

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

**Processing failed:**
```json
{
  "success": false,
  "message": "Failed to process product image"
}
```

---

## 🌐 Accessing Uploaded Images

Static file serving is **already configured** in `app.js`:

```javascript
// Product images
http://localhost:3000/product_images/filename.webp

// Brand logos
http://localhost:3000/brand_logos/filename.webp
```

### Example Response
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Product Name",
    "image": "src/assets/product_images/product-1234567890-optimized.webp",
    ...
  }
}
```

**Frontend URL construction:**
```javascript
const imageUrl = `${BASE_URL}/${product.image.replace('src/assets/', '')}`;
// Result: http://localhost:3000/product_images/product-1234567890-optimized.webp
```

---

## 📝 Important Notes

### ⚠️ Must Know
1. **Content-Type**: Use `multipart/form-data` (NOT `application/json`)
2. **Field Names**: 
   - Products: `image`
   - Brands: `logo`
3. **Arrays**: Send multiple fields with same name (e.g., `categories` multiple times)
4. **JSON Fields**: Send as stringified JSON (e.g., `metadata`)
5. **Optional Files**: You can still send URL-based images in text fields if preferred

### 🔄 Backward Compatibility
The API still accepts URL-based images in text fields. File uploads are **additive**, not breaking changes.

---

## 🧪 Testing

### Quick Test with cURL
```bash
# Test product upload
curl -X POST http://localhost:3000/api/dashboard/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Product" \
  -F "price=99.99" \
  -F "stock=50" \
  -F "brand=BRAND_ID" \
  -F "image=@/path/to/test-image.jpg"

# Test brand upload
curl -X POST http://localhost:3000/api/dashboard/brands \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Brand" \
  -F "slug=test-brand" \
  -F "logo=@/path/to/test-logo.png"
```

---

## 📚 Documentation References

| Document | Location |
|----------|----------|
| **Full API Docs** | `DASHBOARD_API.md` |
| **Quick Reference** | `IMAGE_UPLOAD_DOCS.md` |
| **Upload Middleware** | `src/middleware/uploadMiddleware.js` |
| **Image Utils** | `src/utils/imageUpload.js` |

---

## 🎨 Frontend Integration Examples

### HTML Form
```html
<form enctype="multipart/form-data">
  <input type="text" name="name" required>
  <input type="number" name="price" required>
  <input type="file" name="image" accept="image/*">
  <button type="submit">Create Product</button>
</form>
```

### React Component
```jsx
const [file, setFile] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('image', file);
  // ... append other fields
  
  await fetch('/api/dashboard/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
};

return (
  <form onSubmit={handleSubmit} encType="multipart/form-data">
    <input type="file" onChange={e => setFile(e.target.files[0])} />
  </form>
);
```

### Axios Example
```javascript
const formData = new FormData();
formData.append('image', file);

await axios.post('/api/dashboard/products', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **Multiple Images**: Support gallery images for products
2. **Image Cropping**: Add client-side cropping before upload
3. **Thumbnail Generation**: Create multiple sizes (thumb, medium, large)
4. **CDN Integration**: Upload to S3/Cloudinary instead of local storage
5. **Progress Tracking**: Show upload progress for large files

---

## ✅ Verification Checklist

- [x] Multer installed
- [x] Upload middleware created
- [x] Image processing utilities created
- [x] Routes updated with upload middleware
- [x] Controllers updated to handle files
- [x] Documentation updated
- [x] Static file serving configured
- [x] Error handling implemented
- [x] Syntax verification passed

---

## 🆘 Troubleshooting

**Issue**: "File not uploading"
- Check `Content-Type` is `multipart/form-data`
- Verify field name is `image` (products) or `logo` (brands)
- Ensure file is under 5MB

**Issue**: "Image not accessible"
- Static file serving is configured at `/product_images` and `/brand_logos`
- Use the relative path from database and prepend base URL

**Issue**: "Processing error"
- Check Sharp library is installed (it is ✅)
- Verify file is a valid image format

---

**🎉 Implementation Complete!** Your dashboard APIs are now ready to accept file uploads for products and brands.
