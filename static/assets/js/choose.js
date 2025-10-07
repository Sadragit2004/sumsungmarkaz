let selectedState = null;
let selectedCity = null;

// باز کردن مودال
function openLocationModal() {
    document.getElementById('locationModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadStates();
}

// بستن مودال
function closeLocationModal() {
    document.getElementById('locationModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    resetForm();
}

// بارگذاری استان‌ها
async function loadStates() {
    try {
        const stateSelect = document.getElementById('stateSelect');
        stateSelect.innerHTML = '<option value="">در حال بارگذاری استان‌ها...</option>';
        stateSelect.disabled = true;

        // استفاده از proxy متفاوت برای حل مشکل CORS
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const apiUrl = 'https://iran-locations-api.ir/api/v1/fa/states';

        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }

        const states = await response.json();

        // بررسی ساختار داده‌های برگشتی
        if (!Array.isArray(states)) {
            throw new Error('داده‌های دریافتی معتبر نیستند');
        }

        stateSelect.innerHTML = '<option value="">لطفا استان را انتخاب کنید</option>';
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.id;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        stateSelect.disabled = false;
        stateSelect.addEventListener('change', onStateChange);

    } catch (error) {
        console.error('خطا در بارگذاری استان‌ها:', error);
        stateSelect.innerHTML = '<option value="">خطا در بارگذاری استان‌ها</option>';
        stateSelect.disabled = false;

        // نمایش پیام خطا به کاربر
        setTimeout(() => {
            alert('خطا در بارگذاری لیست استان‌ها. لطفا دوباره تلاش کنید.');
        }, 500);
    }
}

// وقتی استان تغییر کرد
async function onStateChange(event) {
    const stateId = event.target.value;
    const citySelect = document.getElementById('citySelect');
    const saveBtn = document.getElementById('saveBtn');

    selectedState = stateId;
    selectedCity = null;
    saveBtn.disabled = true;

    // مخفی کردن موقعیت انتخاب شده قبلی
    const selectedLocation = document.getElementById('selectedLocation');
    if (selectedLocation) {
        selectedLocation.classList.add('hidden');
    }

    if (!stateId) {
        citySelect.innerHTML = '<option value="">ابتدا استان را انتخاب کنید</option>';
        citySelect.disabled = true;
        return;
    }

    try {
        citySelect.innerHTML = '<option value="">در حال بارگذاری شهرها...</option>';
        citySelect.disabled = true;

        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const apiUrl = `https://iran-locations-api.ir/api/v1/fa/cities?state_id=${stateId}`;

        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }

        const cities = await response.json();

        // بررسی ساختار داده‌های برگشتی
        if (!Array.isArray(cities)) {
            throw new Error('داده‌های دریافتی معتبر نیستند');
        }

        citySelect.innerHTML = '<option value="">لطفا شهر را انتخاب کنید</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });

        citySelect.disabled = false;
        citySelect.addEventListener('change', onCityChange);

    } catch (error) {
        console.error('خطا در بارگذاری شهرها:', error);
        citySelect.innerHTML = '<option value="">خطا در بارگذاری شهرها</option>';
        citySelect.disabled = false;

        // نمایش پیام خطا به کاربر
        setTimeout(() => {
            alert('خطا در بارگذاری لیست شهرها. لطفا دوباره تلاش کنید.');
        }, 500);
    }
}

// وقتی شهر تغییر کرد
function onCityChange(event) {
    selectedCity = event.target.value;
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = !selectedCity;
}

