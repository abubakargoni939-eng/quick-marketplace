const SUPABASE_URL =
  "https://qdnksutiuqwdgeerpahb.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_HqtZfoMs_cvNAVg7ZBlL0w_HLL2D4uy";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentAdmin = null;
let currentSettings = null;

// ===============================
// HELPERS
// ===============================

function get(id) {
  return document.getElementById(id);
}

function showMessage(id, message, success = false) {
  const element = get(id);

  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "green" : "red";
}

// ===============================
// ADMIN CHECK
// ===============================

async function checkAdmin(userId) {
  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Admin check failed: " + error.message);
  }

  return !!data;
}

// ===============================
// ADMIN LOGIN
// ===============================

async function adminLogin() {
  const email = get("adminEmail").value.trim();
  const password = get("adminPassword").value;

  if (!email || !password) {
    showMessage(
      "adminMessage",
      "Please enter email and password."
    );
    return;
  }

  try {
    showMessage(
      "adminMessage",
      "Connecting to Supabase..."
    );

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      showMessage(
        "adminMessage",
        "Login error: " + error.message
      );
      return;
    }

    if (!data.user) {
      showMessage(
        "adminMessage",
        "Login failed."
      );
      return;
    }

    const isAdmin = await checkAdmin(data.user.id);

    if (!isAdmin) {
      await supabaseClient.auth.signOut();

      showMessage(
        "adminMessage",
        "This account is not an admin."
      );

      return;
    }

    currentAdmin = data.user;

    showMessage(
      "adminMessage",
      "Admin login successful!",
      true
    );

    get("adminLoginSection").style.display = "none";
    get("adminPanel").style.display = "block";

    await loadSettings();

  } catch (error) {
    showMessage(
      "adminMessage",
      "System error: " + error.message
    );
  }
}

// ===============================
// LOAD SETTINGS
// ===============================

async function loadSettings() {
  try {
    showMessage(
      "settingsMessage",
      "Loading settings...",
      true
    );

    const { data, error } = await supabaseClient
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      showMessage(
        "settingsMessage",
        "Could not load settings: " + error.message
      );
      return;
    }

    if (!data) {
      showMessage(
        "settingsMessage",
        "Settings record was not found."
      );
      return;
    }

    currentSettings = data;

    setCheckbox(
      "shopOwnerRegistration",
      data.shop_owner_registration
    );

    setCheckbox(
      "shopCreation",
      data.shop_creation
    );

    setCheckbox(
      "productAddition",
      data.product_addition
    );

    setCheckbox(
      "customerRequests",
      data.customer_requests
    );

    setCheckbox(
      "customerSearch",
      data.customer_search
    );

    setCheckbox(
      "commission",
      data.commission
    );

    setCheckbox(
      "minimumOrder",
      data.minimum_order
    );

    setCheckbox(
      "delivery",
      data.delivery
    );

    setCheckbox(
      "quickDelivery",
      data.quick_delivery
    );

    setCheckbox(
      "quickDeliveryLocalOnly",
      data.quick_delivery_local_only
    );

    setCheckbox(
      "otherDelivery",
      data.other_delivery
    );

    setCheckbox(
      "bulkDeliverySupport",
      data.bulk_delivery_support
    );

    setValue(
      "quickDeliveryMinutes",
      data.quick_delivery_minutes
    );

    setValue(
      "bulkOrderMinimum",
      data.bulk_order_minimum
    );

    setValue(
      "deliverySupportPercent",
      data.app_delivery_support_percent
    );

    showMessage(
      "settingsMessage",
      "Settings loaded successfully.",
      true
    );

  } catch (error) {
    showMessage(
      "settingsMessage",
      "Error loading settings: " + error.message
    );
  }
}

// ===============================
// SAVE SETTINGS
// ===============================

async function saveSettings() {
  if (!currentAdmin) {
    showMessage(
      "settingsMessage",
      "Please login as admin first."
    );
    return;
  }

  try {
    showMessage(
      "settingsMessage",
      "Saving settings...",
      true
    );

    const updates = {
      shop_owner_registration:
        getCheckbox("shopOwnerRegistration"),

      shop_creation:
        getCheckbox("shopCreation"),

      product_addition:
        getCheckbox("productAddition"),

      customer_requests:
        getCheckbox("customerRequests"),

      customer_search:
        getCheckbox("customerSearch"),

      commission:
        getCheckbox("commission"),

      minimum_order:
        getCheckbox("minimumOrder"),

      delivery:
        getCheckbox("delivery"),

      quick_delivery:
        getCheckbox("quickDelivery"),

      quick_delivery_local_only:
        getCheckbox("quickDeliveryLocalOnly"),

      other_delivery:
        getCheckbox("otherDelivery"),

      quick_delivery_minutes:
        Number(get("quickDeliveryMinutes").value),

      bulk_delivery_support:
        getCheckbox("bulkDeliverySupport"),

      bulk_order_minimum:
        Number(get("bulkOrderMinimum").value),

      app_delivery_support_percent:
        Number(get("deliverySupportPercent").value),

      updated_at: new Date().toISOString()
    };

    if (
      !Number.isFinite(updates.quick_delivery_minutes) ||
      updates.quick_delivery_minutes < 1
    ) {
      showMessage(
        "settingsMessage",
        "Quick Delivery time must be at least 1 minute."
      );
      return;
    }

    if (
      !Number.isFinite(updates.bulk_order_minimum) ||
      updates.bulk_order_minimum < 0
    ) {
      showMessage(
        "settingsMessage",
        "Bulk order minimum amount is invalid."
      );
      return;
    }

    if (
      !Number.isFinite(updates.app_delivery_support_percent) ||
      updates.app_delivery_support_percent < 0 ||
      updates.app_delivery_support_percent > 100
    ) {
      showMessage(
        "settingsMessage",
        "Delivery support must be between 0% and 100%."
      );
      return;
    }

    const { data, error } = await supabaseClient
      .from("app_settings")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      showMessage(
        "settingsMessage",
        "Save error: " + error.message
      );
      return;
    }

    currentSettings = data;

    showMessage(
      "settingsMessage",
      "Settings saved successfully!",
      true
    );

  } catch (error) {
    showMessage(
      "settingsMessage",
      "System error: " + error.message
    );
  }
}

