# 📊 توثيق نظام الحسابات والمدفوعات والآجل (Accounting & Financial Ledger API Docs)

يوفر هذا النظام إدارة مالية كاملة وتفصيلية للمستخدمين/العملاء، يشمل كشف حساب تفصيلي، دفع بالأجل، سداد بتاريخ مخصص (باك ديت / Backdated Payment)، ورصيد دائن/مدين محسب بدقة، مع نظرة شاملة على جميع أموال ونقدية التطبيق.

---

## 📌 قائمة الـ Endpoints للـ Frontend

> 💡 **ملاحظة هامّة**: جميع مسارات الإدارة (Admin) تُدعم كلاً من البادئتين `/api/accounts/` وكذلك `/api/dashboard/accounts/` أو `/api/dashboard/financial-overview`.

| Endpoint | Method | Auth | الوصف (Description) |
|---|---|---|---|
| `/api/accounts/my-account` | `GET` | User | جلب ملخص الحساب المالي للمستخدم الحالي (الرصيد، الدين، حد الآجل، إجمالي المدفوعات) |
| `/api/accounts/my-statement` | `GET` | User | جلب كشف حساب تفصيلي (سجل كافة عمليات الفلوس) للمستخدم الحالي مع الترقيم والفلترة |
| `/api/orders` | `POST` | User | إنشاء طلب جديد (يدعم `paymentMethod: "deferred"` للطلب بالأجل) |
| `/api/accounts/financial-overview` <br> *(أو `/api/dashboard/accounts/financial-overview`)* | `GET` | Admin | نظرة مالية شاملة للتطبيق كله (إجمالي المبيعات، المحصل، الديون المستحقة، كبار المدينين) |
| `/api/accounts/users/:userId/summary` <br> *(أو `/api/dashboard/accounts/users/:userId/summary`)* | `GET` | Admin | جلب ملخص الحساب المالي لعميل محدد |
| `/api/accounts/users/:userId/statement` <br> *(أو `/api/dashboard/accounts/users/:userId/statement`)* | `GET` | Admin | جلب كشف حساب تفصيلي لعميل محدد |
| `/api/accounts/payments` <br> *(أو `/api/dashboard/accounts/payments`)* | `POST` | Admin | تسجيل دفعة مادية/سداد لعميل (تدعم تاريخ مخصص `paymentDate` وسداد طلب أو حساب عام) |
| `/api/accounts/adjustments` <br> *(أو `/api/dashboard/accounts/adjustments`)* | `POST` | Admin | تسجيل تسوية مالية (إضافة دين / خصم دين) بحساب العميل مع تاريخ مخصص |
| `/api/accounts/users/:userId/credit-limit` <br> *(أو `/api/dashboard/accounts/users/:userId/credit-limit`)* | `PUT` | Admin | تعديل حد الائتمان/الآجل والسماح بالدفع بالأجل لعميل محدد |

---

## 1️⃣ حُساب المستخدم (User Endpoints)

### 🔹 1.1 جلب ملخص الحساب المالي للمستخدم
**GET** `/api/accounts/my-account`  
**Headers**: `Authorization: Bearer <user_token>`

