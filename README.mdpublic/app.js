// ===============================
// QUICK MARKETPLACE - APP.JS
// ===============================

const products = [
  {
    id: 1,
    name: "Rice",
    price: 85000,
    shop: "Cap Shop",
    city: "Maiduguri",
    category: "Food",
    icon: "🍚"
  },
  {
    id: 2,
    name: "Beans",
    price: 70000,
    shop: "Cap Shop",
    city: "Maiduguri",
    category: "Food",
    icon: "🫘"
  },
  {
    id: 3,
    name: "Cooking Oil",
    price: 12000,
    shop: "Abba Store",
    city: "Maiduguri",
    category: "Food",
    icon: "🛢️"
  },
  {
    id: 4,
    name: "Soft Drink",
    price: 1000,
    shop: "City Drinks",
    city: "Maiduguri",
    category: "Drinks",
    icon: "🥤"
  },
  {
    id: 5,
    name: "T-Shirt",
    price: 8500,
    shop: "Fashion House",
    city: "Maiduguri",
    category: "Fashion",
    icon: "👕"
  },
  {
    id: 6,
    name: "Phone",
    price: 150000,
    shop: "Mobile World",
    city: "Maiduguri",
    category: "Electronics",
    icon: "📱"
  },
  {
    id: 7,
    name: "Shoes",
    price: 18000,
    shop: "Fashion House",
    city: "Maiduguri",
    category: "Fashion",
    icon: "👟"
  },
  {
    id: 8,
    name: "Plastic Chair",
    price: 7000,
    shop: "Home Store",
    city: "Maiduguri",
    category: "Household",
    icon: "🪑"
  }
];


// ===============================
// CART
// ===============================

let cart = JSON.parse(
  localStorage.getItem("quickMarketplaceCart") || "[]"
);

let selectedCategory = "All";


// ===============================
// FORMAT MONEY
// ===============================

function formatMoney(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}


// ===============================
// SAVE CART
// ===============================

function saveCart() {
  localStorage.setItem(
    "quickMarketplaceCart",
    JSON.stringify(cart)
  );
}


// ===============================
// DISPLAY PRODUCTS
// ===============================

function displayProducts() {

  const container =
    document.getElementById("productsContainer");

  const empty =
    document.getElementById("emptyProducts");

  const searchInput =
    document.getElementById("searchInput");

  if (!container) return;

  const searchText =
    searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

  let filtered = products.filter(product => {

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchText) ||
      product.shop.toLowerCase().includes(searchText) ||
      product.city.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });


  container.innerHTML = "";


  if (filtered.length === 0) {

    empty.classList.remove("hidden");

    return;
  }


  empty.classList.add("hidden");


  filtered.forEach(product => {

    const card =
      document.createElement("div");

    card.className = "product-card";


    card.innerHTML = `
      <div class="product-image">
        ${product.icon}
      </div>

      <div class="product-info">

        <div class="product-name">
          ${escapeHTML(product.name)}
        </div>

        <div class="product-shop">
          🏪 ${escapeHTML(product.shop)}
        </div>

        <div class="product-shop">
          📍 ${escapeHTML(product.city)}
        </div>

        <div class="product-price">
          ${formatMoney(product.price)}
        </div>

        <button
          class="primary-btn"
          onclick="openProduct(${product.id})"
        >
          View Product
        </button>

      </div>
    `;


    container.appendChild(card);
  });
}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ===============================
// OPEN PRODUCT
// ===============================

function openProduct(productId) {

  const product =
    products.find(item => item.id === productId);

  if (!product) return;


  const modal =
    document.getElementById("productModal");

  const details =
    document.getElementById("productDetails");


  details.innerHTML = `

    <div class="product-image">
      ${product.icon}
    </div>

    <h2 style="margin-top:16px;">
      ${escapeHTML(product.name)}
    </h2>

    <p style="margin-top:8px;color:#6b7280;">
      🏪 ${escapeHTML(product.shop)}
    </p>

    <p style="margin-top:5px;color:#6b7280;">
      📍 ${escapeHTML(product.city)}
    </p>

    <h2 style="margin-top:15px;color:#15803d;">
      ${formatMoney(product.price)}
    </h2>

    <button
      class="primary-btn full-btn"
      style="margin-top:18px;"
      onclick="addToCart(${product.id})"
    >
      🛒 Add to Cart
    </button>

  `;


  modal.classList.remove("hidden");
}


