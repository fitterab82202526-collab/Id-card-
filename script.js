let students=[];
const $=id=>document.getElementById(id);
const aliases={
 name:["student name","name","candidate name","trainee name"],
 enrol:["enrollment no","enrollment number","enrolment no","enrolment number","enrollment"],
 roll:["roll no","roll number","roll"],
 trade:["trade"],
 batch:["batch","session"],
 dob:["dob","date of birth"],
 address:["address","postal address"],
 mobile:["mobile","mobile number","phone"],
 photo:["photo","photo url","image","image url"]
};
function norm(v){return String(v??"").trim().toLowerCase().replace(/[^a-z0-9]+/g," ")}
function get(row, key){
  const keys=Object.keys(row);
  for(const a of aliases[key]){
    const n=norm(a);
    const k=keys.find(x=>norm(x)===n || norm(x).includes(n));
    if(k && row[k]!==undefined && String(row[k]).trim()!=="") return row[k];
  }
  return "";
}
function render(i){
  const s=students[i]; if(!s)return;
  ["name","enrol","roll","trade","batch","dob","address","mobile"].forEach(k=>$(k).textContent=get(s,k)||"—");
  const p=get(s,"photo"); const box=$("photoBox");
  box.innerHTML="";
  if(p && /^https?:\/\//i.test(String(p))){
    const img=document.createElement("img"); img.src=p; img.onerror=()=>box.textContent="PHOTO"; box.appendChild(img);
  }else box.textContent="PHOTO";
  $("printBtn").disabled=false;
}
function fillSelect(list){
  const sel=$("studentSelect"); sel.innerHTML="";
  list.forEach((s,i)=>{
    const o=document.createElement("option");o.value=i;
    o.textContent=`${get(s,"name")||"Unnamed"} — ${get(s,"enrol")||get(s,"roll")||""}`;
    sel.appendChild(o);
  });
  if(list.length){sel.selectedIndex=0;render(list[0]._index);}
}
$("excelFile").addEventListener("change",e=>{
 const f=e.target.files[0]; if(!f)return;
 const r=new FileReader();
 r.onload=ev=>{
   try{
    const wb=XLSX.read(ev.target.result,{type:"array"});
    students=[];
    wb.SheetNames.forEach(sn=>{
      XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:""}).forEach(r=>{r._sheet=sn;students.push(r)});
    });
    students=students.filter(s=>Object.values(s).some(v=>String(v).trim()!==""));
    students.forEach((s,i)=>s._index=i);
    fillSelect(students);
    $("status").textContent=`Loaded ${students.length} student records from ${wb.SheetNames.length} sheet(s).`;
   }catch(err){$("status").textContent="Could not read the Excel file: "+err.message}
 };
 r.readAsArrayBuffer(f);
});
$("search").addEventListener("input",e=>{
 const q=e.target.value.toLowerCase().trim();
 const list=!q?students:students.filter(s=>Object.values(s).some(v=>String(v).toLowerCase().includes(q)));
 fillSelect(list);
});
$("studentSelect").addEventListener("change",e=>render(Number(e.target.value)));
$("printBtn").addEventListener("click",()=>window.print());
$("clearBtn").addEventListener("click",()=>location.reload());
