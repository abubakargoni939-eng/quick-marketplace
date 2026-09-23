const { createClient } = window.supabase;

const config = window.QM_CONFIG;

if (!config?.url || !config?.key) {
  console.error("Supabase configuration is missing.");
}

const supabase = createClient(config.url, config.key);

let currentUser = null;
let products = [];
let cartItems = [];

/* =========================
   BASIC HELPERS
========================= */

const $ = (id) => document.getElementById(id);

function money(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function showMessage(message, error = false) {
  const el = $("msg");
  if (!el) return;

  el.textContent = message;
  el.style.color = error ? "#dc2626" : "#16a34a";
}

function hide(el) {
  if (el) el.classList.add("hide");
}

function show(el) {
  if (el) el.classList.remove("hide");
}

/* =========================
   AUTH MODAL
========================= */

function openAuth() {
  show($("modal"));
  tab("signin");
}

function closeAuth() {
  hide($("modal"));
  showMessage("");
}

function tab(name) {
  hide($("signup"));
  hide($("signin"));
  hide($("otp"));

  if (name === "signup") show($("signup"));
  if (name === "signin") show($("signin"));
  if (name === "otp") show($("otp"));

  showMessage("");
}

window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.tab = tab;

/* =========================
   CART
========================= */

function toggleCart() {
  $("cart")?.classList.toggle("open");
}

window.toggleCart = toggleCart;

function saveCart() {
  localStorage.setItem("quick_marketplace_cart", JSON.stringify(cartItems));
}

function loadCart() {
  try {
    cartItems =
      JSON.parse(
        localStorage.getItem("quick_marketplace_cart") || "[]"
      ) || [];
  } catch {
    cartItems = [];
  }

  renderCart();
}

function addToCart(product) {
  const existing = cartItems.find(
    item => item.product_id === product.id
  );

  if (existing) {
    existing.quantity += 1;
    existing.total_price =
      existing.quantity * Number(existing.unit_price);
  } else {
    cartItems.push({
      product_id: product.id,
      shop_id: product.shop_id,
      name: product.name,
      unit_price: Number(product.price),
      quantity: 1,
      total_price: Number(product.price)
    });
  }

  saveCart();
  renderCart();

  $("cart")?.classList.add("open");
}

window.addToCart = addToCart;

function removeFromCart(productId) {
  cartItems = cartItems.filter(
    item => item.product_id !== productId
  );

  saveCart();
  renderCart();
}

window.removeFromCart = removeFromCart;

function changeQuantity(productId, amount) {
  const item = cartItems.find(
    x => x.product_id === productId
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  item.total_price =
    item.quantity * Number(item.unit_price);

  saveCart();
  renderCart();
}

window.changeQuantity = changeQuantity;

function renderCart() {
  const container = $("cartItems");

  if (!container) return;

  if (!cartItems.length) {
    container.innerHTML =
      `<p class="muted">Cart empty</p>`;
  } else {
    container.innerHTML = cartItems.map(item => `
      <div class="card" style="margin-bottom:10px">

        <strong>${escapeHtml(item.name)}</strong>

        <p>
          ${money(item.unit_price)}
        </p>

        <div style="
          display:flex;
          align-items:center;
          gap:8px;
        ">

          <button
            type="button"
            onclick="changeQuantity(${item.product_id}, -1)"
          >
            −
          </button>

          <strong>
            ${item.quantity}
          </strong>

          <button
            type="button"
            onclick="changeQuantity(${item.product_id}, 1)"
          >
            +
          </button>

          <button
            type="button"
            onclick="removeFromCart(${item.product_id})"
            style="margin-left:auto"
          >
            Remove
          </button>

        </div>

        <strong>
          ${money(item.total_price)}
        </strong>

      </div>
    `).join("");
  }

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.total_price || 0),
    0
  );

  if ($("subtotal")) {
    $("subtotal").textContent = money(subtotal);
  }

  if ($("count")) {
    $("count").textContent =
      cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
  }
}

/* =========================
   PRODUCTS
========================= */

