let students=[];
let filtered=[];
let selected=new Set();
const photoMap=new Map();

const $=id=>document.getElementById(id);

const aliases={
 name:["student name","name","candidate name","trainee name","full name"],
 enrol:["enrollment no","enrollment number","enrolment no","enrolment number","enrollment","enrolment","enrollment no."],
 roll:["roll no","roll number","roll no.","roll"],
 trade:["trade","trade name"],
 batch:["batch","session","batch/session"],
 dob:["dob","date of birth","birth date"],
 address:["address","postal address","permanent address"],
 mobile:["mobile","mobile number","phone","contact number"],
 photo:["photo","photo url","image","image url","photo name","image name"]
};

function norm(v){
 return String(v??"").trim().toLowerCase().replace(/\.[a-z0-9]{2,5}$/i,"").replace(/[^a-z0-9]+/g,"");
}
function textNorm(v){return String(v??"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"");}

function get(row,key){
 const keys=Object.keys(row);
 for(const a of aliases[key]){
   const n=textNorm(a);
   const k=keys.find(x=>textNorm(x)===n || textNorm(x).includes(n));
   if(k && String(row[k]).trim()!=="") return row[k];
 }
 return "";
}

function studentLabel(s){
 return `${get(s,"name")||"Unnamed"} — ${get(s,"enrol")||get(s,"roll")||""}`;
}

function photoFor(s){
 const candidates=[];
 for(const key of ["photo","enrol","roll","name"]){
   const v=get(s,key);
   if(v) candidates.push(norm(v));
 }
 for(const c of candidates){
   if(photoMap.has(c)) return photoMap.get(c);
 }
 for(const [name,url] of photoMap){
   if(candidates.some(c=>c && (name.includes(c)||c.includes(name)))) return url;
 }
 return "";
}

function setCard(s){
 if(!s)return;
 $("name").textContent=get(s,"name")||"—";
 $("enrol").textContent=get(s,"enrol")||"—";
 $("roll").textContent=get(s,"roll")||"—";
 $("trade").textContent=get(s,"trade")||"—";
 $("batch").textContent=get(s,"batch")||"—";
 $("dob").textContent=get(s,"dob")||"—";
 $("address").textContent=get(s,"address")||"—";
 $("mobile").textContent=get(s,"mobile")||"—";
 const box=$("photoBox"); box.innerHTML="";
 const p=photoFor(s);
 if(p){
   const img=new Image(); img.src=p; img.onload=()=>box.appendChild(img);
   img.onerror=()=>box.textContent="PHOTO";
 }else box.textContent="PHOTO";
}

function cardHTML(s){
 const p=photoFor(s);
 const esc=v=>String(v??"—").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
 return `<article class="id-card">
 <div class="card-top"><div class="logo">ITI</div><div><h2>SHREE S K PATEL ITI KADI</h2><div class="sub">GIA-509 · S V CAMPUS KADI</div><div class="title">TRAINEE IDENTITY CARD</div></div></div>
 <div class="photo-area"><div class="photo">${p?`<img src="${p}">`:"PHOTO"}</div></div>
 <div class="details">
 <div class="row"><span>Name</span><b>${esc(get(s,"name"))}</b></div>
 <div class="row"><span>Enrollment No.</span><b>${esc(get(s,"enrol"))}</b></div>
 <div class="row"><span>Roll No.</span><b>${esc(get(s,"roll"))}</b></div>
 <div class="row"><span>Trade</span><b>${esc(get(s,"trade"))}</b></div>
 <div class="row"><span>Batch / Session</span><b>${esc(get(s,"batch"))}</b></div>
 <div class="row"><span>DOB</span><b>${esc(get(s,"dob"))}</b></div>
 <div class="row address"><span>Address</span><b>${esc(get(s,"address"))}</b></div>
 <div class="row"><span>Mobile</span><b>${esc(get(s,"mobile"))}</b></div>
 </div>
 <div class="signatures"><span>Student Signature</span><span>Principal</span></div>
 <div class="footer">If found, please return to the institute.</div>
 </article>`;
}

function updateButtons(){
 const has=students.length>0;
 const chosen=selected.size>0;
 $("previewBtn").disabled=!has;
 $("printBtn").disabled=!has;
 $("bulkBtn").disabled=!chosen;
 $("pdfBtn").disabled=!has;
 $("allPdfBtn").disabled=!has;
}

function renderList(){
 const q=$("search").value.trim().toLowerCase();
 const tr=$("tradeFilter").value;
 filtered=students.filter(s=>{
   const blob=Object.values(s).join(" ").toLowerCase();
   return (!q||blob.includes(q)) && (!tr||String(get(s,"trade"))===tr);
 });
 const sel=$("studentSelect"); sel.innerHTML="";
 filtered.forEach(s=>{
   const o=document.createElement("option");o.value=s._index;o.textContent=studentLabel(s);sel.appendChild(o);
 });
 if(filtered.length) setCard(filtered[0]);
 const list=$("bulkList"); list.innerHTML="";
 filtered.forEach(s=>{
   const d=document.createElement("label"); d.className="student-item";
   d.innerHTML=`<input type="checkbox" data-index="${s._index}" ${selected.has(s._index)?"checked":""}> <span>${studentLabel(s)}</span>`;
   d.querySelector("input").addEventListener("change",e=>{
     const i=Number(e.target.dataset.index); e.target.checked?selected.add(i):selected.delete(i); updateButtons(); updateSelectAll();
   });
   list.appendChild(d);
 });
 $("count").textContent=`${filtered.length} students · ${selected.size} selected`;
 updateButtons(); updateSelectAll();
}

function updateSelectAll(){
 const all=filtered.length>0 && filtered.every(s=>selected.has(s._index));
 $("selectAll").checked=all;
}

$("excelFile").addEventListener("change",e=>{
 const f=e.target.files[0]; if(!f)return;
 const r=new FileReader();
 r.onload=ev=>{
  try{
   const wb=XLSX.read(ev.target.result,{type:"array"});
   students=[];
   wb.SheetNames.forEach(sn=>{
    XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:""}).forEach(row=>{
     row._sheet=sn; students.push(row);
    });
   });
   students=students.filter(s=>Object.keys(s).some(k=>!k.startsWith("_") && String(s[k]).trim()!==""));
   students.forEach((s,i)=>s._index=i);
   selected.clear();
   const trades=[...new Set(students.map(s=>String(get(s,"trade")).trim()).filter(Boolean))].sort();
   $("tradeFilter").innerHTML='<option value="">All trades</option>'+trades.map(t=>`<option>${t.replace(/</g,"&lt;")}</option>`).join("");
   renderList();
   $("status").textContent=`Loaded ${students.length} student records from ${wb.SheetNames.length} sheet(s).`;
  }catch(err){$("status").textContent="Excel error: "+err.message}
 };
 r.readAsArrayBuffer(f);
});

