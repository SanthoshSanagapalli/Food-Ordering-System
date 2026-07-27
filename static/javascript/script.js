let FOOD_ITEMS = [];

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

async function addToCart(id, qty = 1) {
  try {
    const foodId = Number(id.replace("f", ""));

    const response = await fetch("/api/cart/add", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        food_id: foodId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      const cart = getCart();

      cart[id] = (cart[id] || 0) + qty;

      if (cart[id] <= 0) delete cart[id];

      saveCart(cart);
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.log(error);
  }
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

async function loadFoodItems() {
  try {
    const response = await fetch("/api/menu");

    const data = await response.json();

    FOOD_ITEMS = data.map((food) => ({
      id: "f" + food.food_id,

      name: food.food_name,

      category: food.category,

      price: Number(food.price),

      desc: food.description,

      icon: food.image,

      veg: food.veg,

      tag: food.availability,
    }));
    console.log(data);

    renderMenu();
  } catch (error) {
    console.log("Error:", error);
  }
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

async function getDatabaseCart() {
  const response = await fetch("/api/cart");

  const data = await response.json();

  return data;
}

/* ---------- cart page ---------- */
async function renderCartPage() {
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

  async function draw() {
    const response = await fetch("/api/cart");

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    const items = await response.json();

    if (items.length === 0) {
      if (layout) layout.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (layout) layout.style.display = "";
    if (emptyState) emptyState.style.display = "none";

    let subtotal = 0;

    list.innerHTML = items
      .map((item) => {
        subtotal += item.price * item.quantity;

        return `
      <div class="cart-row" data-id="${item.food_id}">
        <div class="thumb">
          <img src="${IMG_BASE}${item.image}" alt="${item.food_name}" />
        </div>

        <div>
          <h4>${item.food_name}</h4>
          <span class="unit">₹${item.price} each</span>
        </div>

        <div class="qty-control">
          <button type="button" data-action="dec">−</button>
          <input type="text" value="${item.quantity}" readonly />
          <button type="button" data-action="inc">+</button>
        </div>

        <span class="price">
          ₹${item.price * item.quantity}
        </span>

        <button
          type="button"
          class="remove-btn"
          data-action="remove">
          ✕
        </button>
      </div>
      `;
      })
      .join("");

    const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + delivery + tax;

    summary.subtotal.textContent = `₹${subtotal}`;
    summary.delivery.textContent = `₹${delivery}`;
    summary.tax.textContent = `₹${tax}`;
    summary.total.textContent = `₹${total}`;

    checkoutBtn.toggleAttribute("disabled", subtotal === 0);
  }

  draw();
  draw();

  list.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const row = button.closest(".cart-row");
    const foodId = Number(row.dataset.id);

    // Increase quantity
    if (button.dataset.action === "inc") {
      await fetch("/api/cart/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          food_id: foodId,
          action: "increase",
        }),
      });

      draw();
    }

    // Decrease quantity
    if (button.dataset.action === "dec") {
      await fetch("/api/cart/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          food_id: foodId,
          action: "decrease",
        }),
      });

      draw();
    }

    // Remove item
    if (button.dataset.action === "remove") {
      await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          food_id: foodId,
        }),
      });

      draw();
    }
  });
}

/* ---------- checkout page ---------- */
async function renderCheckoutSummary() {
  const box = document.querySelector("[data-checkout-summary]");
  if (!box) return;
  const response = await fetch("/api/cart");

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  const items = await response.json();
  let subtotal = 0;
  const rows = items
    .map((item) => {
      subtotal += item.price * item.quantity;

      return `
      <div class="summary-line">
        <span>${item.food_name} × ${item.quantity}</span>
        <b>₹${item.price * item.quantity}</b>
      </div>
    `;
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
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!subtotal) {
        showToast("Your cart is empty");
        return;
      }

      const response = await fetch("/api/place-order", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        showToast("Order placed successfully!");
        window.location.href = "/orders";
      } else {
        showToast(result.message);
      }
    });
  }
}

const ADMIN_FOOD_KEY = "tiffin_admin_food";
let editingId = null;

const modalBackdrop = document.querySelector("[data-food-modal]");
const form = document.querySelector("[data-food-form]");
const modalTitle = document.querySelector("[data-modal-title]");
const tbody = document.querySelector("[data-food-table-body]");

