const state = {
  cart: [],
  activePlatform: 'all',
  activeCategory: 'all',
  currentPage: 'home',
  currentRestaurant: null,
  favourites: new Set([2, 4]),
  appliedCoupon: null,
  orderAddress: '123, Urban Street, Jalandhar, Punjab – 144001',
  deliveryFee: 30,
  chatOpen: false,
};

// ── INIT ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      initApp();
    }, 500);
  }, 1800);
});

function initApp() {
  renderPlatforms();
  renderCategories();
  renderPromos();
  renderRestaurants();
  renderOrders();
  renderFavourites();
  renderProfile();
  renderOffers();
  bindEvents();
  updateCartBadge();
}

// ── RENDER PLATFORMS ───────────────────────────────────────────────
function renderPlatforms() {
  const row = document.getElementById('platformRow');
  row.innerHTML = PLATFORMS.map(p => `
    <button class="platform-card ${state.activePlatform === p.id ? 'active' : ''}"
            data-id="${p.id}" onclick="selectPlatform('${p.id}')">
      <div class="platform-icon" style="background:${p.color}22; color:${p.color};">${p.icon}</div>
      <span class="platform-name">${p.name}</span>
    </button>
  `).join('');
}

// ── RENDER CATEGORIES ──────────────────────────────────────────────
function renderCategories() {
  const row = document.getElementById('categoryRow');
  row.innerHTML = CATEGORIES.map(c => `
    <button class="cat-pill ${state.activeCategory === c.id ? 'active' : ''}"
            data-id="${c.id}" onclick="selectCategory('${c.id}')">
      <span>${c.icon}</span> ${c.label}
    </button>
  `).join('');
}

// ── RENDER PROMOS ──────────────────────────────────────────────────
function renderPromos() {
  const row = document.getElementById('promoRow');
  row.innerHTML = PROMOS.map(p => `
    <div class="promo-card" style="background: linear-gradient(135deg, ${p.color}, ${p.color}cc)">
      <div class="promo-icon">${p.icon}</div>
      <div class="promo-info">
        <h4>${p.title}</h4>
        <p>${p.sub}</p>
        <span class="promo-code">${p.code}</span>
      </div>
    </div>
  `).join('');
}

// ── RENDER RESTAURANTS ─────────────────────────────────────────────
function renderRestaurants(filter = '') {
  let list = RESTAURANTS;

  if (state.activePlatform !== 'all') {
    list = list.filter(r => r.platforms.includes(state.activePlatform));
  }
  if (state.activeCategory !== 'all') {
    list = list.filter(r => r.categories.includes(state.activeCategory));
  }
  if (filter) {
    const q = filter.toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      r.menu.some(m => m.name.toLowerCase().includes(q))
    );
  }

  const title = document.getElementById('restaurantSectionTitle');
  if (state.activePlatform !== 'all') {
    const p = PLATFORMS.find(x => x.id === state.activePlatform);
    title.textContent = `Restaurants on ${p.name}`;
  } else if (state.activeCategory !== 'all') {
    const c = CATEGORIES.find(x => x.id === state.activeCategory);
    title.textContent = `${c.icon} ${c.label} Restaurants`;
  } else {
    title.textContent = 'Top Restaurants';
  }

  const grid = document.getElementById('restaurantGrid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">😔 No restaurants found.<br><small>Try a different filter or search.</small></div>`;
    return;
  }
  grid.innerHTML = list.map(r => restaurantCard(r)).join('');
}

