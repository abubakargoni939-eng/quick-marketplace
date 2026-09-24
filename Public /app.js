(() => {
  'use strict';

  const config = window.QM || {};
  const supabaseLib = window.supabase;

  const $ = (id) => document.getElementById(id);
  const state = {
    user: null,
    profile: null,
    admin: false,
    products: [],
    cart: [],
    settings: null
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function money(value) {
    return '₦' + Number(value || 0).toLocaleString('en-NG');
  }

  function message(text, error = false) {
    const el = $('msg');
    if (el) {
      el.textContent = text || '';
      el.style.color = error ? '#dc2626' : '#16a34a';
    }
  }

  function showError(text) {
    console.error(text);
    const box = $('adminBox');
    if (box && !state.user) {
      box.innerHTML = `<div class="card"><strong>App error:</strong><p>${esc(text)}</p></div>`;
    }
  }

  if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
    showError('Supabase library did not load. Check internet access and the Supabase CDN script.');
    return;
  }

  if (!config.url || !config.key) {
    showError('Supabase configuration is missing. In Render, add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
    return;
  }

  const db = supabaseLib.createClient(config.url, config.key);

  function setHidden(id, hidden) {
    const el = $(id);
    if (el) el.classList.toggle('hide', hidden);
  }

  function openAuth() {
    setHidden('modal', false);
    tab('signin');
  }

  function closeAuth() {
    setHidden('modal', true);
    message('');
  }

  function tab(name) {
    ['signup', 'signin', 'otp'].forEach((id) => setHidden(id, id !== name));
    message('');
  }

  function toggleCart() {
    const cart = $('cart');
    if (cart) cart.classList.toggle('open');
    renderCart();
  }

  window.openAuth = openAuth;
  window.closeAuth = closeAuth;
  window.tab = tab;
  window.toggleCart = toggleCart;

  function loadCart() {
    try {
      state.cart = JSON.parse(localStorage.getItem('qm_cart') || '[]') || [];
    } catch {
      state.cart = [];
    }
    renderCart();
  }

  function saveCart() {
    localStorage.setItem('qm_cart', JSON.stringify(state.cart));
  }

  function addToCart(id) {
    const product = state.products.find((p) => Number(p.id) === Number(id));
    if (!product) return;

    const existing = state.cart.find((x) => Number(x.id) === Number(id));
    if (existing) {
      existing.qty = Math.min(existing.qty + 1, Number(product.stock));
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: Number(product.stock),
        shop_id: product.shop_id,
        qty: 1
      });
    }

    saveCart();
    renderCart();
    $('cart')?.classList.add('open');
  }

  function changeQty(id, delta) {
    const item = state.cart.find((x) => Number(x.id) === Number(id));
    if (!item) return;
    item.qty = Math.max(0, Math.min(Number(item.stock), item.qty + delta));
    state.cart = state.cart.filter((x) => x.qty > 0);
    saveCart();
    renderCart();
  }

  window.add = addToCart;
  window.qty = changeQty;

  function renderCart() {
    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);

    if ($('count')) $('count').textContent = count;
    if ($('subtotal')) $('subtotal').textContent = money(total);

    if ($('cartItems')) {
      $('cartItems').innerHTML = state.cart.length
        ? state.cart.map((item) => `
          <div class="line">
            <span>${esc(item.name)}<br>${money(item.price)} × ${item.qty}</span>
            <span>
              <button type="button" onclick="qty(${item.id},-1)">−</button>
              <button type="button" onclick="qty(${item.id},1)">+</button>
            </span>
          </div>`).join('')
        : '<p class="muted">Cart empty</p>';
    }
  }

  async function loadSettings() {
    const { data, error } = await db.from('app_settings').select('*').limit(1).maybeSingle();
    if (error) {
      console.warn('Settings:', error.message);
      state.settings = {};
      return;
    }
    state.settings = data || {};
  }

  async function loadProducts() {
    const grid = $('productsGrid');
    if (grid) grid.innerHTML = '<div class="card">Loading products...</div>';

    const { data, error } = await db
      .from('products')
      .select('id,shop_id,name,description,price,image_url,stock,is_available,category,shops(id,name,city,commission_per_item,minimum_order_quantity)')
      .eq('is_available', true)
      .gt('stock', 0)
      .order('created_at', { ascending: false });

    if (error) {
      if (grid) grid.innerHTML = `<div class="card">${esc(error.message)}</div>`;
      return;
    }

    state.products = data || [];
    renderProducts();
  }

  function renderProducts() {
    const grid = $('productsGrid');
    if (!grid) return;

    const query = ($('search')?.value || '').trim().toLowerCase();
    const list = state.products.filter((p) =>
      `${p.name} ${p.category || ''} ${p.description || ''} ${p.shops?.name || ''}`.toLowerCase().includes(query)
    );

    grid.innerHTML = list.length
      ? list.map((p) => `
        <article class="product">
          <div class="pic">
            ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover">` : 'No image'}
          </div>
          <div class="body">
            <h3>${esc(p.name)}</h3>
            <div class="muted">${esc(p.shops?.name || 'Shop')} • ${esc(p.category || 'Other')}</div>
            <p>${esc(p.description || '')}</p>
            <div class="price">${money(p.price)}</div>
            <div class="muted">Stock ${p.stock}</div>
            <button type="button" onclick="add(${p.id})">Add to cart</button>
          </div>
        </article>`).join('')
      : '<div class="card">No products found.</div>';
  }

  async function refreshUser(user) {
    state.user = user || null;
    state.profile = null;
    state.admin = false;

    if (state.user) {
      const { data: profile } = await db.from('profiles').select('*').eq('id', state.user.id).maybeSingle();
      state.profile = profile || {
        full_name: state.user.user_metadata?.full_name || state.user.email,
        role: state.user.user_metadata?.role || 'customer'
      };

      const { data: admin } = await db.from('admin_users').select('user_id').eq('user_id', state.user.id).maybeSingle();
      state.admin = !!admin;
    }

    $('who').textContent = state.user ? (state.profile?.full_name || state.user.email) : 'Guest';
    setHidden('login', !!state.user);
    setHidden('logout', !state.user);
    setHidden('adminLink', !state.admin);

    await Promise.all([loadOrders(), renderDashboard(), renderAdmin()]);
  }

  async function signUp(event) {
    event.preventDefault();
    message('Creating account...');

    const { data, error } = await db.auth.signUp({
      email: $('se').value.trim(),
      password: $('sp').value,
      options: {
        data: {
          full_name: $('sn').value.trim(),
          role: $('sr').value
        }
      }
    });

    if (error) return message(error.message, true);

    if (data.session) {
      await refreshUser(data.user);
      closeAuth();
      return;
    }

    message('Account created. Check your email to confirm your account.');
  }

  async function signIn(event) {
    event.preventDefault();
    message('Logging in...');

    const { data, error } = await db.auth.signInWithPassword({
      email: $('le').value.trim(),
      password: $('lp').value
    });

    if (error) return message(error.message, true);
    await refreshUser(data.user);
    closeAuth();
  }

  async function sendOTP() {
    const email = $('oe').value.trim();
    if (!email) return message('Enter your email.', true);

    const { error } = await db.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    message(error ? error.message : 'OTP sent. Check your email.', !!error);
  }

  async function verifyOTP() {
    const email = $('oe').value.trim();
    const token = $('oc').value.trim();
    if (!email || !token) return message('Enter your email and OTP.', true);

    const { data, error } = await db.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return message(error.message, true);

    await refreshUser(data.user);
    closeAuth();
  }

  window.sendOTP = sendOTP;
  window.verifyOTP = verifyOTP;

  async function logout() {
    await db.auth.signOut();
    state.user = null;
    state.profile = null;
    state.admin = false;
    await refreshUser(null);
  }

  async function checkout() {
    if (!state.user) return openAuth();
    if (!state.cart.length) return alert('Your cart is empty.');

    const city = $('city').value.trim();
    const address = $('address').value.trim();
    if (!city || !address) return alert('Enter delivery address and city.');

    const shopIds = [...new Set(state.cart.map((x) => Number(x.shop_id)))];
    if (shopIds.length !== 1) return alert('Please order from one shop at a time.');

    const { data: shop, error: shopError } = await db.from('shops').select('*').eq('id', shopIds[0]).single();
    if (shopError) return alert(shopError.message);

    const quantity = state.cart.reduce((sum, x) => sum + x.qty, 0);
    const minimum = Number(shop.minimum_order_quantity || 1);
    if (quantity < minimum) return alert(`Minimum order: ${minimum}`);

    if ($('dtype').value === 'quick' && state.settings?.quick_delivery === false) {
      return alert('Quick Delivery is currently disabled.');
    }

    const subtotal = state.cart.reduce((sum, x) => sum + x.price * x.qty, 0);
    const commission = state.cart.reduce((sum, x) => sum + Number(shop.commission_per_item || 0) * x.qty, 0);
    const total = subtotal + commission;

    const { data: order, error: orderError } = await db.from('orders').insert({
      customer_id: state.user.id,
      shop_id: shop.id,
      subtotal,
      commission,
      vendor_amount: subtotal,
      delivery_fee: 0,
      total,
      status: 'pending',
      delivery_address: `${address}, ${city}`
    }).select().single();

    if (orderError) return alert(orderError.message);

    const items = state.cart.map((x) => ({
      order_id: order.id,
      product_id: x.id,
      quantity: x.qty,
      unit_price: x.price,
      total_price: x.price * x.qty
    }));

    const { error: itemError } = await db.from('order_items').insert(items);
    if (itemError) {
      await db.from('orders').delete().eq('id', order.id);
      return alert(itemError.message);
    }

    for (const item of state.cart) {
      const product = state.products.find((p) => Number(p.id) === Number(item.id));
      if (!product) continue;
      const newStock = Math.max(0, Number(product.stock) - Number(item.qty));
      await db.from('products').update({ stock: newStock, is_available: newStock > 0 }).eq('id', item.id);
    }

    state.cart = [];
    saveCart();
    renderCart();
    $('address').value = '';
    $('city').value = '';

    await loadProducts();
    await loadOrders();
    alert(`Order #${order.id} created successfully.`);
    location.hash = 'orders';
  }

  window.checkout = checkout;

  async function loadOrders() {
    const list = $('ordersList');
    if (!list) return;

    if (!state.user) {
      list.innerHTML = '<div class="card">Login to see orders.</div>';
      return;
    }

    const { data, error } = await db.from('orders')
      .select('id,shop_id,subtotal,commission,delivery_fee,total,status,delivery_address,created_at,shops(name,city),order_items(id,product_id,quantity,unit_price,total_price)')
      .eq('customer_id', state.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      list.innerHTML = `<div class="card">${esc(error.message)}</div>`;
      return;
    }

    list.innerHTML = data?.length
      ? data.map((o) => `
        <div class="order">
          <b>Order #${o.id}</b>
          <span class="muted"> ${esc(o.status || 'pending')}</span>
          <p>${esc(o.shops?.name || 'Shop')} • ${money(o.total)}</p>
          <p class="muted">${esc(o.delivery_address || '')}</p>
          <small>${new Date(o.created_at).toLocaleString('en-NG')}</small>
        </div>`).join('')
      : '<div class="card">No orders.</div>';
  }

  async function renderDashboard() {
    const dash = $('dash');
    if (!dash) return;
    if (!state.user) {
      dash.innerHTML = '<div class="card">Login first.</div>';
      return;
    }

    const role = state.profile?.role || 'customer';
    let html = `<div class="dashgrid"><div class="card"><h3>Profile</h3><p>${esc(state.profile?.full_name || state.user.email)}</p><p class="muted">Role: ${esc(role)}</p></div>`;

    if (role === 'shop_owner') html += ownerPanel();
    if (role === 'delivery') html += '<div class="card"><h3>Delivery</h3><div id="jobs">Loading...</div></div>';
    html += '</div>';
    dash.innerHTML = html;

    if (role === 'shop_owner') await loadOwner();
    if (role === 'delivery') await loadJobs();
  }

  function ownerPanel() {
    return `<div class="card"><h3>Create shop</h3><form id="shopForm"><input id="shopN" placeholder="Shop name" required><input id="shopC" placeholder="City" required><input id="shopA" placeholder="Address" required><input id="shopP" placeholder="Phone"><input id="shopFee" type="number" min="0" placeholder="Commission per item (₦)" required><input id="shopMin" type="number" min="1" value="1" placeholder="Minimum order" required><button>Create shop</button></form></div><div class="card"><h3>Add product</h3><form id="prodForm"><select id="ps" required></select><input id="pn" placeholder="Product name" required><input id="pp" type="number" min="0" placeholder="Price" required><input id="pq" type="number" min="0" value="1" placeholder="Stock" required><input id="pc" placeholder="Category"><input id="pd" placeholder="Description"><button>Add product</button></form></div><div class="card"><h3>My shops</h3><div id="myshops"></div></div>`;
  }

  async function loadOwner() {
    const { data, error } = await db.from('shops').select('*').eq('owner_id', state.user.id).order('created_at', { ascending: false });
    if (error) return alert(error.message);

    $('myshops').innerHTML = data?.length
      ? data.map((s) => `<div class="order"><b>${esc(s.name)}</b><div>${esc(s.city)} • ${money(s.commission_per_item)} per item • min ${s.minimum_order_quantity}</div></div>`).join('')
      : '<p class="muted">No shop yet.</p>';

    $('ps').innerHTML = (data || []).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');

    $('shopForm').onsubmit = async (e) => {
      e.preventDefault();
      const commission = Number($('shopFee').value);
      const minimum = Number($('shopMin').value);
      if (!Number.isFinite(commission) || commission < 0 || !Number.isInteger(minimum) || minimum < 1) return alert('Enter valid commission and minimum order.');

      const { error: insertError } = await db.from('shops').insert({
        owner_id: state.user.id,
        name: $('shopN').value.trim(),
        city: $('shopC').value.trim(),
        address: $('shopA').value.trim(),
        phone: $('shopP').value.trim(),
        commission_per_item: commission,
        minimum_order_quantity: minimum
      });
      alert(insertError ? insertError.message : 'Shop created successfully.');
      if (!insertError) await renderDashboard();
    };

    $('prodForm').onsubmit = async (e) => {
      e.preventDefault();
      if (!$('ps').value) return alert('Create a shop first.');
      const stock = Number($('pq').value);
      const price = Number($('pp').value);
      if (!Number.isInteger(stock) || stock < 0 || !Number.isFinite(price) || price < 0) return alert('Enter valid price and stock.');

      const { error: insertError } = await db.from('products').insert({
        shop_id: Number($('ps').value),
        name: $('pn').value.trim(),
        price,
        stock,
        category: $('pc').value.trim() || 'Other',
        description: $('pd').value.trim(),
        is_available: stock > 0
      });
      alert(insertError ? insertError.message : 'Product added successfully.');
      if (!insertError) await loadProducts();
    };
  }

  async function loadJobs() {
    const jobs = $('jobs');
    if (!jobs) return;
    const { data, error } = await db.from('delivery_assignments').select('id,order_id,status,assigned_at,orders(id,total,delivery_address)').eq('delivery_person_id', state.user.id).order('created_at', { ascending: false });
    jobs.innerHTML = error
      ? `<p>${esc(error.message)}</p>`
      : data?.length
        ? data.map((j) => `<div class="order"><b>Order #${j.orders?.id || j.order_id}</b><p>${esc(j.orders?.delivery_address || '')}</p><span>${esc(j.status)}</span></div>`).join('')
        : '<p class="muted">No delivery jobs.</p>';
  }

  async function renderAdmin() {
    const box = $('adminBox');
    if (!box) return;
    if (!state.admin) {
      box.innerHTML = '<div class="card">Admin access only.</div>';
      return;
    }

    const s = state.settings || {};
    box.innerHTML = `<div class="dashgrid"><div class="card"><h3>Settings</h3><label>Quick Delivery<select id="qd"><option value="true">Enabled</option><option value="false">Disabled</option></select></label><label>Minutes<input id="qm" type="number" min="1" value="${Number(s.quick_delivery_minutes || 30)}"></label><button id="saveAdminBtn">Save</button></div><div class="card"><h3>Routes</h3><form id="rf"><input id="rf1" placeholder="From city" required><input id="rf2" placeholder="To city" required><input id="rd" type="number" min="0" placeholder="Days" required><input id="rfee" type="number" min="0" placeholder="Fee" required><button>Add route</button></form><div id="routes"></div></div></div>`;
    $('qd').value = s.quick_delivery === false ? 'false' : 'true';

    $('saveAdminBtn').onclick = async () => {
      if (!s.id) return alert('app_settings row not found.');
      const { error } = await db.from('app_settings').update({ quick_delivery: $('qd').value === 'true', quick_delivery_minutes: Number($('qm').value) }).eq('id', s.id);
      alert(error ? error.message : 'Settings saved.');
      if (!error) await loadSettings();
    };

    await loadRoutes();
    $('rf').onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await db.from('delivery_routes').insert({
        from_city: $('rf1').value.trim(),
        to_city: $('rf2').value.trim(),
        estimated_days: Number($('rd').value),
        delivery_fee: Number($('rfee').value),
        is_active: true
      });
      alert(error ? error.message : 'Route added successfully.');
      if (!error) await loadRoutes();
    };
  }

  async function loadRoutes() {
    const el = $('routes');
    if (!el) return;
    const { data, error } = await db.from('delivery_routes').select('*').order('created_at', { ascending: false });
    el.innerHTML = error
      ? `<p>${esc(error.message)}</p>`
      : (data || []).map((r) => `<div class="order"><b>${esc(r.from_city)} → ${esc(r.to_city)}</b><div>${r.estimated_days} days • ${money(r.delivery_fee)}</div></div>`).join('') || '<p class="muted">No routes.</p>';
  }

  async function renderAll() {
    renderProducts();
    renderCart();
    await loadOrders();
    await renderDashboard();
    await renderAdmin();
  }

  $('search')?.addEventListener('input', renderProducts);
  $('login')?.addEventListener('click', openAuth);
  $('logout')?.addEventListener('click', logout);
  $('signup')?.addEventListener('submit', signUp);
  $('signin')?.addEventListener('submit', signIn);

  db.auth.onAuthStateChange((_event, session) => {
    // Do not make Supabase calls inside this callback; schedule them after the auth lock is released.
    setTimeout(() => refreshUser(session?.user || null), 0);
  });

  async function boot() {
    loadCart();
    await loadSettings();
    await loadProducts();
    const { data, error } = await db.auth.getSession();
    if (error) console.warn('Session:', error.message);
    await refreshUser(data?.session?.user || null);
  }

  boot().catch((error) => {
    console.error(error);
    showError(error.message || 'Application failed to start.');
  });
})();
