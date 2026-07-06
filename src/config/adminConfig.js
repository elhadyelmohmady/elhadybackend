import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';
import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Setting from '../models/Setting.js';

// Register the adapter
AdminJS.registerAdapter(AdminJSMongoose);

const adminOptions = {
    resources: [
        {
            resource: Product,
            options: {
                label: 'المنتجات',
                navigation: { name: 'المتجر', icon: 'Store' },
                properties: {
                    name: { label: 'اسم المنتج' },
                    image: {
                        label: 'صورة المنتج',
                        isVisible: { list: true, filter: false, show: true, edit: true },
                    },
                    price: { label: 'السعر' },
                    stock: { label: 'الكمية المتوفرة' },
                    categories: { label: 'التصنيفات' },
                    brand: { label: 'العلامة التجارية' },
                    minOrderQty: { label: 'الحد الأدنى للطلب' },
                    maxOrderQty: { label: 'الحد الأقصى للطلب' },
                    local_id: { label: 'المعرف المحلي' },
                    keywords: {
                        label: 'كلمات مفتاحية',
                        isVisible: { list: false, filter: false, show: true, edit: true },
                    },
                    metadata: { label: 'بيانات إضافية', isVisible: { list: false, filter: false, show: true, edit: true } },
                    _id: { label: 'المعرف الرقمي' },
                    createdAt: { label: 'تاريخ الإضافة' },
                    updatedAt: { label: 'تاريخ التحديث' },
                },
                listProperties: ['name', 'image', 'price', 'stock', 'minOrderQty', 'maxOrderQty', 'brand'],
                showProperties: ['name', 'image', 'price', 'stock', 'minOrderQty', 'maxOrderQty', 'brand', 'categories', 'local_id', 'metadata', 'createdAt', 'updatedAt']
            }
        },
        {
            resource: Category,
            options: {
                label: 'التصنيفات',
                navigation: { name: 'المتجر', icon: 'Folder' },
                properties: {
                    name: { label: 'اسم التصنيف' },
                    slug: { label: 'الرابط المخصص (Slug)' },
                    image: { label: 'صورة القسم' },
                    isActive: { label: 'نشط' },
                    _id: { label: 'المعرف' },
                    createdAt: { label: 'تاريخ الإنشاء' },
                }
            }
        },
        {
            resource: Brand,
            options: {
                label: 'العلامات التجارية',
                navigation: { name: 'المتجر', icon: 'Award' },
                properties: {
                    name: { label: 'اسم العلامة' },
                    logo: { label: 'الشعار (Logo)' },
                    description: { label: 'الوصف' },
                    _id: { label: 'المعرف' },
                    createdAt: { label: 'تاريخ الإضافة' },
                }
            }
        },
        {
            resource: Admin,
            options: {
                label: 'المديرين',
                navigation: { name: 'إدارة النظام', icon: 'Shield' },
                properties: {
                    username: { label: 'اسم المستخدم' },
                    fullName: { label: 'الاسم الكامل' },
                    password: { label: 'كلمة المرور', isVisible: { list: false, filter: false, show: false, edit: true } },
                    createdAt: { label: 'تاريخ الإنشاء' },
                    updatedAt: { label: 'آخر تحديث' },
                    _id: { label: 'المعرف', isVisible: { list: false, filter: true, show: true, edit: false } },
                }
            }
        },
        {
            resource: User,
            options: {
                label: 'المستخدمين',
                navigation: { name: 'إدارة المستخدمين', icon: 'Users' },
                properties: {
                    username: { label: 'اسم المستخدم' },
                    fullName: { label: 'الاسم الكامل' },
                    phoneNumber: { label: 'رقم الهاتف' },
                    isActive: { label: 'حالة الحساب (نشط)' },
                    password: { label: 'كلمة المرور', isVisible: { list: false, filter: false, show: false, edit: true } },
                    createdAt: { label: 'تاريخ التسجيل' },
                    updatedAt: { label: 'آخر تحديث' },
                    _id: { label: 'المعرف', isVisible: { list: false, filter: true, show: true, edit: false } },
                }
            }
        },
        {
            resource: Order,
            options: {
                label: 'الطلبات',
                navigation: { name: 'المبيعات', icon: 'ShoppingCart' },
                properties: {
                    customer: { label: 'اسم العميل' },
                    total: { label: 'إجمالي الطلب' },
                    status: {
                        label: 'حالة الطلب الحالية',
                        availableValues: [
                            { value: 'pending', label: 'في الانتظار' },
                            { value: 'processing', label: 'تمت الموافقة' },
                            { value: 'shipped', label: 'تم الشحن' },
                            { value: 'delivered', label: 'تم التسليم' },
                            { value: 'cancelled', label: 'ملغي' },
                        ],
                    },
                    items: { label: 'المنتجات المطلوبة' },
                    createdAt: { label: 'تاريخ الطلب' },
                    updatedAt: { label: 'تاريخ التحديث' },
                    _id: { label: 'رقم الطلب' },
                },
                listProperties: ['_id', 'customer', 'total', 'status', 'createdAt'],
            }
        },
        {
            resource: Setting,
            options: {
                label: 'الإعدادات',
                navigation: { name: 'إدارة النظام', icon: 'Settings' },
                properties: {
                    key: { label: 'المفتاح', isVisible: { list: false, filter: false, show: true, edit: false } },
                    minOrderTotal: { label: 'الحد الأدنى لقيمة الطلب (جنيه)' },
                    _id: { label: 'المعرف', isVisible: { list: false, filter: false, show: false, edit: false } },
                    createdAt: { label: 'تاريخ الإنشاء' },
                    updatedAt: { label: 'آخر تحديث' },
                },
                actions: {
                    new: { isAccessible: false },
                    delete: { isAccessible: false },
                    bulkDelete: { isAccessible: false },
                },
                listProperties: ['minOrderTotal', 'updatedAt'],
            }
        },
    ],
    branding: {
        companyName: 'الهادي موبايل',
        softwareBrothers: false,
        logo: false,
    },
    locale: {
        language: 'ar',
        availableLanguages: ['ar', 'en'],
        translations: {
            ar: {
                labels: {
                    loginWelcome: 'لوحة التحكم - تسجيل الدخول',
                    Product: 'المنتجات',
                    Admin: 'المديرين',
                    User: 'المستخدمين',
                    Order: 'الطلبات',
                    Category: 'التصنيفات',
                    Brand: 'العلامات التجارية',
                    Setting: 'الإعدادات',
                    dashboard: 'الرئيسية',
                    navigation: 'القائمة الرئيسية',
                    pages: 'الصفحات',
                    selected: 'تم الاختيار',
                    filters: 'الفلاتر البحثية',
                    adminVersion: 'نسخة النظام',
                    search: 'بحث...',
                },
                messages: {
                    welcome: 'مرحباً بك في لوحة تحكم الهادي موبايل',
                    loginWelcome: 'يرجى تسجيل الدخول للمتابعة',
                    noRecords: 'لا توجد بيانات متاحة حالياً',
                    confirmDelete: 'هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟',
                    successfullyCreated: 'تمت إضافة البيانات بنجاح',
                    successfullyUpdated: 'تم تحديث البيانات بنجاح',
                    successfullyDeleted: 'تم حذف البيانات بنجاح',
                    errorStatus: 'حدث خطأ أثناء المعالجة',
                    welcomeOnBoard_title: 'أهلاً بك في النظام',
                    welcomeOnBoard_subtitle: 'ابدأ بإدارة متجرك ومستخدميك من هنا بكل سهولة.',
                    customizeActions_title: 'تخصيص العمليات',
                    customizeActions_subtitle: 'يمكنك تعديل كيفية عمل النظام مع كل سجل.',
                    customizeResources_title: 'إدارة النماذج',
                    customizeResources_subtitle: 'التحكم في الحقول والعرض لكل جدول.',
                    addingResources_title: 'إضافة موارد جديدة',
                    addingResources_subtitle: 'خطوات بسيطة لربط قواعد بيانات أخرى.',
                    roleBasedAccess_title: 'صلاحيات المستخدمين',
                    roleBasedAccess_subtitle: 'تحديد من يمكنه العرض أو التعديل.',
                    customDashboard_title: 'لوحة تحكم مخصصة',
                    customDashboard_subtitle: 'تصميم واجهة تناسب احتياجات عملك.',
                    writeOwnComponents_title: 'بناء واجهات خاصة',
                    writeOwnComponents_subtitle: 'دعم كامل لمكونات React المخصصة.'
                },
                actions: {
                    new: 'إضافة جديد',
                    edit: 'تعديل',
                    show: 'عرض',
                    delete: 'حذف',
                    list: 'القائمة',
                    search: 'بحث',
                    bulkDelete: 'حذف جماعي',
                    filter: 'تصفية',
                },
                buttons: {
                    login: 'تسجيل الدخول',
                    save: 'حفظ التغييرات',
                    createNew: 'إضافة جديد',
                    filter: 'تصفية النتائج',
                    applyChanges: 'تطبيق التعديلات',
                    cancel: 'إلغاء',
                    confirm: 'تأكيد العملية',
                    delete: 'حذف السجل',
                    edit: 'تعديل',
                    list: 'عرض القائمة',
                    search: 'بحث',
                    logout: 'تسجل الخروج',
                    show: 'عرض التفاصيل',
                    reset: 'إعادة تعيين',
                },
                resources: {
                    Product: {
                        properties: {
                            name: 'اسم المنتج',
                            image: 'صورة المنتج',
                            price: 'السعر',
                            stock: 'الكمية المتوفرة',
                            minOrderQty: 'الحد الأدنى للطلب',
                            maxOrderQty: 'الحد الأقصى للطلب',
                            categories: 'التصنيفات',
                            brand: 'العلامة التجارية',
                            local_id: 'المعرف الموحد',
                            metadata: 'بيانات إضافية',
                            _id: 'المعرف الرقمي',
                            createdAt: 'تاريخ الإضافة',
                            updatedAt: 'تاريخ التحديث',
                        }
                    },
                    Category: {
                        properties: {
                            name: 'اسم التصنيف',
                            slug: 'الرابط المخصص',
                            image: 'صورة القسم',
                            isActive: 'حالة القسم (نشط)',
                            _id: 'المعرف',
                            createdAt: 'تاريخ الإنشاء',
                        }
                    },
                    Brand: {
                        properties: {
                            name: 'اسم الماركة',
                            logo: 'الشعار',
                            description: 'الوصف',
                            _id: 'المعرف',
                            createdAt: 'تاريخ الإضافة',
                        }
                    },
                    Admin: {
                        properties: {
                            username: 'اسم المستخدم',
                            fullName: 'الاسم الكامل',
                            password: 'كلمة المرور',
                            createdAt: 'تاريخ الإنشاء',
                            updatedAt: 'آخر تحديث',
                            _id: 'المعرف',
                        }
                    },
                    User: {
                        properties: {
                            username: 'اسم المستخدم',
                            fullName: 'الاسم الكامل',
                            phoneNumber: 'رقم الهاتف',
                            isActive: 'حالة الحساب (نشط)',
                            password: 'كلمة المرور',
                            createdAt: 'تاريخ التسجيل',
                            updatedAt: 'آخر تحديث',
                            _id: 'المعرف',
                        }
                    },
                    Order: {
                        properties: {
                            customer: 'اسم العميل',
                            total: 'إجمالي الطلب',
                            status: 'حالة الطلب الحالية',
                            items: 'المنتجات المطلوبة',
                            createdAt: 'تاريخ الطلب',
                            updatedAt: 'تاريخ التحديث',
                            _id: 'رقم الطلب',
                        }
                    },
                    Setting: {
                        properties: {
                            key: 'المفتاح',
                            minOrderTotal: 'الحد الأدنى لقيمة الطلب (جنيه)',
                            createdAt: 'تاريخ الإنشاء',
                            updatedAt: 'آخر تحديث',
                        }
                    }
                }
            }
        }
    },
    rootPath: '/admin',
    assets: {
        styles: [
            'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap',
        ],
    },
};