function restaurantCard(r) {
  const isFav = state.favourites.has(r.id);
  return `
    <div class="rest-card" onclick="openRestaurant(${r.id})">
      <div class="rest-card-top" style="background:${r.bg}">
        <span class="rest-emoji">${r.image}</span>
        ${r.offer ? `<div class="rest-offer-tag">${r.offer}</div>` : ''}
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavourite(event, ${r.id})">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="rest-card-body">
        <div class="rest-name-row">
          <h4>${r.name}</h4>
          <div class="rest-rating">⭐ ${r.rating}</div>
        </div>
        <p class="rest-cuisine">${r.cuisine}</p>
        <div class="rest-meta">
          <span>⏱ ${r.time}</span>
          <span class="dot">·</span>
          <span>📍 ${r.distance}</span>
          <span class="dot">·</span>
          <span>${r.price}</span>
        </div>
        <div class="rest-tags">
          ${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── OPEN RESTAURANT ────────────────────────────────────────────────
function openRestaurant(id) {
  const r = RESTAURANTS.find(x => x.id === id);
  if (!r) return;
  state.currentRestaurant = r;
  document.getElementById('restaurantPageName').textContent = r.name;

  // Group menu by category
  const groups = {};
  r.menu.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  const isFav = state.favourites.has(r.id);

  let html = `
    <div class="rdet-hero" style="background:${r.bg}">
      <div class="rdet-emoji">${r.image}</div>
      <div class="rdet-info">
        <h2>${r.name}</h2>
        <p>${r.cuisine}</p>
        <div class="rdet-meta">
          <span>⭐ ${r.rating} (${r.reviews} reviews)</span>
          <span>⏱ ${r.time}</span>
          <span>📍 ${r.distance}</span>
        </div>
        ${r.offer ? `<div class="rdet-offer">${r.offer}</div>` : ''}
      </div>
      <button class="rdet-fav ${isFav ? 'active' : ''}" onclick="toggleFavourite(event, ${r.id}); this.classList.toggle('active');">
        ${isFav ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="menu-container">
  `;

  Object.entries(groups).forEach(([cat, items]) => {
    html += `<div class="menu-section"><h3 class="menu-cat">${cat}</h3>`;
    items.forEach(item => {
      const qty = getCartQty(item.id);
      html += `
        <div class="menu-item" id="mi-${item.id}">
          <div class="menu-item-left">
            <div class="veg-badge ${item.veg ? 'veg' : 'nonveg'}"></div>
            <div class="menu-item-info">
              <div class="menu-item-name">
                ${item.name}
                ${item.bestseller ? '<span class="best-badge">🏆 Bestseller</span>' : ''}
              </div>
              <div class="menu-item-desc">${item.desc}</div>
              <div class="menu-item-price">₹${item.price}</div>
            </div>
          </div>
          <div class="menu-item-right">
            <div class="menu-item-img">${item.image}</div>
            ${qty === 0
              ? `<button class="add-btn" onclick="addToCart(${r.id}, ${item.id}, event)">+ ADD</button>`
              : `<div class="qty-ctrl">
                  <button onclick="changeQty(${item.id}, -1, event)">−</button>
                  <span>${qty}</span>
                  <button onclick="changeQty(${item.id}, 1, event)">+</button>
                 </div>`
            }
          </div>
        </div>
      `;
    });
    html += `</div>`;
  });

  html += `</div>`;

  if (state.cart.length) {
    const total = getCartTotal();
    html += `
      <div class="view-cart-bar" onclick="showPage('cart')">
        <span>${state.cart.reduce((s, x) => s + x.qty, 0)} items · ₹${total}</span>
        <span>View Cart →</span>
      </div>
    `;
  }

  document.getElementById('restaurantDetail').innerHTML = html;
  showPage('restaurant');
}

// ── CART OPERATIONS ────────────────────────────────────────────────
function addToCart(restaurantId, itemId, e) {
  if (e) e.stopPropagation();
  const r = RESTAURANTS.find(x => x.id === restaurantId);
  const item = r.menu.find(x => x.id === itemId);

  // Check if mixing restaurants
  if (state.cart.length && state.cart[0].restaurantId !== restaurantId) {
    showConfirmDialog(
      'Replace Cart?',
      `Your cart has items from "${RESTAURANTS.find(x => x.id === state.cart[0].restaurantId)?.name}". Adding this will clear it.`,
      () => {
        state.cart = [];
        pushToCart(restaurantId, item);
      }
    );
    return;
  }

  pushToCart(restaurantId, item);
}

function pushToCart(restaurantId, item) {
  const existing = state.cart.find(x => x.id === item.id);
  if (existing) {
    existing.qty++;
  } else {
    state.cart.push({ ...item, qty: 1, restaurantId });
  }
  toast(`🛒 ${item.name} added!`, '#00A859');
  updateCartBadge();
  refreshMenuItemControls(item.id);
  updateViewCartBar();
}

function changeQty(itemId, delta, e) {
  if (e) e.stopPropagation();
  const idx = state.cart.findIndex(x => x.id === itemId);
  if (idx === -1) return;
  state.cart[idx].qty += delta;
  if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
  updateCartBadge();
  refreshMenuItemControls(itemId);
  updateViewCartBar();
  if (document.getElementById('page-cart').classList.contains('active')) renderCartPage();
}

function getCartQty(itemId) {
  const c = state.cart.find(x => x.id === itemId);
  return c ? c.qty : 0;
}

function getCartTotal() {
  return state.cart.reduce((s, x) => s + x.price * x.qty, 0);
}

function updateCartBadge() {
  const total = state.cart.reduce((s, x) => s + x.qty, 0);
  document.getElementById('cartBadge').textContent = total;
  document.getElementById('cartBadge').style.display = total > 0 ? 'flex' : 'none';
}

function refreshMenuItemControls(itemId) {
  const qty = getCartQty(itemId);
  const el = document.getElementById(`mi-${itemId}`);
  if (!el) return;
  const right = el.querySelector('.menu-item-right');
  const img = right.querySelector('.menu-item-img').outerHTML;
  const rId = state.currentRestaurant?.id;
  right.innerHTML = img + (qty === 0
    ? `<button class="add-btn" onclick="addToCart(${rId}, ${itemId}, event)">+ ADD</button>`
    : `<div class="qty-ctrl">
        <button onclick="changeQty(${itemId}, -1, event)">−</button>
        <span>${qty}</span>
        <button onclick="changeQty(${itemId}, 1, event)">+</button>
       </div>`
  );
}

function updateViewCartBar() {
  const existing = document.querySelector('.view-cart-bar');
  if (state.cart.length && document.getElementById('page-restaurant').classList.contains('active')) {
    const total = getCartTotal();
    const count = state.cart.reduce((s, x) => s + x.qty, 0);
    const bar = existing || (() => {
      const b = document.createElement('div');
      b.className = 'view-cart-bar';
      b.onclick = () => showPage('cart');
      document.getElementById('restaurantDetail').appendChild(b);
      return b;
    })();
    bar.innerHTML = `<span>${count} items · ₹${total}</span><span>View Cart →</span>`;
  } else if (existing) {
    existing.remove();
  }
}

// ── RENDER CART PAGE ───────────────────────────────────────────────
function renderCartPage() {
  const el = document.getElementById('cartContent');
  if (!state.cart.length) {
    el.innerHTML = `
      <div class="empty-state large">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some delicious food to get started!</p>
        <button class="btn-primary" onclick="goHome()">Browse Restaurants</button>
      </div>`;
    return;
  }

  const r = RESTAURANTS.find(x => x.id === state.cart[0].restaurantId);
  let subtotal = getCartTotal();
  let discount = 0;
  let deliveryFee = state.deliveryFee;

  if (state.appliedCoupon) {
    const c = COUPONS.find(x => x.code === state.appliedCoupon);
    if (c) {
      if (c.type === 'percent') discount = Math.floor(subtotal * c.discount / 100);
      else if (c.type === 'flat') discount = c.discount;
      else if (c.type === 'delivery') deliveryFee = 0;
    }
  }

  const total = subtotal - discount + deliveryFee;

  el.innerHTML = `
    <div class="cart-restaurant-tag">
      <span>${r?.image || '🍽️'} ${r?.name || 'Restaurant'}</span>
      <span class="cart-platform-tag">${r?.platforms.filter(p => p !== 'all')[0]?.toUpperCase() || ''}</span>
    </div>

    <div class="cart-items">
      ${state.cart.map(item => `
        <div class="cart-item">
          <div class="veg-badge ${item.veg ? 'veg' : 'nonveg'} sm"></div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price}</div>
          </div>
          <div class="qty-ctrl">
            <button onclick="changeQty(${item.id}, -1, event)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${item.id}, 1, event)">+</button>
          </div>
          <div class="cart-item-total">₹${item.price * item.qty}</div>
        </div>
      `).join('')}
    </div>

    <div class="cart-address-box">
      <div class="cart-section-label">📍 Delivery Address</div>
      <p>${state.orderAddress}</p>
      <button class="link-btn" onclick="changeAddress()">Change</button>
    </div>

    <div class="coupon-box">
      <div class="cart-section-label">🏷️ Apply Coupon</div>
      <div class="coupon-row">
        <input type="text" id="couponInput" placeholder="Enter coupon code" value="${state.appliedCoupon || ''}"/>
        <button onclick="applyCoupon()">${state.appliedCoupon ? 'Remove' : 'Apply'}</button>
      </div>
      ${state.appliedCoupon ? `<div class="coupon-applied">✅ ${state.appliedCoupon} applied!</div>` : ''}
    </div>

    <div class="bill-box">
      <div class="cart-section-label">🧾 Bill Details</div>
      <div class="bill-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
      ${discount > 0 ? `<div class="bill-row green"><span>Discount</span><span>− ₹${discount}</span></div>` : ''}
      <div class="bill-row"><span>Delivery Fee</span><span>${deliveryFee === 0 ? '<del>₹30</del> FREE' : '₹' + deliveryFee}</span></div>
      <div class="bill-row total"><span>Grand Total</span><span>₹${total}</span></div>
    </div>

    <button class="btn-primary full" onclick="showPage('checkout')">Proceed to Checkout · ₹${total}</button>
  `;
}

// ── CHECKOUT PAGE ──────────────────────────────────────────────────
function renderCheckoutPage() {
  let subtotal = getCartTotal();
  let discount = 0;
  let deliveryFee = state.deliveryFee;
  if (state.appliedCoupon) {
    const c = COUPONS.find(x => x.code === state.appliedCoupon);
    if (c) {
      if (c.type === 'percent') discount = Math.floor(subtotal * c.discount / 100);
      else if (c.type === 'flat') discount = c.discount;
      else if (c.type === 'delivery') deliveryFee = 0;
    }
  }
  const total = subtotal - discount + deliveryFee;

  document.getElementById('checkoutContent').innerHTML = `
    <div class="checkout-section">
      <h3>📍 Delivery Address</h3>
      <div class="addr-card">
        <span>🏠 Home</span>
        <p>${state.orderAddress}</p>
      </div>
    </div>
    <div class="checkout-section">
      <h3>⏱ Estimated Delivery</h3>
      <div class="eta-card">
        <div class="eta-time">${state.currentRestaurant?.time || '30-40 min'}</div>
        <p>Your order will arrive fresh & hot!</p>
      </div>
    </div>
    <div class="checkout-section">
      <h3>💳 Payment Method</h3>
      <div class="payment-options">
        <label class="pay-opt active"><input type="radio" name="pay" value="upi" checked/> 📱 UPI</label>
        <label class="pay-opt"><input type="radio" name="pay" value="card"/> 💳 Card</label>
        <label class="pay-opt"><input type="radio" name="pay" value="cod"/> 💵 Cash on Delivery</label>
        <label class="pay-opt"><input type="radio" name="pay" value="wallet"/> 👛 Wallet</label>
      </div>
    </div>
    <div class="checkout-summary">
      <div class="bill-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
      ${discount > 0 ? `<div class="bill-row green"><span>Discount</span><span>− ₹${discount}</span></div>` : ''}
      <div class="bill-row"><span>Delivery Fee</span><span>${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</span></div>
      <div class="bill-row total"><span>Grand Total</span><span>₹${total}</span></div>
    </div>
    <button class="btn-primary full" onclick="placeOrder(${total})">Place Order · ₹${total}</button>
  `;
}

// ── PLACE ORDER ────────────────────────────────────────────────────
function placeOrder(total) {
  const orderId = 'QB' + Date.now().toString().slice(-8);
  toast('🎉 Order Placed Successfully!', '#00A859');
  state.cart = [];
  state.appliedCoupon = null;
  updateCartBadge();
  showTrackingPage(orderId, total);
}

function showTrackingPage(orderId, total) {
  const steps = [
    { icon: '✅', label: 'Order Placed', done: true },
    { icon: '👨‍🍳', label: 'Preparing', done: false },
    { icon: '🚴', label: 'Out for Delivery', done: false },
    { icon: '🏠', label: 'Delivered', done: false },
  ];

  document.getElementById('trackingContent').innerHTML = `
    <div class="tracking-hero">
      <div class="tracking-anim">🚴</div>
      <h2>Order on the way!</h2>
      <p>Estimated delivery: 28 minutes</p>
      <div class="order-id-tag">Order ID: #${orderId}</div>
    </div>
    <div class="tracking-steps">
      ${steps.map((s, i) => `
        <div class="track-step ${s.done ? 'done' : ''} ${i === 1 ? 'active' : ''}">
          <div class="track-icon">${s.icon}</div>
          <div class="track-label">${s.label}</div>
        </div>
        ${i < steps.length - 1 ? '<div class="track-line"></div>' : ''}
      `).join('')}
    </div>
    <div class="tracking-map-placeholder">
      <div class="map-icon">🗺️</div>
      <p>Live map tracking</p>
      <small>Integrate Google Maps / IBM HERE Maps here</small>
    </div>
    <div class="tracking-agent">
      <div class="agent-avatar">🧑‍🦱</div>
      <div>
        <div class="agent-name">Ravi Kumar</div>
        <div class="agent-sub">Your delivery partner</div>
      </div>
      <div class="agent-actions">
        <button class="icon-btn" onclick="toast('📞 Calling Ravi…', '#00B4D8')">📞</button>
        <button class="icon-btn" onclick="toast('💬 Opening chat…', '#7B2FBE')">💬</button>
      </div>
    </div>
    <button class="btn-outline full" style="margin-top:1rem" onclick="goHome()">Back to Home</button>
  `;

  showPage('tracking');

  // Simulate order progress
  let step = 1;
  const interval = setInterval(() => {
    const dots = document.querySelectorAll('.track-step');
    if (!dots.length || step >= steps.length) { clearInterval(interval); return; }
    dots[step].classList.add('done');
    dots[step].classList.remove('active');
    if (step + 1 < steps.length) dots[step + 1].classList.add('active');
    step++;
    if (step === steps.length) {
      toast('🎉 Order Delivered! Enjoy your meal!', '#00A859');
      clearInterval(interval);
    }
  }, 5000);
}

// ── ORDERS PAGE ────────────────────────────────────────────────────
function renderOrders() {
  document.getElementById('ordersContent').innerHTML = PAST_ORDERS.map(o => `
    <div class="order-card">
      <div class="order-card-left">
        <div class="order-icon">${o.icon}</div>
        <div>
          <div class="order-name">${o.restaurant}</div>
          <div class="order-items">${o.items.join(', ')}</div>
          <div class="order-date">${o.date} · via ${o.platform}</div>
        </div>
      </div>
      <div class="order-card-right">
        <div class="order-total">₹${o.total}</div>
        <div class="order-status delivered">${o.status}</div>
        <button class="btn-outline sm" onclick="reorder('${o.id}')">Reorder</button>
      </div>
    </div>
  `).join('');
}

function reorder(id) {
  toast('🔄 Adding items to cart…', '#FF6B35');
  setTimeout(() => goHome(), 800);
}

// ── FAVOURITES PAGE ────────────────────────────────────────────────
function renderFavourites() {
  const favList = RESTAURANTS.filter(r => state.favourites.has(r.id));
  document.getElementById('favouritesContent').innerHTML = favList.length
    ? `<div class="restaurant-grid">${favList.map(r => restaurantCard(r)).join('')}</div>`
    : `<div class="empty-state"><div class="empty-icon">💔</div><h3>No favourites yet</h3><p>Tap the ❤️ on any restaurant to save it.</p></div>`;
}

// ── PROFILE PAGE ───────────────────────────────────────────────────
function renderProfile() {
  document.getElementById('profileContent').innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">S</div>
      <h2>Raghuveer Sain</h2>
      <p>raghuveer@quickbite.in · +91 98765 43210</p>
    </div>
    <div class="profile-section">
      <div class="profile-stat-row">
        <div class="profile-stat"><div class="ps-val">12</div><div class="ps-label">Orders</div></div>
        <div class="profile-stat"><div class="ps-val">₹4,280</div><div class="ps-label">Total Spent</div></div>
        <div class="profile-stat"><div class="ps-val">2</div><div class="ps-label">Saved</div></div>
      </div>
    </div>
    <div class="profile-section">
      <div class="profile-row"><span>🏠</span><div><div class="pr-label">Home Address</div><div class="pr-val">${state.orderAddress}</div></div></div>
      <div class="profile-row"><span>💳</span><div><div class="pr-label">Saved Payment</div><div class="pr-val">UPI · raghuveer@upi</div></div></div>
      <div class="profile-row"><span>🔔</span><div><div class="pr-label">Notifications</div><div class="pr-val">Enabled</div></div></div>
    </div>
    <div class="profile-section">
      <button class="btn-outline full" onclick="toast('👤 Edit profile coming soon!', '#FF6B35')">Edit Profile</button>
    </div>
  `;
}

// ── OFFERS PAGE ────────────────────────────────────────────────────
function renderOffers() {
  document.getElementById('offersContent').innerHTML = OFFERS.map(o => `
    <div class="offer-card" style="border-left: 4px solid ${o.color}">
      <div class="offer-icon" style="background:${o.color}22">${o.icon}</div>
      <div class="offer-info">
        <div class="offer-title" style="color:${o.color}">${o.title}</div>
        <div class="offer-sub">${o.sub}</div>
        <div class="offer-valid">Valid: ${o.valid}</div>
      </div>
      <button class="coupon-copy-btn" onclick="copyCode('${o.code}')">${o.code}</button>
    </div>
  `).join('');
}

function copyCode(code) {
  navigator.clipboard.writeText(code).catch(() => {});
  toast(`📋 Code "${code}" copied!`, '#7B2FBE');
}

// ── COUPON ─────────────────────────────────────────────────────────
function applyCoupon() {
  if (state.appliedCoupon) {
    state.appliedCoupon = null;
    toast('🏷️ Coupon removed', '#FF6B35');
    renderCartPage();
    return;
  }
  const input = document.getElementById('couponInput').value.trim().toUpperCase();
  const coupon = COUPONS.find(c => c.code === input);
  if (!coupon) { toast('❌ Invalid coupon code', '#E23744'); return; }
  if (getCartTotal() < coupon.minOrder) {
    toast(`⚠️ Min order ₹${coupon.minOrder} required`, '#FF6B35');
    return;
  }
  state.appliedCoupon = coupon.code;
  toast(`✅ "${coupon.code}" applied!`, '#00A859');
  renderCartPage();
}

// ── PLATFORM / CATEGORY SELECT ─────────────────────────────────────
function selectPlatform(id) {
  state.activePlatform = id;
  renderPlatforms();
  renderRestaurants();
  toast(`📦 Showing ${PLATFORMS.find(p => p.id === id)?.name} restaurants`, '#00B4D8');
}

function selectCategory(id) {
  state.activeCategory = id;
  renderCategories();
  renderRestaurants();
}

// ── FAVOURITE TOGGLE ───────────────────────────────────────────────
function toggleFavourite(e, id) {
  e.stopPropagation();
  if (state.favourites.has(id)) {
    state.favourites.delete(id);
    toast('💔 Removed from favourites', '#E23744');
  } else {
    state.favourites.add(id);
    toast('❤️ Added to favourites!', '#E23744');
  }
  renderRestaurants();
  renderFavourites();
}

// ── PAGE NAVIGATION ────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  state.currentPage = name;

  // Update bottom nav
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`.bnav-item[data-page="${name}"]`)?.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`.sb-item[data-page="${name}"]`)?.classList.add('active');

  if (name === 'cart') renderCartPage();
  if (name === 'checkout') renderCheckoutPage();
  window.scrollTo(0, 0);
}

