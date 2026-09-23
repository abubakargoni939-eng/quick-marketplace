/* =========================================================
   QUICK MARKETPLACE
   REAL SUPABASE APP.JS
   ========================================================= */

const config = window.QM_CONFIG || {};

if (!config.url || !config.key) {
  console.error("Supabase configuration is missing.");
}

const client = window.supabase.createClient(
  config.url,
  config.key
);

let currentUser = null;
let products = [];
let cart = [];


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  await loadUser();

  await loadProducts();

  setupSearch();

  setupAuthForms();

  setupAuthListener();

  renderCart();

});


/* =========================================================
   AUTH
   ========================================================= */

async function loadUser() {

  const { data } = await client.auth.getSession();

  currentUser = data?.session?.user || null;

  updateHeader();

  if (currentUser) {
    await loadOrders();
  }
}


function setupAuthListener() {

  client.auth.onAuthStateChange(async (_event, session) => {

    currentUser = session?.user || null;

    updateHeader();

    if (currentUser) {
      await loadOrders();
    } else {
      document.getElementById("ordersList").innerHTML = `
        <div class="card">
          Login to see your orders.
        </div>
      `;
    }
  });
}


function updateHeader() {

  const who = document.getElementById("who");
  const login = document.getElementById("login");
  const logout = document.getElementById("logout");

  if (!who) return;

  if (currentUser) {

    const name =
      currentUser.user_metadata?.full_name ||
      currentUser.email ||
      "User";

    who.textContent = name;

    if (login) login.classList.add("hide");
    if (logout) logout.classList.remove("hide");

  } else {

    who.textContent = "Guest";

    if (login) login.classList.remove("hide");
    if (logout) logout.classList.add("hide");
  }
}


/* =========================================================
   LOGIN BUTTON
   ========================================================= */

document.getElementById("login")?.addEventListener("click", () => {

  const modal = document.getElementById("modal");

  if (modal) {
    modal.classList.remove("hide");
  }

  tab("signin");
});


/* =========================================================
   LOGOUT
   ========================================================= */

document.getElementById("logout")?.addEventListener("click", async () => {

  await client.auth.signOut();

  currentUser = null;

  cart = [];

  renderCart();

  updateHeader();
});


/* =========================================================
   AUTH TABS
   ========================================================= */

window.tab = function(type) {

  const signup = document.getElementById("signup");
  const signin = document.getElementById("signin");
  const otp = document.getElementById("otp");

  signup?.classList.add("hide");
  signin?.classList.add("hide");
  otp?.classList.add("hide");

  if (type === "signup") {
    signup?.classList.remove("hide");
  }

  if (type === "signin") {
    signin?.classList.remove("hide");
  }

  if (type === "otp") {
    otp?.classList.remove("hide");
  }

  clearMessage();
};


window.closeAuth = function() {

  document.getElementById("modal")?.classList.add("hide");

};


/* =========================================================
   SIGN UP
   ========================================================= */

function setupAuthForms() {

  const signup = document.getElementById("signup");

  signup?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document.getElementById("sn").value.trim();
    const email = document.getElementById("se").value.trim();
    const password = document.getElementById("sp").value;
    const role = document.getElementById("sr").value;

    showMessage("Creating account...");

    const { data, error } = await client.auth.signUp({

      email,

      password,

      options: {
        data: {
          full_name: name,
          role
        }
      }

    });

    if (error) {

      showMessage(error.message);

      return;
    }

    if (data.user) {

      showMessage(
        "Account created. Check your email to confirm your account."
      );

      signup.reset();

    }

  });


  /* ================= LOGIN ================= */

  const signin = document.getElementById("signin");

  signin?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("le").value.trim();
    const password = document.getElementById("lp").value;

    showMessage("Logging in...");

    const { data, error } =
      await client.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      showMessage(error.message);

      return;
    }

    currentUser = data.user;

    showMessage("Login successful.");

    setTimeout(() => {
      closeAuth();
    }, 700);

  });

}


/* =========================================================
   OTP
   ========================================================= */

window.sendOTP = async function() {

  const email = document.getElementById("oe").value.trim();

  if (!email) {

    showMessage("Enter your email first.");

    return;
  }

  showMessage("Sending OTP...");

  const { error } =
    await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });

  if (error) {

    showMessage(error.message);

    return;
  }

  showMessage(
    "OTP sent to your email."
  );
};


window.verifyOTP = async function() {

  const email = document.getElementById("oe").value.trim();
  const token = document.getElementById("oc").value.trim();

  if (!email || !token) {

    showMessage("Enter your email and OTP.");

    return;
  }

  showMessage("Verifying OTP...");

  const { data, error } =
    await client.auth.verifyOtp({
      email,
      token,
      type: "email"
    });

  if (error) {

    showMessage(error.message);

    return;
  }

  currentUser = data.user;

  showMessage("OTP verified successfully.");

  setTimeout(() => {
    closeAuth();
  }, 700);
};


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {

  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  grid.innerHTML = `
    <div class="card">
      Loading products...
    </div>
  `;

  const { data, error } = await client
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
        <br><br>
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

  products = data || [];

  renderProducts(products);
}


