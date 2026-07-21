# 🔔 توثيق نظام الإشعارات (Telegram & Dashboard Notifications API)

يقوم هذا النظام بإرسال إشعارات فورية عبر **تليجرام (Telegram Bot)** للإدارة والـ Super Admin، بالإضافة إلى تخزين الإشعارات في قاعدة البيانات لتهيئتها للعرض في **لوحة التحكم (Dashboard)** و**تطبيق الموبايل (Mobile App)**.

---

## 🚀 1. كيفية إعداد وتفعيل بوت تليجرام (Telegram Bot Setup)

### الخطوة الأولى: إنشاء البوت والحصول على الـ `Bot Token`
1. افتح تطبيق تليجرام وابحث عن المستخدم **`@BotFather`**.
2. أرسل الأمر `/newbot`.
3. أدخل اسم البوت واسم المستخدم الخاص به (يجب أن ينتهي بـ `bot`).
4. سيمنحك `@BotFather` رمز الحماية **`HTTP API Token`** (مثال: `7123456789:AAFxxx...`). هذا هو `TELEGRAM_BOT_TOKEN`.

### الخطوة الثانية: الحصول على الـ `Chat ID` الخاص بالـ Super Admin
1. ابحث عن البوت **`@userinfobot`** أو **`@raw_data_bot`** في تليجرام.
2. قم بإرسال أي رسالة له وسيظهر لك `Id` الخاص بك (مثال: `123456789`). هذا هو `TELEGRAM_CHAT_ID`.
3. **مهم جداً:** افتح البوت الخاص بك الذي أنشأته في الخطوة الأولى اضغط على **Start** وأرسل له أي رسالة ترحيبية حتى يتمكن البوت من مراسلتك.

---

## ⚙️ 2. الطرق المتاحة لضبط إعدادات تليجرام بالنظام

### الطريقة الأولى: عن طريق ملف البيئة (`.env`)
أضف المتغيرات التالية في ملف `.env`:
```env
TELEGRAM_BOT_TOKEN=7123456789:AAFxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

### الطريقة الثانية: عن طريق لوحة التحكم (API)
يمكنك تحديث إعدادات تليجرام ديناميكياً بدون إعادة تشغيل السيرفر عن طريق الـ API الموضح أدناه (`PUT /api/dashboard/notifications/telegram-config`).

---

## 📡 3. إحداثيات وتوثيق الـ API الخاصة بالإشعارات (Dashboard Notification API)

جميع المسارات أدناه تتطلب المصادقة باستخدام Header:
`Authorization: Bearer <ADMIN_JWT_TOKEN>`

---

### 1️⃣ فحص حالة إعدادات تليجرام (Get Telegram Config Status)
* **Endpoint:** `GET /api/dashboard/notifications/telegram-config`
* **Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "isEnvProvided": true,
    "botToken": "712345...xYz1",
    "chatId": "123456789",
    "hasBotToken": true,
    "hasChatId": true
  }
}
```

---

### 2️⃣ تحديث إعدادات تليجرام من لوحة التحكم (Update Telegram Config)
* **Endpoint:** `PUT /api/dashboard/notifications/telegram-config`
* **Body:**
```json
{
  "botToken": "7123456789:AAFxxxxxxxxxxxxxxxxxxxx",
  "chatId": "123456789"
}
```
* **Response:**
```json
{
  "success": true,
  "message": "تم حفظ إعدادات تليجرام بنجاح",
  "data": {
    "configured": true,
    "chatId": "123456789"
  }
}
```

---

### 3️⃣ إرسال رسالة تجريبية لتليجرام (Test Telegram Integration)
* **Endpoint:** `POST /api/dashboard/notifications/test-telegram`
* **Body (اختياري):**
```json
{
  "customMessage": "رسالة تجريبية من لوحة التحكم 🚀"
}
```
* **Response:**
```json
{
  "success": true,
  "message": "تم ارسال رسالة الاختبار بنجاح إلى تليجرام!"
}
```

---

### 4️⃣ جلب قائمة الإشعارات للوحة التحكم (Get Notifications List)
* **Endpoint:** `GET /api/dashboard/notifications`
* **Query Parameters (اختيارية):**
  * `page` (default: 1)
  * `limit` (default: 20)
  * `isRead` (`true` / `false`)
  * `type` (`order_new`, `order_status`, `order_cancelled`, `payment_new`, `stock_low`, `user_registered`)
* **Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "669db...",
      "title": "📦 طلب جديد #669db...",
      "message": "قام العميل أحمد علي بعمل طلب جديد بقيمة 1500 جنيه.",
      "type": "order_new",
      "recipientType": "admin",
      "metadata": {
        "orderId": "669db...",
        "total": 1500,
        "customerName": "أحمد علي",
        "paymentMethod": "cash_on_delivery"
      },
      "isRead": false,
      "severity": "success",
      "createdAt": "2026-07-21T21:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  },
  "unreadCount": 1
}
```

---

### 5️⃣ جلب عدد الإشعارات غير المقروءة (Get Unread Count)
* **Endpoint:** `GET /api/dashboard/notifications/unread-count`
* **Response:**
```json
{
  "success": true,
  "unreadCount": 5
}
```

---

### 6️⃣ تعليم إشعار معين كمقروء (Mark Single Notification as Read)
* **Endpoint:** `PATCH /api/dashboard/notifications/:id/read`
* **Response:**
```json
{
  "success": true,
  "message": "تم تعليم الإشعار كمقروء"
}
```

---

### 7️⃣ تعليم كل الإشعارات كمقروءة (Mark All Notifications as Read)
* **Endpoint:** `PATCH /api/dashboard/notifications/read-all`
* **Response:**
```json
{
  "success": true,
  "message": "تم تعليم جميع الإشعارات كمقروءة"
}
```

---

### 8️⃣ حذف إشعار (Delete Notification)
* **Endpoint:** `DELETE /api/dashboard/notifications/:id`
* **Response:**
```json
{
  "success": true,
  "message": "تم حذف الإشعار بنجاح"
}
```

---

## 📱 4. إحداثيات إشعارات تطبيق الموبايل (User Mobile Notifications API)

Header المطلوب للمصادقة: `Authorization: Bearer <USER_JWT_TOKEN>`

* **جلب إشعارات المستخدم:** `GET /api/notifications`
* **عدد الإشعارات غير المقروءة:** `GET /api/notifications/unread-count`
* **تعليم إشعار كمقروء:** `PATCH /api/notifications/:id/read`

---

## ⚡ 5. الأحداث والتنبيهات التلقائية بالنظام (Automated Triggers)

يتم إرسال إشعار تليجرام + حفظ الإشعار بقاعدة البيانات تلقائياً في الأحداث التالية:
1. **إنشاء طلب جديد (`order_new`):** يحتوي على اسم العميل، الهاتف، العنوان، المنتجات بالكميات، وطريقة الدفع.
2. **تحديث حالة الطلب (`order_status`):** تنبيه بالإنتقال من حالة لأخرى (مثل: قيد الانتظار 👈 تم التوصيل).
3. **إلغاء طلب (`order_cancelled`):** تنبيه عند إلغاء الطلب من قِبل العميل أو الأدمن.
4. **تسجيل دفعة جديدة (`payment_new`):** تنبيه عند إضافة مبلغ مدفوع لحساب عميل أو طلب.
5. **تنبيه مخزون منخفض (`stock_low`):** تنبيه عندما ينخفض مخزون منتج عن الحد الآمن.