// ذخیره موقعیت
async function saveLocation() {
    if (!selectedState || !selectedCity) return;

    const stateSelect = document.getElementById('stateSelect');
    const citySelect = document.getElementById('citySelect');
    const saveBtn = document.getElementById('saveBtn');
    const saveBtnText = document.getElementById('saveBtnText');
    const saveBtnLoading = document.getElementById('saveBtnLoading');

    const stateName = stateSelect.options[stateSelect.selectedIndex].text;
    const cityName = citySelect.options[citySelect.selectedIndex].text;

    // نمایش حالت لودینگ
    saveBtnText.textContent = 'در حال ذخیره...';
    saveBtnLoading.classList.remove('hidden');
    saveBtn.disabled = true;

    try {
        // ارسال به سرور Django
        const response = await fetch('/order/save-location/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                state_id: selectedState,
                city_id: selectedCity,
                state_name: stateName,
                city_name: cityName
            })
        });

        // بررسی وضعیت پاسخ
        if (!response.ok) {
            throw new Error(`خطای سرور: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // نمایش موفقیت
            const selectedLocation = document.getElementById('selectedLocation');
            const selectedLocationText = document.getElementById('selectedLocationText');

            selectedLocationText.textContent = result.data.full_address;
            selectedLocation.classList.remove('hidden');

            // آپدیت نمایش موقعیت در هدر
            updateLocationDisplay(result.data.full_address);

            // بستن خودکار مودال بعد از 2 ثانیه
            setTimeout(() => {
                closeLocationModal();

                // نمایش پیام موفقیت
                showToast('موقعیت شما با موفقیت ذخیره شد', 'success');
            }, 2000);

        } else {
            // نمایش خطا
            showToast('خطا در ذخیره موقعیت: ' + result.error, 'error');
            resetSaveButton();
        }

    } catch (error) {
        console.error('خطا در ارسال به سرور:', error);
        showToast('خطا در ارتباط با سرور', 'error');
        resetSaveButton();
    }
}

// نمایش پیام toast
function showToast(message, type = 'info') {
    // ایجاد عنصر toast اگر وجود ندارد
    let toast = document.getElementById('locationToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'locationToast';
        toast.className = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-transform duration-300';
        document.body.appendChild(toast);
    }

    // تنظیم رنگ بر اساس نوع
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-transform duration-300 ${colors[type] || colors.info}`;
    toast.textContent = message;

    // نمایش toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // مخفی کردن toast بعد از 4 ثانیه
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 4000);
}

// دریافت CSRF Token
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// آپدیت نمایش موقعیت در صفحه
function updateLocationDisplay(fullAddress) {
    const locationDisplay = document.getElementById('userLocationDisplay');
    const locationText = document.getElementById('currentLocationText');

    if (locationDisplay && locationText) {
        locationText.textContent = fullAddress;
        locationDisplay.classList.remove('hidden');

        // اضافه کردن انیمیشن
        locationDisplay.classList.add('animate-pulse');
        setTimeout(() => {
            locationDisplay.classList.remove('animate-pulse');
        }, 1000);
    }
}

// بازنشانی دکمه ذخیره
function resetSaveButton() {
    const saveBtnText = document.getElementById('saveBtnText');
    const saveBtnLoading = document.getElementById('saveBtnLoading');

    saveBtnText.textContent = 'تایید موقعیت';
    saveBtnLoading.classList.add('hidden');
    document.getElementById('saveBtn').disabled = false;
}

// ریست فرم
function resetForm() {
    selectedState = null;
    selectedCity = null;

    const stateSelect = document.getElementById('stateSelect');
    const citySelect = document.getElementById('citySelect');

    if (stateSelect) stateSelect.selectedIndex = 0;
    if (citySelect) {
        citySelect.innerHTML = '<option value="">ابتدا استان را انتخاب کنید</option>';
        citySelect.disabled = true;
    }

    document.getElementById('saveBtn').disabled = true;

    const selectedLocation = document.getElementById('selectedLocation');
    if (selectedLocation) {
        selectedLocation.classList.add('hidden');
    }
}

// بستن مودال با کلیک خارج
document.getElementById('locationModal').addEventListener('click', function(e) {
    if (e.target.id === 'locationModal') {
        closeLocationModal();
    }
});

// بستن مودال با کلید ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !document.getElementById('locationModal').classList.contains('hidden')) {
        closeLocationModal();
    }
});

// لود موقعیت کاربر هنگام لود صفحه
document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن استایل برای toast
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); }
            to { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);

    loadUserLocation();
});

// دریافت موقعیت کاربر از سرور
async function loadUserLocation() {
    try {
        const response = await fetch('/order/get-location/');

        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            updateLocationDisplay(result.data.full_address);
        }
    } catch (error) {
        console.error('خطا در دریافت موقعیت:', error);
        // خطا را به صورت خاموش مدیریت می‌کنیم چون ممکن است کاربر موقعیتی ثبت نکرده باشد
    }
}

// تابع کمکی برای بررسی وضعیت آنلاین
function checkOnlineStatus() {
    if (!navigator.onLine) {
        showToast('اتصال اینترنت خود را بررسی کنید', 'error');
        return false;
    }
    return true;
}

// اضافه کردن event listener برای وضعیت آنلاین
window.addEventListener('online', () => {
    showToast('اتصال اینترنت برقرار شد', 'success');
});

window.addEventListener('offline', () => {
    showToast('اتصال اینترنت قطع شد', 'error');
});