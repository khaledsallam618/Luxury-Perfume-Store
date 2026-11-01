const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// استدعاء النماذج من مجلد models
const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// الإعدادات الوسيطة (Middlewares)
// ==========================================
app.use(cors());
app.use(express.json());

// تقديم ملفات الواجهة من المجلد الرئيسي
app.use(express.static(__dirname));

// ==========================================
// الاتصال بقاعدة البيانات (MongoDB)
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luxury_perfume';

mongoose.connect(MONGO_URI)
    .then(() => console.log(' Connected successfully to MongoDB'))
    .catch((err) => console.error(' MongoDB connection error:', err));

// قائمة الأسعار المرجعية لمنع التلاعب من المتصفح
const PRICE_CATALOG = {
    'VALENTINO': 534,
    'GENTLEMEN': 535,
    'THOMAS KOSMALA APRES LAMOUR ORIGINAL': 1210,
    'GIORGIO ARMANI': 579,
    'SAUVAGE PERFUME': 980,
    'One Million Perfume': 400,
    'Ambre Noir': 690,
    'Coco Chanel': 1085,
    'BLEU DE CHANEL': 815,
    'CREED AVENTUS': 1350,
    'BACCARAT ROUGE 540': 1250,
    'TOM FORD OMBRÉ LEATHER': 740,
    'DIOR HOMME INTENSE': 684,
    'VERSACE EROS': 360,
    'OUD ROYAL PERFUME': 850,
    'JEAN PAUL GAULTIER PERFUME': 400,
    'YVES SAINT LAURENT PERFUME': 448,
    'PARFUMS DE MARLY LAYTON': 940,
    'KILIAN ANGELS SHARE': 890,
    'XERJOFF ERBA PURA': 790,
    'CHANEL ALLURE HOMME SPORT':620,
    'ROJA PARFUMS ELYSIUM':1150,
    'LE LABO SANTAL 33':990,
    'INITIO OUD FOR GREATNESS':1280,
    'NISHANE HACIVAT':860,
    'AMOUAGE INTERLUDE MAN':1180,
    'REPLICA JAZZ CLUB':540,
    'TOM FORD TOBACCO VANILLE':1120,
    'CREED SILVER MOUNTAIN WATER':1524,
    'BYREDO GYPSY WATER':900,
};

// ==========================================
// مسارات المصادقة والمستخدمين (Auth Routes)
// ==========================================

// تسجيل مستخدم جديد
// تثبيت المكتبة: npm install stripe
// الكود الآمن بعد قراءة المفتاح من ملف .env
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;

        // تجهيز المنتجات لـ Stripe بناءً على محتويات السلة
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'ils', // أو أي عملة أخرى
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // المبلغ بالـ Agorot / سنت
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'https://yourdomain.com/success.html',
            cancel_url: 'https://yourdomain.com/cart.html',
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// مسار تسجيل مستخدم جديد (Register Route)
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور).'
            });
        }

        // التحقق من عدم وجود حساب مسبق بنفس البريد
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'هذا البريد الإلكتروني مسجل بالفعل.'
            });
        }

        // إنشاء المستخدم وحفظه في MongoDB
        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            password // ملاحظة: يفضل لاحقاً تشفيرها باستخدام bcrypt
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح!',
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر أثناء إنشاء الحساب.'
        });
    }
});

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
        }

        const user = await User.findOne({ email: email.toLowerCase(), password });
        if (!user) {
            return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
        }

        return res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح!',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الدخول.' });
    }
});

// ==========================================
// مسارات المنتجات (Product Routes)
// ==========================================

// جلب جميع العطور المتاحة
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({ inStock: true });
        return res.json({ success: true, products });
    } catch (error) {
        console.error('Fetch products error:', error);
        return res.status(500).json({ success: false, message: 'تعذر جلب قائمة المنتجات.' });
    }
});

// ==========================================
// مسار الدفع والطلبات (Checkout Route)
// ==========================================

app.post('/api/checkout', async (req, res) => {
    try {
        const { customerName, customerAddress, items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'سلة التسوق فارغة!' });
        }

        if (!customerName || !customerAddress) {
            return res.status(400).json({ success: false, error: 'يرجى ملء جميع بيانات التوصيل والاسم.' });
        }

        let calculatedTotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const serverPrice = PRICE_CATALOG[item.name];
            const actualPrice = serverPrice !== undefined ? serverPrice : Number(item.price);
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

            calculatedTotal += actualPrice * quantity;

            verifiedItems.push({
                name: item.name,
                price: actualPrice,
                quantity: quantity
            });
        }

        const newOrder = new Order({
            customerName,
            customerAddress,
            items: verifiedItems,
            totalAmount: calculatedTotal
        });

        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: 'تم تسجيل الطلب وتأكيد الدفع بنجاح.',
            orderId: newOrder._id,
            total: calculatedTotal
        });

    } catch (error) {
        console.error('Checkout processing error:', error);
        return res.status(500).json({ success: false, error: 'حدث خطأ داخلي أثناء معالجة الطلب.' });
    }
});

// توجيه المسارات غير المعرفة للصفحة الرئيسية (متوافق مع Express 5)
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// تشغيل السيرفر
// ==========================================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
});