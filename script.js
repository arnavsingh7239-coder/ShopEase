/* ShopEase - educational front-end demo. Not a secure production store. */
"use strict";

const $ = (id) => document.getElementById(id);
const STORAGE = {
  users: "shopease_users_v2",
  products: "shopease_products_v2",
  cart: "shopease_cart_v2",
  orders: "shopease_orders_v2",
  wishlist: "shopease_wishlist_v2"
};

function readStore(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}
function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

let users = readStore(STORAGE.users, []);
function makeProductArt(kind, title) {
  const art = {
    headphones: {emoji:"🎧", bg:"#dbeafe", accent:"#2563eb"},
    watch: {emoji:"⌚", bg:"#f3e8ff", accent:"#7c3aed"},
    tshirt: {emoji:"👕", bg:"#dcfce7", accent:"#15803d"},
    backpack: {emoji:"🎒", bg:"#ffedd5", accent:"#c2410c"},
    lamp: {emoji:"💡", bg:"#fef3c7", accent:"#b45309"},
    beauty: {emoji:"🧴", bg:"#fce7f3", accent:"#be185d"},
    books: {emoji:"📚", bg:"#e0e7ff", accent:"#4338ca"},
    speaker: {emoji:"🔊", bg:"#cffafe", accent:"#0e7490"},
    default: {emoji:"🛍️", bg:"#eff6ff", accent:"#1d4ed8"}
  };
  const item = art[kind] || art.default;
  const safeTitle = String(title || "ShopEase Product").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="520" viewBox="0 0 640 520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${item.bg}"/><stop offset="1" stop-color="#ffffff"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="${item.accent}" flood-opacity=".15"/></filter></defs><rect width="640" height="520" rx="28" fill="url(#g)"/><circle cx="320" cy="220" r="145" fill="#ffffff" opacity=".65"/><circle cx="320" cy="220" r="118" fill="${item.bg}" filter="url(#s)"/><text x="320" y="260" text-anchor="middle" font-size="150" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${item.emoji}</text><rect x="42" y="410" width="556" height="70" rx="18" fill="#ffffff" opacity=".9"/><text x="320" y="454" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="${item.accent}">${safeTitle.slice(0,30)}</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
function photoForProduct(product) {
  const name = String(product.name || "").toLowerCase();
  if (name.includes("headphone") || name.includes("earphone")) return makeProductArt("headphones", product.name);
  if (name.includes("watch")) return makeProductArt("watch", product.name);
  if (name.includes("t-shirt") || name.includes("tshirt") || name.includes("shirt")) return makeProductArt("tshirt", product.name);
  if (name.includes("backpack") || name.includes("bag")) return makeProductArt("backpack", product.name);
  if (name.includes("lamp")) return makeProductArt("lamp", product.name);
  if (name.includes("beauty") || name.includes("care") || name.includes("skin")) return makeProductArt("beauty", product.name);
  if (name.includes("book") || name.includes("notebook")) return makeProductArt("books", product.name);
  if (name.includes("speaker")) return makeProductArt("speaker", product.name);
  if (product.category === "Electronics") return makeProductArt("headphones", product.name);
  if (product.category === "Fashion") return makeProductArt("tshirt", product.name);
  if (product.category === "Beauty") return makeProductArt("beauty", product.name);
  if (product.category === "Books") return makeProductArt("books", product.name);
  if (product.category === "Home") return makeProductArt("lamp", product.name);
  return makeProductArt("default", product.name);
}

let products = readStore(STORAGE.products, null);
let cart = readStore(STORAGE.cart, []);
let orders = readStore(STORAGE.orders, []);
let wishlist = readStore(STORAGE.wishlist, []);
let currentUser = null;
let selectedRole = "customer";
let selectedImage = "";
let toastTimer = null;
let checkoutItems = [];
let checkoutMode = "cart";

if (!Array.isArray(products)) {
  products = [
    {id:101,name:"Wireless Headphones",price:799,category:"Electronics",description:"Enjoy music with these everyday wireless headphones.",image:makeProductArt("headphones", "Wireless Headphones"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:102,name:"Smart Watch",price:1299,category:"Electronics",description:"A stylish watch for your everyday routine.",image:makeProductArt("watch", "Smart Watch"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:103,name:"Casual T-Shirt",price:399,category:"Fashion",description:"Comfortable casual wear for daily use.",image:makeProductArt("tshirt", "Casual T-Shirt"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:104,name:"College Backpack",price:599,category:"Fashion",description:"A useful backpack for college and travel.",image:makeProductArt("backpack", "College Backpack"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:105,name:"Desk Lamp",price:499,category:"Home",description:"A simple lamp for your study desk.",image:makeProductArt("lamp", "Desk Lamp"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:106,name:"Daily Care Kit",price:349,category:"Beauty",description:"Everyday personal-care essentials.",image:makeProductArt("beauty", "Daily Care Kit"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:107,name:"Learning Notebook Set",price:199,category:"Books",description:"A handy notebook set for study notes.",image:makeProductArt("books", "Learning Notebook Set"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"},
    {id:108,name:"Bluetooth Speaker",price:999,category:"Electronics",description:"Compact speaker for music and entertainment.",image:makeProductArt("speaker", "Bluetooth Speaker"),sellerEmail:"demo@shopease.local",sellerName:"ShopEase Demo"}
  ];
  writeStore(STORAGE.products, products);
}
// Upgrade older saved demo products that were created before product photos were added.
products = products.map(product => ({
  ...product,
  image: (product.image && product.image.startsWith("data:image/") && !product.image.includes("svg+xml")) ? product.image : photoForProduct(product)
}));
try { writeStore(STORAGE.products, products); } catch (error) { /* keep browsing if storage is full */ }

let activeCategory = "All";
let searchTerm = "";

function persistAll() {
  writeStore(STORAGE.users, users);
  writeStore(STORAGE.products, products);
  writeStore(STORAGE.cart, cart);
  writeStore(STORAGE.orders, orders);
  writeStore(STORAGE.wishlist, wishlist);
}
function showToast(message) {
  const el = $("toast");
  if (!el) { alert(message); return; }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function showMessage(id, message, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "#15803d";
}
function showPage(id) {
  ["loginPage", "signupPage", "shopPage"].forEach(pageId => $(pageId)?.classList.add("hidden"));
  $(id)?.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
function selectRole(role) {
  selectedRole = role === "seller" ? "seller" : "customer";
  $("customerRole")?.classList.toggle("active", selectedRole === "customer");
  $("sellerRole")?.classList.toggle("active", selectedRole === "seller");
}
function togglePassword() {
  const input = $("password");
  if (input) input.type = $("showPassword").checked ? "text" : "password";
}
function forgotPassword() {
  const email = $("email")?.value.trim().toLowerCase();
  if (!email) {
    showMessage("loginMessage", "Enter your email first. This demo cannot send password-reset emails.", true);
    $("email")?.focus();
    return;
  }
  const exists = users.some(user => user.email === email);
  showMessage("loginMessage", exists
    ? "Password reset is not connected in this demo. Please create a new test account if needed."
    : "No account with this email was found in this browser.", !exists);
}
function showSignup() {
  showMessage("loginMessage", "");
  showMessage("signupMessage", "");
  showPage("signupPage");
}
function showLogin() {
  showMessage("signupMessage", "");
  showMessage("loginMessage", "");
  showPage("loginPage");
}
function signup(event) {
  event?.preventDefault();
  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;
  const role = $("signupRole").value;
  if (!name || !email || !password) return showMessage("signupMessage", "Please complete every field.", true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage("signupMessage", "Please enter a valid email address.", true);
  if (password.length < 6) return showMessage("signupMessage", "Password must be at least 6 characters.", true);
  if (users.some(user => user.email === email)) return showMessage("signupMessage", "This email is already registered. Please log in.", true);
  users.push({id:Date.now(),name,email,password,role});
  try { writeStore(STORAGE.users, users); }
  catch { users.pop(); return showMessage("signupMessage", "Browser storage is full. Try clearing demo data.", true); }
  $("signupForm").reset();
  showMessage("signupMessage", "Account created! Taking you to login…");
  setTimeout(() => {
    showLogin();
    $("email").value = email;
    selectRole(role);
    showMessage("loginMessage", "Account created. Log in with your new details.");
  }, 650);
}
function login(event) {
  event?.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const user = users.find(item => item.email === email && item.password === password && item.role === selectedRole);
  if (!user) {
    const otherRole = users.find(item => item.email === email && item.password === password);
    return showMessage("loginMessage", otherRole ? `This account is registered as ${otherRole.role}. Select the ${otherRole.role} button.` : "Email or password is incorrect. Create an account first if you are new.", true);
  }
  currentUser = user;
  showMessage("loginMessage", "");
  startShopping();
}
function logout() {
  currentUser = null;
  checkoutItems = [];
  showPage("loginPage");
  $("loginForm")?.reset();
  selectRole("customer");
  showMessage("loginMessage", "You have logged out.");
}
function startShopping() {
  showPage("shopPage");
  $("welcomeMessage").textContent = `Hi, ${currentUser.name}`;
  const seller = currentUser.role === "seller";
  $("sellerNav")?.classList.toggle("hidden", !seller);
  $("sellerPanel")?.classList.toggle("hidden", !seller);
  renderProducts();
  renderSellerProducts();
  updateCartCount();
}
function getPlaceholderImage(name) {
  return makeProductArt("default", name || "ShopEase Product");
}
function productImage(product) { return product.image || getPlaceholderImage(product.name); }
function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;
  const sort = $("sortSelect")?.value || "recommended";
  let visible = products.filter(product => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const haystack = `${product.name} ${product.category} ${product.description || ""} ${product.sellerName || ""}`.toLowerCase();
    return matchesCategory && haystack.includes(searchTerm);
  });
  if (sort === "low") visible.sort((a,b) => a.price - b.price);
  if (sort === "high") visible.sort((a,b) => b.price - a.price);
  $("productHeading").textContent = activeCategory === "All" ? "Featured Products" : activeCategory === "Home" ? "Home & Kitchen" : activeCategory;
  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><strong>No products found</strong>Try another search or choose a different category.</div>`;
    return;
  }
  grid.innerHTML = visible.map(product => {
    const saved = wishlist.some(item => item.userEmail === currentUser.email && item.productId === product.id);
    return `<article class="product-card">
      <div class="product-image-wrap"><img src="${escapeHTML(productImage(product))}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src=getPlaceholderImage('ShopEase Product')"><button type="button" class="wishlist-heart ${saved ? "saved" : ""}" onclick="toggleWishlist(${product.id})" aria-label="Toggle wishlist">${saved ? "♥" : "♡"}</button></div>
      <span class="product-category">${escapeHTML(product.category === "Home" ? "Home & Kitchen" : product.category)}</span>
      <h3>${escapeHTML(product.name)}</h3><p class="product-description">${escapeHTML(product.description || "Quality product for everyday use.")}</p>
      <p class="product-price">${money(product.price)}</p>
      <div class="product-actions"><button type="button" class="cart-button" onclick="addToCart(${product.id})">＋ Add to Cart</button><button type="button" class="buy-button" onclick="buyNow(${product.id})">Buy Now</button></div>
    </article>`;
  }).join("");
}
function searchProducts() {
  searchTerm = $("searchInput").value.trim().toLowerCase();
  renderProducts();
}
function setCategory(category, button) {
  activeCategory = category;
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  if (button) button.classList.add("active");
  else {
    const navButtons = [...document.querySelectorAll(".nav-item")];
    const match = navButtons.find(item => item.textContent.trim().toLowerCase() === (category === "All" ? "home" : category.toLowerCase()));
    match?.classList.add("active");
  }
  renderProducts();
  $("productSection")?.scrollIntoView({behavior:"smooth",block:"start"});
}
function showSellerPanel() {
  if (currentUser?.role !== "seller") return showToast("Seller account required.");
  $("sellerPanel").classList.remove("hidden");
  $("sellerPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
function previewProductImage(event) {
  const file = event.target.files?.[0];
  selectedImage = "";
  $("imagePreview").classList.add("hidden");
  $("imagePreview").removeAttribute("src");
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    return showMessage("sellerMessage", "Choose a valid image file.", true);
  }
  if (file.size > 700 * 1024) {
    event.target.value = "";
    return showMessage("sellerMessage", "Image must be smaller than 700 KB. Choose a smaller image.", true);
  }
  const reader = new FileReader();
  reader.onload = () => {
    selectedImage = reader.result;
    $("imagePreview").src = selectedImage;
    $("imagePreview").classList.remove("hidden");
    showMessage("sellerMessage", "");
  };
  reader.onerror = () => showMessage("sellerMessage", "Could not read this image.", true);
  reader.readAsDataURL(file);
}
function addProduct(event) {
  event.preventDefault();
  if (currentUser?.role !== "seller") return showMessage("sellerMessage", "Log in with a seller account to add products.", true);
  const name = $("productName").value.trim();
  const price = Number($("productPrice").value);
  const category = $("productCategory").value;
  const description = $("productDescription").value.trim();
  if (!name || !Number.isFinite(price) || price <= 0) return showMessage("sellerMessage", "Enter a product name and valid price.", true);
  if (!selectedImage) return showMessage("sellerMessage", "Please select a product photo.", true);
  const product = {id:Date.now(),name,price,category,description,image:selectedImage,sellerEmail:currentUser.email,sellerName:currentUser.name};
  products.push(product);
  try { writeStore(STORAGE.products, products); }
  catch (error) {
    products = products.filter(item => item.id !== product.id);
    return showMessage("sellerMessage", "Browser storage is full. Try a smaller image or clear old demo data.", true);
  }
  $("productForm").reset();
  $("imagePreview").classList.add("hidden");
  $("imagePreview").removeAttribute("src");
  selectedImage = "";
  renderProducts();
  renderSellerProducts();
  showMessage("sellerMessage", "Product added successfully!");
}
function renderSellerProducts() {
  const list = $("sellerProductsList");
  if (!list || currentUser?.role !== "seller") return;
  const mine = products.filter(item => item.sellerEmail === currentUser.email);
  list.innerHTML = mine.length ? mine.map(product => `<article class="seller-product">
    <img src="${escapeHTML(productImage(product))}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src=getPlaceholderImage('Product')">
    <h4>${escapeHTML(product.name)}</h4><p>${money(product.price)} · ${escapeHTML(product.category)}</p>
    <button type="button" onclick="deleteProduct(${product.id})">Delete Product</button>
  </article>`).join("") : `<div class="empty-state"><strong>No products yet</strong>Add your first product using the form above.</div>`;
}
function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product || product.sellerEmail !== currentUser?.email) return showToast("You can delete only your own products.");
  if (!confirm(`Delete "${product.name}"?`)) return;
  products = products.filter(item => item.id !== id);
  cart = cart.filter(item => item.productId !== id);
  wishlist = wishlist.filter(item => item.productId !== id);
  persistAll();
  renderProducts(); renderSellerProducts(); updateCartCount();
  showToast("Product deleted.");
}
function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return showToast("Product is no longer available.");
  const existing = cart.find(item => item.userEmail === currentUser.email && item.productId === id);
  if (existing) existing.quantity += 1;
  else cart.push({userEmail:currentUser.email,productId:id,quantity:1});
  writeStore(STORAGE.cart, cart);
  updateCartCount();
  showToast("Added to cart.");
}
function updateCartCount() {
  const count = cart.filter(item => item.userEmail === currentUser?.email).reduce((sum,item) => sum + item.quantity, 0);
  if ($("cartCount")) $("cartCount").textContent = count;
}
function updateCartQuantity(id, change) {
  const item = cart.find(entry => entry.userEmail === currentUser.email && entry.productId === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(entry => entry !== item);
  writeStore(STORAGE.cart, cart);
  updateCartCount();
  showCart();
}
function removeCartItem(id) {
  cart = cart.filter(item => !(item.userEmail === currentUser.email && item.productId === id));
  writeStore(STORAGE.cart, cart);
  updateCartCount();
  showCart();
}
function openModal(html) {
  $("modalContent").innerHTML = html;
  $("modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("modal")?.classList.add("hidden");
  document.body.style.overflow = "";
}
function showCart() {
  const items = cart.filter(item => item.userEmail === currentUser.email);
  if (!items.length) return openModal(`<h2 id="modalTitle">Your Cart</h2><div class="empty-state"><strong>Your cart is empty</strong>Add a product to get started.</div><button class="primary-button" onclick="closeModal()">Continue Shopping</button>`);
  let total = 0;
  const html = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return "";
    total += product.price * item.quantity;
    return `<div class="modal-list-item"><div class="row"><div><strong>${escapeHTML(product.name)}</strong><p>${money(product.price)} each</p></div><strong>${money(product.price * item.quantity)}</strong></div><div class="row"><div class="quantity-control"><button onclick="updateCartQuantity(${product.id},-1)">−</button><span>${item.quantity}</span><button onclick="updateCartQuantity(${product.id},1)">+</button></div><button class="remove-button" onclick="removeCartItem(${product.id})">Remove</button></div></div>`;
  }).join("");
  openModal(`<h2 id="modalTitle">Your Cart</h2>${html}<p class="order-total">Total: ${money(total)}</p><button class="primary-button" onclick="checkoutCart()">Proceed to Checkout →</button>`);
}
function toggleWishlist(id) {
  const found = wishlist.find(item => item.userEmail === currentUser.email && item.productId === id);
  if (found) wishlist = wishlist.filter(item => item !== found);
  else wishlist.push({userEmail:currentUser.email,productId:id});
  writeStore(STORAGE.wishlist, wishlist);
  renderProducts();
  showToast(found ? "Removed from wishlist." : "Added to wishlist.");
}
function showWishlist() {
  const items = wishlist.filter(item => item.userEmail === currentUser.email);
  const html = items.map(item => {
    const p = products.find(product => product.id === item.productId);
    if (!p) return "";
    return `<div class="modal-list-item"><div class="row"><div><strong>${escapeHTML(p.name)}</strong><p>${money(p.price)}</p></div><div><button class="primary-button" onclick="addToCart(${p.id})">Add to Cart</button> <button class="remove-button" onclick="toggleWishlist(${p.id});showWishlist()">Remove</button></div></div></div>`;
  }).join("");
  openModal(`<h2 id="modalTitle">My Wishlist</h2>${html || `<div class="empty-state"><strong>Nothing saved yet</strong>Tap the heart on a product to save it.</div>`}`);
}
function buyNow(id) {
  if (!products.some(item => item.id === id)) return showToast("Product is no longer available.");
  checkoutMode = "buy";
  checkoutItems = [{productId:id,quantity:1}];
  showCheckout();
}
function checkoutCart() {
  checkoutMode = "cart";
  checkoutItems = cart.filter(item => item.userEmail === currentUser.email).map(item => ({productId:item.productId,quantity:item.quantity}));
  if (!checkoutItems.length) return showToast("Your cart is empty.");
  showCheckout();
}
function showCheckout() {
  let total = 0;
  const summary = checkoutItems.map(item => {
    const p = products.find(product => product.id === item.productId);
    if (!p) return "";
    total += p.price * item.quantity;
    return `<div class="row"><span>${escapeHTML(p.name)} × ${item.quantity}</span><strong>${money(p.price * item.quantity)}</strong></div>`;
  }).join("");
  if (!total) return showToast("Selected products are unavailable.");
  openModal(`<h2 id="modalTitle">Delivery & Checkout</h2><p class="muted">Please enter your delivery details.</p><div class="modal-list-item">${summary}<hr><div class="row"><strong>Total</strong><strong>${money(total)}</strong></div></div>
    <form id="checkoutForm" class="checkout-form">
      <div class="checkout-grid">
        <div class="wide"><label for="addressName">Full Name</label><input id="addressName" required maxlength="100" autocomplete="name" placeholder="Full name"></div>
        <div><label for="addressEmail">Email Address</label><input id="addressEmail" type="email" required value="${escapeHTML(currentUser.email)}" autocomplete="email"></div>
        <div><label for="addressPhone">Mobile Number</label><input id="addressPhone" type="tel" required pattern="[0-9]{10}" maxlength="10" inputmode="numeric" placeholder="10-digit mobile number"></div>
        <div class="wide"><label for="addressHouse">House / Flat / Building</label><input id="addressHouse" required maxlength="150" autocomplete="address-line1" placeholder="House number and building"></div>
        <div class="wide"><label for="addressStreet">Street / Locality</label><input id="addressStreet" required maxlength="150" autocomplete="address-line2" placeholder="Street, area or locality"></div>
        <div><label for="addressCity">City / Village</label><input id="addressCity" required maxlength="80" autocomplete="address-level2" placeholder="City or village"></div>
        <div><label for="addressState">State</label><input id="addressState" required maxlength="80" autocomplete="address-level1" placeholder="State"></div>
        <div><label for="addressPincode">PIN Code</label><input id="addressPincode" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="postal-code" placeholder="6-digit PIN code"></div>
      </div>
      <p class="payment-note"><strong>Payment method: Cash on Delivery (COD)</strong><br>This is a college demo. No real order, delivery or payment is created.</p>
      <button type="submit" class="primary-button full-width">Place Demo Order · ${money(total)}</button>
    </form>`);
  $("checkoutForm").addEventListener("submit", placeOrder);
}
function placeOrder(event) {
  event.preventDefault();
  const selected = checkoutItems.map(item => {
    const p = products.find(product => product.id === item.productId);
    return p ? {productId:p.id,name:p.name,price:p.price,quantity:item.quantity,sellerEmail:p.sellerEmail} : null;
  }).filter(Boolean);
  if (!selected.length) return showToast("Selected products are unavailable.");
  const address = {
    name:$("addressName").value.trim(),email:$("addressEmail").value.trim(),
    phone:$("addressPhone").value.trim(),house:$("addressHouse").value.trim(),
    street:$("addressStreet").value.trim(),city:$("addressCity").value.trim(),
    state:$("addressState").value.trim(),pincode:$("addressPincode").value.trim()
  };
  const total = selected.reduce((sum,item) => sum + item.price * item.quantity,0);
  const order = {id:"SE"+Date.now().toString().slice(-9),userEmail:currentUser.email,items:selected,address,total,paymentMethod:"Cash on Delivery (demo)",status:"Demo Order Placed",date:new Date().toLocaleString("en-IN")};
  orders.push(order);
  if (checkoutMode === "cart") {
    for (const selectedItem of checkoutItems) {
      const cartItem = cart.find(item => item.userEmail === currentUser.email && item.productId === selectedItem.productId);
      if (cartItem) cart = cart.filter(item => item !== cartItem);
    }
  }
  try { persistAll(); }
  catch {
    orders = orders.filter(item => item.id !== order.id);
    return showToast("Unable to save order: browser storage is full.");
  }
  checkoutItems = [];
  updateCartCount();
  openModal(`<div class="success-panel"><div class="success-icon">✓</div><p class="eyebrow blue">THANK YOU</p><h2 id="modalTitle">Demo Order Placed!</h2><p>Your order has been saved in this browser for the college project.</p><div class="modal-list-item"><p>Order ID</p><strong>${escapeHTML(order.id)}</strong><div class="row"><span>Total</span><strong>${money(order.total)}</strong></div><p>Payment: Cash on Delivery (demo)</p><p>Status: Demo Order Placed</p></div><button class="primary-button" onclick="showOrders()">View My Orders</button><button class="outline-button" onclick="closeModal()">Continue Shopping</button></div>`);
}
function showOrders() {
  const mine = orders.filter(order => order.userEmail === currentUser.email).slice().reverse();
  const html = mine.map(order => `<div class="modal-list-item"><div class="row"><strong>Order ${escapeHTML(order.id)}</strong><span class="product-category">${escapeHTML(order.status)}</span></div><p>${escapeHTML(order.date)}</p>${order.items.map(item => `<p>${escapeHTML(item.name)} × ${item.quantity} — ${money(item.price * item.quantity)}</p>`).join("")}<div class="row"><strong>Total: ${money(order.total)}</strong><span>${escapeHTML(order.paymentMethod)}</span></div><p>Deliver to: ${escapeHTML(order.address.name)}, ${escapeHTML(order.address.house)}, ${escapeHTML(order.address.street)}, ${escapeHTML(order.address.city)}, ${escapeHTML(order.address.state)} - ${escapeHTML(order.address.pincode)}</p><p>Contact: ${escapeHTML(order.address.phone)}</p></div>`).join("");
  openModal(`<h2 id="modalTitle">My Orders</h2>${html || `<div class="empty-state"><strong>No orders yet</strong>Demo orders will appear here after checkout.</div>`}`);
}
function showAccount() {
  openModal(`<h2 id="modalTitle">My Account</h2><div class="modal-list-item"><p>Full Name</p><strong>${escapeHTML(currentUser.name)}</strong><p>Email</p><strong>${escapeHTML(currentUser.email)}</strong><p>Account Type</p><strong>${escapeHTML(currentUser.role)}</strong></div><button class="primary-button" onclick="showOrders()">My Orders</button><button class="outline-button" onclick="showWishlist()">My Wishlist</button><button class="remove-button" onclick="closeModal();logout()">Logout</button>`);
}
function showSupport() {
  openModal(`<h2 id="modalTitle">Customer Support</h2><p>For this project demo, the displayed support contact is:</p><div class="modal-list-item"><strong>7239068281</strong><p>Support contact link only; this page does not provide a real support desk.</p></div><a class="primary-button" href="tel:7239068281">Call Support</a>`);
}

document.addEventListener("DOMContentLoaded", () => {
  $("loginForm").addEventListener("submit", login);
  $("signupForm").addEventListener("submit", signup);
  $("productForm").addEventListener("submit", addProduct);
  $("productImage").addEventListener("change", previewProductImage);
  $("searchInput").addEventListener("keydown", event => { if (event.key === "Enter") searchProducts(); });
  $("searchInput").addEventListener("input", () => { searchTerm = $("searchInput").value.trim().toLowerCase(); renderProducts(); });
  $("modal").addEventListener("click", event => { if (event.target === $("modal")) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
  showPage("loginPage");
  selectRole("customer");
});
