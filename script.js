const APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbzv6HldKj9WSjuaNvuVEGqxEYXpzssvu6AnNTfKGk-HOVmwcGsbf0bUPEHjmJ3bH86d/exec";
const students=window.ITI_STUDENTS||[];let selected=null,photoData=null;
const $=id=>document.getElementById(id);
const norm=v=>String(v??"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function set(id,v){$(id).textContent=String(v||"—")}
function toast(t){$("toast").textContent=t;$("toast").style.display="block";clearTimeout(window.tt);window.tt=setTimeout(()=>$("toast").style.display="none",3000)}
function init(){const trades=[...new Set(students.map(s=>s.trade).filter(Boolean))].sort();$("trade").innerHTML='<option value="">All Trades</option>'+trades.map(t=>`<option>${esc(t)}</option>`).join("");render();if(students[0])select(students[0])}
function render(){const q=norm($("search").value),t=$("trade").value;const list=students.filter(s=>(!q||norm(s.name).includes(q)||norm(s.enrolment).includes(q))&&(!t||s.trade===t));$("results").innerHTML=list.slice(0,100).map(s=>`<div class="result" data-e="${esc(s.enrolment)}"><div><b>${esc(s.name)}</b><br><small>${esc(s.enrolment)} · ${esc(s.trade)} · ${esc(s.batch)}</small></div><b>SELECT</b></div>`).join("");document.querySelectorAll(".result").forEach(x=>x.onclick=()=>select(students.find(s=>s.enrolment===x.dataset.e)));$("info").textContent=`${list.length} matching student(s).`}
async function select(s){if(!s)return;selected=s;set("sName",s.name);set("sEnrol",s.enrolment);set("sTrade",s.trade);set("cName",s.name);set("cEnrol",s.enrolment);set("cTrade",s.trade);set("cBatch",`${s.batch} / ${s.session}`);set("cDob",s.dob);set("cAddress",s.address);$("photoInput").disabled=false;await loadPhoto(s.enrolment);render()}
function jsonp(url){return new Promise((resolve,reject)=>{const cb="cb_"+Date.now()+"_"+Math.random().toString(36).slice(2);window[cb]=r=>{delete window[cb];script.remove();resolve(r)};const script=document.createElement("script");script.src=url+(url.includes("?")?"&":"?")+"callback="+cb;script.onerror=()=>{delete window[cb];script.remove();reject(new Error("Apps Script request failed"))};document.body.appendChild(script);setTimeout(()=>{if(window[cb]){delete window[cb];script.remove();reject(new Error("Request timeout"))}},20000)})}
async function loadPhoto(enrol){$("photoBox").innerHTML="Loading…";$("photoStatus").textContent="Checking Google Drive…";$("photoStatus").className="";try{const r=await jsonp(APPS_SCRIPT_URL+"?action=getPhoto&enrollment="+encodeURIComponent(enrol));if(r&&r.success&&r.data&&r.data.data){photoData=r.data.data;display(photoData)}else{photoData=null;noPhoto()}}catch(e){photoData=null;noPhoto();toast("Could not read Google Drive photo.")}}
function display(data){$("photoBox").innerHTML=`<img src="${data}" alt="Student photo">`;$("photoStatus").textContent="Photo synced from Google Drive";$("photoStatus").className="ok"}
function noPhoto(){$("photoBox").textContent="PHOTO";$("photoStatus").textContent="Photo not found";$("photoStatus").className=""}
function file64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
$("photoInput").onchange=async e=>{if(!selected||!e.target.files[0])return;try{toast("Uploading photo…");const data=await file64(e.target.files[0]);await fetch(APPS_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({enrollment:selected.enrolment,photo:data})});photoData=data;display(data);toast("Photo saved to Google Drive. Verifying…");setTimeout(()=>loadPhoto(selected.enrolment),1500)}catch(err){toast("Upload failed.")}e.target.value=""}
$("generate").onclick=async()=>{if(selected){await loadPhoto(selected.enrolment);$("card").scrollIntoView({behavior:"smooth"})}}
$("print").onclick=()=>window.print();
$("pdf").onclick=()=>{const w=window.open("","_blank");if(!w){toast("Allow pop-ups.");return}w.document.write(`<html><head><title>ITI ID Card</title><style>${document.querySelector("style")?.textContent||""}</style></head><body>${$("card").outerHTML}<script>onload=()=>print()<\/script></body></html>`);w.document.close()}
$("search").oninput=render;$("trade").onchange=render;function startWebsite(){init();}
if(portalLoggedIn()) startWebsite();

/* Simple portal login gate.
   NOTE: GitHub Pages is public, so this is an access gate, not strong security. */
const PORTAL_USER="ITI";
const PORTAL_PASS="509";

function portalLoggedIn(){
  return sessionStorage.getItem("itiPortalLogin")==="1";
}
function showPortal(){
  $("loginScreen").style.display="none";
  $("portalApp").style.display="block";
}
function showLogin(){
  $("loginScreen").style.display="flex";
  $("portalApp").style.display="none";
}
function doLogin(){
  const u=$("loginUser").value.trim();
  const p=$("loginPass").value;
  if(u===PORTAL_USER && p===PORTAL_PASS){
    sessionStorage.setItem("itiPortalLogin","1");
    $("loginError").textContent="";
    showPortal();
    startWebsite();
  }else{
    $("loginError").textContent="Incorrect username or password.";
  }
}
$("loginBtn").addEventListener("click",doLogin);
$("loginPass").addEventListener("keydown",e=>{if(e.key==="Enter")doLogin();});
if(portalLoggedIn()) showPortal(); else showLogin();