function openModal(food = null) {
  editingId = food ? food.food_id : null;

  modalTitle.textContent = food ? "Edit Dish" : "Add New Dish";

  form.name.value = food ? food.food_name : "";
  form.category.value = food ? food.category : "";
  form.price.value = food ? food.price : "";
  form.veg.value = food ? (food.veg ? "true" : "false") : "true";

  form.stock.checked = food ? food.availability === "Available" : true;

  form.desc.value = food ? food.description : "";

  modalBackdrop.classList.add("open");
}

function closeModal() {
  modalBackdrop.classList.remove("open");

  editingId = null;

  form.reset();
}

function renderManageFood() {
  if (!modalBackdrop || !form || !document.querySelector("[data-open-add]")) {
    return;
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      food_name: form.name.value.trim(),
      category: form.category.value,
      description: form.desc.value.trim(),
      price: Number(form.price.value),
      image: null,
      availability: form.stock.checked ? "Available" : "Unavailable",
      veg: form.veg.value === "true" ? 1 : 0,
    };

    let url = "/api/admin/foods";
    let method = "POST";

    if (editingId !== null) {
      url = `/api/admin/foods/${editingId}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      showToast(
        editingId ? "Dish updated successfully" : "Dish added successfully",
      );

      closeModal();
      form.reset();
      renderFoods();
      editingId = null;
    } else {
      showToast(result.message);
    }
  });
}

/* ---------- admin: dashboard demo stats ---------- */
async function renderDashboard() {
  const el = document.querySelector("[data-dashboard]");
  if (!el) return;

  const response = await fetch("/api/admin/foods");
  const foods = await response.json();

  const outOfStock = foods.filter(
    (food) => food.availability === "Unavailable",
  ).length;

  const totalDishes = document.querySelector("[data-stat-dishes]");
  const totalOOS = document.querySelector("[data-stat-oos]");

  if (totalDishes) totalDishes.textContent = foods.length;
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

async function loadUserDetails() {
  const fullname = document.getElementById("fullname");
  if (!fullname) return;

  const response = await fetch("/api/user");

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  const user = await response.json();

  document.getElementById("fullname").value = user.full_name;
  document.getElementById("phone").value = user.phone;
  document.getElementById("address").value = user.address;
}

async function renderOrders() {
  const container = document.querySelector("[data-orders-list]");
  if (!container) return;

  const response = await fetch("/api/orders");

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  const orders = await response.json();

  if (orders.length === 0) {
    container.innerHTML = `
            <div class="order-card">
                <h3>No Orders Yet</h3>
                <p>Your placed orders will appear here.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const items = order.items
        .map((item) => `${item.quantity}× ${item.food_name}`)
        .join(", ");

      return `
            <div class="order-card">

                <div class="order-top">

                    <div class="order-id">
                        #TB-${order.order_id}
                        <small>${new Date(order.order_date).toLocaleString()}</small>
                    </div>

                    <span class="status-token ${getStatusClass(order.status)}">
    ${order.status}
</span>

                </div>

                <p class="order-items">
                    ${items} —
                    <strong>₹${order.total_amount}</strong>
                </p>

                <div class="order-track">
                         ${getOrderTrack(order.status)} </div>

            </div>
        `;
    })
    .join("");
}

function getOrderTrack(status) {
  let steps = ["Placed", "Preparing", "On the way", "Delivered"];

  let completed = 0;

  if (status === "Pending") {
    completed = 1;
  } else if (status === "Preparing") {
    completed = 2;
  } else if (status === "On the way") {
    completed = 3;
  } else if (status === "Delivered") {
    completed = 4;
  }

  return steps
    .map(
      (step, index) => `
        <div class="pt ${index < completed ? "done" : ""}">
            <div class="dot"></div>
            <span>${step}</span>
        </div>
    `,
    )
    .join("");
}

function getStatusClass(status) {
  if (status === "Pending") {
    return "status-pending";
  }

  if (status === "Preparing") {
    return "status-preparing";
  }

  if (status === "On the way") {
    return "status-otw";
  }

  if (status === "Delivered") {
    return "status-delivered";
  }

  if (status === "Cancelled") {
    return "status-cancelled";
  }

  return "status-pending";
}

