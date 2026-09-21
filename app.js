const products = [
{id:"demo-rice",name:"Rice",price:85000,shop:"Cap Shop",city:"Maiduguri",category:"Food",emoji:"🍚",stock:100,min_order:1},
{id:"demo-beans",name:"Beans",price:70000,shop:"Cap Shop",city:"Maiduguri",category:"Food",emoji:"🫘",stock:100,min_order:1},
{id:"demo-oil",name:"Cooking Oil",price:12000,shop:"Abba Store",city:"Maiduguri",category:"Food",emoji:"🛢️",stock:100,min_order:1},
{id:"demo-drink",name:"Soft Drink",price:1000,shop:"City Drinks",city:"Maiduguri",category:"Drinks",emoji:"🥤",stock:100,min_order:1},
{id:"demo-shirt",name:"T-Shirt",price:8500,shop:"Fashion House",city:"Maiduguri",category:"Fashion",emoji:"👕",stock:50,min_order:1},
{id:"demo-phone",name:"Phone",price:150000,shop:"Mobile World",city:"Maiduguri",category:"Electronics",emoji:"📱",stock:20,min_order:1},
{id:"demo-shoes",name:"Shoes",price:18000,shop:"Fashion House",city:"Maiduguri",category:"Fashion",emoji:"👟",stock:30,min_order:1},
{id:"demo-chair",name:"Plastic Chair",price:7000,shop:"Home Store",city:"Maiduguri",category:"Household",emoji:"🪑",stock:80,min_order:1}
];
function allProducts(){return [...products,...JSON.parse(localStorage.getItem("qm_products")||"[]")]}
function card(p){return `<article class="card"><div class="pic">${p.emoji||"📦"}</div><div class="card-body"><b>${p.name}</b><div class="price">${QM.money(p.price)}</div><div class="muted">${p.shop||"Shop"} • ${p.city||""}</div><button class="btn full" style="margin-top:10px" onclick='QM.add(${JSON.stringify(p).replaceAll("'","&#39;")},1)'>Add to cart</button></div></article>`}
function render(q="",cat=""){let arr=allProducts().filter(p=>(!q||(p.name+" "+p.shop+" "+p.category).toLowerCase().includes(q.toLowerCase()))&&(!cat||p.category===cat));document.querySelector("#products").innerHTML=arr.map(card).join("")||"<p>No products found.</p>"}
document.addEventListener("DOMContentLoaded",()=>{const cats=[["🍚","Food"],["🥤","Drinks"],["👕","Fashion"],["📱","Electronics"],["🏠","Household"]];document.querySelector("#categories").innerHTML=cats.map(([e,n])=>`<a class="cat" href="products.html?category=${encodeURIComponent(n)}"><b>${e}</b>${n}</a>`).join("");render();document.querySelector("#search").addEventListener("input",e=>render(e.target.value));});