const adminJS = new AdminJS(adminOptions);

// Custom Deep RTL & Cairo Font CSS Override
const advancedRtlCss = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
  
  body, html, * {
    font-family: 'Cairo', sans-serif !important;
    direction: rtl !important;
    text-align: right !important;
  }

  /* Sidebar flipped to the right */
  .adminjs_Sidebar {
    left: auto !important;
    right: 0 !important;
    border-left: 1px solid #e0e0e0 !important;
    border-right: none !important;
    width: 250px !important;
  }

  /* Main content pushed to the left because sidebar is on the right */
  .adminjs_Page {
    margin-left: 0 !important;
    margin-right: 250px !important;
  }

  /* Table text alignment */
  .adminjs_Table th, .adminjs_Table td {
    text-align: right !important;
  }

  /* Form Labels and Inputs */
  .adminjs_Label, label {
    text-align: right !important;
    width: 100% !important;
  }
  
  .adminjs_Input, input, select, textarea {
    text-align: right !important;
    direction: rtl !important;
  }

  /* Adjust icons in sidebar and buttons */
  .adminjs_Sidebar .adminjs_Icon, 
  .adminjs_Button .adminjs_Icon {
    margin-left: 12px !important;
    margin-right: 0 !important;
  }

  /* Login Page RTL Fixes */
  .adminjs_Box[data-css="login-box"] {
    direction: rtl !important;
    text-align: right !important;
  }

  /* Dashboard welcome message alignment */
  .adminjs_Box[data-css="dashboard-welcome"] {
    text-align: right !important;
  }

  /* Fixed for Buttons Layout */
  .adminjs_Button {
    flex-direction: row-reverse !important;
    justify-content: flex-start !important;
  }

  /* Grid Fix */
  .adminjs_Grid {
    direction: rtl !important;
  }

  /* Placeholder alignment */
  ::placeholder {
    text-align: right !important;
  }
