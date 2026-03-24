/**
 * Francine E-Commerce — Frontend Logic
 * Connected to backend API
 */

const API_BASE = "https://fran-bac.onrender.com";
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_ORDER = `${API_BASE}/api/order`;
const API_AUTH = `${API_BASE}/api/auth`;

// ——— Auth State ———
function getAuth() {
    try {
        const data = localStorage.getItem("francine_auth");
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function setAuth(token, user) {
    localStorage.setItem("francine_auth", JSON.stringify({ token, user }));
    updateNavAuth();
}

function clearAuth() {
    localStorage.removeItem("francine_auth");
    updateNavAuth();
}

function updateAdminShopUI() {
    const isAdmin = getAuth()?.user?.role === "Admin";
    const addProductBtn = document.getElementById("addProductBtn");
    if (addProductBtn) addProductBtn.style.display = isAdmin ? "block" : "none";
}

function getAuthToken() {
    const auth = getAuth();
    return auth?.token || null;
}

function updateNavAuth() {
    const auth = getAuth();
    const navAuth = document.getElementById("navAuth");
    const navUser = document.getElementById("navUser");
    const userNameDisplay = document.getElementById("userNameDisplay");
    if (auth?.user) {
        if (navAuth) navAuth.style.display = "none";
        if (navUser) {
            navUser.style.display = "flex";
            navUser.style.alignItems = "center";
        }
        if (userNameDisplay) userNameDisplay.textContent = `Hi, ${auth.user.name}`;
    } else {
        if (navAuth) navAuth.style.display = "flex";
        if (navUser) navUser.style.display = "none";
    }
    updateAdminShopUI();
}

// Fallback products when API is unavailable — Modern tech products
const FALLBACK_PRODUCTS = [
    { _id: "1", name: "Neural AI Earbuds Pro", price: 299.99, image: null, icon: "bi-earbuds" },
    { _id: "2", name: "Quantum LED Smart Watch", price: 449.00, image: null, icon: "bi-smartwatch" },
    { _id: "3", name: "AR Glasses XR-2000", price: 799.00, image: null, icon: "bi-glasses" },
    { _id: "4", name: "Portable Solar Power Bank 30W", price: 89.99, image: null, icon: "bi-battery-charging" },
    { _id: "5", name: "4K Webcam with AI Background", price: 159.00, image: null, icon: "bi-camera-video" },
    { _id: "6", name: "Mechanical Keyboard RGB", price: 129.00, image: null, icon: "bi-keyboard" },
    { _id: "7", name: "Wireless Noise-Canceling Headphones", price: 349.00, image: null, icon: "bi-headphones" },
    { _id: "8", name: "Smart Home Hub Pro", price: 199.00, image: null, icon: "bi-houses" },
    { _id: "9", name: "USB-C 100W Laptop Dock", price: 179.00, image: null, icon: "bi-hdd-stack" },
    { _id: "10", name: "Portable SSD 2TB", price: 249.00, image: null, icon: "bi-device-ssd" },
    { _id: "11", name: "Ergonomic Vertical Mouse", price: 79.99, image: null, icon: "bi-mouse" },
    { _id: "12", name: "E-Ink Tablet 10.3\"", price: 399.00, image: null, icon: "bi-tablet" },
    { _id: "13", name: "Wireless Charging Pad 3-in-1", price: 69.99, image: null, icon: "bi-battery-full" },
    { _id: "14", name: "Streaming Microphone Pro", price: 149.00, image: null, icon: "bi-mic" },
    { _id: "15", name: "VR Headset Lightweight", price: 499.00, image: null, icon: "bi-display" },
    { _id: "16", name: "Smart Ring Health Tracker", price: 279.00, image: null, icon: "bi-circle" },
    { _id: "17", name: "Ultrawide Monitor 34\" Curved", price: 599.00, image: null, icon: "bi-display" },
    { _id: "18", name: "Desk Lamp with Wireless Charge", price: 89.00, image: null, icon: "bi-lamp" },
    { _id: "19", name: "Portable Projector 1080p", price: 329.00, image: null, icon: "bi-projector" },
    { _id: "20", name: "Fitness Tracker Band", price: 119.00, image: null, icon: "bi-activity" },
];

let cart = JSON.parse(localStorage.getItem("francine_cart")) || [];
let productsCache = [];
let revealObserver = null;

function setButtonLoading(button, isLoading, loadingText = "Please wait...") {
    if (!button) return;
    if (isLoading) {
        if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${escapeHtml(loadingText)}`;
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
            delete button.dataset.originalHtml;
        }
    }
}

function setGlobalLoading(message = "Loading...") {
    let overlay = document.getElementById("globalLoadingOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "globalLoadingOverlay";
        overlay.className = "global-loading-overlay";
        overlay.innerHTML = `
            <div class="global-loading-content">
                <div class="spinner-border text-light" role="status" aria-hidden="true"></div>
                <p class="global-loading-text mb-0"></p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    const text = overlay.querySelector(".global-loading-text");
    if (text) text.textContent = message;
    overlay.classList.add("show");
}

function clearGlobalLoading() {
    const overlay = document.getElementById("globalLoadingOverlay");
    if (overlay) overlay.classList.remove("show");
}

function observeRevealElements(root = document) {
    if (!revealObserver) return;
    root.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

function normalizeImageUrl(imagePath) {
    if (!imagePath) return "";
    const value = String(imagePath).trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
    if (value.startsWith("/")) return `${API_BASE}${value}`;
    return `${API_BASE}/${value}`;
}

// ——— Product Loading ———
async function loadProducts() {
    const grid = document.getElementById("productGrid");
    let products = [];

    try {
        const res = await fetch(API_PRODUCTS);
        if (res.ok) {
            products = await res.json();
        } else {
            throw new Error("API not available");
        }
    } catch {
        products = FALLBACK_PRODUCTS;
    }

    products = products.map((p) => ({
        ...p,
        _id: (p._id || p.id || "").toString(),
        image: normalizeImageUrl(p.imageUrl || p.image),
        price: Number(p.price) || 0,
        description: p.description || "",
    }));
    productsCache = products;

    const isAdmin = getAuth()?.user?.role === "Admin";

    grid.innerHTML = products
        .map(
            (p, idx) => {
                const imgHtml = p.image
                    ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-image">`
                    : `<div class="product-placeholder"><i class="bi ${p.icon || "bi-cpu"}"></i></div>`;
                const actionsHtml = isAdmin
                    ? `
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-sm btn-outline-maroon flex-grow-1 btn-edit-in-shop" data-product-id="${escapeHtml(p._id)}"><i class="bi bi-pencil me-1"></i> Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete-in-shop" data-product-id="${escapeHtml(p._id)}" data-product-name="${escapeHtml(p.name)}"><i class="bi bi-trash"></i></button>
                    </div>
                `
                    : `
                    <button class="btn-add-cart w-100" data-product-id="${escapeHtml(p._id)}" data-product-name="${escapeHtml(p.name)}" data-product-price="${p.price}" data-product-image="${escapeHtml(p.image || "")}">
                        <i class="bi bi-bag-plus me-1"></i> Add to Cart
                    </button>
                `;
                return `
        <div class="col-sm-6 col-lg-4 reveal reveal-delay" style="--reveal-delay:${Math.min(idx * 70, 420)}ms;">
            <div class="product-card card">
                <div class="product-image-wrap">
                    ${imgHtml}
                </div>
                <div class="card-body">
                    <h5 class="product-name">${escapeHtml(p.name)}</h5>
                    <p class="product-price mb-3">₱${(p.price || 0).toFixed(2)}</p>
                    ${actionsHtml}
                </div>
            </div>
        </div>
    `;
            }
        )
        .join("");
    observeRevealElements(grid);

    if (isAdmin) {
        grid.querySelectorAll(".btn-edit-in-shop").forEach((btn) => {
            btn.addEventListener("click", () => {
                const p = productsCache.find((x) => String(x._id) === btn.dataset.productId);
                if (p) openEditProductModal(p);
            });
        });
        grid.querySelectorAll(".btn-delete-in-shop").forEach((btn) => {
            btn.addEventListener("click", () => deleteAdminProduct(btn.dataset.productId, btn.dataset.productName));
        });
    } else {
        grid.querySelectorAll(".btn-add-cart").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!getAuth()?.user) {
                    showToast("Sign in first so you can purchase a product");
                    bootstrap.Modal.getOrCreateInstance(document.getElementById("loginModal"))?.show();
                    return;
                }
                const id = btn.dataset.productId;
                const name = btn.dataset.productName;
                const price = parseFloat(btn.dataset.productPrice);
                const image = btn.dataset.productImage || "";
                addToCart(id, name, price, image);
            });
        });
    }
}