$("photoFiles").addEventListener("change",e=>{
 photoMap.clear();
 [...e.target.files].forEach(file=>{
   const key=norm(file.name);
   photoMap.set(key,URL.createObjectURL(file));
 });
 if(students.length) renderList();
 $("status").textContent=`Loaded ${e.target.files.length} photo file(s). Photos are matched by enrollment, roll number, or student name in the filename.`;
});

$("search").addEventListener("input",renderList);
$("tradeFilter").addEventListener("change",renderList);
$("studentSelect").addEventListener("change",e=>setCard(students[Number(e.target.value)]));

$("selectAll").addEventListener("change",e=>{
 filtered.forEach(s=>e.target.checked?selected.add(s._index):selected.delete(s._index));
 renderList();
});

$("previewBtn").addEventListener("click",()=>{
 const i=Number($("studentSelect").value); if(!Number.isNaN(i)) setCard(students[i]);
});

$("printBtn").addEventListener("click",()=>{
 const i=Number($("studentSelect").value); if(Number.isNaN(i))return;
 $("printArea").innerHTML=cardHTML(students[i]);
 window.print();
});

function chosenStudents(){
 const arr=[...selected].map(i=>students[i]).filter(Boolean);
 if(arr.length)return arr;
 const i=Number($("studentSelect").value);
 return Number.isNaN(i)?[]:[students[i]];
}

$("bulkBtn").addEventListener("click",()=>{
 const arr=chosenStudents(); if(!arr.length)return;
 $("printArea").innerHTML=arr.map(cardHTML).join("");
 window.print();
});

async function makePDF(arr,name){
 if(!arr.length)return;
 const area=$("printArea"); area.innerHTML=arr.map(cardHTML).join("");
 area.style.display="grid";
 const opt={margin:5,filename:name,image:{type:"jpeg",quality:.95},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};
 try{await html2pdf().set(opt).from(area).save();}
 finally{area.style.display="none";area.innerHTML="";}
}

$("pdfBtn").addEventListener("click",()=>{
 const arr=chosenStudents(); makePDF(arr,`ITI_ID_Card_${norm(get(arr[0]||{},"name"))||"student"}.pdf`);
});
$("allPdfBtn").addEventListener("click",()=>{
 if(filtered.length) makePDF(filtered,"ITI_ID_Cards_All_Filtered.pdf");
});

$("clearBtn").addEventListener("click",()=>location.reload());
updateButtons();
