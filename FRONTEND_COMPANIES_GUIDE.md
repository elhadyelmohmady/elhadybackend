# 🏢 دليل تكامل واجهة لوحة التحكم (Frontend Dashboard Integration Guide)
## نظام الشركات والربط مع العلامات التجارية والتصنيفات والمنتجات

---

## 📌 1. نظرة عامة (Overview)
تم إضافة كيان جديد في النظام باسم **الشركات (Companies)** ليمثل الشركات الأم/المصنعة الكبرى (مثل: *يونيليفر، بروكتر آند غامبل، هنكل، إيفا، دابر، فاين، إلخ*).
* **كل شركة (Company)** تملك أو ترتبط بـ:
  * **أكثر من علامة تجارية (Brands):** مثل شركة يونيليفر التي تضم (دوف، لوكس، سيجنال، كمفورت، فازلين، صن سيلك، أكس، دورو).
  * **تصنيفات متعددة (Categories):** الأقسام التي تتبع لها منتجات الشركة.
  * **منتجات متعددة (Products):** كافة المنتجات التابعة لبراندات الشركة أو المرتبطة بها مباشرة.

---

## 🖥️ 2. الشاشات والمكونات المطلوبة في الفرونت إند (Required UI Screens)

### الشاشة 1: قائمة الشركات (Companies List Screen)
* **المسار المقترح:** `/dashboard/companies`
* **الصلاحية المطلوبة:** `viewCompanies`
* **المكونات:**
  1. **شريط الأدوات العلوي (Header Bar):**
     * زر **"إضافة شركة جديدة"** (يظهر فقط إذا كان لدى المدير صلاحية `manageCompanies`).
     * حقل بحث فوري (`search`) بالاسم أو الوصف.
     * فلتر حسب التصنيف (`category`).
     * فلتر حسب العلامة التجارية (`brand`).
  2. **جدول / كروت الشركات (Table / Grid):**
     * **شعار الشركة (Logo):** عرض الصورة الدائرية أو المربعة المصغرة.
     * **اسم الشركة (Name):** باللغة العربية والإنجليزية.
     * **الرابط (Slug):** المعرف اللطيف.
     * **العلامات التجارية التابعة (Brands):** Badges أو عدد البراندات التابعة مع إمكانية الضغط لرؤيتها.
     * **التصنيفات التابعة (Categories):** Tags للتصنيفات.
     * **الحالة (Status):** مفعل (Active) أو غير مفعل (Inactive).
     * **عمود الإجراءات (Actions):**
       * زر **عرض التفاصيل** (View Details).
       * زر **تعديل** (Edit).
       * زر **حذف** (Delete - مع تأكيد الحذف Confirmation Modal).

---

### الشاشة 2: إضافة / تعديل شركة (Create / Edit Company Form)
* **المسار المقترح:** Modal نافذة منبثقة أو صفحة `/dashboard/companies/new` و `/dashboard/companies/:id/edit`.
* **الصلاحية المطلوبة:** `manageCompanies`
* **نوع الإرسال:** `multipart/form-data` (لوجود ملف صورة الشعار).
* **الحقول المطلوبة في النموذج:**
  1. **اسم الشركة `name` (مطلوب - Text):** مثال: `يونيليفر (Unilever)`.
  2. **الرابط الفريد `slug` (اختياري - Text):** يتم توليده تلقائياً من الاسم إذا تُرك فارغاً (مثال: `unilever`).
  3. **الوصف `description` (اختياري - Textarea):** نبذة عن الشركة ونشاطها.
  4. **شعار الشركة `logo` (اختياري - File Upload):** يقبل (PNG, JPG, WebP) بحد أقصى 5MB، مع ميزة معاينة الصورة قبل الرفع (Image Preview).
  5. **العلامات التجارية التابعة `brands` (اختياري - Multi-Select Dropdown):**
     * قائمة منسدلة متعددة الخيارات لجلب البراندات المسجلة من `GET /api/dashboard/brands`.
     * يتم إرسالها كمصفوفة IDs.
  6. **التصنيفات التابعة `categories` (اختياري - Multi-Select Dropdown):**
     * قائمة منسدلة متعددة الخيارات لاختيار التصنيفات التابعة من `GET /api/dashboard/categories`.
  7. **حالة التفعيل `isActive` (اختياري - Switch/Checkbox):** القيمة الافتراضية `true`.

---

### الشاشة 3: صفحة تفاصيل الشركة (Company Details View)
* **المسار المقترح:** `/dashboard/companies/:id`
* **المكونات:**
  1. **بطاقة معلومات الشركة:** الشعار، الاسم، الوصف، تاريخ الإضافة، إجمالي عدد البراندات، إجمالي عدد المنتجات.
  2. **تبويب العلامات التجارية (Brands Tab):** جدول أو شبكة بالبراندات التابعة لشعار كل براند وتصنيفاته.
  3. **تبويب المنتجات (Products Tab):** جدول لجميع منتجات الشركة (يجلب من `GET /api/companies/:id/products`) مع إمكانية الترقيم والبحث والفلترة بالسعر والمخزون.
  4. **تبويب التصنيفات (Categories Tab):** قائمة الأقسام المرتبطة.

