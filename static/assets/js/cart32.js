// cart-manager-fixed.js
let cartManager = null;

// تابع مقداردهی اولیه
function initCartManager() {
    cartManager = new CartManager();
}

// توابع سراسری
function addToCart(productId, quantity = 1) {
    if (!cartManager) {
        console.error('Cart manager not initialized');
        return;
    }

    // ایجاد یک المنت شبیه‌سازی شده برای دکمه
    const fakeButton = {
        dataset: {
            productId: productId,
            quantity: quantity
        },
        disabled: false,
        innerHTML: 'افزودن به سبد خرید'
    };

    const event = {
        target: fakeButton
    };

    cartManager.addToCart(event);
}

function removeFromCart(productId) {
    if (!cartManager) {
        console.error('Cart manager not initialized');
        return;
    }

    const fakeButton = {
        dataset: { productId },
        closest: () => fakeButton
    };

    const event = {
        target: fakeButton
    };

    cartManager.removeFromCart(event);
}

function incrementQuantity(productId) {
    if (!cartManager) {
        console.error('Cart manager not initialized');
        return;
    }

    // شبیه‌سازی ساختار DOM برای updateQuantity
    const fakeInput = { value: '1' };
    const fakeContainer = {
        querySelector: () => fakeInput
    };
    const fakeButton = {
        dataset: { productId },
        closest: () => fakeContainer
    };

    const event = {
        target: fakeButton
    };

    cartManager.updateQuantity(event, 1);
}

function decrementQuantity(productId) {
    if (!cartManager) {
        console.error('Cart manager not initialized');
        return;
    }

    const fakeInput = { value: '1' };
    const fakeContainer = {
        querySelector: () => fakeInput
    };
    const fakeButton = {
        dataset: { productId },
        closest: () => fakeContainer
    };

    const event = {
        target: fakeButton
    };

    cartManager.updateQuantity(event, -1);
}

function clearCart() {
    if (!cartManager) {
        console.error('Cart manager not initialized');
        return;
    }
    cartManager.clearCart();
}

// کلاس اصلی
class CartManager {
    constructor() {
        this.cartCounter = document.getElementById('cart-counter');
        this.cartItemsCount = document.getElementById('cart-items-count');
        this.cartItemsContainer = document.getElementById('cart-items-container');
        this.cartTotalPrice = document.getElementById('cart-total-price');
        this.baseUrl = window.location.origin;

        console.log('CartManager initialized', {
            cartCounter: !!this.cartCounter,
            cartItemsCount: !!this.cartItemsCount,
            cartItemsContainer: !!this.cartItemsContainer,
            cartTotalPrice: !!this.cartTotalPrice
        });

        this.init();
    }

    init() {
        // لود اولیه سبد خرید
        this.loadCartFromServer();

        // اضافه کردن event listener برای دکمه‌های موجود در صفحه
        this.addEventListeners();
    }