function goHome() { showPage('home'); }
function scrollToRestaurants() {
  document.getElementById('restaurantGrid').scrollIntoView({ behavior: 'smooth' });
}

// ── ADDRESS ────────────────────────────────────────────────────────
function changeAddress() {
  const addr = prompt('Enter new delivery address:', state.orderAddress);
  if (addr) {
    state.orderAddress = addr;
    toast('📍 Address updated!', '#00A859');
    renderCartPage();
  }
}

// ── SEARCH ─────────────────────────────────────────────────────────
function bindEvents() {
  // Search
  document.getElementById('searchToggle').addEventListener('click', () => {
    const bar = document.getElementById('searchBar');
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) document.getElementById('searchInput').focus();
  });
  document.getElementById('clearSearch').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchBar').classList.remove('open');
    renderRestaurants();
    goHome();
  });
  document.getElementById('searchInput').addEventListener('input', (e) => {
    showPage('home');
    renderRestaurants(e.target.value);
  });

  // Cart button
  document.getElementById('cartBtn').addEventListener('click', () => showPage('cart'));
  document.getElementById('cartNavBtn').addEventListener('click', () => showPage('cart'));

  // Sidebar
  document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);
  document.querySelectorAll('.sb-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      showPage(item.dataset.page);
      closeSidebar();
    });
  });
  document.getElementById('chatbotSideBtn').addEventListener('click', () => {
    closeSidebar();
    toggleChatbot();
  });

  // Bottom nav
  document.querySelectorAll('.bnav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  // Chatbot
  document.getElementById('chatbotFab').addEventListener('click', toggleChatbot);
  document.getElementById('chatClose').addEventListener('click', () => {
    document.getElementById('chatbotPanel').classList.remove('open');
    state.chatOpen = false;
  });
  document.getElementById('chatSend').addEventListener('click', sendChatMessage);
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });

  // Avatar
  document.getElementById('avatarBtn').addEventListener('click', () => showPage('profile'));

  // Pay option selection
  document.addEventListener('change', (e) => {
    if (e.target.name === 'pay') {
      document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('active'));
      e.target.parentElement.classList.add('active');
    }
  });

  // Location pill
  document.getElementById('locationPill').addEventListener('click', () => {
    toast('📍 Location: Jalandhar, Punjab', '#00B4D8');
  });
}

