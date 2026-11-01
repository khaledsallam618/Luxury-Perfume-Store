// تحديد رابط الـ API تلقائياً بناءً على بيئة التشغيل
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : '';

// =========================================================================
// 1. إدارة سلة المشتريات (Cart Management)
// =========================================================================

// جلب عناصر السلة بأمان من التخزين المحلي
const getCart = () => {
    try {
        return JSON.parse(localStorage.getItem('perfumeCart')) || [];
    } catch (e) {
        console.error("Error reading cart from localStorage:", e);
        return [];
    }
};

// حفظ عناصر السلة في التخزين المحلي
const saveCart = (cartArray) => {
    localStorage.setItem('perfumeCart', JSON.stringify(cartArray));
};

// حساب الإجمالي الكلي للأسعار
const calculateTotal = () => {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
};

// إضافة منتج جديد إلى السلة
const addToCart = (itemName, itemPrice) => {
    let cart = getCart();
    let existingItem = cart.find(item => item.name === itemName);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            name: itemName,
            price: Number(itemPrice),
            quantity: 1
        });
    }

    saveCart(cart);
    alert(`${itemName} has been added to your cart!`);
    updateGlobalCartCount();
};

// حذف عنصر معين من السلة بناءً على موقعه (Index)
const removeItem = (index) => {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    if (typeof loadCartDisplay === 'function') {
        loadCartDisplay();
    }
    updateGlobalCartCount();
};

// تفريغ السلة بالكامل
const clearCart = () => {
    let cart = getCart();
    if (cart.length === 0) return;

    if (confirm("Are you sure you want to empty the cart?")) {
        localStorage.removeItem('perfumeCart');
        if (typeof loadCartDisplay === 'function') {
            loadCartDisplay();
        }
        updateGlobalCartCount();
    }
};

// تحديث شارة عداد السلة في الـ Navbar
function updateGlobalCartCount() {
    try {
        const cart = getCart();
        const countElement = document.getElementById('cartCount');
        if (countElement) {
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            countElement.textContent = totalItems;
        }
    } catch (e) {
        console.error("Error updating cart counter:", e);
    }
}

// تشغيل تحديث عداد السلة فور تحميل هيكل الصفحة
window.addEventListener('DOMContentLoaded', updateGlobalCartCount);

// =========================================================================
// 2. إدارة التواصل (Contact Form)
// =========================================================================

function handleContactSubmit(event) {
    event.preventDefault();
    alert("תודה שפנית אלינו! ההודעה נשלחה בהצלחה.");
    event.target.reset();
}

// =========================================================================
// 3. إدارة تسجيل الحساب (Register)
// =========================================================================

async function handleRegister(event) {
    event.preventDefault();

    const fullNameInput = document.getElementById('fullName') ||
        document.querySelector('input[name="fullName"]') ||
        document.querySelector('input[name="name"]') ||
        document.querySelector('input[type="text"]');

    const emailInput = document.getElementById('email') ||
        document.querySelector('input[name="email"]') ||
        document.querySelector('input[type="email"]');

    const passwordInput = document.getElementById('password') ||
        document.querySelector('input[name="password"]') ||
        document.querySelector('input[type="password"]');

    if (!fullNameInput || !emailInput || !passwordInput) {
        alert("يرجى ملء جميع الحقول المطلوبة.");
        return;
    }

    const userData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
    };

    if (!userData.fullName || !userData.email || !userData.password) {
        alert("يرجى ملء جميع الحقول المطلوبة.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(data.message || "تم إنشاء الحساب بنجاح!");
            window.location.href = "login.html";
        } else {
            alert(data.message || "فشل إنشاء الحساب.");
        }
    } catch (err) {
        console.error("Register Error:", err);
        alert("Server network error, please try again.");
    }
}

// =========================================================================
// 4. إدارة تسجيل الدخول (Login)
// =========================================================================

async function handleLogin(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email') ||
        document.querySelector('input[type="email"]');

    const passwordInput = document.getElementById('password') ||
        document.querySelector('input[type="password"]');

    if (!emailInput || !passwordInput) {
        alert("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
        return;
    }

    const credentials = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(data.message || "تم تسجيل الدخول بنجاح!");
            localStorage.setItem('currentUser', JSON.stringify(data.user || { email: credentials.email }));
            window.location.href = "index.html";
        } else {
            alert(data.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("تعذر الاتصال بالسيرفر، يرجى المحاولة لاحقاً.");
    }
}