// ===============================
// LOGOUT
// ===============================

async function adminLogout() {
  await supabaseClient.auth.signOut();

  currentAdmin = null;
  currentSettings = null;

  get("adminPanel").style.display = "none";
  get("adminLoginSection").style.display = "block";

  showMessage(
    "adminMessage",
    "You have been logged out.",
    true
  );
}

// ===============================
// ROUTES
// ===============================

const ROUTES_KEY = "quickMarketplaceDeliveryRoutes";

function getRoutes() {
  try {
    return JSON.parse(
      localStorage.getItem(ROUTES_KEY)
    ) || [];
  } catch {
    return [];
  }
}

function saveRoutes(routes) {
  localStorage.setItem(
    ROUTES_KEY,
    JSON.stringify(routes)
  );
}

function addRoute() {
  const from = get("routeFrom").value.trim();
  const to = get("routeTo").value.trim();
  const time = get("routeTime").value.trim();

  if (!from || !to || !time) {
    showMessage(
      "routesMessage",
      "Please fill From, To and Delivery Time."
    );
    return;
  }

  const routes = getRoutes();

  routes.push({
    id: Date.now(),
    from,
    to,
    time
  });

  saveRoutes(routes);

  get("routeFrom").value = "";
  get("routeTo").value = "";
  get("routeTime").value = "";

  renderRoutes();

  showMessage(
    "routesMessage",
    "Route added successfully.",
    true
  );
}

function deleteRoute(id) {
  const routes = getRoutes();

  const updated = routes.filter(
    route => route.id !== id
  );

  saveRoutes(updated);

  renderRoutes();
}

function renderRoutes() {
  const container = get("routesList");

  if (!container) return;

  const routes = getRoutes();

  if (routes.length === 0) {
    container.innerHTML =
      "<p>No delivery routes added yet.</p>";
    return;
  }

  container.innerHTML = routes.map(route => `
    <div class="route-item">
      <strong>${escapeHTML(route.from)}</strong>
      →
      <strong>${escapeHTML(route.to)}</strong>

      <span>${escapeHTML(route.time)}</span>

      <button
        type="button"
        onclick="deleteRoute(${route.id})"
      >
        Delete
      </button>
    </div>
  `).join("");
}

// ===============================
// SMALL HELPERS
// ===============================

function setCheckbox(id, value) {
  const element = get(id);

  if (element) {
    element.checked = Boolean(value);
  }
}

function getCheckbox(id) {
  const element = get(id);

  return element
    ? element.checked
    : false;
}

function setValue(id, value) {
  const element = get(id);

  if (element) {
    element.value = value ?? "";
  }
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===============================
// INITIALIZE
// ===============================

async function initializeAdmin() {
  renderRoutes();

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return;
  }

  try {
    const isAdmin = await checkAdmin(
      session.user.id
    );

    if (!isAdmin) {
      await supabaseClient.auth.signOut();
      return;
    }

    currentAdmin = session.user;

    get("adminLoginSection").style.display =
      "none";

    get("adminPanel").style.display =
      "block";

    await loadSettings();

  } catch (error) {
    console.error(error);
  }
}

// ===============================
// BUTTON EVENTS
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const loginButton =
      get("adminLoginBtn");

    if (loginButton) {
      loginButton.addEventListener(
        "click",
        adminLogin
      );
    }

    const saveButton =
      get("saveSettingsBtn");

    if (saveButton) {
      saveButton.addEventListener(
        "click",
        saveSettings
      );
    }

    const addRouteButton =
      get("addRouteBtn");

    if (addRouteButton) {
      addRouteButton.addEventListener(
        "click",
        addRoute
      );
    }

    const logoutButton =
      get("adminLogoutBtn");

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        adminLogout
      );
    }

    initializeAdmin();
  }
);