---

### الشاشة 4: تحديثات على شاشات أخرى قائمة (Updates to Existing Screens)
1. **في شاشة إضافة/تعديل البراند (`/dashboard/brands`):**
   * إضافة حقل منسدل لاختيار **"الشركة الأم" (`company`)**.
2. **في شاشة المنتجات (`/dashboard/products`):**
   * إضافة فلتر حسب **"الشركة" (`company`)** في شريط التصفية العلوي.
   * إظهار عمود أو شارة (Badge) باسم الشركة التابع لها المنتج إن وجدت.

---

## 🔌 3. التوثيق البرمجي للـ Endpoints (API Reference)

### Base URL
```
https://api-mobile.elhadyelmohmady.com/api/dashboard
```
أو محلياً:
```
http://localhost:5151/api/dashboard
```

### Headers الإلزامية
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

---

### 1. جلب قائمة الشركات (Get Companies)
```http
GET /api/dashboard/companies?page=1&limit=20&search=&category=&brand=
```
* **Permissions:** `viewCompanies`
* **Query Parameters:**
  * `page` (number, default: 1): رقم الصفحة.
  * `limit` (number, default: 50): عدد العناصر بالصفحة.
  * `search` (string, optional): بحث بالاسم أو الوصف.
  * `category` (string, optional): فلترة بمعرف القسم (Category ID).
  * `brand` (string, optional): فلترة بمعرف العلامة التجارية (Brand ID).

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "6aeb67dfff8fe1fddc85fd96",
      "name": "يونيليفر (Unilever)",
      "slug": "unilever",
      "logo": "company_logos/company-1730740445-123456789.webp",
      "description": "شركة يونيليفر العالمية للسلع الاستهلاكية ومنتجات العناية الشخصية والمنزلية",
      "isActive": true,
      "brands": [
        {
          "_id": "69ce24b6f4352dd137e5bc01",
          "name": "دوف",
          "logo": "brand_logos/dove.webp"
        },
        {
          "_id": "69ce24b6f4352dd137e5bc02",
          "name": "لايف بوي",
          "logo": "brand_logos/lifebuoy.webp"
        }
      ],
      "categories": [
        {
          "_id": "69ce24b6f4352dd137e5bbcc",
          "name": "مستحضرات",
          "slug": "cosmetics"
        }
      ],
      "createdAt": "2026-11-04T17:14:06.123Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

### 2. جلب تفاصيل شركة واحدة (Get Single Company)
```http
GET /api/dashboard/companies/:id
```
* **Permissions:** `viewCompanies`

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "6aeb67dfff8fe1fddc85fd96",
    "name": "يونيليفر (Unilever)",
    "slug": "unilever",
    "logo": "company_logos/company-1730740445-123456789.webp",
    "description": "شركة يونيليفر العالمية للسلع الاستهلاكية",
    "isActive": true,
    "brands": [ ... ],
    "categories": [ ... ]
  }
}
```

---

### 3. إنشاء شركة جديدة (Create Company)
```http
POST /api/dashboard/companies
```
* **Permissions:** `manageCompanies`
* **Content-Type:** `multipart/form-data`

#### Request Form Data:
| الحقل (Field) | النوع (Type) | إلزامي؟ | الوصف |
|---|---|---|---|
| `name` | Text | نعم | اسم الشركة (مثال: هنكل Henkel) |
| `slug` | Text | اختياري | الرابط اللطيف (مثال: `henkel`) |
| `description` | Text | اختياري | وصف الشركة |
| `logo` | File | اختياري | ملف صورة الشعار (PNG, JPG, WebP) |
| `brands` | Text / JSON Array | اختياري | معرفات البراندات: `["69ce24b6f4352dd137e5bc01"]` |
| `categories` | Text / JSON Array | اختياري | معرفات التصنيفات: `["69ce24b6f4352dd137e5bbcc"]` |
| `isActive` | Boolean | اختياري | `true` أو `false` |

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "6aeb67dfff8fe1fddc85fda0",
    "name": "هنكل (Henkel)",
    "slug": "henkel",
    "logo": "company_logos/company-1730741234.webp",
    "brands": [ ... ],
    "categories": [ ... ]
  }
}
```

---

### 4. تعديل شركة (Update Company)
```http
PUT /api/dashboard/companies/:id
```
* **Permissions:** `manageCompanies`
* **Content-Type:** `multipart/form-data`
* يقبل نفس حقول الـ `POST`. يتم إرسال الحقول المراد تعديلها فقط.
* إذا تم إرفاق ملف `logo` جديد، سيقوم السيرفر تلقائياً بحذف الشعار القديم واستبداله بالشعار المحسن الجديد.

