const PRODUCTS_KEY = "quickMarketplaceShopProducts";
const CART_KEY = "quickMarketplaceCart";
const ORDERS_KEY = "quickMarketplaceOrders";

/* =========================
   SAMPLE PRODUCTS
========================= */

const sampleProducts = [
  {
    id: "sample_1",
    name: "Rice",
    price: 85000,
    shopName: "Cap Shop",
    shopCity: "Maiduguri",
    category: "Food",
    icon: "🍚",
    minimumQuantity: 1,
    availableQuantity: 100
  },
  {
    id: "sample_2",
    name: "Beans",
    price: 70000,
    shopName: "Cap Shop",
    shopCity: "Maiduguri",
    category: "Food",
    icon: "🫘",
    minimumQuantity: 1,
    availableQuantity: 100
  },
  {
    id: "sample_3",
    name: "Cooking Oil",
    price: 12000,
    shopName: "Abba Store",
    shopCity: "Maiduguri",
    category: "Food",
    icon: "🛢️",
    minimumQuantity: 1,
    availableQuantity: 100
  },
  {
    id: "sample_4",
    name: "Soft Drink",
    price: 1000,
    shopName: "City Drinks",
    shopCity: "Maiduguri",
    category: "Drinks",
    icon: "🥤",
    minimumQuantity: 1,
    availableQuantity: 100
  },
  {
    id: "sample_5",
    name: "T-Shirt",
    price: 8500,
    shopName: "Fashion House",
    shopCity: "Maiduguri",
    category: "Fashion",
    icon: "👕",
    minimumQuantity: 1,
    availableQuantity: 100
  },
  {
    id: "sample_6",
    name: "Phone",
    price: 150000,
    shopName: "Mobile World",
    shopCity: "Maiduguri",
    category: "Electronics",
    icon: "📱",
    minimumQuantity: 1,
    availableQuantity: 50
  },
  {
    id: "sample_7",
    name: "Shoes",
    price: 18000,
    shopName: "Fashion House",
    shopCity: "Maiduguri",
    category: "Fashion",
    icon: "👟",
    minimumQuantity: 1,
    availableQuantity: 50
  },
  {
    id: "sample_8",
    name: "Plastic Chair",
    price: 7000,
    shopName: "Home Store",
    shopCity: "Maiduguri",
    category: "Household",
    icon: "🪑",
    minimumQuantity: 1,
    availableQuantity: 100
  }
];


/* =========================
   GET SHOP PRODUCTS
========================= */

function getShopProducts() {
  return JSON.parse(
    localStorage.getItem(PRODUCTS_KEY) || "[]"
  );
}


/* =========================
   GET ALL PRODUCTS
========================= */

function getAllProducts() {
  const shopProducts = getShopProducts();

  return [
    ...sampleProducts,
    ...shopProducts
  ];
}


/* =========================
   CART
========================= */

function getCart() {
  return JSON.parse(
    localStorage.getItem(CART_KEY) || "[]"
  );
}

function saveCart(cart) {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );
}


/* =========================
   FORMAT MONEY
========================= */

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString();
}


/* =========================
   PRODUCT ICON
========================= */

function getCategoryIcon(category) {
  const icons = {
    Food: "🍚",
    Drinks: "🥤",
    Fashion: "👕",
    Electronics: "📱",
    Household: "🪑"
  };

  return icons[category] || "🛍️";
}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(products) {
  const container =
    document.getElementById("productsContainer");

  const empty =
    document.getElementById("emptyProducts");

  if (!container) return;

  if (!products.length) {
    container.innerHTML = "";

    if (empty) {
      empty.style.display = "block";
    }

    return;
  }

  if (empty) {
    empty.style.display = "none";
  }

  container.innerHTML = products
    .map(product => {

      const icon =
        product.icon ||
        getCategoryIcon(product.category);

      return `
        <div class="product-card">

          <div class="product-image">
            ${icon}
          </div>

          <div class="product-info">

            <h3>
              ${escapeHTML(product.name)}
            </h3>

            <p class="product-price">
              ₦${formatMoney(product.price)}
            </p>

            <p class="product-shop">
              🏪 ${escapeHTML(product.shopName || "Shop")}
            </p>

            <p class="product-city">
              📍 ${escapeHTML(product.shopCity || "")}
            </p>

            <button
              class="primary-btn"
              onclick="openProduct('${product.id}')">
              View Product
            </button>

          </div>

        </div>
      `;
    })
    .join("");
}


/* =========================
   FILTER PRODUCTS
========================= */