`;

// Inject the CSS via base64 data script to ensure it loads in the browser
adminJS.options.assets.scripts = [
  'data:text/javascript;base64,' + Buffer.from(`
    (function() {
      const style = document.createElement('style');
      style.innerHTML = \`${advancedRtlCss}\`;
      document.head.appendChild(style);

      // Force refresh of some elements if necessary
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.lang = 'ar';

      // Render product/brand image paths as actual <img> tags in the dashboard
      // IMPORTANT: Do NOT modify React-managed text nodes (no textContent='') — it breaks React's virtual DOM.
      // Instead, hide text via CSS and overlay an <img> element.
      function renderProductImages() {
        document.querySelectorAll('td, section').forEach(el => {
          if (el.dataset.imgRendered) return;
          const text = el.textContent.trim();
          if ((text.startsWith('product_images/') || text.startsWith('brand_logos/')) && text.endsWith('.webp')) {
            el.dataset.imgRendered = '1';
            el.style.position = 'relative';
            // Hide original text by making it invisible but keeping the DOM node intact for React
            Array.from(el.childNodes).forEach(n => {
              if (n.nodeType === 3) { // text node
                const span = document.createElement('span');
                span.style.cssText = 'font-size:0;line-height:0;overflow:hidden;display:block;height:0;';
                span.textContent = n.textContent;
                n.replaceWith(span);
              }
            });
            const img = document.createElement('img');
            img.src = '/' + text;
            img.alt = 'صورة';
            img.style.cssText = 'width:60px;height:60px;object-fit:contain;border-radius:6px;background:#f9f9f9;';
            el.appendChild(img);
          }
        });
      }

      // Run periodically (avoid MutationObserver to reduce conflicts with React)
      setInterval(renderProductImages, 1000);
    })();
  `).toString('base64'),
];

// Set the theme font explicitly
adminJS.options.branding.theme = {
    font: "'Cairo', sans-serif",
    colors: {
        primary100: '#1c3faa',
    },
};

// Build authenticated router - admins must login to access dashboard
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(adminJS, {
    authenticate: async (email, password) => {
        const admin = await Admin.findOne({ username: email });
        if (admin && await bcrypt.compare(password, admin.password)) {
            return admin.toJSON();
        }
        return null;
    },
    cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'admin-cookie-secret-change-me',
}, null, {
    resave: false,
    saveUninitialized: false,
    secret: process.env.ADMIN_COOKIE_SECRET || 'admin-cookie-secret-change-me',
});

export { adminJS, adminRouter };
