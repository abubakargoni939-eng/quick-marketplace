const SHOPS_KEY = "quickMarketplaceShops";
const PRODUCTS_KEY = "quickMarketplaceShopProducts";
const CURRENT_SHOP_KEY = "quickMarketplaceCurrentShop";

function getShops() {
  return JSON.parse(localStorage.getItem(SHOPS_KEY) || "[]");
}

function saveShops(shops) {
  localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
}

function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getCurrentShop() {
  const shopId = localStorage.getItem(CURRENT_SHOP_KEY);
  if (!shopId) return null;

  const shops = getShops();
  return shops.find(shop => shop.id === shopId) || null;
}

function createShop() {
  const name = document.getElementById("shopName").value.trim();
  const owner = document.getElementById("shopOwner").value.trim();
  const city = document.getElementById("shopCity").value.trim();

  const commissionInput =
    document.getElementById("shopCommission").value.trim();

  const message = document.getElementById("shopMessage");

  if (!name || !owner || !city || commissionInput === "") {
    message.textContent =
      "Please fill all fields, including commission.";
    return;
  }

  const commission = Number(commissionInput);

  if (!Number.isFinite(commission) || commission < 0) {
    message.textContent =
      "Commission must be a valid number.";
    return;
  }

  const shops = getShops();

  const shop = {
    id: "shop_" + Date.now(),
    name,
    owner,
    city,
    commission,
    createdAt: new Date().toISOString()
  };

  shops.push(shop);
  saveShops(shops);

  localStorage.setItem(CURRENT_SHOP_KEY, shop.id);

  message.textContent =
    "Shop created successfully.";

  document.getElementById("shopName").value = "";
  document.getElementById("shopOwner").value = "";
  document.getElementById("shopCity").value = "";
  document.getElementById("shopCommission").value = "";

  renderMyShop();
  renderMyProducts();
}

function addProduct() {
  const shop = getCurrentShop();
  const message = document.getElementById("productMessage");

  if (!shop) {
    message.textContent =
      "Please create a shop first.";
    return;
  }

  const name =
    document.getElementById("productName").value.trim();

  const price =
    Number(document.getElementById("productPrice").value);

  const category =
    document.getElementById("productCategory").value;

  const minimumQuantity =
    Number(document.getElementById("minimumQuantity").value);

  const availableQuantity =
    Number(document.getElementById("availableQuantity").value);

  if (!name || !category) {
    message.textContent =
      "Please fill all product fields.";
    return;
  }

  if (!Number.isFinite(price) || price <= 0) {
    message.textContent =
      "Enter a valid product price.";
    return;
  }

  if (
    !Number.isInteger(minimumQuantity) ||
    minimumQuantity < 1
  ) {
    message.textContent =
      "Minimum quantity must be at least 1.";
    return;
  }

  if (
    !Number.isInteger(availableQuantity) ||
    availableQuantity < minimumQuantity
  ) {
    message.textContent =
      "Available quantity must be at least the minimum quantity.";
    return;
  }

  const products = getProducts();

  const product = {
    id: "product_" + Date.now(),
    shopId: shop.id,
    shopName: shop.name,
    shopCity: shop.city,
    name,
    price,
    category,
    minimumQuantity,
    availableQuantity,
    commission: shop.commission,
    createdAt: new Date().toISOString()
  };

  products.push(product);
  saveProducts(products);

  message.textContent =
    "Product added successfully.";

  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productCategory").value = "";
  document.getElementById("minimumQuantity").value = "";
  document.getElementById("availableQuantity").value = "";

  renderMyProducts();
}

function renderMyShop() {
  const container =
    document.getElementById("myShop");

  const shop = getCurrentShop();

  if (!shop) {
    container.innerHTML =
      "<p>No shop created yet.</p>";
    return;
  }

  container.innerHTML = `
    <div class="shop-info">
      <h3>${escapeHTML(shop.name)}</h3>
      <p>Owner: ${escapeHTML(shop.owner)}</p>
      <p>City: ${escapeHTML(shop.city)}</p>
      <p>App commission per item: ₦${shop.commission.toLocaleString()}</p>
    </div>
  `;
}

function renderMyProducts() {
  const container =
    document.getElementById("myProducts");

  const shop = getCurrentShop();

  if (!shop) {
    container.innerHTML =
      "<p>Create a shop first.</p>";
    return;
  }

  const products =
    getProducts().filter(product =>
      product.shopId === shop.id
    );

  if (products.length === 0) {
    container.innerHTML =
      "<p>No products added yet.</p>";
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-row">
      <div>
        <strong>${escapeHTML(product.name)}</strong>
        <p>₦${product.price.toLocaleString()}</p>
        <small>
          Minimum: ${product.minimumQuantity}
          | Available: ${product.availableQuantity}
        </small>
      </div>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function goHome() {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  renderMyShop();
  renderMyProducts();

  const createShopBtn =
    document.getElementById("createShopBtn");

  const addProductBtn =
    document.getElementById("addProductBtn");

  if (createShopBtn) {
    createShopBtn.addEventListener(
      "click",
      createShop
    );
  }

  if (addProductBtn) {
    addProductBtn.addEventListener(
      "click",
      addProduct
    );
  }
});
