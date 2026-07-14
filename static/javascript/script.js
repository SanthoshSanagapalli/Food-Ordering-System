const FOOD_ITEMS = [
  {
    id: "f1",
    name: "South Thali",
    category: "thali",
    veg: true,
    price: 189,
    tag: "Bestseller",
    icon: "thali.jpeg",
    desc: "Rice, sambar, rasam, two curries, curd & papad.",
  },
  {
    id: "f2",
    name: "Paneer Butter Masala Thali",
    category: "thali",
    veg: true,
    price: 219,
    tag: "Chef's pick",
    icon: "panner-butter-masala.jpeg",
    desc: "Paneer curry, dal, jeera rice, roti & salad.",
  },
  {
    id: "f3",
    name: "Masala Dosa",
    category: "dosa",
    veg: true,
    price: 99,
    tag: "Crispy",
    icon: "dosa.jpeg",
    desc: "Crisp rice crepe, spiced potato filling, chutneys.",
  },
  {
    id: "f4",
    name: "Rava Dosa",
    category: "dosa",
    veg: true,
    price: 109,
    tag: "Light",
    icon: "ravadosa.jpeg",
    desc: "Semolina crepe, onions, served with sambar.",
  },
  {
    id: "f5",
    name: "Chicken Biryani",
    category: "biryani",
    veg: false,
    price: 249,
    tag: "Spicy",
    icon: "biryani.jpeg",
    desc: "Slow-cooked basmati, tender chicken, raita.",
  },
  {
    id: "f6",
    name: "Veg Dum Biryani",
    category: "biryani",
    veg: true,
    price: 189,
    tag: "Aromatic",
    icon: "vegdum.jpeg",
    desc: "Layered rice, garden vegetables, fried onions.",
  },
  {
    id: "f7",
    name: "Samosa (2 pc)",
    category: "snacks",
    veg: true,
    price: 49,
    tag: "Snack",
    icon: "samosa.jpeg",
    desc: "Golden pastry, spiced potato & pea filling.",
  },
  {
    id: "f8",
    name: "Onion Pakora",
    category: "snacks",
    veg: true,
    price: 59,
    tag: "Crispy",
    icon: "onionpakoda.jpeg",
    desc: "Sliced onions in gram-flour batter, fried fresh.",
  },
  {
    id: "f9",
    name: "Gulab Jamun (2 pc)",
    category: "dessert",
    veg: true,
    price: 69,
    tag: "Sweet",
    icon: "gulabjamun.jpeg",
    desc: "Soft milk dumplings soaked in cardamom syrup.",
  },
  {
    id: "f10",
    name: "Rasmalai",
    category: "dessert",
    veg: true,
    price: 79,
    tag: "Chilled",
    icon: "rasmalai.jpeg",
    desc: "Paneer discs in saffron-scented reduced milk.",
  },
  {
    id: "f11",
    name: "Masala Chai",
    category: "beverage",
    veg: true,
    price: 29,
    tag: "Hot",
    icon: "masalachai.jpeg",
    desc: "Spiced tea brewed with milk and ginger.",
  },
  {
    id: "f12",
    name: "Sweet Lassi",
    category: "beverage",
    veg: true,
    price: 59,
    tag: "Chilled",
    icon: "sweet lassi.jpeg",
    desc: "Churned yogurt, sugar, a touch of cardamom.",
  },
];

const CATEGORIES = [
  { id: "thali", label: "Thalis", icon: "icon-thali.svg" },
  { id: "dosa", label: "Dosas", icon: "icon-dosa.svg" },
  { id: "biryani", label: "Biryani", icon: "icon-biryani.svg" },
  { id: "snacks", label: "Snacks", icon: "icon-snacks.svg" },
  { id: "dessert", label: "Desserts", icon: "icon-dessert.svg" },
  { id: "beverage", label: "Beverages", icon: "icon-beverage.svg" },
];

const IMG_BASE = document.body.dataset.imgBase || "../static/images/";
const CART_KEY = "tiffin_cart";
const THEME_KEY = "tiffin_theme";
const DELIVERY_FEE = 30;
const TAX_RATE = 0.05;

function updateThemeToggle(theme) {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  btn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
  btn.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggle(theme);
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      );
    });
  }
}