// ===============================
// ADD TO CART
// ===============================

function addToCart(productId) {

  const product =
    products.find(item => item.id === productId);

  if (!product) return;


  const existing =
    cart.find(item => item.id === productId);


  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      ...product,
      quantity: 1
    });

  }


  saveCart();

  updateCartUI();

  closeModal("productModal");

  alert(
    product.name + " has been added to your cart."
  );
}


// ===============================
// CART UI
// ===============================

function updateCartUI() {

  const countElement =
    document.getElementById("cartCount");

  if (!countElement) return;


  const count =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  countElement.textContent =
    count === 1
      ? "1 item"
      : `${count} items`;
}


// ===============================
// OPEN CART
// ===============================

function openCart() {

  const modal =
    document.getElementById("cartModal");

  const itemsContainer =
    document.getElementById("cartItems");

  const totalElement =
    document.getElementById("cartTotal");


  if (!modal || !itemsContainer) return;


  itemsContainer.innerHTML = "";


  if (cart.length === 0) {

    itemsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add products to continue.</p>
      </div>
    `;

    totalElement.textContent = "₦0";

    modal.classList.remove("hidden");

    return;
  }


  let total = 0;


  cart.forEach(item => {

    const itemTotal =
      item.price * item.quantity;

    total += itemTotal;


    const row =
      document.createElement("div");

    row.className = "cart-item";


    row.innerHTML = `

      <div style="font-size:35px;">
        ${item.icon}
      </div>

      <div class="cart-item-info">

        <div class="cart-item-name">
          ${escapeHTML(item.name)}
        </div>

        <div class="cart-item-price">
          ${formatMoney(item.price)}
        </div>

      </div>

      <div class="cart-controls">

        <button
          onclick="changeQuantity(${item.id}, -1)"
        >
          −
        </button>

        <strong>
          ${item.quantity}
        </strong>

        <button
          onclick="changeQuantity(${item.id}, 1)"
        >
          +
        </button>

      </div>

    `;


    itemsContainer.appendChild(row);
  });


  totalElement.textContent =
    formatMoney(total);


  modal.classList.remove("hidden");
}


// ===============================
// CHANGE QUANTITY
// ===============================

function changeQuantity(productId, change) {

  const item =
    cart.find(product => product.id === productId);

  if (!item) return;


  item.quantity += change;


  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product => product.id !== productId
      );

  }


  saveCart();

  updateCartUI();

  openCart();
}


// ===============================
// CHECKOUT
// ===============================

function openCheckout() {

  if (cart.length === 0) {

    alert("Your cart is empty.");

    return;
  }


  closeModal("cartModal");


  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );


  const checkoutTotal =
    document.getElementById("checkoutTotal");


  if (checkoutTotal) {

    checkoutTotal.textContent =
      formatMoney(total);

  }


  document
    .getElementById("checkoutModal")
    .classList.remove("hidden");
}


// ===============================
// PLACE ORDER
// ===============================

function placeOrder() {

  const name =
    document
      .getElementById("customerName")
      .value.trim();

  const phone =
    document
      .getElementById("customerPhone")
      .value.trim();

  const city =
    document
      .getElementById("deliveryCity")
      .value.trim();

  const address =
    document
      .getElementById("deliveryAddress")
      .value.trim();

  const message =
    document.getElementById("checkoutMessage");


  if (!name || !phone || !city || !address) {

    message.textContent =
      "Please fill in all delivery details.";

    return;
  }


  if (cart.length === 0) {

    message.textContent =
      "Your cart is empty.";

    return;
  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );


  const order = {

    id:
      "ORD-" +
      Date.now(),

    customerName: name,

    phone: phone,

    city: city,

    address: address,

    items: [...cart],

    total: total,

    status: "Pending",

    createdAt:
      new Date().toISOString()
  };


  const orders =
    JSON.parse(
      localStorage.getItem(
        "quickMarketplaceOrders"
      ) || "[]"
    );


  orders.push(order);


  localStorage.setItem(
    "quickMarketplaceOrders",
    JSON.stringify(orders)
  );


  cart = [];

  saveCart();

  updateCartUI();


  message.style.color = "#15803d";

  message.textContent =
    "Order placed successfully!";


  setTimeout(() => {

    closeModal("checkoutModal");

    message.textContent = "";

    message.style.color = "";

  }, 1800);
}


// ===============================
// CLOSE MODAL
// ===============================

function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (modal) {

    modal.classList.add("hidden");

  }
}


// ===============================
// CATEGORY FILTER
// ===============================

function setupCategories() {

  const buttons =
    document.querySelectorAll(
      ".category-btn"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          button.dataset.category;


        buttons.forEach(item => {

          item.classList.remove("active");

        });


        button.classList.add("active");


        displayProducts();

      }
    );

  });

}


// ===============================
// SEARCH
// ===============================

function setupSearch() {

  const input =
    document.getElementById(
      "searchInput"
    );


  if (!input) return;


  input.addEventListener(
    "input",
    displayProducts
  );
}


// ===============================
// BOTTOM NAVIGATION
// ===============================

function setupNavigation() {

  const buttons =
    document.querySelectorAll(
      ".nav-btn"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const page =
          button.dataset.page;


        if (page === "cart") {

          openCart();

          return;

        }


        if (page === "shop") {

          window.location.href =
            "shop.html";

          return;

        }


        if (page === "profile") {

          window.location.href =
            "profile.html";

          return;

        }


        if (page === "products") {

          window.scrollTo({
            top: document
              .querySelector(".products-grid")
              ?.offsetTop || 0,
            behavior: "smooth"
          });

          return;

        }


        if (page === "home") {

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }

      }
    );

  });

}


// ===============================
// MODALS
// ===============================

function setupModals() {

  const closeProduct =
    document.getElementById(
      "closeProductModal"
    );

  const closeCart =
    document.getElementById(
      "closeCartModal"
    );

  const closeCheckout =
    document.getElementById(
      "closeCheckoutModal"
    );


  if (closeProduct) {

    closeProduct.onclick = () =>
      closeModal("productModal");

  }


  if (closeCart) {

    closeCart.onclick = () =>
      closeModal("cartModal");

  }


  if (closeCheckout) {

    closeCheckout.onclick = () =>
      closeModal("checkoutModal");

  }


  document
    .getElementById("openCartBtn")
    ?.addEventListener(
      "click",
      openCart
    );


  document
    .getElementById("checkoutBtn")
    ?.addEventListener(
      "click",
      openCheckout
    );


  document
    .getElementById("placeOrderBtn")
    ?.addEventListener(
      "click",
      placeOrder
    );


  const viewAll =
    document.getElementById(
      "viewAllBtn"
    );


  if (viewAll) {

    viewAll.addEventListener(
      "click",
      () => {

        selectedCategory = "All";

        document
          .querySelectorAll(
            ".category-btn"
          )
          .forEach(button => {

            button.classList.remove(
              "active"
            );

          });


        document
          .querySelector(
            '[data-category="All"]'
          )
          ?.classList.add("active");


        displayProducts();

      }
    );

  }

}


// ===============================
// START APP
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    displayProducts();

    updateCartUI();

    setupCategories();

    setupSearch();

    setupNavigation();

    setupModals();

    document
      .querySelector(
        '[data-category="All"]'
      )
      ?.classList.add("active");

  }
);