async function renderAdminOrders() {
  const tbody = document.querySelector("[data-admin-orders-table]");
  if (!tbody) return;

  const response = await fetch("/api/admin/orders");

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }

  const orders = await response.json();

  if (orders.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No orders found.
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const items = order.items
        .map((item) => `${item.food_name} × ${item.quantity}`)
        .join(", ");

      return `
            <tr>

                <td>#TB-${order.order_id}</td>

                <td>${order.customer}</td>

                <td>${items}</td>

                <td>₹${order.total_amount}</td>

                <td>
                    <span class="status-token ${getStatusClass(order.status)}">
                        ${order.status}
                    </span>
                </td>

                <td>
                      <select
                          class="order-status-select"
                          data-order-id="${order.order_id}">

                          <option value="Pending"
                              ${order.status === "Pending" ? "selected" : ""}>
                              Pending
                          </option>

                          <option value="Preparing"
                              ${order.status === "Preparing" ? "selected" : ""}>
                              Preparing
                          </option>

                          <option value="Out for Delivery"
                              ${order.status === "Out for Delivery" ? "selected" : ""}>
                              Out for Delivery
                          </option>

                          <option value="Delivered"
                              ${order.status === "Delivered" ? "selected" : ""}>
                              Delivered
                          </option>

                          <option value="Cancelled"
                              ${order.status === "Cancelled" ? "selected" : ""}>
                              Cancelled
                          </option>

                      </select>
                    </td>

            </tr>
        `;
    })
    .join("");
  tbody.querySelectorAll(".order-status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const orderId = select.dataset.orderId;
      const status = select.value;

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Order status updated successfully");
        renderAdminOrders();
      } else {
        showToast(result.message);
      }
    });
  });
}

async function renderDashboardOrders() {
  const tbody = document.querySelector("[data-dashboard-orders]");
  if (!tbody) return;

  const response = await fetch("/api/admin/orders");

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }

  const orders = await response.json();

  tbody.innerHTML = orders
    .slice(0, 5)
    .map((order) => {
      const items = order.items
        .map((item) => `${item.food_name} ×${item.quantity}`)
        .join(", ");

      return `
            <tr>

                <td class="order-id">
                    #TB-${order.order_id}
                </td>

                <td>
                    ${order.customer}
                </td>

                <td>
                    ${items}
                </td>

                <td class="price">
                    ₹${order.total_amount}
                </td>

                <td>
                    <span class="status-token ${getStatusClass(order.status)}">
                        ${order.status}
                    </span>
                </td>

            </tr>
        `;
    })
    .join("");
}

async function renderFoods() {
  const tbody = document.querySelector("[data-food-table-body]");
  if (!tbody) return;

  const response = await fetch("/api/admin/foods");

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }

  const foods = await response.json();

  if (foods.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No food items found.
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = foods
    .map(
      (food) => `
        <tr>

            <td>${food.food_name}</td>

            <td>${food.veg ? "🥗 Veg" : "🍗 Non-Veg"}</td>

            <td>₹${food.price}</td>

            <td>${food.availability}</td>

            <td>
                <button
    class="btn btn-secondary btn-sm edit-food-btn"
    data-food-id="${food.food_id}">
    Edit
</button>

                <button
    class="btn btn-danger btn-sm delete-food-btn"
    data-food-id="${food.food_id}">
    Delete
</button>
            </td>

        </tr>
    `,
    )
    .join("");
  tbody.querySelectorAll(".edit-food-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const foodId = Number(button.dataset.foodId);

      const food = foods.find((item) => item.food_id === foodId);

      openModal(food);
    });
  });
  tbody.querySelectorAll(".delete-food-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const foodId = button.dataset.foodId;

      const confirmDelete = confirm(
        "Are you sure you want to delete this dish?",
      );

      if (!confirmDelete) return;

      const response = await fetch(`/api/admin/foods/${foodId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        showToast("Dish deleted successfully");
        renderFoods();
      } else {
        showToast(result.message);
      }
    });
  });
  tbody.querySelectorAll(".edit-food-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const foodId = button.dataset.foodId;

      const food = foods.find((item) => item.food_id == foodId);

      openModal(food);
    });
  });
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initTheme();
  renderCategoryStrip();
  loadFoodItems();
  renderCartPage();
  renderCheckoutSummary();
  renderManageFood();
  renderDashboard();
  initFormValidation();
  loadUserDetails();
  renderOrders();
  renderAdminOrders();
  renderDashboardOrders();
  renderFoods();
  // orders.html: show "placed" confirmation toast
  if (window.location.search.includes("placed=1"))
    showToast("Order placed successfully");
});