// ── SIDEBAR ────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ── CHATBOT ────────────────────────────────────────────────────────
function toggleChatbot() {
  state.chatOpen = !state.chatOpen;
  document.getElementById('chatbotPanel').classList.toggle('open', state.chatOpen);
}

function sendQuickMsg(msg) {
  document.getElementById('chatInput').value = msg;
  sendChatMessage();
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendChatBubble(msg, 'user');
  document.getElementById('chatSuggestions').style.display = 'none';

  // Simulate IBM Watson response
  appendTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const reply = getBotReply(msg);
    appendChatBubble(reply, 'bot');
  }, 1200);
}

function appendChatBubble(text, who) {
  const msgs = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `chat-bubble ${who}`;
  div.innerHTML = `<div class="bubble-text">${text}</div><div class="bubble-time">${time}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendTypingIndicator() {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-bubble bot typing-indicator';
  div.id = 'typingIndicator';
  div.innerHTML = `<div class="bubble-text"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typingIndicator')?.remove();
}

// ── IBM Watson Integration Point ────────────────────────────────────
// Need to replace this function with IBM Watson Assistant API call
// Example: POST to https://api.us-south.assistant.watson.cloud.ibm.com/instances/{id}/v2/assistants/{assistant_id}/sessions/{session_id}/message
function getBotReply(msg) {
  const m = msg.toLowerCase();

  // ── REPLACE BELOW WITH IBM WATSON FETCH CALL ──
  // const response = await fetch('YOUR_IBM_WATSON_URL', {
  //   method: 'POST',
  //   headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ input: { text: msg } })
  // });
  // const data = await response.json();
  // return data.output.generic[0].text;
  // ─────────────────────────────────────────────

  if (m.includes('pizza')) return '🍕 Great choice! Pizza Paradise has amazing pizzas near you. They have Margherita at ₹249 and Pepperoni Blast at ₹399. Want me to add any to your cart?';
  if (m.includes('burger')) return '🍔 Burger Barn is your go-to! Crispy Chicken Burger at ₹229 is a bestseller. Want to open the menu?';
  if (m.includes('track') || m.includes('order')) return '📦 Your last order #QB20240101 from Spice Route was delivered on Dec 15. Would you like to reorder?';
  if (m.includes('offer') || m.includes('coupon') || m.includes('discount')) return '🏷️ Use code **FIRST50** for 50% off your first order! Also try **QB100** for ₹100 flat off on orders above ₹499.';
  if (m.includes('biryani')) return '🍲 Spice Route has an amazing Chicken Biryani at ₹349 — rated 4.8 ⭐! Want to order it?';
  if (m.includes('chinese')) return '🍜 Dragon Bowl serves great Chinese food! Chicken Manchurian + Hakka Noodles is a popular combo at ₹428.';
  if (m.includes('healthy') || m.includes('salad')) return '🥗 Green Bowl is perfect for you! Try the Quinoa Power Bowl at ₹299 — low calorie and delicious!';
  if (m.includes('dessert') || m.includes('sweet')) return '🍰 Sweet Treats has amazing desserts! Chocolate Lava Cake (₹149) is a bestseller. Perfect after your meal!';
  if (m.includes('fast') || m.includes('quick')) return '⚡ Roll Station is your fastest option — delivery in 15-20 min! Egg Rolls start at just ₹79.';
  if (m.includes('hello') || m.includes('hi') || m.includes('hey')) return '👋 Hello! I\'m your QuickBite AI assistant powered by IBM Watson. I can help you find food, track orders, or apply coupons. What are you craving today?';
  if (m.includes('swiggy')) return '🟠 Swiggy has great options! Pizza Paradise, Burger Barn, Spice Route, Dragon Bowl, and Sweet Treats are all available. Any preference?';
  if (m.includes('zomato')) return '🔴 Zomato has Pizza Paradise, Sushi Studio, Spice Route, Dragon Bowl, and Green Bowl. Want me to filter restaurants by Zomato?';
  if (m.includes('thank')) return '😊 You\'re welcome! Enjoy your meal! Don\'t forget to rate your experience. 🌟';
  return '🤖 I\'m here to help! Ask me about restaurants, cuisines, offers, or tracking your order. (Connect IBM Watson API for full AI experience!)';
}

// ── CONFIRM DIALOG ───────────────────────────────────────────────
function showConfirmDialog(title, msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <div class="dialog-box">
      <h3>${title}</h3>
      <p>${msg}</p>
      <div class="dialog-btns">
        <button class="btn-outline" onclick="this.closest('.dialog-overlay').remove()">Cancel</button>
        <button class="btn-primary" id="confirmBtn">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmBtn').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

// ── TOAST ──────────────────────────────────────────────────────────
function toast(msg, bg = '#333') {
  Toastify({
    text: msg,
    duration: 2800,
    gravity: 'top',
    position: 'right',
    style: { background: bg, borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  }).showToast();
}