#### 🟢 Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb8b5c9c22b9c8b4567",
      "username": "ahmed_ali",
      "fullName": "أحمد علي",
      "phoneNumber": "01012345678",
      "creditLimit": 10000,
      "isCreditAllowed": true,
      "availableCredit": 8500
    },
    "financials": {
      "totalDebit": 5000,
      "totalCredit": 3500,
      "currentBalance": 1500,
      "accountStatus": "in_debt"
    }
  }
}
```
> **توضيح الحقول**:
> - `currentBalance`: الرصيد الحالي المستحق. (إذا كان > 0 فهو دَين مستحق عليه، 0 خالص، < 0 رصيد دائن له).
> - `totalDebit`: إجمالي قيمة المسحوبات والطلبات بالكامل.
> - `totalCredit`: إجمالي قيمة المدفوعات والسدادات التي دفعها العميل.
> - `availableCredit`: المتبقي من حد الآجل المسموح به (`creditLimit - currentBalance`).
> - `accountStatus`: حالة الحساب (`balanced` خالص, `in_debt` عليه دَين, `overpaid` له رصيد دائن).

---

### 🔹 1.2 كشف حساب العميل التفصيلي (Kashf 7sab / Ledger)
**GET** `/api/accounts/my-statement`  
**Headers**: `Authorization: Bearer <user_token>`  
**Query Parameters**:
- `page`: رقم الصفحة (افتراضي `1`)
- `limit`: عدد العناصر بالصفحة (افتراضي `20`)
- `startDate`: تاريخ البدء `YYYY-MM-DD` (اختياري)
- `endDate`: تاريخ الانتهاء `YYYY-MM-DD` (اختياري)
- `type`: نوع العملية `order_debit` / `payment_credit` / `adjustment_debit` / `adjustment_credit` (اختياري)

#### 🟢 Response `200 OK`:
```json
{
  "success": true,
  "summary": {
    "totalDebit": 5000,
    "totalCredit": 3500,
    "currentBalance": 1500,
    "accountStatus": "in_debt"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  },
  "data": [
    {
      "_id": "669fc820a1b2c3d4e5f60002",
      "user": "60d5ecb8b5c9c22b9c8b4567",
      "type": "payment_credit",
      "amount": 500,
      "balanceAfter": 1500,
      "paymentMethod": "cash",
      "transactionDate": "2026-07-05T14:30:00.000Z",
      "notes": "سداد نقدي بتاريخ 5 يوليو",
      "createdAt": "2026-07-05T14:30:00.000Z"
    },
    {
      "_id": "669fc820a1b2c3d4e5f60001",
      "user": "60d5ecb8b5c9c22b9c8b4567",
      "type": "order_debit",
      "amount": 2000,
      "balanceAfter": 2000,
      "order": "60d5ecb8b5c9c22b9c8b9999",
      "paymentMethod": "deferred",
      "transactionDate": "2026-07-01T10:00:00.000Z",
      "notes": "طلب جديد رقم #60d5ecb8b5c9c22b9c8b9999 (آجل)",
      "createdAt": "2026-07-01T10:00:00.000Z"
    }
  ]
}
```

---

### 🔹 1.3 إنشاء طلب جديد بالدفع بالأجل (Deferred / Credit Order)
**POST** `/api/orders`  
**Headers**: `Authorization: Bearer <user_token>`  
**Request Body**:
```json
{
  "items": [
    {
      "product": "60d5ecb8b5c9c22b9c8b1234",
      "quantity": 2
    }
  ],
  "paymentMethod": "deferred",
  "shippingType": "normal",
  "address": {
    "lat": 30.0444,
    "lng": 31.2357,
    "city": "القاهرة",
    "locationDetails": "شارع النصر، عمارة 12"
  }
}
```
> 💡 **ملاحظة**: قيم `paymentMethod` المتاحة: `cash_on_delivery`, `deferred` (آجل), `credit` (آجل), `online`, `bank_transfer`.
> يطرح النظام تلقائياً من الحد المسموح بالآجل `creditLimit` ويرفض الطلب برسال 400 في حال تجاوز الحد.

---

## 2️⃣ لوحة التحكم والإدارة (Admin Endpoints)

### 🔹 2.1 النظرة المالية الشاملة للتطبيق (App Financial Overview)
**GET** `/api/accounts/financial-overview`  
**Headers**: `Authorization: Bearer <admin_token>`

#### 🟢 Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSales": 150000,
      "totalCollected": 110000,
      "totalOutstandingDebt": 40000,
      "totalDeferredSales": 65000,
      "totalOverpaidCredit": 2000,
      "totalOrdersCount": 120,
      "totalPaymentsCount": 95,
      "totalUsersCount": 50,
      "usersWithDebtCount": 18
    },
    "topDebtors": [
      {
        "userId": "60d5ecb8b5c9c22b9c8b4567",
        "username": "ahmed_ali",
        "fullName": "أحمد علي",
        "phoneNumber": "01012345678",
        "creditLimit": 10000,
        "currentBalance": 8500,
        "totalDebit": 15000,
        "totalCredit": 6500
      }
    ],
    "recentTransactions": [...]
  }
}
```

---

### 🔹 2.2 تسجيل دفع بسداد بتأريخ مخصص (Record Custom Date Payment)
**POST** `/api/accounts/payments`  
**Headers**: `Authorization: Bearer <admin_token>`  
**Request Body**:
```json
{
  "userId": "60d5ecb8b5c9c22b9c8b4567",
  "amount": 2500,
  "paymentDate": "2026-07-15T12:00:00Z",
  "paymentMethod": "cash",
  "orderId": "60d5ecb8b5c9c22b9c8b9999",
  "notes": "تم الاستلام نقدياً وتوثيق الدفعة بتاريخ سابق"
}
```
> 💡 **ملاحظة**: `paymentDate` يتيح لك إدخال أي تاريخ مخصص (Backdated Payment). `orderId` اختياري (إن لم يُرسل، يتم تخصيص السداد تلقائياً للطلبات القديمة غير المسددة).

---

### 🔹 2.3 تسجيل تسوية مالية (إضافة دَين / خصم دَين)
**POST** `/api/accounts/adjustments`  
**Headers**: `Authorization: Bearer <admin_token>`  
**Request Body**:
```json
{
  "userId": "60d5ecb8b5c9c22b9c8b4567",
  "type": "adjustment_credit",
  "amount": 300,
  "transactionDate": "2026-07-20T00:00:00Z",
  "notes": "خصم تسوية بسبب عجز في شحنة مستلمة"
}
```
> `type` يتقبل:
> - `adjustment_debit`: إضافة دَين على العميل (زيادة المستحق عليه).
> - `adjustment_credit`: خصم دَين من العميل (تخفيض المستحق عليه).

---

### 🔹 2.4 تعديل حد الائتمان والدفع بالأجل للعميل (Credit Limit Settings)
**PUT** `/api/accounts/users/:userId/credit-limit`  
**Headers**: `Authorization: Bearer <admin_token>`  
**Request Body**:
```json
{
  "creditLimit": 15000,
  "isCreditAllowed": true
}
```