/* ---------- cart storage helpers ---------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function cartCount(cart) {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
function addToCart(id, qty = 1) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  if (cart[id] <= 0) delete cart[id];
  saveCart(cart);
}
function setCartQty(id, qty) {
  const cart = getCart();
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;
  saveCart(cart);
}
function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
}
function updateCartBadge() {
  const el = document.querySelector("[data-cart-count]");
  if (!el) return;
  const n = cartCount(getCart());
  el.textContent = n;
  el.style.display = n > 0 ? "flex" : "none";
}

/* ---------- toast ---------- */
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- nav toggle ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
  updateCartBadge();
}

/* ---------- menu page ---------- */
function renderCategoryStrip() {
  const strip = document.querySelector("[data-cat-strip]");
  if (!strip) return;
  strip.innerHTML =
    `<button type="button" class="chip active" data-cat="all">All</button>` +
    CATEGORIES.map(
      (c) =>
        `<button type="button" class="chip" data-cat="${c.id}">${c.label}</button>`,
    ).join("");
}

function foodCardHTML(item) {
  const cart = getCart();
  const qty = cart[item.id] || 0;
  return `
  <article class="food-card" data-id="${item.id}" data-cat="${item.category}" data-name="${item.name.toLowerCase()}">
    <div class="food-media">
      <span class="veg-dot ${item.veg ? "" : "nonveg"}" title="${item.veg ? "Vegetarian" : "Non-vegetarian"}"></span>
      <img src="${IMG_BASE}${item.icon}" alt="${item.name}" />
    </div>
    <div class="food-body">
      <div class="food-tags"><span class="tag">${item.tag}</span><span class="tag">${item.veg ? "Veg" : "Non-veg"}</span></div>
      <h4>${item.name}</h4>
      <p style="font-size:.85rem;margin-bottom:4px;">${item.desc}</p>
      <div class="food-foot">
        <span class="price">₹${item.price}</span>
        ${
          qty > 0
            ? `<div class="qty-control" data-qty-for="${item.id}">
               <button type="button" data-action="dec">−</button>
               <input type="text" value="${qty}" readonly />
               <button type="button" data-action="inc">+</button>
             </div>`
            : `<button type="button" class="add-btn" data-action="add">+ Add</button>`
        }
      </div>
    </div>
  </article>`;
}

function renderMenu() {
  const grid = document.querySelector("[data-food-grid]");
  if (!grid) return;

  const search = document.querySelector("[data-search-input]");
  const catStrip = document.querySelector("[data-cat-strip]");
  let activeCat = "all";
  let query = "";

  function draw() {
    const items = FOOD_ITEMS.filter(
      (i) =>
        (activeCat === "all" || i.category === activeCat) &&
        i.name.toLowerCase().includes(query),
    );
    grid.innerHTML = items.length
      ? items.map(foodCardHTML).join("")
      : `<div class="empty-state" style="grid-column:1/-1;">
           <img src="${IMG_BASE}empty-tiffin.svg" alt="" width="140" style="margin:0 auto 12px;" />
           <h3>No dishes match</h3><p>Try a different search or category.</p>
         </div>`;
  }

  if (catStrip) {
    catStrip.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      activeCat = btn.dataset.cat;
      catStrip
        .querySelectorAll(".chip")
        .forEach((c) =>
          c.classList.toggle("active", c.dataset.cat === activeCat),
        );
      draw();
    });
  }
  if (search) {
    search.addEventListener("input", (e) => {
      query = e.target.value.trim().toLowerCase();
      draw();
    });
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".food-card");
    if (!card) return;
    const id = card.dataset.id;
    const action = e.target.dataset.action;
    if (action === "add") {
      addToCart(id, 1);
      showToast("Added to cart");
    }
    if (action === "inc") {
      addToCart(id, 1);
    }
    if (action === "dec") {
      addToCart(id, -1);
    }
    draw();
  });

  draw();
}