async function loadProducts() {
  const grid = $("productsGrid");

  if (!grid) return;

  grid.innerHTML =
    `<div class="card">Loading products...</div>`;

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      shop_id,
      name,
      description,
      price,
      image_url,
      stock,
      is_available,
      category
    `)
    .eq("is_available", true)
    .gt("stock", 0)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(error);

    grid.innerHTML = `
      <div class="card">
        Unable to load products.
      </div>
    `;

    return;
  }

  products = data || [];

  renderProducts(products);
}

function renderProducts(list) {
  const grid = $("productsGrid");

  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `
      <div class="card">
        No products found.
      </div>
    `;

    return;
  }

  grid.innerHTML = list.map(product => `
    <div class="card">

      ${
        product.image_url
          ? `
            <img
              src="${escapeAttribute(product.image_url)}"
              alt="${escapeAttribute(product.name)}"
              style="
                width:100%;
                height:180px;
                object-fit:cover;
                border-radius:10px;
              "
            >
          `
          : ""
      }

      <h3>
        ${escapeHtml(product.name)}
      </h3>

      <p class="muted">
        ${escapeHtml(product.description || "")}
      </p>

      <p>
        <strong>
          ${money(product.price)}
        </strong>
      </p>

      <p>
        Stock: ${product.stock}
      </p>

      <button
        type="button"
        onclick='addToCart(${JSON.stringify(product)})'
      >
        Add to cart
      </button>

    </div>
  `).join("");
}

function searchProducts() {
  const value =
    ($("search")?.value || "")
      .trim()
      .toLowerCase();

  if (!value) {
    renderProducts(products);
    return;
  }

  const filtered = products.filter(product =>
    `${product.name} ${product.description || ""} ${product.category || ""}`
      .toLowerCase()
      .includes(value)
  );

  renderProducts(filtered);
}

/* =========================
   SIGN UP
========================= */

async function signup(event) {
  event.preventDefault();

  const fullName = $("sn").value.trim();
  const email = $("se").value.trim();
  const password = $("sp").value;
  const role = $("sr").value;

  showMessage("Creating account...");

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        role
      });
  }

  showMessage(
    "Account created. Check your email to confirm your account."
  );
}

/* =========================
   LOGIN
========================= */

async function signin(event) {
  event.preventDefault();

  const email = $("le").value.trim();
  const password = $("lp").value;

  showMessage("Logging in...");

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  closeAuth();
  await refreshUser();
}

/* =========================
   OTP
========================= */

async function sendOTP() {
  const email = $("oe").value.trim();

  if (!email) {
    showMessage("Enter your email.", true);
    return;
  }

  showMessage("Sending OTP...");

  const { error } =
    await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  showMessage(
    "OTP sent. Check your email."
  );
}

window.sendOTP = sendOTP;

async function verifyOTP() {
  const email = $("oe").value.trim();
  const token = $("oc").value.trim();

  if (!email || !token) {
    showMessage(
      "Enter email and OTP.",
      true
    );
    return;
  }

  showMessage("Verifying OTP...");

  const { error } =
    await supabase.auth.verifyOtp({
      email,
      token,
      type: "email"
    });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  showMessage("OTP verified successfully.");

  closeAuth();

  await refreshUser();
}

window.verifyOTP = verifyOTP;

/* =========================
   USER
========================= */

async function refreshUser() {
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  currentUser = user || null;

  updateHeader();

  if (currentUser) {
    await loadOrders();
    await loadDashboard();
    await checkAdmin();
  } else {
    $("ordersList").innerHTML = `
      <div class="card">
        Login to see your orders.
      </div>
    `;

    $("dash").innerHTML = `
      <div class="card">
        Login to access your dashboard.
      </div>
    `;

    hide($("adminLink"));
  }
}

function updateHeader() {
  if (currentUser) {
    $("who").textContent =
      currentUser.email || "User";

    hide($("login"));
    show($("logout"));
  } else {
    $("who").textContent = "Guest";

    show($("login"));
    hide($("logout"));
  }
}

/* =========================
   LOGOUT
========================= */

async function logout() {
  await supabase.auth.signOut();

  currentUser = null;

  updateHeader();

  $("ordersList").innerHTML = `
    <div class="card">
      Login to see your orders.
    </div>
  `;

  $("dash").innerHTML = `
    <div class="card">
      Login to access your dashboard.
    </div>
  `;

  hide($("adminLink"));
}

window.logout = logout;

/* =========================
   CHECKOUT
========================= */

async function checkout() {
  if (!currentUser) {
    openAuth();
    return;
  }

  if (!cartItems.length) {
    alert("Your cart is empty.");
    return;
  }

  const address =
    $("address").value.trim();

  const city =
    $("city").value.trim();

  const deliveryType =
    $("dtype").value;

  if (!address || !city) {
    alert(
      "Please enter your delivery address and city."
    );
    return;
  }

  /*
    Current MVP supports one shop per order.
    If products from different shops are in the cart,
    the checkout will ask the customer to separate them.
  */

  const shopIds = [
    ...new Set(
      cartItems.map(item => item.shop_id)
    )
  ];

  if (shopIds.length !== 1) {
    alert(
      "Please order products from one shop at a time."
    );
    return;
  }

  const shopId = shopIds[0];

  const { data: shop, error: shopError } =
    await supabase
      .from("shops")
      .select(`
        id,
        commission_per_item,
        minimum_order_quantity
      `)
      .eq("id", shopId)
      .single();

  if (shopError) {
    console.error(shopError);
    alert("Shop information could not be loaded.");
    return;
  }

  const quantity = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity),
    0
  );

  const minimumOrder =
    Number(shop.minimum_order_quantity || 1);

  if (quantity < minimumOrder) {
    alert(
      `This shop requires a minimum order of ${minimumOrder} item(s).`
    );
    return;
  }

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.total_price),
    0
  );

  const commission =
    Number(shop.commission_per_item || 0)
    * quantity;

  /*
    Delivery fee can be connected to delivery_routes
    later. For now the order is created with ₦0
    delivery fee instead of inventing a route price.
  */

  const deliveryFee = 0;

  const total =
    subtotal +
    commission +
    deliveryFee;

  const vendorAmount =
    subtotal;

  const status =
    deliveryType === "quick"
      ? "pending"
      : "pending";

  const { data: order, error: orderError } =
    await supabase
      .from("orders")
      .insert({
        customer_id: currentUser.id,
        shop_id: shopId,
        subtotal,
        commission,
        vendor_amount: vendorAmount,
        delivery_fee: deliveryFee,
        total,
        status,
        delivery_address:
          `${address}, ${city}`
      })
      .select()
      .single();

  if (orderError) {
    console.error(orderError);

    alert(
      "Order could not be created: " +
      orderError.message
    );

    return;
  }

  const orderItems =
    cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));

  const {
    error: itemsError
  } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error(itemsError);

    await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    alert(
      "Order items could not be saved: " +
      itemsError.message
    );

    return;
  }

  /*
    Reduce stock.
  */

  for (const item of cartItems) {
    const product =
      products.find(
        p => p.id === item.product_id
      );

    if (!product) continue;

    const newStock =
      Math.max(
        0,
        Number(product.stock) -
        Number(item.quantity)
      );

    await supabase
      .from("products")
      .update({
        stock: newStock,
        is_available: newStock > 0
      })
      .eq("id", item.product_id);
  }

  cartItems = [];

  saveCart();
  renderCart();

  $("address").value = "";
  $("city").value = "";

  alert(
    `Order #${order.id} placed successfully.`
  );

  await loadProducts();
  await loadOrders();

  location.hash = "orders";
}

