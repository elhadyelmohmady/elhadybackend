# نشر ميزة الإعلانات (Ads) على الإنتاج

التاريخ: 2026-11-22

## اللي اتضاف (شغال ومختبَر محلياً)

- **Backend**: موديل `Ad` (سلايدر / منبثق)، CRUD على `/api/dashboard/ads` بصلاحيات `viewAds`/`manageAds`، ورفع صور `ad_images` (sharp → webp)، وإندبوينتات عامة للموبايل: `GET /api/ads` و `GET /api/ads/popup`.
- **Dashboard**: صفحة "الإعلانات" الجديدة على `/dashboard/ads` (تبويبات سلايدر/منبثق، رفع صور أو رابط خارجي، جدولة تواريخ للإعلانات المدفوعة، ترتيب، تفعيل/تعطيل بضغطة، اسم المُعلن، وجهة الإعلان: شاشة داخل التطبيق أو رابط خارجي، وتكرار ظهور المنبثق).
- **Mobile**: السلايدر في الصفحة الرئيسية بقى متغذي من `/api/ads` (فيه fallback للصور القديمة لو الـ API فاضي/واقف)، وإعلان منبثق بيظهر عند فتح التطبيق حسب تكرار الظهور المحدد من الداشبورد.

## خطوات النشر بالترتيب (مهم: الباك اند قبل الداشبورد)

### 1. Backend (سيرفر الإنتاج `elhady-win` عبر Tailscale)

```bash
# من الماك بعد تشغيل Tailscale:
ssh elhady-win
# على السيرفر، في مجلد المشروع (نفس مكان اللي شغال عليه pm2/الخدمة):
git pull origin main        # أو master حسب الفرع الموجود
# ثم أعد تشغيل الخدمة (حسب إعداد السيرفر):
#   pm2 restart <elhady-backend>   أو   npm start
```

الملفات الجديدة/المتغيرة في هذا الإصدار:
- `src/models/Ad.js` (جديد)
- `src/routes/adRoutes.js` (جديد)
- `src/controllers/dashboardController.js` (قسم ads جديد)
- `src/routes/dashboardRoutes.js` (راوتات ads)
- `src/middleware/uploadMiddleware.js` (adUpload)
- `src/utils/imageUpload.js` (processAdImage)
- `src/app.js` (ستاتيك `/ad_images` + ماونت `/api/ads`)
- `src/models/Admin.js` (الصلاحيات الجديدة viewAds/manageAds)

بعد التشغيل اتأكد:
```bash
curl https://api-mobile.elhadyelmohmady.com/api/ads          # → {"success":true,"count":0,"data":[]}
curl https://api-mobile.elhadyelmohmady.com/api/ads/popup    # → {"success":true,"data":null}
```

ملاحظة: مجلد `src/assets/ad_images` هيتعمل تلقائياً أول ما ترفع أول صورة (أو اعمله يدوي: `mkdir src/assets/ad_images`).

### 2. Dashboard (Vercel)

بمجرد `git push` للـ main في `elhady-dashboard-frontend` هيتعمل deploy تلقائي (Vercel Git integration) — **متدفعوش غير بعد ما الباك اند يبقى شغال**، عشان صفحة الإعلانات متظهرش خطأ 404.

### 3. الصلاحيات

- حساب `super_admin` معاه الصلاحيات الجديدة تلقائياً بعد أول save لحسابه (أو من صفحة المدراء عدّل الصلاحيات: «عرض الإعلانات» / «إدارة الإعلانات»).

### 4. Mobile

تغييرات الكود جاهزة في repo `Elhady`. الإعلانات بتظهر أول ما تتبني نسخة جديدة وتتوزع على المتاجر (مفيش force update مطلوب — الميزة إضافية).