/* ---------- cart page ---------- */
function renderCartPage() {
  const list = document.querySelector("[data-cart-list]");
  if (!list) return;
  const summary = {
    subtotal: document.querySelector("[data-sum-subtotal]"),
    delivery: document.querySelector("[data-sum-delivery]"),
    tax: document.querySelector("[data-sum-tax]"),
    total: document.querySelector("[data-sum-total]"),
  };
  const checkoutBtn = document.querySelector("[data-checkout-btn]");
  const emptyState = document.querySelector("[data-cart-empty]");
  const layout = document.querySelector("[data-cart-layout]");

  function draw() {
    const cart = getCart();
    const entries = Object.entries(cart).filter(([, q]) => q > 0);
    if (!entries.length) {
      if (layout) layout.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }
    if (layout) layout.style.display = "";
    if (emptyState) emptyState.style.display = "none";

    let subtotal = 0;
    list.innerHTML = entries
      .map(([id, qty]) => {
        const item = FOOD_ITEMS.find((f) => f.id === id);
        if (!item) return "";
        subtotal += item.price * qty;
        return `
        <div class="cart-row" data-id="${id}">
          <div class="thumb"><img src="${IMG_BASE}${item.icon}" alt="${item.name}" /></div>
          <div>
            <h4>${item.name}</h4>
            <span class="unit">₹${item.price} each</span>
          </div>
          <div class="qty-control">
            <button type="button" data-action="dec">−</button>
            <input type="text" value="${qty}" readonly />
            <button type="button" data-action="inc">+</button>
          </div>
          <span class="price">₹${item.price * qty}</span>
          <button type="button" class="remove-btn" data-action="remove" aria-label="Remove">✕</button>
        </div>`;
      })
      .join("");

    const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + delivery + tax;
    if (summary.subtotal) summary.subtotal.textContent = `₹${subtotal}`;
    if (summary.delivery) summary.delivery.textContent = `₹${delivery}`;
    if (summary.tax) summary.tax.textContent = `₹${tax}`;
    if (summary.total) summary.total.textContent = `₹${total}`;
    if (checkoutBtn) checkoutBtn.toggleAttribute("disabled", subtotal === 0);
  }

  list.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-row");
    if (!row) return;
    const id = row.dataset.id;
    const action = e.target.dataset.action;
    const cart = getCart();
    if (action === "inc") setCartQty(id, (cart[id] || 0) + 1);
    if (action === "dec") setCartQty(id, (cart[id] || 0) - 1);
    if (action === "remove") removeFromCart(id);
    draw();
  });

  draw();
}

/* ---------- checkout page ---------- */
function renderCheckoutSummary() {
  const box = document.querySelector("[data-checkout-summary]");
  if (!box) return;
  const cart = getCart();
  const entries = Object.entries(cart).filter(([, q]) => q > 0);
  let subtotal = 0;
  const rows = entries
    .map(([id, qty]) => {
      const item = FOOD_ITEMS.find((f) => f.id === id);
      if (!item) return "";
      subtotal += item.price * qty;
      return `<div class="summary-line"><span>${item.name} × ${qty}</span><b>₹${item.price * qty}</b></div>`;
    })
    .join("");
  const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + delivery + tax;
  box.innerHTML = `
    ${rows || `<p>Your cart is empty.</p>`}
    <div class="summary-line" style="margin-top:12px;"><span>Delivery fee</span><b>₹${delivery}</b></div>
    <div class="summary-line"><span>Taxes</span><b>₹${tax}</b></div>
    <div class="summary-total"><span>Total</span><span>₹${total}</span></div>
  `;

  const form = document.querySelector("[data-checkout-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!subtotal) {
        showToast("Your cart is empty");
        return;
      }
      localStorage.removeItem(CART_KEY);
      updateCartBadge();
      window.location.href = "orders.html?placed=1";
    });
  }
}

/* ---------- admin: manage food (localStorage CRUD demo) ---------- */
const ADMIN_FOOD_KEY = "tiffin_admin_food";
function getAdminFood() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_FOOD_KEY));
    if (stored) return stored;
  } catch (e) {
    /* fall through */
  }
  const seeded = FOOD_ITEMS.map((f) => ({ ...f, stock: true }));
  localStorage.setItem(ADMIN_FOOD_KEY, JSON.stringify(seeded));
  return seeded;
}
function saveAdminFood(items) {
  localStorage.setItem(ADMIN_FOOD_KEY, JSON.stringify(items));
}

