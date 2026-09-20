const ORDERS_KEY = "quickMarketplaceOrders";
const CART_KEY = "quickMarketplaceCart";

function goHome() {
  window.location.href = "index.html";
}

function openShop() {
  window.location.href = "shop.html";
}

function goProducts() {
  window.location.href = "index.html#products";
}

function goCart() {
  window.location.href = "index.html#cart";
}

function openOrders() {
  const ordersContainer =
    document.getElementById("ordersContainer");

  if (!ordersContainer) return;

  renderOrders(ordersContainer);

  ordersContainer.scrollIntoView({
    behavior: "smooth"
  });
}

function getOrders() {
  return JSON.parse(
    localStorage.getItem(ORDERS_KEY) || "[]"
  );
}

function renderOrders(container) {
  const orders = getOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <p>No orders yet.</p>
    `;
    return;
  }

  container.innerHTML = orders
    .slice()
    .reverse()
    .map((order, index) => {
      const total = Number(order.total || 0);

      return `
        <div class="order-card">
          <h3>Order #${orders.length - index}</h3>

          <p>
            <strong>Customer:</strong>
            ${escapeHTML(order.customerName || "Customer")}
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHTML(order.customerPhone || "")}
          </p>

          <p>
            <strong>Delivery city:</strong>
            ${escapeHTML(order.deliveryCity || "")}
          </p>

          <p>
            <strong>Address:</strong>
            ${escapeHTML(order.deliveryAddress || "")}
          </p>

          <p>
            <strong>Total:</strong>
            ₦${total.toLocaleString()}
          </p>

          <p>
            <strong>Status:</strong>
            ${escapeHTML(order.status || "Pending")}
          </p>
        </div>
      `;
    })
    .join("");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  const ordersContainer =
    document.getElementById("ordersContainer");

  if (ordersContainer) {
    renderOrders(ordersContainer);
  }
});
