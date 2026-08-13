const BASE_DATA = window.ITI_STUDENTS || [];
const DATA_KEY = "iti_student_data_v4";
const PHOTO_DB = "iti_photo_store_v4";
let students = [];
let selected = null;
let photoUrl = null;

const $ = id => document.getElementById(id);

function clean(v){ return String(v ?? "").trim(); }
function key(v){ return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,""); }
function escapeHtml(v){
  return clean(v).replace(/[&<>"]/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[m]));
}

function loadData(){
  try{
    const saved = localStorage.getItem(DATA_KEY);
    students = saved ? JSON.parse(saved) : structuredClone(BASE_DATA);
  }catch(e){ students = structuredClone(BASE_DATA); }
  renderTrades();
  renderResults();
  if(students.length) selectStudent(students[0].enrolment);
  $("updateInfo").textContent = `${students.length} student records currently available.`;
}

function saveData(){
  localStorage.setItem(DATA_KEY, JSON.stringify(students));
  $("updateInfo").textContent = `${students.length} student records saved in this browser.`;
}

function renderTrades(){
  const trades = [...new Set(students.map(s=>clean(s.trade)).filter(Boolean))].sort();
  $("tradeFilter").innerHTML = '<option value="">All Trades</option>' +
    trades.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

function filteredStudents(){
  const q = key($("searchBox").value);
  const trade = $("tradeFilter").value;
  return students.filter(s=>{
    const matchQ = !q || key(s.name).includes(q) || key(s.enrolment).includes(q);
    const matchT = !trade || s.trade === trade;
    return matchQ && matchT;
  });
}

function renderResults(){
  const list = filteredStudents();
  $("results").innerHTML = "";
  list.slice(0,100).forEach(s=>{
    const div=document.createElement("div");
    div.className="result"+(selected?.enrolment===s.enrolment?" active":"");
    div.innerHTML=`<div><div class="result-name">${escapeHtml(s.name)}</div><div class="result-meta">${escapeHtml(s.enrolment)} · ${escapeHtml(s.trade)} · Batch ${escapeHtml(s.batch)}</div></div><strong>SELECT</strong>`;
    div.onclick=()=>selectStudent(s.enrolment);
    $("results").appendChild(div);
  });
  $("resultInfo").textContent = list.length ? `${list.length} matching student(s).` : "No student found.";
}

function setText(id,v){ $(id).textContent = clean(v) || "—"; }

async function getPhoto(enrolment){
  return new Promise(resolve=>{
    const req=indexedDB.open(PHOTO_DB,1);
    req.onupgradeneeded=e=>e.target.result.createObjectStore("photos");
    req.onsuccess=e=>{
      const db=e.target.result, tx=db.transaction("photos","readonly");
      const r=tx.objectStore("photos").get(String(enrolment));
      r.onsuccess=()=>resolve(r.result || null);
      r.onerror=()=>resolve(null);
    };
    req.onerror=()=>resolve(null);
  });
}

async function savePhoto(enrolment,blob){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(PHOTO_DB,1);
    req.onupgradeneeded=e=>e.target.result.createObjectStore("photos");
    req.onsuccess=e=>{
      const db=e.target.result, tx=db.transaction("photos","readwrite");
      tx.objectStore("photos").put(blob,String(enrolment));
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    };
    req.onerror=()=>reject(req.error);
  });
}

async function showPhoto(enrolment){
  const blob=await getPhoto(enrolment);
  const box=$("cardPhoto");
  if(photoUrl){URL.revokeObjectURL(photoUrl);photoUrl=null;}
  box.innerHTML="";
  if(blob){
    photoUrl=URL.createObjectURL(blob);
    const img=document.createElement("img");
    img.src=photoUrl;
    box.appendChild(img);
    $("photoStatus").textContent="Photo saved";
    $("photoStatus").className="status done";
  }else{
    box.textContent="PHOTO";
    $("photoStatus").textContent="Photo pending";
    $("photoStatus").className="status pending";
  }
}

async function selectStudent(enrolment){
  selected=students.find(s=>String(s.enrolment)===String(enrolment)) || null;
  if(!selected)return;
  setText("sName",selected.name);
  setText("sEnrol",selected.enrolment);
  setText("sTrade",selected.trade);
  setText("sBatch",`${selected.batch} / ${selected.session}`);
  setText("cName",selected.name);
  setText("cEnrol",selected.enrolment);
  setText("cTrade",selected.trade);
  setText("cBatch",`${selected.batch} / ${selected.session}`);
  setText("cDob",selected.dob);
  setText("cAddress",selected.address);
  $("photoInput").disabled=false;
  $("generateBtn").disabled=false;
  $("printBtn").disabled=false;
  $("pdfBtn").disabled=false;
  await showPhoto(selected.enrolment);
  renderResults();
}

$("searchBox").addEventListener("input",renderResults);
$("tradeFilter").addEventListener("change",renderResults);

$("photoInput").addEventListener("change",async e=>{
  if(!selected || !e.target.files[0])return;
  const file=e.target.files[0];
  if(!file.type.startsWith("image/"))return showToast("Please select an image file.");
  await savePhoto(selected.enrolment,file);
  await showPhoto(selected.enrolment);
  showToast("Photo saved for this student.");
  e.target.value="";
});

$("generateBtn").addEventListener("click",async()=>{
  if(!selected)return;
  await showPhoto(selected.enrolment);
  $("idCard").scrollIntoView({behavior:"smooth",block:"center"});
  showToast("ID card generated.");
});

$("printBtn").addEventListener("click",()=>{
  if(!selected)return;
  window.print();
});

$("pdfBtn").addEventListener("click",async()=>{
  if(!selected)return;
  const blob=await getPhoto(selected.enrolment);
  if(!blob) showToast("Upload the student photo first.");
  const img = $("cardPhoto").querySelector("img");
  const win=window.open("","_blank");
  if(!win){showToast("Allow pop-ups to save PDF.");return;}
  const card=$("idCard").outerHTML;
  win.document.write(`<!doctype html><html><head><title>ID Card</title><style>${document.querySelector("style").textContent}</style></head><body><div style="margin:20px">${card}</div><script>window.onload=()=>window.print();<\/script></body></html>`);
  win.document.close();
});

$("excelInput").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const wb=XLSX.read(ev.target.result,{type:"array"});
      const out=[];
      wb.SheetNames.forEach(sheet=>{
        const json=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:""});
        json.forEach(r=>{
          const get=(names)=>{
            const ks=Object.keys(r);
            for(const n of names){
              const nn=key(n);
              const k=ks.find(x=>key(x)===nn || key(x).includes(nn));
              if(k && clean(r[k]))return r[k];
            }
            return "";
          };
          const enrol=get(["EnrolmentNo","EnrollmentNo","Enrollment Number","Enrolment Number","Enrollment"]);
          const name=get(["Student Name","Name","Candidate Name"]);
          if(enrol || name){
            out.push({
              enrolment:clean(enrol),
              session:clean(get(["Session"])),
              trade:clean(get(["Trade","Trade Name"])),
              batch:clean(get(["Batch","Batch No"])),
              name:clean(name),
              dob:clean(get(["Date of Birth","DOB"])),
              address:clean(get(["Address","Postal Address"]))
            });
          }
        });
      });
      const unique=[]; const seen=new Set();
      out.forEach(s=>{const k=key(s.enrolment)||key(s.name);if(k&&!seen.has(k)){seen.add(k);unique.push(s);}});
      if(!unique.length){showToast("No usable student rows found.");return;}
      students=unique;
      saveData(); renderTrades(); selected=null; renderResults();
      $("photoInput").disabled=true; $("generateBtn").disabled=true; $("printBtn").disabled=true; $("pdfBtn").disabled=true;
      $("updateInfo").textContent=`Imported ${students.length} students. Photos already saved in this browser remain available when enrollment numbers match.`;
      showToast(`Imported ${students.length} students.`);
    }catch(err){showToast("Excel error: "+err.message);}
  };
  reader.readAsArrayBuffer(file);
  e.target.value="";
});

$("exportBtn").addEventListener("click",()=>{
  const content="window.ITI_STUDENTS = "+JSON.stringify(students,null,2)+";\n";
  const blob=new Blob([content],{type:"text/javascript"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="data.js"; a.click();
  URL.revokeObjectURL(a.href);
  showToast("Updated data.js downloaded. Replace data.js in GitHub for a permanent website update.");
});

$("resetDataBtn").addEventListener("click",()=>{
  if(!confirm("Restore the original GitHub master data?"))return;
  localStorage.removeItem(DATA_KEY);
  location.reload();
});

function showToast(msg){
  const t=$("toast"); t.textContent=msg; t.style.display="block";
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.style.display="none",3000);
}

loadData();