---

### 5. حذف شركة (Delete Company)
```http
DELETE /api/dashboard/companies/:id
```
* **Permissions:** `manageCompanies`
* يقوم بحذف الشركة، ويفك ارتباطها تلقائياً عن البراندات والمنتجات التابعة لها بوضع `company: null`.

#### Response (200 OK):
```json
{
  "success": true,
  "message": "تم حذف الشركة بنجاح"
}
```

---

### 6. جلب منتجات الشركة (Get Company Products)
```http
GET /api/companies/:id/products?page=1&limit=20&category=&sort=price_asc
```
* **العنوان:** Public / Mobile / Dashboard
* **Query Parameters:**
  * `page`, `limit`
  * `category`: فلترة بمنتجات قسم معين تابعة لهذه الشركة.
  * `sort`: `price_asc` | `price_desc` | `most_ordered` | `name_asc` | `name_desc`.

#### Response (200 OK):
```json
{
  "success": true,
  "company": {
    "_id": "6aeb67dfff8fe1fddc85fd96",
    "name": "يونيليفر (Unilever)",
    "logo": "company_logos/unilever.webp"
  },
  "count": 20,
  "pagination": {
    "total": 65,
    "page": 1,
    "limit": 20,
    "pages": 4
  },
  "data": [
    {
      "_id": "69ce24b7f4352dd137e5c501",
      "name": "دوف صابون بيوتي 135جم",
      "price": 45,
      "stock": 120,
      "brand": { "_id": "...", "name": "دوف", "logo": "..." },
      "company": { "_id": "...", "name": "يونيليفر (Unilever)" },
      "categories": [ ... ]
    }
  ]
}
```

---

### 7. جلب براندات الشركة (Get Company Brands)
```http
GET /api/companies/:id/brands
```
* يعيد قائمة البراندات التابعة للشركة مع شعار كل براند وتصنيفاته.

---

## 🖼️ 4. عرض الصور والشعارات (Image URLs)

الصور المخزنة في قاعدة البيانات يتم حفظها كمسارات نسبية:
* مسار شعار الشركة في الداتا: `company_logos/company-1730740445-123456789.webp`
* رابط العرض الكامل في الـ Frontend:
```javascript
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-logo.png';
  if (imagePath.startsWith('http')) return imagePath;
  const BASE_URL = 'https://api-mobile.elhadyelmohmady.com'; // أو الرابط المحلي
  return `${BASE_URL}/${imagePath}`;
};
```

---

## 💻 5. أمثلة برمجية لـ Frontend (JavaScript / Axios)

### مثال: إنشاء شركة جديدة مع رفع الشعار والبراندات
```javascript
import axios from 'axios';

export const createCompany = async ({ name, slug, description, logoFile, selectedBrandIds, selectedCategoryIds }) => {
  const formData = new FormData();
  formData.append('name', name);
  if (slug) formData.append('slug', slug);
  if (description) formData.append('description', description);
  
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  // إرسال المصفوفات بصيغة JSON String
  if (selectedBrandIds?.length > 0) {
    formData.append('brands', JSON.stringify(selectedBrandIds));
  }
  if (selectedCategoryIds?.length > 0) {
    formData.append('categories', JSON.stringify(selectedCategoryIds));
  }

  const token = localStorage.getItem('adminToken');

  const response = await axios.post('/api/dashboard/companies', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
```

### مثال: جلب الشركات مع الفلترة
```javascript
export const fetchCompanies = async ({ page = 1, search = '', categoryId = '' }) => {
  const token = localStorage.getItem('adminToken');
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', 20);
  if (search) params.append('search', search);
  if (categoryId) params.append('category', categoryId);

  const response = await axios.get(`/api/dashboard/companies?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data; // { success: true, data: [...], pagination: {...} }
};
```

---

## 🛡️ 6. الصلاحيات وإدارة الأخطاء (Permissions & Error Handling)

| كود الخطأ | السبب | الإجراء المطلوب من Frontend |
|---|---|---|
| `400 Bad Request` | اسم الشركة مكرر أو الرابط مكرر | إظهار رسالة خطأ للحقل: "اسم الشركة موجود بالفعل" |
| `401 Unauthorized` | التوكن منتهي أو غير موجود | توجيه المستخدم لصفحة تسجيل الدخول `/login` |
| `403 Forbidden` | المدير لا يملك صلاحية `manageCompanies` | إخفاء أو تعطيل أزرار الإضافة والتعديل والحذف |
| `404 Not Found` | الشركة غير موجودة | عرض تنبيه "الشركة غير موجودة" والرجوع للقائمة |
| `500 Server Error` | خطأ في معالجة ملف الصورة أو السيرفر | عرض رسالة "حدث خطأ في الخادم، حاول مرة أخرى" |