    addEventListeners() {
        // رویداد برای دکمه‌های add-to-cart
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                this.addToCart(e);
            }
        });

        // رویداد برای actions داخل سبد خرید
        if (this.cartItemsContainer) {
            this.cartItemsContainer.addEventListener('click', (e) => {
                if (e.target.closest('[data-action="remove"]')) {
                    this.removeFromCart(e);
                }
                if (e.target.closest('[data-action="increment"]')) {
                    this.updateQuantity(e, 1);
                }
                if (e.target.closest('[data-action="decrement"]')) {
                    this.updateQuantity(e, -1);
                }
            });
        }
    }

    async loadCartFromServer() {
        try {
            console.log('Loading cart from server...');
            const response = await fetch(`${this.baseUrl}/order/cart/summary/`);
            if (response.ok) {
                const data = await response.json();
                console.log('Cart data loaded:', data);
                if (data.success) {
                    this.updateCartUI(data);
                }
            } else {
                console.error('Failed to load cart:', response.status);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    async addToCart(event) {
        let button;
        let productId;
        let quantity = 1;

        // بررسی اینکه event از دکمه واقعی آمده یا شبیه‌سازی شده
        if (event.target.dataset && event.target.dataset.productId) {
            button = event.target;
            productId = button.dataset.productId;
            quantity = parseInt(button.dataset.quantity) || 1;
        } else {
            // اگر از تابع addToCart فراخوانی شده
            productId = event.target.dataset.productId;
            quantity = parseInt(event.target.dataset.quantity) || 1;
        }

        console.log('Adding to cart:', { productId, quantity });

        // اگر دکمه واقعی وجود دارد، وضعیت آن را تغییر بده
        if (button) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.innerHTML = 'در حال افزودن...';

            try {
                await this.performAddToCart(productId, quantity);
            } finally {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        } else {
            // اگر دکمه واقعی نیست، فقط عملیات را انجام بده
            await this.performAddToCart(productId, quantity);
        }
    }

    async performAddToCart(productId, quantity) {
        try {
            const response = await fetch(`${this.baseUrl}/order/cart/add/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });

            const data = await response.json();
            console.log('Add to cart response:', data);

            if (data.success) {
                this.updateCartUI(data);
                this.showSuccessMessage(data.message || 'محصول به سبد خرید اضافه شد');
            } else {
                this.showErrorMessage(data.error || 'خطا در افزودن محصول');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('خطا در ارتباط با سرور');
        }
    }

    async removeFromCart(event) {
        const button = event.target.closest('[data-action="remove"]') || event.target;
        const productId = button.dataset.productId;

        console.log('Removing from cart:', productId);

        try {
            const response = await fetch(`${this.baseUrl}/order/cart/remove/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    product_id: productId
                })
            });

            const data = await response.json();
            console.log('Remove from cart response:', data);

            if (data.success) {
                this.updateCartUI(data);
                this.showSuccessMessage(data.message || 'محصول از سبد خرید حذف شد');
            } else {
                this.showErrorMessage(data.error || 'خطا در حذف محصول');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('خطا در ارتباط با سرور');
        }
    }

    async updateQuantity(event, change) {
        const button = event.target.closest('[data-action="increment"], [data-action="decrement"]') || event.target;
        const productId = button.dataset.productId;

        // پیدا کردن مقدار فعلی
        let currentQuantity = 1;
        if (button.closest) {
            const container = button.closest('.quantity-container');
            if (container) {
                const input = container.querySelector('input');
                if (input) {
                    currentQuantity = parseInt(input.value) || 1;
                }
            }
        }

        const newQuantity = currentQuantity + change;

        if (newQuantity < 1) return;

        console.log('Updating quantity:', { productId, newQuantity });

        try {
            const response = await fetch(`${this.baseUrl}/order/cart/update/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: newQuantity
                })
            });

            const data = await response.json();
            console.log('Update quantity response:', data);

            if (data.success) {
                this.updateCartUI(data);
            } else {
                this.showErrorMessage(data.error || 'خطا در به‌روزرسانی تعداد');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('خطا در ارتباط با سرور');
        }
    }

    updateCartUI(data) {
        const cartCount = data.cart_count || 0;
        console.log('Updating UI with cart count:', cartCount);

        // به‌روزرسانی شمارنده
        if (this.cartCounter) {
            this.cartCounter.textContent = cartCount;
            this.animateCounter();
        }

        if (this.cartItemsCount) {
            this.cartItemsCount.textContent = cartCount;
        }

        // به‌روزرسانی لیست محصولات
        if (this.cartItemsContainer) {
            this.renderCartItems(data.items || []);
        }

        // به‌روزرسانی قیمت کل
        if (this.cartTotalPrice) {
            this.cartTotalPrice.textContent = this.formatPrice(data.total_price || 0) + ' تومان';
        }
    }

    renderCartItems(items) {
        console.log('Rendering cart items:', items);

        if (items.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div style="width:300px;" class="text-center py-8 text-gray-500">
                    سبد خرید شما خالی است
                </div>
            `;
            return;
        }

        let html = '';
        items.forEach(item => {
            html += `
                <div style="width:300px;" class="flex gap-5 pb-5 border-b border-gray-100 last:border-b-0">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover">
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-gray-800 line-clamp-2">${item.name}</h4>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-sm text-gray-600">${item.quantity} × ${this.formatPrice(item.final_price)}</span>
                            <span class="text-sm font-medium text-gray-800">${this.formatPrice(item.total_price)} تومان</span>
                        </div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="quantity-container flex h-8 max-w-24 items-center justify-between rounded-lg border border-gray-200 px-2 py-1">
                                <button class="cursor-pointer" type="button" data-action="decrement" data-product-id="${item.id}">
                                    <svg class="fill-red-500" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256">
                                        <path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z"></path>
                                    </svg>
                                </button>
                                <input value="${item.quantity}" disabled type="number" class="flex h-5 w-full grow select-none items-center justify-center bg-transparent text-center text-sm text-zinc-700 outline-none">
                                <button class="cursor-pointer" type="button" data-action="increment" data-product-id="${item.id}">
                                    <svg class="fill-green-500" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256">
                                        <path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"></path>
                                    </svg>
                                </button>
                            </div>
                            <button class="text-red-500 hover:text-red-700 transition-colors text-sm" data-action="remove" data-product-id="${item.id}">
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        this.cartItemsContainer.innerHTML = html;
    }

    async clearCart() {
        try {
            console.log('Clearing cart...');
            const response = await fetch(`${this.baseUrl}/order/cart/clear/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            });

            const data = await response.json();
            console.log('Clear cart response:', data);

            if (data.success) {
                this.updateCartUI(data);
                this.showSuccessMessage(data.message || 'سبد خرید پاک شد');
            } else {
                this.showErrorMessage(data.error || 'خطا در پاک کردن سبد خرید');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('خطا در ارتباط با سرور');
        }
    }

    animateCounter() {
        if (this.cartCounter) {
            this.cartCounter.classList.add('animate-ping');
            setTimeout(() => {
                this.cartCounter.classList.remove('animate-ping');
            }, 600);
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fa-IR').format(price);
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const existingMessage = document.querySelector('.cart-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `cart-message fixed top-4 left-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(messageEl)) {
                    document.body.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    getCookie(name) {
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
}

// مقداردهی اولیه
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing cart manager...');
    initCartManager();
});