function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

// ——— Cart Logic ———
function addToCart(id, name, price, image) {
    const auth = getAuth();
    if (!auth?.user) {
        showToast("Sign in first so you can purchase a product");
        bootstrap.Modal.getOrCreateInstance(document.getElementById("loginModal"))?.show();
        return;
    }
    if (auth.user.role === "Admin") {
        showToast("Admins cannot add products to cart");
        return;
    }

    const existing = cart.find((i) => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1, image: normalizeImageUrl(image || "") });
    }
    saveCart();
    renderCart();
    updateCartCount();
    showToast(`${name} added to cart`);
}

function removeFromCart(id) {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
    updateCartCount();
}

function saveCart() {
    localStorage.setItem("francine_cart", JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = count;
}

function renderCart() {
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="bi bi-bag display-4 d-block mb-2 text-maroon"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        if (totalEl) totalEl.textContent = "₱0.00";
        return;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    container.innerHTML = cart
        .map(
            (item) => {
                const imgHtml = item.image
                    ? `<img src="${escapeHtml(item.image)}" alt="" class="cart-item-img">`
                    : `<div class="product-placeholder cart-item-img"><i class="bi bi-gem text-maroon"></i></div>`;
                return `
        <div class="cart-item">
            <div class="cart-item-img-wrap">${imgHtml}</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">₱${item.price.toFixed(2)} × ${item.qty}</div>
            </div>
            <button class="cart-item-remove btn-remove-cart" data-cart-id="${escapeHtml(item.id)}" title="Remove">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    `;
            }
        )
        .join("");

    container.querySelectorAll(".btn-remove-cart").forEach((btn) => {
        btn.addEventListener("click", () => removeFromCart(btn.dataset.cartId));
    });

    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
}

// ——— Toast ———
function showToast(message) {
    const existing = document.querySelector(".toast-container");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.className = "toast-container position-fixed bottom-0 end-0 p-3";
    div.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header toast-custom">
                <strong class="me-auto text-maroon">Francine</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body" style="background:var(--gray-800);color:var(--white);">
                ${escapeHtml(message)}
            </div>
        </div>
    `;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3000);
}

// ——— Contact Form ———
document.getElementById("contactForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Thanks for reaching out! We'll get back to you soon.");
    e.target.reset();
});

// ——— Newsletter ———
document.querySelector(".newsletter-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input[type=email]");
    if (input?.value) {
        showToast("Thanks for subscribing!");
        input.value = "";
    }
});

// ——— Checkout ———
function openCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

async function submitCheckout(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector("#checkoutName")?.value?.trim();
    const email = form.querySelector("#checkoutEmail")?.value?.trim();
    const phone = form.querySelector("#checkoutPhone")?.value?.trim();
    const address = form.querySelector("#checkoutAddress")?.value?.trim();

    if (!name) {
        showToast("Please enter your name");
        return;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const items = cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));

    try {
        const res = await fetch(`${API_ORDER}/guestCheckout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, address, total, items }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.status === "success") {
            cart = [];
            saveCart();
            renderCart();
            updateCartCount();
            bootstrap.Modal.getInstance(document.getElementById("checkoutModal"))?.hide();
            form.reset();
            showToast("Order placed successfully! Thank you for your purchase.");
        } else {
            showToast(data.error || "Checkout failed. Please try again.");
        }
    } catch (err) {
        showToast("Unable to connect. Make sure the backend is running.");
    }
}