/* =========================
   ORDERS
========================= */

async function loadOrders() {
  const container = $("ordersList");

  if (!container || !currentUser) return;

  container.innerHTML =
    `<div class="card">Loading orders...</div>`;

  const {
    data,
    error
  } = await supabase
    .from("orders")
    .select(`
      id,
      shop_id,
      subtotal,
      commission,
      delivery_fee,
      total,
      status,
      delivery_address,
      created_at
    `)
    .eq("customer_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(error);

    container.innerHTML = `
      <div class="card">
        Could not load orders.
      </div>
    `;

    return;
  }

  if (!data?.length) {
    container.innerHTML = `
      <div class="card">
        You have no orders yet.
      </div>
    `;

    return;
  }

  container.innerHTML = data.map(order => `
    <div class="card" style="margin-bottom:12px">

      <h3>
        Order #${order.id}
      </h3>

      <p>
        Status:
        <strong>
          ${escapeHtml(order.status || "pending")}
        </strong>
      </p>

      <p>
        Total:
        <strong>
          ${money(order.total)}
        </strong>
      </p>

      <p>
        Delivery:
        ${escapeHtml(order.delivery_address || "")}
      </p>

      <small class="muted">
        ${new Date(order.created_at).toLocaleString("en-NG")}
      </small>

    </div>
  `).join("");
}