function renderManageFood() {
  const tbody = document.querySelector("[data-food-table-body]");
  if (!tbody) return;
  const modalBackdrop = document.querySelector("[data-food-modal]");
  const form = document.querySelector("[data-food-form]");
  const modalTitle = document.querySelector("[data-modal-title]");
  let editingId = null;

  function draw() {
    const items = getAdminFood();
    tbody.innerHTML = items
      .map(
        (item) => `
      <tr data-id="${item.id}">
        <td>
          <div class="row-food">
            <div class="thumb"><img src="${IMG_BASE}${item.icon}" alt="" /></div>
            <div><strong>${item.name}</strong><br><span class="tag">${item.category}</span></div>
          </div>
        </td>
        <td>${item.veg ? "Veg" : "Non-veg"}</td>
        <td class="price">₹${item.price}</td>
        <td><span class="badge-stock ${item.stock ? "badge-in" : "badge-out"}">${item.stock ? "In stock" : "Out of stock"}</span></td>
        <td>
          <button type="button" class="icon-btn" data-action="edit" title="Edit">✎</button>
          <button type="button" class="icon-btn" data-action="delete" title="Delete">🗑</button>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  function openModal(item) {
    editingId = item ? item.id : null;
    modalTitle.textContent = item ? "Edit dish" : "Add new dish";
    form.name.value = item ? item.name : "";
    form.category.value = item ? item.category : "thali";
    form.price.value = item ? item.price : "";
    form.veg.value = item ? String(item.veg) : "true";
    form.stock.checked = item ? item.stock : true;
    form.desc.value = item ? item.desc : "";
    modalBackdrop.classList.add("open");
  }
  function closeModal() {
    modalBackdrop.classList.remove("open");
    editingId = null;
  }

  document
    .querySelectorAll("[data-open-add]")
    .forEach((btn) => btn.addEventListener("click", () => openModal(null)));
  document
    .querySelectorAll("[data-modal-close]")
    .forEach((btn) => btn.addEventListener("click", closeModal));
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  tbody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
    const items = getAdminFood();
    if (e.target.dataset.action === "edit")
      openModal(items.find((i) => i.id === id));
    if (e.target.dataset.action === "delete") {
      saveAdminFood(items.filter((i) => i.id !== id));
      draw();
      showToast("Dish removed");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const items = getAdminFood();
    const payload = {
      name: form.name.value.trim(),
      category: form.category.value,
      price: Number(form.price.value) || 0,
      veg: form.veg.value === "true",
      stock: form.stock.checked,
      desc: form.desc.value.trim(),
      icon: `icon-${form.category.value}.svg`,
      tag: form.category.value === "thali" ? "Meal" : "New",
    };
    if (editingId) {
      const idx = items.findIndex((i) => i.id === editingId);
      items[idx] = { ...items[idx], ...payload };
      showToast("Dish updated");
    } else {
      payload.id = "f" + Date.now();
      items.unshift(payload);
      showToast("Dish added");
    }
    saveAdminFood(items);
    closeModal();
    draw();
  });

  draw();
}

/* ---------- admin: dashboard demo stats ---------- */
function renderDashboard() {
  const el = document.querySelector("[data-dashboard]");
  if (!el) return;
  const items = getAdminFood();
  const outOfStock = items.filter((i) => !i.stock).length;
  const totalDishes = document.querySelector("[data-stat-dishes]");
  const totalOOS = document.querySelector("[data-stat-oos]");
  if (totalDishes) totalDishes.textContent = items.length;
  if (totalOOS) totalOOS.textContent = outOfStock;
}

/* ---------- simple form validation ---------- */
function initFormValidation() {
  document.querySelectorAll("form[data-validate]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      let ok = true;
      form.querySelectorAll("[required]").forEach((input) => {
        if (!input.value.trim()) {
          ok = false;
          input.style.borderColor = "var(--danger)";
        } else input.style.borderColor = "";
      });
      const pw = form.querySelector('input[name="password"]');
      const cpw = form.querySelector('input[name="confirm_password"]');
      if (pw && cpw && cpw.value && pw.value !== cpw.value) {
        ok = false;
        cpw.style.borderColor = "var(--danger)";
        showToast("Passwords do not match");
      }
      if (!ok) e.preventDefault();
    });
  });
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initTheme();
  renderCategoryStrip();
  renderMenu();
  renderCartPage();
  renderCheckoutSummary();
  renderManageFood();
  renderDashboard();
  initFormValidation();

  // orders.html: show "placed" confirmation toast
  if (window.location.search.includes("placed=1"))
    showToast("Order placed successfully");
});
