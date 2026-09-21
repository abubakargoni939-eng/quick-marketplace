const KEYS={products:"qm_products_v3",cart:"qm_cart_v3",orders:"qm_orders_v3",shops:"qm_shops_v3"};

const seed=[
{name:"Rice",price:85000,shop:"Cap Shop",city:"Maiduguri",category:"Food",emoji:"🍚",stock:100,min:1,commission:500},
{name:"Beans",price:70000,shop:"Cap Shop",city:"Maiduguri",category:"Food",emoji:"🫘",stock:100,min:1,commission:500},
{name:"Cooking Oil",price:12000,shop:"Abba Store",city:"Maiduguri",category:"Food",emoji:"🛢️",stock:50,min:1,commission:300},
{name:"Soft Drink",price:1000,shop:"City Drinks",city:"Maiduguri",category:"Drinks",emoji:"🥤",stock:100, min:1,commission:50},
{name:"T-Shirt",price:8500,shop:"Fashion House",city:"Maiduguri",category:"Fashion",emoji:"👕",stock:40,min:1,commission:100},
{name:"Phone",price:150000,shop:"Mobile World",city:"Maiduguri",category:"Electronics",emoji:"📱",stock:20,min:1,commission:1000},
{name:"Shoes",price:18000,shop:"Fashion House",city:"Maiduguri",category:"Fashion",emoji:"👟",stock:30,min:1,commission:150},
{name:"Plastic Chair",price:7000,shop:"Home Store",city:"Maiduguri",category:"Household",emoji:"🪑",stock:50,min:1,commission:100}
];

const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const money=n=>"₦"+Number(n).toLocaleString("en-NG");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

if(!localStorage.getItem(KEYS.products))set(KEYS.products,seed.map((p,i)=>({...p,id:"seed-"+i,shopId:"seed-shop-"+p.shop})));

function products(){return get(KEYS.products,[])}
function cart(){return get(KEYS.cart,[])}
function updateCartCount(){const e=document.getElementById("cartCount");if(e)e.textContent=cart().reduce((a,b)=>a+b.qty,0)}

function renderHome(category="All",term=""){
 const box=document.getElementById("products");if(!box)return;
 const cats=["All",...new Set(products().map(p=>p.category))];
 document.getElementById("categoryBar").innerHTML=cats.map(c=>`<button class="chip ${c===category?"active":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
 const q=term.toLowerCase();
 const list=products().filter(p=>(category==="All"||p.category===category)&&(!q||`${p.name} ${p.shop} ${p.city} ${p.category}`.toLowerCase().includes(q)));
 box.innerHTML=list.map(p=>`<article class="card"><div class="pic">${p.emoji||"📦"}</div><div class="card-body"><h3>${esc(p.name)}</h3><div class="price">${money(p.price)}</div><div class="muted">🏪 ${esc(p.shop)}</div><div class="muted">📍 ${esc(p.city)}</div><button class="primary" data-view="${p.id}">View Product</button></div></article>`).join("");
 document.getElementById("empty").classList.toggle("hidden",list.length>0);
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>renderHome(b.dataset.cat,document.getElementById("searchInput").value));
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>openProduct(b.dataset.view));
}

function openProduct(id){
 const p=products().find(x=>x.id===id);if(!p)return;
 document.getElementById("productDetails").innerHTML=`<div class="pic">${p.emoji||"📦"}</div><h2>${esc(p.name)}</h2><div class="price">${money(p.price)}</div><p>Shop: ${esc(p.shop)}<br>City: ${esc(p.city)}<br>Available: ${p.stock}<br>Minimum quantity: ${p.min}</p><button class="primary" id="addBtn">Add to Cart</button>`;
 document.getElementById("productModal").classList.remove("hidden");
 document.getElementById("addBtn").onclick=()=>{addToCart(p);document.getElementById("productModal").classList.add("hidden")};
}

function addToCart(p){
 const c=cart();const x=c.find(i=>i.productId===p.id);
 if(x)x.qty++;else c.push({productId:p.id,qty:1});
 set(KEYS.cart,c);updateCartCount();
}

document.addEventListener("DOMContentLoaded",()=>{
 if(document.getElementById("products")){
  renderHome();
  document.getElementById("searchInput").oninput=e=>renderHome("All",e.target.value);
  document.getElementById("viewAllBtn").onclick=()=>{document.getElementById("searchInput").value="";renderHome()};
  document.getElementById("closeProduct").onclick=()=>document.getElementById("productModal").classList.add("hidden");
 }
 updateCartCount();
});