function filterProducts() {

  const searchInput =
    document.getElementById("searchInput");

  const search =
    searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

  const products =
    getAllProducts();

  const filtered =
    products.filter(product => {

      const name =
        String(product.name || "").toLowerCase();

      const shop =
        String(product.shopName || "").toLowerCase();

      const category =
        String(product.category || "").toLowerCase();

      return (
        name.includes(search) ||
        shop.includes(search) ||
        category.includes(search)
      );
    });

  renderProducts(filtered);
}


/* =========================
   CATEGORY FILTER
========================= */

function setupCategories() {

  const buttons =
    document.querySelectorAll(".category-btn");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      buttons.forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");

      const category =
        button.dataset.category;

      const products =
        getAllProducts();

      if (!category || category === "All") {
        renderProducts(products);
        return;
      }

      const filtered =
        products.filter(
          product =>
            product.category === category
        );

      renderProducts(filtered);
    });

  });
}


/* =========================
   SEARCH
========================= */

function setupSearch() {

  const input =
    document.getElementById("searchInput");

  if (!input) return;

  input.addEventListener(
    "input",
    filterProducts
  );
}


/* =========================
   PRODUCT MODAL
========================= */

function openProduct(productId) {

  const products =
    getAllProducts();

  const product =
    products.find(
      item => String(item.id) === String(productId)
    );

  if (!product) return;

  const modal =
    document.getElementById("productModal");

  const details =
    document.getElementById("productDetails");

  if (!modal || !details) return;

  const icon =
    product.icon ||
    getCategoryIcon(product.category);

  details.innerHTML = `
    <div class="product-modal-content">

      <div class="product-large-icon">
        ${icon}
      </div>

      <h2>
        ${escapeHTML(product.name)}
      </h2>

      <p class="product-price">
        ₦${formatMoney(product.price)}
      </p>

      <p>
        <strong>Shop:</strong>
        ${escapeHTML(product.shopName || "Shop")}
      </p>

      <p>
        <strong>City:</strong>
        ${escapeHTML(product.shopCity || "")}
      </p>

      <p>
        <strong>Category:</strong>
        ${escapeHTML(product.category || "")}
      </p>

      <p>
        <strong>Minimum quantity:</strong>
        ${product.minimumQuantity || 1}
      </p>

      <p>
        <strong>Available:</strong>
        ${product.availableQuantity ?? "Available"}
      </p>

      <button
        class="primary-btn"
        onclick="addToCart('${product.id}')">
        Add to Cart
      </button>

    </div>
  `;

  modal.style.display = "flex";
}


/* =========================
   CLOSE PRODUCT MODAL
========================= */

function closeProductModal() {

  const modal =
    document.getElementById("productModal");

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================
   ADD TO CART
========================= */

function addToCart(productId) {

  const products =
    getAllProducts();

  const product =
    products.find(
      item => String(item.id) === String(productId)
    );

  if (!product) return;

  const cart =
    getCart();

  const existing =
    cart.find(
      item => String(item.id) === String(product.id)
    );

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      shopName: product.shopName,
      shopCity: product.shopCity,
      category: product.category,
      minimumQuantity:
        product.minimumQuantity || 1,
      availableQuantity:
        product.availableQuantity ?? 999999,
      quantity: 1
    });

  }

  saveCart(cart);

  closeProductModal();

  renderCart();

  alert("Product added to cart.");
}


/* =========================
   CART MODAL
========================= */

function openCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) return;

  renderCart();

  modal.style.display = "flex";
}


function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================
   RENDER CART
========================= */

function renderCart() {

  const container =
    document.getElementById("cartItems");

  const totalElement =
    document.getElementById("cartTotal");

  if (!container) return;

  const cart =
    getCart();

  if (!cart.length) {

    container.innerHTML =
      "<p>Your cart is empty.</p>";

    if (totalElement) {
      totalElement.textContent = "₦0";
    }

    return;
  }

  container.innerHTML =
    cart.map(item => `

      <div class="cart-item">

        <div>
          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <p>
            ₦${formatMoney(item.price)}
          </p>
        </div>

        <div class="cart-controls">

          <button
            onclick="changeCartQuantity('${item.id}', -1)">
            −
          </button>

          <span>
            ${item.quantity}
          </span>

          <button
            onclick="changeCartQuantity('${item.id}', 1)">
            +
          </button>

        </div>

      </div>

    `).join("");

  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price) * item.quantity,
      0
    );

  if (totalElement) {
    totalElement.textContent =
      "₦" + formatMoney(total);
  }
}


/* =========================
   CHANGE CART QUANTITY
========================= */

function changeCartQuantity(
  productId,
  change
) {

  const cart =
    getCart();

  const item =
    cart.find(
      product =>
        String(product.id) === String(productId)
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity < 1) {
    item.quantity = 1;
  }

  if (
    item.availableQuantity &&
    item.quantity > item.availableQuantity
  ) {
    item.quantity =
      item.availableQuantity;
  }

  saveCart(cart);

  renderCart();
}