document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Your cart is empty");
        return;
    }
    openCheckoutModal();
});

document.getElementById("checkoutForm")?.addEventListener("submit", submitCheckout);

// ——— Auth: Login ———
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, "Logging in...");
    const email = document.getElementById("loginEmail")?.value?.trim();
    const password = document.getElementById("loginPassword")?.value;

    try {
        const res = await fetch(`${API_AUTH}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.token) {
            setAuth(data.token, data.user);
            bootstrap.Modal.getInstance(document.getElementById("loginModal"))?.hide();
            e.target.reset();
            loadProducts();
            if (data.user.role === "Admin") {
                showToast(`Welcome, ${data.user.name}`);
                return;
            }
            showToast(`Welcome back, ${data.user.name}!`);
        } else {
            showToast(data.message || "Login failed");
        }
    } catch (err) {
        showToast("Unable to connect. Open http://localhost:5000 with backend running.");
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// ——— Auth: Register (Customer only) ———
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("registerName")?.value?.trim();
    const email = document.getElementById("registerEmail")?.value?.trim();
    const password = document.getElementById("registerPassword")?.value;
    const body = { name, email, password };

    try {
        const res = await fetch(`${API_AUTH}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.token) {
            setAuth(data.token, data.user);
            bootstrap.Modal.getInstance(document.getElementById("registerModal"))?.hide();
            e.target.reset();
            showToast(`Account created! Welcome, ${data.user.name}`);
        } else {
            showToast(data.message || "Registration failed");
        }
    } catch (err) {
        showToast("Unable to connect. Open http://localhost:5000 with backend running.");
    }
});