function renderProducts(list) {

  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  if (!list.length) {

    grid.innerHTML = `
      <div class="card">
        No products found.
      </div>
    `;

    return;
  }

  grid.innerHTML = list.map(product => {

    const image = product.image_url
      ? `<img src="${escapeAttribute(product.image_url)}" alt="${escapeAttribute(product.name)}">`
      : "🛍️";

    return `
      <article class="product">

        <div class="pic">
          ${image}
        </div>

        <div class="body">

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <p>
            ${escapeHTML(product.description || "Available now")}
          </p>

          <div class="price">
            ₦${money(product.price)}
          </div>

          <p>
            Stock: ${product.stock}
          </p>

          <button
            onclick="addToCart(${product.id})"
          >
            Add to cart
          </button>

        </div>

      </article>
    `;

  }).join("");
}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

  const search = document.getElementById("search");

  if (!search) return;

  search.addEventListener("input", () => {

    const value =
      search.value.trim().toLowerCase();

    if (!value) {

      renderProducts(products);

      return;
    }

    const result = products.filter(product => {

      return (
        product.name?.toLowerCase().includes(value) ||
        product.description?.toLowerCase().includes(value) ||
        product.category?.toLowerCase().includes(value)
      );

    });

    renderProducts(result);
  });
}


/* =========================================================
   CART
   ========================================================= */

window.addToCart = function(productId) {

  const product =
    products.find(p => p.id === productId);

  if (!product) return;

  const existing =
    cart.find(item => item.product.id === productId);

  if (existing) {

    if (existing.quantity >= product.stock) {

      alert("No more stock available.");

      return;
    }

    existing.quantity++;

  } else {

    cart.push({
      product,
      quantity: 1
    });

  }

  renderCart();

};


window.removeFromCart = function(productId) {

  cart =
    cart.filter(item =>
      item.product.id !== productId
    );

  renderCart();

};


window.changeQuantity = function(productId, amount) {

  const item =
    cart.find(i => i.product.id === productId);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {

    removeFromCart(productId);

    return;
  }

  if (item.quantity > item.product.stock) {

    item.quantity = item.product.stock;

  }

  renderCart();
};


function renderCart() {

  const container =
    document.getElementById("cartItems");

  const count =
    document.getElementById("count");

  const subtotal =
    document.getElementById("subtotal");

  if (!container) return;

  if (!cart.length) {

    container.innerHTML = `
      <p class="muted">
        Your cart is empty.
      </p>
    `;

  } else {

    container.innerHTML =
      cart.map(item => {

        return `
          <div class="line">

            <div>

              <strong>
                ${escapeHTML(item.product.name)}
              </strong>

              <br>

              ₦${money(item.product.price)}
              × ${item.quantity}

              <br>

              <button
                onclick="changeQuantity(${item.product.id}, -1)"
              >
                −
              </button>

              <button
                onclick="changeQuantity(${item.product.id}, 1)"
              >
                +
              </button>

              <button
                onclick="removeFromCart(${item.product.id})"
              >
                Remove
              </button>

            </div>

            <strong>
              ₦${money(
                Number(item.product.price) *
                item.quantity
              )}
            </strong>

          </div>
        `;

      }).join("");

  }

  const totalItems =
    cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.product.price) *
        item.quantity,
      0
    );

  if (count) {
    count.textContent = totalItems;
  }

  if (subtotal) {
    subtotal.textContent =
      `₦${money(total)}`;
  }
}


window.toggleCart = function() {

  document
    .getElementById("cart")
    ?.classList.toggle("open");

};


/* =========================================================
   CHECKOUT
   ========================================================= */

