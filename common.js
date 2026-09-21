const QM = (() => {
  const cfg = window.QM_CONFIG || {};
  const client = (window.supabase && cfg.url && cfg.key) ? window.supabase.createClient(cfg.url, cfg.key) : null;
  const money = n => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n)||0);
  const getCart=()=>JSON.parse(localStorage.getItem("qm_cart")||"[]");
  const setCart=c=>{localStorage.setItem("qm_cart",JSON.stringify(c)); updateCartCount();};
  const add=(p,qty=1)=>{let c=getCart();let x=c.find(i=>i.product_id===p.id);if(x)x.qty+=qty;else c.push({...p,product_id:p.id,qty});setCart(c)};
  const updateCartCount=()=>{const n=getCart().reduce((s,x)=>s+x.qty,0);document.querySelectorAll("#cartCount").forEach(e=>e.textContent=n)};
  const signOut=async()=>{if(client)await client.auth.signOut();location.href="index.html"};
  return {client,money,getCart,setCart,add,updateCartCount,signOut};
})();
document.addEventListener("DOMContentLoaded",()=>QM.updateCartCount());