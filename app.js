/**
 * Francine E-Commerce — Frontend Logic
 * Connected to backend API
 */

const API_BASE = (window.location.origin && window.location.origin !== "file://")
    ? window.location.origin
    : "http://localhost:5000";
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

function showAdminUI(show) {
    const adminSection = document.getElementById("adminSection");
    const aboutSection = document.getElementById("about");
    const contactSection = document.getElementById("contact");
    const navAbout = document.getElementById("navAbout");
    const navContact = document.getElementById("navContact");
    const footerCompany = document.getElementById("footerCompany");

    if (show) {
        if (adminSection) adminSection.style.display = "block";
        if (aboutSection) aboutSection.style.display = "none";
        if (contactSection) contactSection.style.display = "none";
        if (navAbout) navAbout.style.display = "none";
        if (navContact) navContact.style.display = "none";
        if (footerCompany) footerCompany.style.display = "none";
        loadAdminProducts();
    } else {
        if (adminSection) adminSection.style.display = "none";
        if (aboutSection) aboutSection.style.display = "block";
        if (contactSection) contactSection.style.display = "block";
        if (navAbout) navAbout.style.display = "block";
        if (navContact) navContact.style.display = "block";
        if (footerCompany) footerCompany.style.display = "block";
    }
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
        image: p.imageUrl || p.image,
        price: Number(p.price) || 0,
    }));

    grid.innerHTML = products
        .map(
            (p) => `
        <div class="col-sm-6 col-lg-4">
            <div class="product-card card">
                <div class="product-image-wrap">
                    ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-image">` : `<div class="product-placeholder"><i class="bi ${p.icon || "bi-cpu"}"></i></div>`}
                </div>
                <div class="card-body">
                    <h5 class="product-name">${escapeHtml(p.name)}</h5>
                    <p class="product-price mb-3">₱${(p.price || 0).toFixed(2)}</p>
                    <button class="btn-add-cart" data-product-id="${escapeHtml(p._id)}" data-product-name="${escapeHtml(p.name)}" data-product-price="${p.price}">
                        <i class="bi bi-bag-plus me-1"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `
        )
        .join("");

    // Attach add-to-cart handlers
    grid.querySelectorAll(".btn-add-cart").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.productId;
            const name = btn.dataset.productName;
            const price = parseFloat(btn.dataset.productPrice);
            addToCart(id, name, price);
        });
    });
}

function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

// ——— Cart Logic ———
function addToCart(id, name, price) {
    const existing = cart.find((i) => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
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
            (item) => `
        <div class="cart-item">
            <div class="product-placeholder cart-item-img">
                <i class="bi bi-gem text-maroon"></i>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">₱${item.price.toFixed(2)} × ${item.qty}</div>
            </div>
            <button class="cart-item-remove btn-remove-cart" data-cart-id="${escapeHtml(item.id)}" title="Remove">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    `
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
            if (data.user.role === "Admin") {
                showAdminUI(true);
                loadProducts();
                showToast(`Welcome, ${data.user.name}`);
                return;
            }
            showToast(`Welcome back, ${data.user.name}!`);
        } else {
            showToast(data.message || "Login failed");
        }
    } catch (err) {
        showToast("Unable to connect. Open http://localhost:5000 with backend running.");
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
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    clearAuth();
    showAdminUI(false);
    loadProducts();
    renderCart();
    updateCartCount();
    showToast("Logged out");
});

// ——— Admin: Product CRUD ———
let adminProductsCache = [];

async function loadAdminProducts() {
    const tbody = document.getElementById("adminProductTable");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">Loading...</td></tr>';

    try {
        const res = await fetch(API_PRODUCTS);
        const products = res.ok ? await res.json() : [];
        adminProductsCache = products;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">No products yet. Add one above.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map((p) => `
            <tr>
                <td>${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">` : '<span class="text-gray-500">—</span>'}</td>
                <td>${escapeHtml(p.name)}</td>
                <td class="text-gray-400" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.description)}</td>
                <td class="text-maroon fw-bold">₱${Number(p.price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-maroon me-1 btn-edit-product" data-id="${escapeHtml(p._id)}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-product" data-id="${escapeHtml(p._id)}" data-name="${escapeHtml(p.name)}"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".btn-edit-product").forEach((btn) => {
            btn.addEventListener("click", () => {
                const p = adminProductsCache.find((x) => String(x._id) === btn.dataset.id);
                if (p) openEditProductModal(p);
            });
        });
        tbody.querySelectorAll(".btn-delete-product").forEach((btn) => {
            btn.addEventListener("click", () => deleteAdminProduct(btn.dataset.id, btn.dataset.name));
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load products</td></tr>';
    }
}

document.getElementById("addProductForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();
    formData.append("name", form.name.value.trim());
    formData.append("description", form.description.value.trim());
    formData.append("price", form.price.value);
    if (form.image.files[0]) formData.append("image", form.image.files[0]);

    const token = getAuthToken();
    if (!token) { showToast("Session expired. Please login again."); return; }

    try {
        const res = await fetch(API_PRODUCTS, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            form.reset();
            loadAdminProducts();
            loadProducts();
            showToast("Product added!");
        } else {
            showToast(data.message || "Failed to add product");
        }
    } catch (err) { showToast("Unable to connect"); }
});

function openEditProductModal(product) {
    document.getElementById("editProductId").value = product._id;
    document.getElementById("editProductName").value = product.name || "";
    document.getElementById("editProductDescription").value = product.description || "";
    document.getElementById("editProductPrice").value = product.price ?? "";
    document.getElementById("editProductImage").value = "";
    new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

document.getElementById("editProductForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editProductId").value;
    const formData = new FormData();
    formData.append("name", document.getElementById("editProductName").value.trim());
    formData.append("description", document.getElementById("editProductDescription").value.trim());
    formData.append("price", document.getElementById("editProductPrice").value);
    const fileInput = document.getElementById("editProductImage");
    if (fileInput.files[0]) formData.append("image", fileInput.files[0]);

    const token = getAuthToken();
    if (!token) { showToast("Session expired. Please login again."); return; }

    try {
        const res = await fetch(`${API_PRODUCTS}/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("editProductModal"))?.hide();
            loadAdminProducts();
            loadProducts();
            showToast("Product updated!");
        } else {
            showToast(data.message || "Failed to update product");
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
            loadAdminProducts();
            loadProducts();
            showToast("Product deleted");
        } else {
            showToast(data.message || "Failed to delete product");
        }
    } catch (err) { showToast("Unable to connect"); }
}

// ——— Init ———
document.addEventListener("DOMContentLoaded", () => {
    const auth = getAuth();
    if (auth?.user?.role === "Admin") {
        showAdminUI(true);
    } else {
        showAdminUI(false);
    }
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
});