/* =========================
   CHECKOUT
========================= */

function openCheckout() {

  const cart =
    getCart();

  if (!cart.length) {

    alert("Your cart is empty.");

    return;
  }

  const modal =
    document.getElementById("checkoutModal");

  if (!modal) return;

  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price) * item.quantity,
      0
    );

  const totalElement =
    document.getElementById("checkoutTotal");

  if (totalElement) {
    totalElement.textContent =
      "₦" + formatMoney(total);
  }

  modal.style.display = "flex";
}


/* =========================
   CLOSE CHECKOUT
========================= */

function closeCheckout() {

  const modal =
    document.getElementById("checkoutModal");

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================
   PLACE ORDER
========================= */

function placeOrder() {

  const name =
    document.getElementById("customerName")
      ?.value.trim();

  const phone =
    document.getElementById("customerPhone")
      ?.value.trim();

  const city =
    document.getElementById("deliveryCity")
      ?.value.trim();

  const address =
    document.getElementById("deliveryAddress")
      ?.value.trim();

  const message =
    document.getElementById("checkoutMessage");

  if (!name || !phone || !city || !address) {

    if (message) {
      message.textContent =
        "Please fill all delivery details.";
    }

    return;
  }

  const cart =
    getCart();

  if (!cart.length) {

    if (message) {
      message.textContent =
        "Your cart is empty.";
    }

    return;
  }

  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price) * item.quantity,
      0
    );

  const orders =
    JSON.parse(
      localStorage.getItem(ORDERS_KEY) || "[]"
    );

  const order = {

    id:
      "order_" +
      Date.now(),

    customerName: name,

    customerPhone: phone,

    deliveryCity: city,

    deliveryAddress: address,

    items: cart,

    total,

    status: "Pending",

    createdAt:
      new Date().toISOString()

  };

  orders.push(order);

  localStorage.setItem(
    ORDERS_KEY,
    JSON.stringify(orders)
  );

  localStorage.removeItem(CART_KEY);

  if (message) {
    message.textContent =
      "Order placed successfully!";
  }

  renderCart();

  setTimeout(() => {

    closeCheckout();
    closeCart();

  }, 1000);
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {

  const homeBtn =
    document.querySelector(
      '[data-nav="home"]'
    );

  const productsBtn =
    document.querySelector(
      '[data-nav="products"]'
    );

  const shopBtn =
    document.querySelector(
      '[data-nav="shop"]'
    );

  const cartBtn =
    document.querySelector(
      '[data-nav="cart"]'
    );

  const profileBtn =
    document.querySelector(
      '[data-nav="profile"]'
    );

  if (homeBtn) {

    homeBtn.addEventListener(
      "click",
      () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    );

  }

  if (productsBtn) {

    productsBtn.addEventListener(
      "click",
      () => {

        const section =
          document.getElementById("products");

        if (section) {
          section.scrollIntoView({
            behavior: "smooth"
          });
        }

      }
    );

  }

  if (shopBtn) {

    shopBtn.addEventListener(
      "click",
      () => {
        window.location.href =
          "shop.html";
      }
    );

  }

  if (cartBtn) {

    cartBtn.addEventListener(
      "click",
      openCart
    );

  }

  if (profileBtn) {

    profileBtn.addEventListener(
      "click",
      () => {
        window.location.href =
          "profile.html";
      }
    );

  }
}


/* =========================
   MODALS
========================= */

function setupModals() {

  const productModal =
    document.getElementById("productModal");

  const cartModal =
    document.getElementById("cartModal");

  const checkoutModal =
    document.getElementById("checkoutModal");

  window.addEventListener(
    "click",
    event => {

      if (
        event.target === productModal
      ) {
        closeProductModal();
      }

      if (
        event.target === cartModal
      ) {
        closeCart();
      }

      if (
        event.target === checkoutModal
      ) {
        closeCheckout();
      }

    }
  );
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   START APP
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderProducts(
      getAllProducts()
    );

    setupCategories();

    setupSearch();

    setupNavigation();

    setupModals();

    renderCart();

    const openCartBtn =
      document.getElementById(
        "openCartBtn"
      );

    if (openCartBtn) {

      openCartBtn.addEventListener(
        "click",
        openCart
      );

    }

    const checkoutBtn =
      document.getElementById(
        "checkoutBtn"
      );

    if (checkoutBtn) {

      checkoutBtn.addEventListener(
        "click",
        openCheckout
      );

    }

    const placeOrderBtn =
      document.getElementById(
        "placeOrderBtn"
      );

    if (placeOrderBtn) {

      placeOrderBtn.addEventListener(
        "click",
        placeOrder
      );

    }

  }
);