window.checkout = async function() {

  if (!currentUser) {

    alert("Please login before placing an order.");

    document
      .getElementById("modal")
      ?.classList.remove("hide");

    tab("signin");

    return;
  }

  if (!cart.length) {

    alert("Your cart is empty.");

    return;
  }

  const address =
    document.getElementById("address")
      ?.value.trim();

  const city =
    document.getElementById("city")
      ?.value.trim();

  const deliveryType =
    document.getElementById("dtype")
      ?.value || "standard";

  if (!address || !city) {

    alert(
      "Please enter your delivery address and city."
    );

    return;
  }


  /* One shop per order */

  const shopIds =
    [...new Set(
      cart.map(item => item.product.shop_id)
    )];

  if (shopIds.length !== 1) {

    alert(
      "Please order products from one shop at a time."
    );

    return;
  }

  const shopId = shopIds[0];


  /* Get shop commission */

  const { data: shop, error: shopError } =
    await client
      .from("shops")
      .select(`
        id,
        name,
        commission_per_item,
        minimum_order_quantity
      `)
      .eq("id", shopId)
      .single();

  if (shopError) {

    alert(shopError.message);

    return;
  }


  const totalQuantity =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  if (
    totalQuantity <
    Number(shop.minimum_order_quantity || 1)
  ) {

    alert(
      `Minimum order is ${shop.minimum_order_quantity} item(s).`
    );

    return;
  }


  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.product.price) *
        item.quantity,
      0
    );


  const commission =
    Number(shop.commission_per_item || 0) *
    totalQuantity;


  /*
    Delivery fee can later be calculated
    from the delivery_routes table.
  */

  let deliveryFee = 0;


  if (deliveryType === "quick") {

    /*
      Temporary quick-delivery fee is zero
      until the route pricing system is connected.
    */

    deliveryFee = 0;
  }


  const total =
    subtotal +
    deliveryFee;


  const vendorAmount =
    subtotal -
    commission;


  /* Create order */

  const { data: order, error: orderError } =
    await client
      .from("orders")
      .insert({

        customer_id: currentUser.id,

        shop_id: shopId,

        subtotal,

        commission,

        vendor_amount: vendorAmount,

        delivery_fee: deliveryFee,

        total,

        status: "pending",

        delivery_address:
          `${address}, ${city}`

      })
      .select()
      .single();


  if (orderError) {

    alert(
      `Order failed: ${orderError.message}`
    );

    return;
  }


  /* Create order items */

  const orderItems =
    cart.map(item => {

      const unitPrice =
        Number(item.product.price);

      return {

        order_id: order.id,

        product_id:
          item.product.id,

        quantity:
          item.quantity,

        unit_price:
          unitPrice,

        total_price:
          unitPrice *
          item.quantity

      };

    });


  const { error: itemsError } =
    await client
      .from("order_items")
      .insert(orderItems);


  if (itemsError) {

    /*
      Remove the order if order items failed.
    */

    await client
      .from("orders")
      .delete()
      .eq("id", order.id);

    alert(
      `Order items failed: ${itemsError.message}`
    );

    return;
  }


  /* Reduce stock */

  for (const item of cart) {

    const newStock =
      Math.max(
        0,
        Number(item.product.stock) -
        item.quantity
      );

    await client
      .from("products")
      .update({
        stock: newStock,
        is_available: newStock > 0
      })
      .eq("id", item.product.id);

  }


  alert(
    `Order placed successfully!\nOrder #${order.id}`
  );


  cart = [];

  renderCart();

  document
    .getElementById("cart")
    ?.classList.remove("open");


  await loadProducts();

  await loadOrders();
};


/* =========================================================
   ORDERS
   ========================================================= */

async function loadOrders() {

  const container =
    document.getElementById("ordersList");

  if (!container) return;

  if (!currentUser) {

    container.innerHTML = `
      <div class="card">
        Login to see your orders.
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="card">
      Loading orders...
    </div>
  `;


  const { data, error } =
    await client
      .from("orders")
      .select(`
        id,
        subtotal,
        commission,
        vendor_amount,
        delivery_fee,
        total,
        status,
        delivery_address,
        created_at,
        shops (
          name
        )
      `)
      .eq("customer_id", currentUser.id)
      .order("created_at", {
        ascending: false
      });


  if (error) {

    container.innerHTML = `
      <div class="card">
        ${escapeHTML(error.message)}
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


  container.innerHTML =
    data.map(order => {

      return `
        <div class="order">

          <strong>
            Order #${order.id}
          </strong>

          <br>

          <span class="muted">
            ${escapeHTML(
              order.shops?.name ||
              "Shop"
            )}
          </span>

          <br><br>

          <span class="badge">
            ${escapeHTML(order.status)}
          </span>

          <p>
            Total:
            <strong>
              ₦${money(order.total)}
            </strong>
          </p>

          <p class="muted">
            ${escapeHTML(
              order.delivery_address || ""
            )}
          </p>

          <p class="muted">
            ${new Date(
              order.created_at
            ).toLocaleString()}
          </p>

        </div>
      `;

    }).join("");
}


/* =========================================================
   HELPERS
   ========================================================= */

function money(value) {

  return Number(value || 0)
    .toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

}


function showMessage(message) {

  const box =
    document.getElementById("msg");

  if (box) {
    box.textContent = message;
  }

}


function clearMessage() {

  const box =
    document.getElementById("msg");

  if (box) {
    box.textContent = "";
  }

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);
}


/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

window.addEventListener("error", event => {

  console.error(
    "Quick Marketplace error:",
    event.error || event.message
  );

});