/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {
  const dash = $("dash");

  if (!dash || !currentUser) return;

  const {
    data: profile
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  const role =
    profile?.role ||
    currentUser.user_metadata?.role ||
    "customer";

  if (role === "shop_owner") {
    await loadShopOwnerDashboard();
    return;
  }

  if (role === "delivery") {
    dash.innerHTML = `
      <div class="card">
        <h3>🚚 Delivery Dashboard</h3>
        <p>
          Your delivery dashboard is ready
          for delivery assignments.
        </p>
      </div>
    `;

    return;
  }

  dash.innerHTML = `
    <div class="card">

      <h3>
        Welcome 👋
      </h3>

      <p>
        Account:
        ${escapeHtml(currentUser.email || "")}
      </p>

      <p>
        Role: Customer
      </p>

      <button
        type="button"
        onclick="location.hash='products'"
      >
        Continue Shopping
      </button>

    </div>
  `;
}

/* =========================
   SHOP OWNER
========================= */

async function loadShopOwnerDashboard() {
  const dash = $("dash");

  const {
    data: shops,
    error
  } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(error);

    dash.innerHTML = `
      <div class="card">
        Could not load your shop.
      </div>
    `;

    return;
  }

  if (!shops?.length) {
    dash.innerHTML = `
      <div class="card">

        <h3>
          🏪 Shop Owner
        </h3>

        <p>
          You do not have a shop yet.
        </p>

        <button
          type="button"
          onclick="createShopPrompt()"
        >
          Create Shop
        </button>

      </div>
    `;

    return;
  }

  dash.innerHTML = shops.map(shop => `
    <div class="card" style="margin-bottom:12px">

      <h3>
        🏪 ${escapeHtml(shop.name)}
      </h3>

      <p>
        ${escapeHtml(shop.description || "")}
      </p>

      <p>
        City:
        ${escapeHtml(shop.city || "")}
      </p>

      <p>
        Commission per item:
        <strong>
          ${money(shop.commission_per_item)}
        </strong>
      </p>

      <p>
        Minimum order:
        <strong>
          ${shop.minimum_order_quantity}
        </strong>
      </p>

    </div>
  `).join("");
}

async function createShopPrompt() {
  if (!currentUser) {
    openAuth();
    return;
  }

  const name =
    prompt("Shop name:");

  if (!name) return;

  const description =
    prompt("Shop description:") || "";

  const city =
    prompt("Shop city:");

  if (!city) return;

  const address =
    prompt("Shop address:");

  if (!address) return;

  const phone =
    prompt("Shop phone:");

  if (!phone) return;

  const commission =
    Number(
      prompt(
        "Commission per item (₦):"
      )
    );

  if (!Number.isFinite(commission) || commission < 0) {
    alert("Enter a valid commission.");
    return;
  }

  const minimumOrder =
    Number(
      prompt(
        "Minimum order quantity:"
      )
    );

  if (
    !Number.isInteger(minimumOrder) ||
    minimumOrder < 1
  ) {
    alert(
      "Minimum order must be at least 1."
    );
    return;
  }

  const {
    error
  } = await supabase
    .from("shops")
    .insert({
      owner_id: currentUser.id,
      name,
      description,
      city,
      address,
      phone,
      commission_per_item: commission,
      minimum_order_quantity: minimumOrder
    });

  if (error) {
    console.error(error);

    alert(
      "Shop creation failed: " +
      error.message
    );

    return;
  }

  alert(
    "Shop created successfully."
  );

  await loadDashboard();
}

window.createShopPrompt = createShopPrompt;

/* =========================
   ADMIN
========================= */

async function checkAdmin() {
  if (!currentUser) return;

  const {
    data,
    error
  } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    show($("adminLink"));

    $("adminBox").innerHTML = `
      <div class="card">

        <h3>
          ⚙️ Admin Dashboard
        </h3>

        <p>
          Admin account detected.
        </p>

        <p>
          You can manage marketplace settings
          from the admin area.
        </p>

      </div>
    `;
  } else {
    hide($("adminLink"));
  }
}

/* =========================
   SECURITY HELPERS
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

/* =========================
   EVENTS
========================= */

$("login")?.addEventListener(
  "click",
  openAuth
);

$("logout")?.addEventListener(
  "click",
  logout
);

$("signup")?.addEventListener(
  "submit",
  signup
);

$("signin")?.addEventListener(
  "submit",
  signin
);

$("search")?.addEventListener(
  "input",
  searchProducts
);

supabase.auth.onAuthStateChange(
  async (_event, session) => {
    currentUser =
      session?.user || null;

    updateHeader();

    if (currentUser) {
      await loadOrders();
      await loadDashboard();
      await checkAdmin();
    }
  }
);

/* =========================
   START APP
========================= */

async function startApp() {
  loadCart();

  await loadProducts();

  await refreshUser();
}

startApp();