// ——— Auth: Logout ———
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    setGlobalLoading("Logging out...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    clearAuth();
    updateAdminShopUI();
    loadProducts();
    renderCart();
    updateCartCount();
    clearGlobalLoading();
    showToast("Logged out");
});

// ——— Admin: Add Product button ———
document.getElementById("addProductBtn")?.addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("addProductModal")).show();
});

// ——— Admin: Product CRUD (in shop) ———
document.getElementById("addProductForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();
    formData.append("name", form.name.value.trim());
    formData.append("description", form.description.value.trim());
    formData.append("price", form.price.value);
    if (form.imageUrl?.value?.trim()) formData.append("imageUrl", form.imageUrl.value.trim());
    if (form.image.files[0]) formData.append("image", form.image.files[0]);

    const token = getAuthToken();
    if (!token) { showToast("Session expired. Please login again."); return; }

    try {
        const res = await fetch(API_PRODUCTS, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            form.reset();
            bootstrap.Modal.getInstance(document.getElementById("addProductModal"))?.hide();
            loadProducts();
            showToast("Product added!");
        } else {
            if (res.status === 401) {
                clearAuth();
                showToast("Admin session expired. Please log in again.");
            } else {
                showToast(data.message || "Failed to add product");
            }
        }
    } catch (err) { showToast("Unable to connect"); }
});

function openEditProductModal(product) {
    document.getElementById("editProductId").value = product._id;
    document.getElementById("editProductName").value = product.name || "";
    document.getElementById("editProductDescription").value = product.description || "";
    document.getElementById("editProductPrice").value = product.price ?? "";
    document.getElementById("editProductImage").value = "";
    document.getElementById("editProductImageUrl").value = product.image || "";
    new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

document.getElementById("editProductForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editProductId").value;
    const formData = new FormData();
    formData.append("name", document.getElementById("editProductName").value.trim());
    formData.append("description", document.getElementById("editProductDescription").value.trim());
    formData.append("price", document.getElementById("editProductPrice").value);
    const imageUrlInput = document.getElementById("editProductImageUrl");
    if (imageUrlInput?.value?.trim()) formData.append("imageUrl", imageUrlInput.value.trim());
    const fileInput = document.getElementById("editProductImage");
    if (fileInput.files[0]) formData.append("image", fileInput.files[0]);

    const token = getAuthToken();
    if (!token) { showToast("Session expired. Please login again."); return; }

    try {
        const res = await fetch(`${API_PRODUCTS}/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("editProductModal"))?.hide();
            loadProducts();
            showToast("Product updated!");
        } else {
            if (res.status === 401) {
                clearAuth();
                showToast("Admin session expired. Please log in again.");
            } else {
                showToast(data.message || "Failed to update product");
            }
        }
    } catch (err) { showToast("Unable to connect"); }
});

async function deleteAdminProduct(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    const token = getAuthToken();
    if (!token) { showToast("Session expired. Please login again."); return; }

    try {
        const res = await fetch(`${API_PRODUCTS}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            loadProducts();
            showToast("Product deleted");
        } else {
            if (res.status === 401) {
                clearAuth();
                showToast("Admin session expired. Please log in again.");
            } else {
                showToast(data.message || "Failed to delete product");
            }
        }
    } catch (err) { showToast("Unable to connect"); }
}

// ——— Init ———
document.addEventListener("DOMContentLoaded", () => {
    updateNavAuth();
    loadProducts();
    renderCart();
    updateCartCount();

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
            const href = a.getAttribute("href");
            if (href === "#") return;
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: "smooth" });
        });
    });

    // Scroll reveal animation
    revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );
    observeRevealElements(document);
});
