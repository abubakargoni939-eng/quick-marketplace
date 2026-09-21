const sb=window.supabase.createClient(window.QM_SUPABASE_URL,window.QM_SUPABASE_KEY);
const $=id=>document.getElementById(id);
const show=(id,text,ok=true)=>{$(id).textContent=text;$(id).className="msg "+(ok?"success":"danger")};

async function login(){
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||!password)return show("loginMsg","Enter email and password.",false);
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error)return show("loginMsg",error.message,false);
 const {data:admin,error:ae}=await sb.from("admin_users").select("user_id").eq("user_id",data.user.id).maybeSingle();
 if(ae||!admin){await sb.auth.signOut();return show("loginMsg","This account is not an admin.",false)}
 $("loginPanel").classList.add("hidden");$("adminPanel").classList.remove("hidden");await load();
}
async function load(){
 const {data,error}=await sb.from("app_settings").select("*").eq("id",1).single();
 if(error)return show("saveMsg",error.message,false);
 $("bulkMin").value=data.bulk_order_minimum;$("support").value=data.app_delivery_support_percent;
}
async function save(){
 const bulk=Number($("bulkMin").value),support=Number($("support").value);
 if(bulk<0||support<0||support>100)return show("saveMsg","Enter valid values.",false);
 const {error}=await sb.from("app_settings").update({bulk_order_minimum:bulk,app_delivery_support_percent:support}).eq("id",1);
 show("saveMsg",error?error.message:"Settings saved.",!error);
}
async function logout(){await sb.auth.signOut();$("adminPanel").classList.add("hidden");$("loginPanel").classList.remove("hidden")}
document.addEventListener("DOMContentLoaded",()=>{$("login").onclick=login;$("save").onclick=save;$("logout").onclick=logout});