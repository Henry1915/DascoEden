const $=id=>document.getElementById(id);
const IMG={sick:"assets/sickbay.jpg",sport:"assets/sports-facilities.jpg",cult:"assets/culture.jpg",campus:"assets/campus.jpg",lab:"assets/science-lab.jpg",foot:"assets/football.jpg"};
document.querySelectorAll("[data-img]").forEach(i=>i.src=IMG[i.dataset.img]);
$("yr").textContent=new Date().getFullYear();
$("menu").onclick=()=>$("nav").classList.toggle("open");

// lightbox
document.querySelectorAll("[data-lb]").forEach(f=>f.onclick=()=>{$("lb").querySelector("img").src=f.querySelector("img").src;$("lb").classList.add("on")});
$("lb").onclick=()=>$("lb").classList.remove("on");

// router
const pages=[...document.querySelectorAll(".page")],links=[...document.querySelectorAll("#nav a")];
let counted=false;
const PATHS={home:"/",about:"/about",academics:"/academics",campus:"/campus-life",staff:"/staff",news:"/news-events",admissions:"/admissions",contact:"/contact",parent:"/parents",teacher:"/teachers",admin:"/admin"};
const NOURL=!!window.NO_URL_ROUTING||location.protocol==="file:";
const SITE="Dasco Eden International School";
const SEO={
 home:[SITE+" | A Holistic School in Kumasi, Ghana","Dasco Eden International School, Mamponteng, Kwabre East, Kumasi. GES and Cambridge curricula. Apply online."],
 about:["About us | "+SITE,"Learn about Dasco Eden International School, an ultra-modern school at Mamponteng, Kumasi, running GES and Cambridge curricula."],
 academics:["Academics | "+SITE,"Programs, facilities and learning at Dasco Eden International School in Kumasi, following the GES and Cambridge curricula."],
 campus:["Campus life | "+SITE,"Photos and videos of cultural celebrations, sports facilities, the sick bay and campus life at Dasco Eden International School."],
 staff:["Our staff | "+SITE,"Meet the teachers and staff of Dasco Eden International School."],
 news:["News and events | "+SITE,"Latest announcements and upcoming events at Dasco Eden International School."],
 admissions:["Admissions | "+SITE,"Apply online to Dasco Eden International School and upload your child's documents securely. Call +233 24 255 4403."],
 contact:["Contact us | "+SITE,"Find Dasco Eden International School at Mamponteng, Kwabre East District, Kumasi. Call +233 24 255 4403 or get directions."],
 parent:["Parent portal | "+SITE,"Parent sign-in for Dasco Eden International School.",1],
 teacher:["Teacher portal | "+SITE,"Teacher sign-in for Dasco Eden International School.",1],
 admin:["Admin sign-in | "+SITE,"Staff sign-in for Dasco Eden International School.",1]};
const idFromPath=()=>{const p=location.pathname.replace(/\/+$/,"")||"/";return Object.keys(PATHS).find(k=>PATHS[k]===p)||"home"};
function setMeta(sel,attr,val){const m=document.querySelector(sel);if(m)m.setAttribute(attr,val)}
function seo(id){const s=SEO[id]||SEO.home;document.title=s[0];
  setMeta('meta[name="description"]',"content",s[1]);setMeta('meta[property="og:title"]',"content",s[0]);setMeta('meta[property="og:description"]',"content",s[1]);
  setMeta('meta[name="robots"]',"content",s[2]?"noindex,nofollow":"index,follow");
  if(!NOURL){const u=location.origin+PATHS[id];setMeta('link[rel="canonical"]',"href",u);setMeta('meta[property="og:url"]',"content",u)}}
function go(id){if(!NOURL){try{history.pushState({},"",PATHS[id])}catch(e){}}route(id)}
let cur;
function route(to){
  let id=to||(NOURL?"home":idFromPath());if(!$("p-"+id))id="home";
  if(!to&&id===cur)return;cur=id;
  pages.forEach(p=>p.classList.toggle("on",p.id==="p-"+id));
  links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")===PATHS[id]));
  seo(id);
  $("nav").classList.remove("open");window.scrollTo(0,0);if(typeof onPage==="function")onPage(id);
  if(id==="home"&&!counted){counted=true;count()}
}
addEventListener("popstate",()=>route());
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("a[href]");if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==="_blank")return;
  const id=Object.keys(PATHS).find(k=>PATHS[k]===a.getAttribute("href"));if(!id)return;e.preventDefault();go(id)});
if(!NOURL&&/^#\/\w+/.test(location.hash)&&PATHS[location.hash.slice(2)]){try{history.replaceState(null,"",PATHS[location.hash.slice(2)])}catch(e){}}

// counters
function count(){document.querySelectorAll("[data-n]").forEach(el=>{const n=+el.dataset.n;let i=0;
  const t=setInterval(()=>{i+=Math.max(1,Math.ceil(n/40));if(i>=n){i=n;clearInterval(t)}el.textContent=i+(el.dataset.s||"")},30)})}



// academics tabs
const P={"Playgroup":"Play-based learning for ages 2 to 5: phonics, number sense, art, music and social skills in a warm, safe setting.",
"Primary":"Years 1 to 6 follow a strong core of English, Mathematics, Science, ICT, French and Creative Arts, with coding from Year 3.",
"Junior High":"Years 7 to 9 focus on BECE preparation, laboratory science, Career Technology, robotics and leadership.",
"Clubs":"Football, debate, coding, cultural dance, choir, art and science clubs every Friday."};
const pt=$("ptabs");
Object.keys(P).forEach(k=>{const b=document.createElement("button");b.textContent=k;b.onclick=()=>pick(k);pt.append(b)});
function pick(k){[...pt.children].forEach(b=>b.classList.toggle("on",b.textContent===k));$("pbody").textContent=P[k]}
pick("Playgroup");

// staff
let STAFF=[];
let sd="All";const sg=$("sgrid"),st=$("stabs");
$("ssearch").oninput=srender;
function srender(){
  const depts=["All",...new Set(STAFF.map(s=>s.d).filter(Boolean))];if(!depts.includes(sd))sd="All";
  st.textContent="";depts.forEach(k=>{const b=document.createElement("button");b.textContent=k;b.className=k===sd?"on":"";b.onclick=()=>{sd=k;srender()};st.append(b)});
  st.classList.toggle("hidden",STAFF.length<2);$("ssearch").classList.toggle("hidden",!STAFF.length);
  const q=$("ssearch").value.toLowerCase();sg.textContent="";
  const list=STAFF.filter(s=>(sd==="All"||s.d===sd)&&(s.n+s.r+s.d).toLowerCase().includes(q));
  $("snone").textContent=STAFF.length?"No staff match your search.":"Our staff profiles will be added soon.";$("snone").classList.toggle("hidden",list.length>0);
  list.forEach(s=>{const c=document.createElement("div");c.className="glass card";c.style.cursor="pointer";
    const av=document.createElement("div");av.className="av";av.textContent=s.n.replace(/^(Mr|Mrs|Ms|Dr)\.\s/,"").split(" ").map(w=>w[0]).join("");
    const h=document.createElement("h3");h.textContent=s.n;
    const r=document.createElement("p");r.textContent=s.r;r.style.cssText="color:var(--blue);font-weight:600";
    const b=document.createElement("p");b.textContent=s.b;b.style.cssText="display:none;margin-top:8px";
    c.onclick=()=>{b.style.display=b.style.display==="none"?"block":"none"};
    c.append(av,h,r,b);sg.append(c)});
}
srender();

// WhatsApp enquiry (default 233242554403 is the school phone from its Google listing; change it in Admin > Settings)
$("enq").onsubmit=e=>{e.preventDefault();
  const m=`Hello, I'm ${$("pn").value}. I'd like admission details for ${$("cn").value} (${$("cl").value}). My number: ${$("ph").value}`;
  const l=document.createElement("a");l.href="https://wa.me/"+SET.wa+"?text="+encodeURIComponent(m);l.target="_blank";l.rel="noopener noreferrer";document.body.append(l);l.click();l.remove();};

// ===== backend client (talks to the Netlify Function at /api) =====
const h=(t,a,...k)=>{const e=document.createElement(t);for(const x in a||{}){if(x==="class")e.className=a[x];else if(x==="style")e.style.cssText=a[x];else e[x]=a[x]}k.flat().forEach(c=>e.append(c instanceof Node?c:document.createTextNode(c==null?"":c)));return e};
// the admin session lives in sessionStorage, so closing the tab signs you out
const bk=k=>k==="rc_admin"||k==="rc_teacher"?sessionStorage:localStorage;
const S={get:k=>{try{return bk(k).getItem(k)||""}catch(e){return ""}},set:(k,v)=>{try{v?bk(k).setItem(k,v):bk(k).removeItem(k)}catch(e){}}};
let PUB={announcements:[],events:[],staff:[],videos:[],settings:{}},SET={wa:"233242554403",pay:"Please contact the school office for payment details."},
 ANN=[],EV=[],APPS=[],PARENTS=[],ATT={},VID=[],TEACHERS=[],MYDOC=null,AI=false,TWOFA=false,lastCode=null,openKid=null,admLoaded=false;
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const CC="233"; // country code used to turn local numbers like 024... into WhatsApp links
const waNum=p=>{let d=String(p||"").replace(/\D/g,"");if(d.startsWith("00"))d=d.slice(2);else if(d.startsWith("0"))d=CC+d.slice(1);return d};
const today=()=>new Date().toLocaleDateString("en-CA");
const SW={P:"present",A:"absent",L:"late"},SL={P:"Present",A:"Absent",L:"Late"};
const fmtDate=s=>new Date(s+"T00:00").toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});
const noticeText=n=>n.childName+" was marked "+SW[n.status]+" on "+fmtDate(n.date)+".";
const money=n=>"GH₵"+(n||0).toLocaleString();
const bar=p=>h("div",{class:"pbar"},h("i",{style:"width:"+Math.round(Math.max(0,Math.min(1,p||0))*100)+"%"}));
function toast(t){const d=h("div",{class:"toast"},t);document.body.append(d);setTimeout(()=>d.remove(),3500)}
async function api(path,body,key){
  const r=await fetch("/api/"+path,{method:body?"POST":"GET",headers:{"content-type":"application/json",...(key&&S.get(key)?{authorization:"Bearer "+S.get(key)}:{})},body:body?JSON.stringify(body):undefined});
  let d={};try{d=await r.json()}catch(e){}
  if(!r.ok){const e=new Error(d.error||"Something went wrong");e.status=r.status;throw e}return d}
async function w(fn){try{await fn()}catch(e){
  if(e.status===401&&S.get("rc_admin")&&$("p-admin").classList.contains("on")){S.set("rc_admin","");admLoaded=false;setAdminLink();toast("Session expired. Please sign in again.");renderAdmin()}
  else if(e.status===401&&S.get("rc_teacher")&&$("p-teacher").classList.contains("on")){S.set("rc_teacher","");TCH=null;toast("Session expired. Please sign in again.");renderTeacher()}
  else toast(e.message||"Something went wrong")}}
function delBtn(fn){const b=h("button",{class:"btn o"},"Delete");let armed=0;
  b.onclick=()=>{if(!armed){armed=1;b.textContent="Sure?";setTimeout(()=>{armed=0;b.textContent="Delete"},3000)}else w(fn)};return b}

// public content
function apply(){
  PUB.videos=PUB.videos||[];VID=PUB.videos;renderVideos();
  ANN=PUB.announcements.slice().sort((a,b)=>b.at-a.at);EV=PUB.events;
  STAFF=PUB.staff;
  SET={wa:(PUB.settings&&PUB.settings.wa)||"233242554403",pay:(PUB.settings&&PUB.settings.pay)||"Please contact the school office for payment details."};
  renderNews();renderEvents();srender();$("aiBtn").classList.toggle("hidden",!AI)}
async function loadPublic(){try{const d=await api("public");PUB={announcements:d.announcements||[],events:d.events||[],staff:d.staff||[],videos:d.videos||[],settings:d.settings||{}};AI=!!d.ai;TWOFA=!!d.twofa}catch(e){}apply();if($("p-admin").classList.contains("on")&&!S.get("rc_admin"))renderAdmin()}
function fill(el,items,empty){el.textContent="";if(!items.length&&empty){el.append(h("li",{class:"glass"},h("div",{style:"color:var(--mute)"},empty)));return}items.forEach(a=>el.append(h("li",{class:"glass"},h("div",{},a.text),h("small",{},new Date(a.at).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})))))}
function renderNews(){const m="No announcements yet. Check back soon.";fill($("annList"),ANN,m);fill($("homeNews"),ANN.slice(0,3),m)}
function renderEvents(){const t=new Date();t.setHours(0,0,0,0);
  const list=EV.slice().sort((a,b)=>a.date<b.date?-1:1).filter(e=>new Date(e.date+"T00:00")>=t);
  const box=$("evList");box.textContent="";
  if(!list.length){box.append(h("p",{class:"note"},"No upcoming events. Check back soon."));return}
  list.forEach(e=>{const d=new Date(e.date+"T00:00");
    box.append(h("div",{class:"glass card ev"},h("div",{class:"date"},h("small",{},d.toLocaleString("en",{month:"short"}).toUpperCase()),String(d.getDate())),h("div",{},h("b",{},e.title),h("br"),h("span",{class:"note"},e.where||""))))})}

// parent portal
const mini=(l,v)=>h("div",{class:"glass stat",style:"padding:14px"},h("b",{class:"grad",style:"font-size:1.7rem"},v),h("span",{},l));
function childCard(c){
  const a=c.att||{},f=c.fees||{},g=c.grades||[],att=a.total?Math.round(a.present/a.total*100):null,t=f.total||0,p=f.paid||0,
  avg=g.length?Math.round(g.reduce((s,x)=>s+x.score,0)/g.length):null;
  return h("div",{class:"glass card",style:"margin-bottom:16px"},
    h("div",{class:"fr2",style:"justify-content:flex-start;gap:14px"},h("div",{class:"av"},c.name.split(" ").map(x=>x[0]).slice(0,2).join("")),h("div",{},h("h3",{style:"margin:0"},c.name),h("span",{class:"note"},c.cls||""))),
    h("div",{class:"stats",style:"margin-top:14px"},mini("Attendance",att==null?"–":att+"%"),mini("Average score",avg==null?"–":avg+"%"),mini("Fee balance",money(Math.max(0,t-p)))),
    c.recent&&c.recent.length?h("div",{class:"fr",style:"margin:12px 0 0"},c.recent.map(r=>h("span",{class:"chip "+r.status,title:r.date},fmtDate(r.date)+" · "+SL[r.status]))):"",
    h("h4",{style:"margin:18px 0 6px"},"Fees"),bar(t?p/t:0),h("span",{class:"note"},"Paid "+money(p)+" of "+money(t)),
    h("h4",{style:"margin:18px 0 6px"},"Grades"),
    g.length?g.map(x=>h("div",{style:"margin:8px 0"},h("div",{class:"fr2"},h("span",{},x.subject+" · "+x.term),h("b",{},x.score+"%")),bar(x.score/100))):h("span",{class:"note"},"No grades yet."),
    c.note?h("div",{class:"glass card",style:"margin-top:14px"},h("b",{},"Teacher's note"),h("p",{},c.note)):"")}
function renderParent(){const b=$("parentBody");b.textContent="";
  if(!S.get("rc_parent")){const c=h("input",{placeholder:"Access code, e.g. AB3K-9XPQ-7M",maxLength:20});
    b.append(h("div",{class:"glass card"},h("h3",{},"Parent login"),h("p",{},"Enter the access code the school office gave you."),
      h("div",{class:"fr"},c,h("button",{class:"btn",onclick:()=>w(async()=>{const d=await api("parent/login",{code:c.value});S.set("rc_parent",d.token);MYDOC=null;renderParent()})},"Sign in"))));return}
  if(!MYDOC){b.append(h("p",{class:"note"},"Loading…"));
    api("parent/me",null,"rc_parent").then(d=>{MYDOC=d;renderParent()}).catch(()=>{S.set("rc_parent","");MYDOC=null;renderParent();toast("Please sign in again.")});return}
  b.append(h("div",{class:"fr2",style:"margin-bottom:18px"},h("p",{class:"lead",style:"margin:0"},"Hello, "+(MYDOC.name||"parent")+". Here is how your child is doing."),
    h("button",{class:"btn o",onclick:()=>{S.set("rc_parent","");MYDOC=null;renderParent()}},"Log out")));
  const kids=MYDOC.children||[];
  if(kids.length)b.append(h("div",{class:"glass card",style:"margin-bottom:16px"},h("h3",{},"Attendance today"),kids.map(c=>h("div",{class:"fr2",style:"margin-top:8px"},h("span",{},c.name+(c.cls?" ("+c.cls+")":"")),c.today?h("span",{class:"chip "+c.today},SL[c.today]):h("span",{class:"note"},"Not taken yet")))));
  const ns=MYDOC.notices||[];
  b.append(h("div",{class:"glass card",style:"margin-bottom:16px"},h("div",{class:"fr2"},h("h3",{style:"margin:0"},"Notifications"+(MYDOC.unread?" ("+MYDOC.unread+" new)":"")),
    MYDOC.unread?h("button",{class:"btn o",onclick:()=>w(async()=>{await api("parent/read",{},"rc_parent");MYDOC=await api("parent/me",null,"rc_parent");lastUnread=0;setParentBadge(0);renderParent()})},"Mark all as read"):""),
    ns.length?ns.map(n=>h("div",{class:"fr2",style:"margin-top:10px"},h("span",{style:n.readAt?"color:var(--mute)":"font-weight:700"},noticeText(n)),n.readAt?"":h("span",{class:"chip A"},"New"))):h("p",{class:"note",style:"margin-top:8px"},"No notifications yet."),
    ("Notification" in window&&Notification.permission==="default")?h("button",{class:"btn o",style:"margin-top:12px",onclick:()=>Notification.requestPermission().then(renderParent)},"Turn on alerts on this device"):"",
    h("p",{class:"note",style:"margin-top:10px"},"Alerts show while this site is open in your browser. New attendance updates appear here within a minute.")));
  if(!kids.length)b.append(h("div",{class:"glass card"},h("p",{style:"color:var(--ink)"},"No children are linked to your account yet. Please contact the school office.")));
  kids.forEach(c=>b.append(childCard(c)));
  b.append(h("div",{class:"glass card"},h("h3",{},"Paying fees"),h("p",{},SET.pay||""),
    h("div",{class:"row"},h("a",{class:"btn",target:"_blank",rel:"noopener noreferrer",href:"https://wa.me/"+SET.wa+"?text="+encodeURIComponent("Hello, I'm "+(MYDOC.name||"a parent")+" ("+(kids[0]?kids[0].name:"")+"'s parent).")},"Message the school"))))}

// admin dashboard
const AT=["Overview","Parents & students","Attendance","Applications","Announcements","Events","Staff","Videos","Teachers","Data & backup","Settings"],STAT=["New","Contacted","Visited","Offered","Enrolled","Declined"],DEPT=["Leadership","Early Years","Primary","Junior High","Support"];
let at=0;
const inp=(p,t)=>h("input",{placeholder:p,type:t||"text",maxLength:200}),lab=(t,e)=>h("label",{class:"lab"},t,e),num=v=>h("input",{type:"number",min:0,value:v}),
 sel=o=>h("select",{},o.map(x=>h("option",{},x))),msg=t=>h("div",{class:"glass card"},h("p",{style:"color:var(--ink)"},t));
async function adminLoad(){const d=await api("admin/data",null,"rc_admin");PUB=d.public;PARENTS=d.parents;APPS=d.applications;ATT=d.attendance||{};TEACHERS=d.teachers||[];admLoaded=true;apply();setAdminLink();bump()}
const savePub=async()=>{await api("admin/save",{key:"public",value:PUB},"rc_admin");apply();renderAdmin()},
 saveApps=async()=>{await api("admin/save",{key:"applications",value:APPS},"rc_admin");renderAdmin()},
 saveParents=async()=>{await api("admin/parents-save",{parents:PARENTS.map(p=>({id:p.id,name:p.name,phone:p.phone||"",children:p.children}))},"rc_admin");renderAdmin()};
function renderAdmin(){const t=$("atabs");t.textContent="";const b=$("adminBody");b.textContent="";
  if(!S.get("rc_admin")){
    const p=h("input",{placeholder:"Password",type:"password",autocomplete:"current-password",required:true}),
      c=TWOFA?h("input",{placeholder:"6-digit code from your authenticator app",inputMode:"numeric",autocomplete:"one-time-code",maxLength:7,required:true}):null,
      show=h("button",{type:"button",class:"btn o",onclick:()=>{p.type=p.type==="password"?"text":"password";show.textContent=p.type==="password"?"Show":"Hide"}},"Show");
    b.append(h("div",{class:"glass card",style:"max-width:460px"},h("h3",{},"Staff sign-in"),h("p",{},"For school staff only. You are signed out after 15 minutes of inactivity."),
      h("form",{class:"fr",style:"display:grid",onsubmit:e=>{e.preventDefault();w(async()=>{const d=await api("admin/login",{password:p.value,code:c?c.value:""});p.value="";S.set("rc_admin",d.token);await adminLoad();renderAdmin()})}},
        h("div",{class:"fr",style:"margin:0"},p,show),c||"",h("button",{class:"btn",type:"submit"},"Sign in"))));return}
  if(!admLoaded){b.append(h("p",{class:"note"},"Loading…"));adminLoad().then(renderAdmin).catch(e=>{S.set("rc_admin","");toast(e.message||"Couldn't load");renderAdmin()});return}
  AT.forEach((n,i)=>t.append(h("button",{class:i===at?"on":"",onclick:()=>{at=i;renderAdmin()}},n)));
  t.append(h("button",{onclick:()=>logout()},"Log out"));
  [aOver,aParents,aAtt,aApps,aAnn,aEv,aStaff,aVid,aTeach,aData,aSet][at](b);restoreFocus()}
function onPage(id){if(id==="admin")renderAdmin();if(id==="parent")renderParent();if(id==="teacher")renderTeacher()}
const simpleRow=(text,del)=>h("div",{class:"glass card fr2",style:"margin-top:10px"},h("span",{},text),delBtn(del));

function aOver(b){const fq=inp("Type a student's name, class, parent or phone");
  b.append(h("form",{class:"glass card",style:"margin-bottom:14px;display:block",onsubmit:e=>{e.preventDefault();pq=fq.value.trim();at=1;renderAdmin()}},h("h3",{},"Find a student"),h("div",{class:"fr"},fq,h("button",{class:"btn",type:"submit"},"Search"))));
  let st=0,ex=0,pd=0,pr=0,ps=0,gs=0,gn=0;
  PARENTS.forEach(p=>(p.children||[]).forEach(c=>{st++;ex+=(c.fees||{}).total||0;pd+=(c.fees||{}).paid||0;pr+=(c.att||{}).present||0;ps+=(c.att||{}).total||0;(c.grades||[]).forEach(g=>{gs+=g.score;gn++})}));
  const k=[["Parents",PARENTS.length],["Students",st],["Fees collected",money(pd)],["Outstanding",money(Math.max(0,ex-pd))],["Attendance",ps?Math.round(pr/ps*100)+"%":"–"],["Average score",gn?Math.round(gs/gn)+"%":"–"],["New applications",APPS.filter(a=>a.status==="New").length],["Announcements",PUB.announcements.length]];
  b.append(h("div",{class:"stats"},k.map(x=>h("div",{class:"glass stat"},h("b",{class:"grad"},String(x[1])),h("span",{},x[0])))));
  b.append(h("div",{class:"glass card",style:"margin-top:16px"},h("h3",{},"Fee collection"),h("div",{style:"height:8px"}),bar(ex?pd/ex:0),h("span",{class:"note"},ex?Math.round(pd/ex*100)+"% of "+money(ex)+" collected":"No fees recorded yet.")));
  b.append(h("div",{class:"glass card",style:"margin-top:16px"},h("h3",{},"Admissions pipeline"),STAT.map(s=>{const n=APPS.filter(a=>a.status===s).length;return h("div",{style:"margin:10px 0"},h("div",{class:"fr2"},h("span",{},s),h("b",{},String(n))),bar(APPS.length?n/APPS.length:0))})))}

// ---------- student search helpers ----------
let pq="",attQ="",tQ="",keepId="";
const deb=(fn,ms)=>{let x;return(...a)=>{clearTimeout(x);x=setTimeout(()=>fn(...a),ms||180)}};
const fold=s=>String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
function matches(q,...f){const w=fold(q).split(" ").filter(Boolean);if(!w.length)return true;const raw=f.join(" "),hay=fold(raw),dig=raw.replace(/\D/g,"");
  return w.every(x=>hay.includes(x)||(/^\d{3,}$/.test(x)&&dig.includes(x)))}
function restoreFocus(){if(!keepId)return;const el=document.querySelector('[data-keep="'+keepId+'"]');keepId="";if(el){el.focus();try{const n=el.value.length;el.setSelectionRange(n,n)}catch(e){}}}
function aStudentForm(b){
  const sn=inp("Student's full name"),sc=inp("Class (e.g. Year 4)"),sf=inp("Fees for the year (GH₵)","number"),
    ps=sel(["+ New parent",...PARENTS.map(p=>p.name+(p.phone?" · "+p.phone:""))]),pn=inp("Parent's full name"),pp=inp("Parent phone (for WhatsApp alerts)"),
    np=h("div",{class:"fr",style:"margin:0;flex:1 1 100%"},pn,pp);
  ps.onchange=()=>np.classList.toggle("hidden",ps.selectedIndex!==0);
  b.append(h("div",{class:"glass card",style:"margin-bottom:14px"},h("h3",{},"Add a student ("+PARENTS.reduce((n,p)=>n+(p.children||[]).length,0)+" so far)"),
    h("p",{},"Every student belongs to a parent. Choose an existing parent, or create a new one and you will get their access code."),
    h("div",{class:"fr",style:"margin-top:10px"},sn,sc,sf),
    h("div",{class:"fr"},lab("Parent",ps)),np,
    h("button",{class:"btn",onclick:()=>{const name=sn.value.trim(),idx=ps.selectedIndex,pnm=pn.value.trim();
      if(!name)return toast("Enter the student's name");
      if(idx===0&&!pnm)return toast("Enter the parent's name");
      w(async()=>{let par;
        if(idx===0){const d=await api("admin/parent-add",{name:pnm,phone:pp.value.trim()},"rc_admin");lastCode={name:pnm,code:d.code};await adminLoad();par=PARENTS.find(x=>x.id===d.id)}
        else par=PARENTS[idx-1];
        if(!par)throw new Error("Couldn't find the parent record. Refresh the page and try again.");
        const kid={id:uid(),name,cls:sc.value.trim(),att:{present:0,total:0},fees:{total:+sf.value||0,paid:0},grades:[],note:""};
        par.children=(par.children||[]).concat(kid);openKid=kid.id;await saveParents();toast("Student added to "+par.name)})}},"Add student")))}
function aParents(b){aStudentForm(b);const nm=inp("Parent name"),ph=inp("Parent phone (for WhatsApp alerts)");
  if(lastCode)b.append(h("div",{class:"glass card",style:"border-color:var(--blue);margin-bottom:14px"},h("h3",{},"Access code for "+lastCode.name),h("p",{},"Share this with the parent now. It is shown only once; you can reset it later."),
    h("div",{class:"fr"},h("input",{readOnly:true,value:lastCode.code}),h("button",{class:"btn o",onclick:()=>navigator.clipboard.writeText(lastCode.code).then(()=>toast("Copied")).catch(()=>toast("Copy failed"))},"Copy"))));
  b.append(h("div",{class:"glass card"},h("h3",{},"Add a parent"),h("p",{},"Creates an access code the parent uses on the Parents page."),
    h("div",{class:"fr"},nm,ph,h("button",{class:"btn",onclick:()=>{if(!nm.value.trim())return toast("Enter a name");const n=nm.value.trim();w(async()=>{const d=await api("admin/parent-add",{name:n,phone:ph.value.trim()},"rc_admin");lastCode={name:n,code:d.code};await adminLoad();renderAdmin()})}},"Create & get code"))));
  if(!PARENTS.length)b.append(h("p",{class:"note",style:"margin-top:14px"},"No parents yet."));
  const sq=inp("Search by student name, class, parent or phone");sq.value=pq;sq.setAttribute("data-keep","pq");sq.oninput=deb(()=>{pq=sq.value;keepId="pq";renderAdmin()});
  let nS=0,nP=0;const shown=PARENTS.filter(p=>{const km=(p.children||[]).filter(c=>matches(pq,c.name,c.cls,p.name,p.phone));nS+=km.length;if(matches(pq,p.name,p.phone)||km.length){nP++;return true}return false});
  b.append(h("div",{class:"glass card",style:"margin-top:14px"},h("h3",{style:"margin-top:0"},"Find a student"),sq,
    h("p",{class:"note",style:"margin-top:8px"},pq?nS+" student(s) in "+nP+" family record(s) match.":"Showing all "+PARENTS.length+" family record(s). Type a name to narrow the list.")));
  if(pq&&!shown.length)b.append(h("p",{class:"note",style:"margin-top:14px"},"No student, parent or class matches “"+pq+"”."));
  shown.forEach(p=>b.append(parentCard(p,pq)))}
function save(p,kids,open){p.children=kids;openKid=open||null;w(saveParents)}
function parentCard(p,q){const kids=p.children||[],c=h("div",{class:"glass card",style:"margin-top:14px"});
  c.append(h("div",{class:"fr2"},h("div",{},h("h3",{style:"margin:0"},p.name)),h("div",{class:"fr",style:"margin:0"},
    h("button",{class:"btn o",onclick:()=>w(async()=>{const d=await api("admin/parent-reset",{id:p.id},"rc_admin");lastCode={name:p.name,code:d.code};renderAdmin()})},"Reset code"),
    delBtn(()=>{PARENTS=PARENTS.filter(x=>x.id!==p.id);return saveParents()}))));
  const pp=inp("Phone, e.g. 024 123 4567");pp.value=p.phone||"";
  c.append(h("div",{class:"fr"},lab("Parent phone (used for WhatsApp alerts)",pp),h("button",{class:"btn o",onclick:()=>{p.phone=pp.value.trim();w(saveParents)}},"Save phone")));
  kids.forEach((k,i)=>c.append(kidEd(p,k,i,q&&matches(q,k.name,k.cls,p.name,p.phone))));
  const cn=inp("Child name"),cc=inp("Class (e.g. Year 4)"),cf=inp("Fees total (GH₵)","number");
  c.append(h("div",{class:"fr",style:"margin-top:12px"},cn,cc,cf,h("button",{class:"btn o",onclick:()=>{if(!cn.value.trim())return;
    kids.push({id:uid(),name:cn.value.trim(),cls:cc.value.trim(),att:{present:0,total:0},fees:{total:+cf.value||0,paid:0},grades:[],note:""});save(p,kids,"")}},"Add child")));return c}
function kidEd(p,c,i,hl){const kids=p.children;c.att=c.att||{present:0,total:0};c.fees=c.fees||{total:0,paid:0};c.grades=c.grades||[];
  const ap=num(c.att.present),at2=num(c.att.total),ft=num(c.fees.total),fp=num(c.fees.paid),nt=inp("Teacher's note to parents");nt.value=c.note||"";
  const gs=inp("Subject"),gv=inp("Score %","number"),gt=inp("Term");gt.value="Term 1";
  const d=h("details",{style:"margin-top:10px"},h("summary",{},c.name+" · "+(c.cls||"")),
    h("div",{class:"fr"},lab("Days present",ap),lab("Total days",at2),lab("Fees total",ft),lab("Fees paid",fp)),
    h("div",{class:"fr"},nt),
    h("div",{class:"fr"},c.grades.map((g,gi)=>h("button",{class:"btn o",title:"Remove grade",onclick:()=>{c.grades.splice(gi,1);save(p,kids,c.id)}},g.subject+" "+g.score+"% ("+g.term+") ×"))),
    h("div",{class:"fr"},gs,gv,gt,h("button",{class:"btn o",onclick:()=>{if(!gs.value.trim()||gv.value==="")return;c.grades.push({subject:gs.value.trim(),score:+gv.value,term:gt.value.trim()});save(p,kids,c.id)}},"Add grade")),
    h("div",{class:"fr"},h("button",{class:"btn",onclick:()=>{c.att={present:+ap.value||0,total:+at2.value||0};c.fees={total:+ft.value||0,paid:+fp.value||0};c.note=nt.value;save(p,kids,c.id)}},"Save changes"),delBtn(()=>{kids.splice(i,1);p.children=kids;return saveParents()})));
  d.open=openKid===c.id||!!hl;return d}

// attendance register (admin)
let attDate=today(),attClass="All",attMarks={},lastNotify=null;
function aAtt(b){
  const kids=[];PARENTS.forEach(p=>(p.children||[]).forEach(c=>kids.push({p,c})));
  const classes=["All",...new Set(kids.map(k=>k.c.cls).filter(Boolean))];
  if(lastNotify){const L=lastNotify.list;
    b.append(h("div",{class:"glass card",style:"border-color:var(--blue);margin-bottom:14px"},h("h3",{},"Register saved"),
      L.length?h("p",{},"Send these parents a WhatsApp message (one tap each):"):h("p",{},"Nothing new to notify. Parents already see today's status on their portal."),
      L.map(x=>{const num=waNum(x.phone),msg="Dear "+x.parentName+", this is Dasco Eden International School. "+x.childName+" was marked "+SW[x.status]+" today ("+fmtDate(lastNotify.date)+")."+(x.status==="A"?" Please let us know if this is unexpected.":"");
        return h("div",{class:"fr2",style:"margin-top:8px"},h("span",{},x.childName+" · "+SL[x.status]+" · "+x.parentName),
          num?h("a",{class:"btn",target:"_blank",rel:"noopener noreferrer",href:"https://wa.me/"+num+"?text="+encodeURIComponent(msg)},"WhatsApp"):h("span",{class:"note"},"No phone saved"))}),
      h("div",{class:"row"},h("button",{class:"btn o",onclick:()=>{lastNotify=null;renderAdmin()}},"Dismiss"))))}
  const d=h("input",{type:"date",value:attDate,max:today()});d.onchange=()=>{if(!d.value)return;attDate=d.value;attMarks={};renderAdmin()};
  const cs=sel(classes);cs.value=attClass;cs.onchange=()=>{attClass=cs.value;renderAdmin()};
  const sq=inp("Search student name");sq.value=attQ;sq.setAttribute("data-keep","attq");sq.oninput=deb(()=>{attQ=sq.value;keepId="attq";renderAdmin()});
  b.append(h("div",{class:"glass card"},h("h3",{},"Take attendance"),h("p",{},"Pick a date and class, mark each learner and save. Parents see the update on their portal straight away."),h("div",{class:"fr"},lab("Date",d),lab("Class",cs),lab("Search student",sq))));
  const list=kids.filter(k=>attClass==="All"||k.c.cls===attClass),vis=list.filter(k=>matches(attQ,k.c.name,k.c.cls,k.p.name));
  if(!list.length){b.append(h("p",{class:"note",style:"margin-top:14px"},"No learners yet. Add parents and children first."));return}
  const saved=ATT[attDate]||{},cur=id=>attMarks[id]||saved[id]||"",info=h("span",{class:"note"});
  const upd=()=>{const un=list.filter(k=>!cur(k.c.id)).length;info.textContent=un?un+" not marked yet":"All marked"};
  b.append(h("div",{class:"fr2",style:"margin:14px 0 6px"},info,h("button",{class:"btn o",onclick:()=>{vis.forEach(k=>{if(!cur(k.c.id))attMarks[k.c.id]="P"});renderAdmin()}},"Mark unmarked as present")));
  if(attQ&&!vis.length)b.append(h("p",{class:"note"},"No student matches “"+attQ+"”."));
  vis.forEach(({p,c})=>{const seg=h("div",{class:"seg"});
    ["P","A","L"].forEach(s=>{const bt=h("button",{type:"button",class:s+(cur(c.id)===s?" on":""),onclick:()=>{attMarks[c.id]=s;[...seg.children].forEach(x=>x.classList.toggle("on",x.dataset.s===s));upd()}},SL[s]);bt.dataset.s=s;seg.append(bt)});
    b.append(h("div",{class:"glass card fr2",style:"margin-top:8px;padding:12px 16px"},h("div",{},h("b",{},c.name),h("br"),h("span",{class:"note"},(c.cls||"")+" · "+p.name)),seg))});
  upd();
  b.append(h("div",{class:"row"},h("button",{class:"btn",onclick:()=>{const marks={};list.forEach(k=>{const v=cur(k.c.id);if(v)marks[k.c.id]=v});
    if(!Object.keys(marks).length)return toast("Mark at least one learner");
    w(async()=>{const r=await api("admin/attendance-save",{date:attDate,marks},"rc_admin");lastNotify={date:attDate,list:r.notify};attMarks={};await adminLoad();renderAdmin()})}},"Save attendance")))}

// campus videos
const DEF_VID=[{title:"Young dancers in kente",url:"assets/videos/video-01.mp4",poster:"assets/videos/video-01.jpg"},{title:"Kente dance performance",url:"assets/videos/video-02.mp4",poster:"assets/videos/video-02.jpg"},{title:"Dancing on the red carpet",url:"assets/videos/video-03.mp4",poster:"assets/videos/video-03.jpg"},{title:"Drummers and guests under the tent",url:"assets/videos/video-04.mp4",poster:"assets/videos/video-04.jpg"},{title:"Celebration under the tent",url:"assets/videos/video-05.mp4",poster:"assets/videos/video-05.jpg"},{title:"Guests on campus",url:"assets/videos/video-06.mp4",poster:"assets/videos/video-06.jpg"}];
function vInfo(u){u=String(u||"").trim();let m;
  if(m=u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i))return{k:"YouTube",id:m[1]};
  if(m=u.match(/vimeo\.com\/(?:video\/)?(\d+)/i))return{k:"Vimeo",id:m[1]};
  if(/facebook\.com|fb\.watch/i.test(u))return{k:"Facebook"};
  if(/\.(mp4|webm|mov)(\?.*)?$/i.test(u))return{k:"Video file"};
  return{k:"Link"}}
function playVideo(m,v,i){m.textContent="";m.onclick=null;m.style.cursor="default";const A="autoplay; encrypted-media; picture-in-picture; fullscreen";
  if(i.k==="YouTube")m.append(h("iframe",{src:"https://www.youtube-nocookie.com/embed/"+i.id+"?autoplay=1&rel=0",allow:A,allowFullscreen:true,title:v.title}));
  else if(i.k==="Vimeo")m.append(h("iframe",{src:"https://player.vimeo.com/video/"+i.id+"?autoplay=1",allow:A,allowFullscreen:true,title:v.title}));
  else if(i.k==="Facebook")m.append(h("iframe",{src:"https://www.facebook.com/plugins/video.php?show_text=false&autoplay=true&href="+encodeURIComponent(v.url),allow:A,allowFullscreen:true,title:v.title}));
  else m.append(h("video",{src:v.url,poster:v.poster||"",controls:true,autoplay:true,playsInline:true,preload:"auto"}))}
function vCard(v,n){const i=v?vInfo(v.url):null,m=h("div",{class:"vm"});
  if(i&&i.k==="YouTube")m.append(h("img",{src:"https://i.ytimg.com/vi/"+i.id+"/hqdefault.jpg",alt:"",loading:"lazy",onerror:function(){this.remove()}}));
  if(i&&v.poster&&i.k!=="YouTube")m.append(h("img",{src:v.poster,alt:"",loading:"lazy"}));
  m.append(h("span",{class:"play"},"▶"));
  if(i){m.append(h("span",{class:"lbl"},i.k==="Link"?"Opens in new tab":i.k));
    m.onclick=()=>{if(i.k==="Link")window.open(v.url,"_blank","noopener,noreferrer");else playVideo(m,v,i)}}
  return h("div",{class:"vc"+(v?"":" empty")},m,h("div",{class:"vt"},v?v.title:"Campus video "+n+": coming soon"))}
function renderVideos(){const g=$("vgrid");if(!g)return;g.textContent="";
  const L=(VID.length?VID:DEF_VID).slice(0,20);L.forEach(v=>g.append(vCard(v)));
  const sec=g.closest("section");if(sec)sec.classList.toggle("hidden",!L.length)}
function aVid(b){const t=inp("Video title"),u=inp("Link (YouTube, Facebook, Vimeo or .mp4)");
  b.append(h("div",{class:"glass card"},h("h3",{},"Campus videos ("+PUB.videos.length+" of 20)"),
    h("p",{},"Paste a YouTube, Facebook or Vimeo link, or a direct .mp4 link. To use your own video file, put it in public/assets/videos/ and type assets/videos/yourfile.mp4. "+(DEF_VID.length?"Until you add one here, the Campus Life page shows the school's "+DEF_VID.length+" built-in videos. Adding your own list replaces them, so use the button below first if you want to keep and edit those.":"The Campus Life page shows these videos. If the list is empty the video section is hidden. Long videos are best uploaded to YouTube and added here as links.")),
    PUB.videos.length||!DEF_VID.length?"":h("button",{class:"btn o",style:"margin-bottom:10px",onclick:()=>{PUB.videos=DEF_VID.map(v=>({...v,id:uid()}));w(savePub)}},"Load the 6 school videos to edit"),
    h("div",{class:"fr"},t,u,h("button",{class:"btn",onclick:()=>{const v=u.value.trim();
      if(PUB.videos.length>=20)return toast("You can add up to 20 videos");
      if(!t.value.trim()||!v)return toast("Add a title and a link");
      if(!/^https:\/\//i.test(v)&&!/^assets\/videos\/[\w .\-]+\.(mp4|webm)$/i.test(v))return toast("Use a full https:// link or assets/videos/name.mp4");
      PUB.videos.push({id:uid(),title:t.value.trim(),url:v});w(savePub)}},"Add video"))));
  PUB.videos.forEach((v,i)=>b.append(simpleRow((i+1)+". "+v.title+" · "+vInfo(v.url).k,()=>{PUB.videos=PUB.videos.filter(x=>x.id!==v.id);return savePub()})))}

// ---------- CSV helpers ----------
function parseTable(text){text=String(text||"").replace(/^\uFEFF/,"");const first=text.split(/\r?\n/)[0]||"";
  const d=first.includes("\t")?"\t":(first.split(";").length>first.split(",").length?";":",");
  const rows=[];let row=[],cur="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;
    else if(c===d){row.push(cur);cur=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cur);cur="";if(row.some(x=>x.trim()))rows.push(row);row=[]}
    else cur+=c}
  row.push(cur);if(row.some(x=>x.trim()))rows.push(row);return rows}
const csvCell=v=>{v=String(v==null?"":v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const toCsv=rows=>rows.map(r=>r.map(csvCell).join(",")).join("\r\n");
function dl(name,text,type,noBom){const a=h("a",{href:URL.createObjectURL(new Blob([(noBom?"":"\uFEFF")+text],{type:(type||"text/csv")+";charset=utf-8"})),download:name});document.body.append(a);a.click();setTimeout(()=>a.remove(),500)}
function codeCard(b){if(!lastCode)return;
  b.append(h("div",{class:"glass card",style:"border-color:var(--blue);margin-bottom:14px"},h("h3",{},"Access code for "+lastCode.name),h("p",{},"Share this now. It is shown only once; you can reset it later."),
    h("div",{class:"fr"},h("input",{readOnly:true,value:lastCode.code}),h("button",{class:"btn o",onclick:()=>navigator.clipboard.writeText(lastCode.code).then(()=>toast("Copied")).catch(()=>toast("Copy failed"))},"Copy"))))}

// ---------- admin: teachers ----------
function aTeach(b){const nm=inp("Teacher's name"),cl=inp("Classes, separated by commas (e.g. Year 4, Year 5)");
  const known=[...new Set(PARENTS.flatMap(p=>(p.children||[]).map(c=>c.cls).filter(Boolean)))];
  codeCard(b);
  b.append(h("div",{class:"glass card"},h("h3",{},"Add a teacher"),
    h("p",{},"Teachers sign in on the Teacher portal with an access code. They can only see the classes you assign: attendance, grades and notes. They never see fees or parent phone numbers."+(known.length?" Classes in use: "+known.join(", ")+".":"")),
    h("div",{class:"fr"},nm,cl,h("button",{class:"btn",onclick:()=>{const n=nm.value.trim();if(!n)return toast("Enter the teacher's name");
      w(async()=>{const d=await api("admin/teacher-add",{name:n,classes:cl.value.split(",").map(s=>s.trim()).filter(Boolean)},"rc_admin");lastCode={name:n,code:d.code};await adminLoad();renderAdmin()})}},"Create & get code"))));
  if(!TEACHERS.length)b.append(h("p",{class:"note",style:"margin-top:14px"},"No teachers yet."));
  TEACHERS.forEach(t=>{const cs=inp("Classes");cs.value=(t.classes||[]).join(", ");
    b.append(h("div",{class:"glass card",style:"margin-top:12px"},h("div",{class:"fr2"},h("h3",{style:"margin:0"},t.name),h("div",{class:"fr",style:"margin:0"},
      h("button",{class:"btn o",onclick:()=>w(async()=>{const d=await api("admin/teacher-reset",{id:t.id},"rc_admin");lastCode={name:t.name,code:d.code};renderAdmin()})},"Reset code"),
      delBtn(()=>{TEACHERS=TEACHERS.filter(x=>x.id!==t.id);return saveTeachers()}))),
      h("div",{class:"fr"},lab("Classes this teacher can access",cs),h("button",{class:"btn o",onclick:()=>{t.classes=cs.value.split(",").map(s=>s.trim()).filter(Boolean);w(saveTeachers)}},"Save classes"))))})}
const saveTeachers=async()=>{await api("admin/teachers-save",{teachers:TEACHERS.map(t=>({id:t.id,name:t.name,classes:t.classes}))},"rc_admin");renderAdmin()};

// ---------- admin: import, export, backup ----------
let impRows=[],lastImport=null;
function aData(b){
  if(lastImport){const L=lastImport;
    b.append(h("div",{class:"glass card",style:"border-color:var(--blue);margin-bottom:14px"},h("h3",{},"Import finished"),
      h("p",{},L.added+" student(s) added"+(L.duplicates?", "+L.duplicates+" already existed":"")+(L.skipped?", "+L.skipped+" skipped":"")+". "+L.newParents.length+" new parent record(s) created."),
      L.newParents.length?h("p",{style:"color:var(--ink)"},"Parent access codes are shown only once. Download them now and keep the file safe."):"",
      h("div",{class:"row"},L.newParents.length?h("button",{class:"btn",onclick:()=>dl("parent-access-codes.csv",toCsv([["Parent","Phone","Access code"],...L.newParents.map(p=>[p.parent,p.phone,p.code])]))},"Download parent codes (CSV)"):"",
        h("button",{class:"btn o",onclick:()=>{lastImport=null;renderAdmin()}},"Done"))))}
  const ta=h("textarea",{rows:6,placeholder:"Paste rows from Excel here (columns: Student name, Class, Parent name, Parent phone, Fees total)"}),fi=h("input",{type:"file",accept:".csv,.tsv,.txt"}),prev=h("div",{});
  const show=()=>{prev.textContent="";if(!impRows.length)return;
    prev.append(h("p",{style:"margin-top:12px;color:var(--ink)"},impRows.length+" student(s) found. Check the first rows:"),
      h("div",{style:"overflow-x:auto"},h("table",{class:"tbl"},h("tr",{},["Student","Class","Parent","Phone","Fees"].map(x=>h("th",{},x))),impRows.slice(0,8).map(r=>h("tr",{},[r.student,r.cls,r.parent,r.phone,r.fees].map(x=>h("td",{},x)))))),
      impRows.length>8?h("p",{class:"note"},"…and "+(impRows.length-8)+" more."):"",
      h("button",{class:"btn",style:"margin-top:10px",onclick:()=>w(async()=>{const tot={added:0,duplicates:0,skipped:0,newParents:[]};
        for(let i=0;i<impRows.length;i+=500){const r=await api("admin/import",{rows:impRows.slice(i,i+500)},"rc_admin");tot.added+=r.added;tot.duplicates+=r.duplicates;tot.skipped+=r.skipped;tot.newParents.push(...r.newParents)}
        impRows=[];lastImport=tot;await adminLoad();renderAdmin()})},"Import "+impRows.length+" students"))};
  const parse=txt=>{let rows=parseTable(txt);if(rows.length&&/student|name|learner|pupil/i.test(rows[0][0]||""))rows=rows.slice(1);
    impRows=rows.map(r=>({student:(r[0]||"").trim(),cls:(r[1]||"").trim(),parent:(r[2]||"").trim(),phone:(r[3]||"").trim(),fees:(r[4]||"").trim()})).filter(r=>r.student);
    if(!impRows.length)toast("No students found. Check the columns.");show()};
  fi.onchange=()=>{const f=fi.files[0];if(f)f.text().then(t=>{ta.value=t;parse(t)})};
  b.append(h("div",{class:"glass card"},h("h3",{},"Import students from Excel"),
    h("p",{},"In Excel, put one student per row with these columns in this order: Student name, Class, Parent name, Parent phone, Fees total. Then copy the rows and paste them below, or save the sheet as CSV and choose the file. Brothers and sisters with the same parent phone are grouped under one parent."),
    h("div",{class:"row",style:"margin:0 0 10px"},h("button",{class:"btn o",onclick:()=>dl("student-import-template.csv",toCsv([["Student name","Class","Parent name","Parent phone","Fees total"],["Kofi Mensah","Year 4","Mrs Mensah","0241234567","1200"],["Ama Mensah","Year 2","Mrs Mensah","0241234567","1100"]]))},"Download template")),
    ta,h("div",{class:"fr"},lab("Or choose a CSV file",fi),h("button",{class:"btn o",onclick:()=>parse(ta.value)},"Check rows")),prev));
  b.append(h("div",{class:"glass card",style:"margin-top:14px"},h("h3",{},"Export to Excel"),h("p",{},"Download all students with their class, parent, fees and attendance. Opens in Excel."),
    h("button",{class:"btn o",onclick:()=>{const rows=[["Student","Class","Parent","Parent phone","Fees total","Fees paid","Balance","Days present","Total days","Attendance %"]];
      PARENTS.forEach(p=>(p.children||[]).forEach(c=>{const a=c.att||{},f=c.fees||{};rows.push([c.name,c.cls,p.name,p.phone||"",f.total||0,f.paid||0,Math.max(0,(f.total||0)-(f.paid||0)),a.present||0,a.total||0,a.total?Math.round(a.present/a.total*100):""])}));
      dl("students-"+today()+".csv",toCsv(rows))}},"Download students (CSV)")));
  const rf=h("input",{type:"file",accept:".json,application/json"}),rbox=h("div",{});
  rf.onchange=()=>{const f=rf.files[0];rbox.textContent="";if(!f)return;
    f.text().then(t=>{let o;try{o=JSON.parse(t)}catch(e){return toast("That file isn't a valid backup")}
      if(!o||o.version!==1)return toast("That file isn't a Dasco Eden backup");
      const pl=(o.parents&&o.parents.list)||[],n=pl.reduce((s,p)=>s+((p.children||[]).length),0),ci=h("input",{placeholder:"Type RESTORE to confirm"});
      rbox.append(h("div",{class:"glass card",style:"margin-top:10px;border-color:#a11d1d"},h("p",{style:"color:var(--ink)"},"This backup (saved "+new Date(o.at||0).toLocaleString()+") has "+pl.length+" parents and "+n+" students. Restoring REPLACES everything currently on the site."),
        ci,h("button",{class:"btn",style:"margin-top:10px",onclick:()=>{if(ci.value.trim()!=="RESTORE")return toast("Type RESTORE to confirm");
          w(async()=>{const r=await api("admin/restore",{backup:o},"rc_admin");toast("Restored "+r.students+" students");await adminLoad();renderAdmin()})}},"Restore backup")))})};
  b.append(h("div",{class:"glass card",style:"margin-top:14px"},h("h3",{},"Backup and restore"),
    h("p",{},"Download a full backup of everything (students, parents, teachers, attendance, applications, news, settings). Keep it somewhere safe and make a new one every week. The file contains private data; do not share it."),
    h("button",{class:"btn",onclick:()=>w(async()=>{const d=await api("admin/backup",null,"rc_admin");dl("dasco-eden-backup-"+today()+".json",JSON.stringify(d,null,2),"application/json",true);toast("Backup downloaded")})},"Download full backup"),
    h("hr",{style:"border:0;border-top:1px solid var(--line);margin:18px 0"}),h("p",{},"Restore from a backup file:"),lab("Choose backup file",rf),rbox))}

// ---------- teacher portal ----------
let TCH=null,tDate=today(),tClass="All",tMarks={};
function teacherLogout(auto){S.set("rc_teacher","");TCH=null;tMarks={};if(auto)toast("You were signed out after 15 minutes of inactivity.");if($("p-teacher").classList.contains("on"))renderTeacher()}
function segs(cur,set){const seg=h("div",{class:"seg"});
  ["P","A","L"].forEach(s=>{const bt=h("button",{type:"button",class:s+(cur===s?" on":""),onclick:()=>{set(s);[...seg.children].forEach(x=>x.classList.toggle("on",x.dataset.s===s))}},SL[s]);bt.dataset.s=s;seg.append(bt)});return seg}
function renderTeacher(){const b=$("teacherBody");b.textContent="";
  if(!S.get("rc_teacher")){const c=h("input",{placeholder:"Teacher access code, e.g. AB3K-9XPQ-7M",maxLength:20,autocomplete:"one-time-code"});
    b.append(h("div",{class:"glass card",style:"max-width:460px"},h("h3",{},"Teacher sign-in"),h("p",{},"Enter the access code from the school office. You are signed out after 15 minutes of inactivity."),
      h("form",{class:"fr",style:"display:grid",onsubmit:e=>{e.preventDefault();w(async()=>{const d=await api("teacher/login",{code:c.value},"");S.set("rc_teacher",d.token);TCH=null;renderTeacher();bump()})}},c,h("button",{class:"btn",type:"submit"},"Sign in"))));return}
  if(!TCH||TCH.date!==tDate){b.append(h("p",{class:"note"},"Loading…"));
    api("teacher/me?date="+tDate,null,"rc_teacher").then(d=>{TCH=d;renderTeacher()}).catch(e=>{S.set("rc_teacher","");TCH=null;toast(e.message||"Please sign in again");renderTeacher()});return}
  const d=h("input",{type:"date",value:tDate,max:today()});d.onchange=()=>{if(!d.value)return;tDate=d.value;tMarks={};TCH=null;renderTeacher()};
  const cs=sel(["All",...TCH.classes]);cs.value=tClass;cs.onchange=()=>{tClass=cs.value;renderTeacher()};
  b.append(h("div",{class:"fr2",style:"margin-bottom:14px"},h("p",{class:"lead",style:"margin:0"},"Hello, "+TCH.name+". Your classes: "+(TCH.classes.join(", ")||"none assigned yet")+"."),h("button",{class:"btn o",onclick:()=>teacherLogout()},"Log out")));
  const list=TCH.students.filter(s=>tClass==="All"||s.cls===tClass);
  const sq=inp("Search by student name");sq.value=tQ;sq.setAttribute("data-keep","tq");sq.oninput=deb(()=>{tQ=sq.value;keepId="tq";renderTeacher()});
  const vis=list.filter(s=>matches(tQ,s.name,s.cls));
  b.append(h("div",{class:"glass card"},h("h3",{},"Take attendance"),h("p",{},"Mark each learner and save. Parents are notified on their portal."),h("div",{class:"fr"},lab("Date",d),lab("Class",cs),lab("Search student",sq))));
  if(!list.length){b.append(h("p",{class:"note",style:"margin-top:14px"},"No students in your classes yet."));return}
  if(tQ&&!vis.length)b.append(h("p",{class:"note",style:"margin-top:14px"},"No student matches “"+tQ+"”."));
  const cur=id=>tMarks[id]||TCH.marks[id]||"";
  b.append(h("div",{class:"row",style:"margin:12px 0 4px"},h("button",{class:"btn o",onclick:()=>{vis.forEach(s=>{if(!cur(s.id))tMarks[s.id]="P"});renderTeacher()}},"Mark unmarked as present")));
  vis.forEach(s=>b.append(h("div",{class:"glass card fr2",style:"margin-top:8px;padding:12px 16px"},h("div",{},h("b",{},s.name),h("br"),h("span",{class:"note"},s.cls||"")),segs(cur(s.id),v=>{tMarks[s.id]=v}))));
  b.append(h("div",{class:"row"},h("button",{class:"btn",onclick:()=>{const marks={};list.forEach(s=>{const v=cur(s.id);if(v)marks[s.id]=v});if(!Object.keys(marks).length)return toast("Mark at least one learner");
    w(async()=>{const r=await api("teacher/attendance-save",{date:tDate,marks},"rc_teacher");tMarks={};TCH=null;toast("Saved. "+r.notified+" parent notice(s) sent.");renderTeacher()})}},"Save attendance")));
  b.append(h("h2",{style:"margin:34px 0 10px"},"Grades and notes"));
  vis.forEach(s=>{const gs=inp("Subject"),gv=inp("Score %","number"),gt=inp("Term"),nt=inp("Note to parents");gt.value="Term 1";nt.value=s.note||"";
    const save=()=>w(async()=>{await api("teacher/student-save",{childId:s.id,grades:s.grades,note:nt.value},"rc_teacher");TCH=null;renderTeacher()});
    b.append(h("details",{class:"glass",style:"margin-bottom:8px"},h("summary",{},s.name+" · "+(s.cls||"")),
      h("div",{class:"fr"},(s.grades||[]).map((g,gi)=>h("button",{class:"btn o",title:"Remove",onclick:()=>{s.grades.splice(gi,1);save()}},g.subject+" "+g.score+"% ("+g.term+") ×"))),
      h("div",{class:"fr"},gs,gv,gt,h("button",{class:"btn o",onclick:()=>{if(!gs.value.trim()||gv.value==="")return;s.grades.push({subject:gs.value.trim(),score:+gv.value,term:gt.value.trim()});save()}},"Add grade")),
      h("div",{class:"fr"},nt,h("button",{class:"btn",onclick:save},"Save note"))))});restoreFocus()}

// ---------- online application with document upload ----------
const DOC_SLOTS=[["birth_certificate","Child's birth certificate"],["photo","Passport-size photo of the child"],["report","Last school report"],["health","Immunisation or health card"],["other","Any other document"]];
const KIND_LABEL={birth_certificate:"Birth certificate",photo:"Passport photo",report:"School report",health:"Health card",other:"Other"};
const MAX_DOC=4*1024*1024;
const fmtSize=n=>n>=1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB";
async function shrink(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size<900*1024)return file;
  try{const bmp=await createImageBitmap(file),max=1600,sc=Math.min(1,max/Math.max(bmp.width,bmp.height)),c=document.createElement("canvas");
    c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.82));
    return blob&&blob.size<file.size?new File([blob],file.name.replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"}):file}catch(e){return file}}
async function uploadDoc(token,file,kind){
  const fd=new FormData();fd.set("kind",kind);fd.set("file",file,file.name);
  const r=await fetch("/api/apply-doc",{method:"POST",headers:{authorization:"Bearer "+token},body:fd});
  let d={};try{d=await r.json()}catch(e){}
  if(!r.ok)throw new Error(d.error||"Upload failed");return d}
function initApply(){const f=$("apply");if(!f)return;
  const slots=$("docSlots"),sts={};
  DOC_SLOTS.forEach(([k,label])=>{const inp=h("input",{type:"file",accept:"image/jpeg,image/png,image/webp,application/pdf,image/*",name:"doc_"+k}),st=h("span",{class:"st"},"JPG, PNG, WebP or PDF, up to 4 MB");sts[k]=st;
    inp.onchange=()=>{const x=inp.files[0];st.className="st";if(!x){st.textContent="JPG, PNG, WebP or PDF, up to 4 MB";return}
      if(!/^(image\/|application\/pdf)/.test(x.type)&&!/\.(jpe?g|png|webp|pdf)$/i.test(x.name)){st.className="st bad";st.textContent="This file type is not accepted. Use JPG, PNG, WebP or PDF.";return}
      st.textContent=x.name+" ("+fmtSize(x.size)+")"};
    slots.append(h("div",{class:"dslot"},h("b",{},label),inp,st))});
  const msg=$("applyMsg"),btn=$("applyBtn"),fail=t=>{msg.textContent=t;msg.scrollIntoView({block:"center",behavior:"smooth"});return false};
  f.onsubmit=async e=>{e.preventDefault();msg.textContent="";const v=n=>f.elements[n].value.trim();
    if(!v("child")||!v("cls")||!v("parent"))return fail("Please fill in the child's name, the class and your name.");
    if(v("phone").replace(/\D/g,"").length<7)return fail("Please enter a phone number we can call.");
    if(!f.elements.consent.checked)return fail("Please tick the confirmation box.");
    btn.disabled=true;btn.textContent="Submitting…";
    try{
      const files=[];
      for(const [k] of DOC_SLOTS){const x=f.elements["doc_"+k].files[0];if(!x)continue;
        if(!/^(image\/|application\/pdf)/.test(x.type)&&!/\.(jpe?g|png|webp|pdf)$/i.test(x.name))throw new Error("“"+x.name+"” is not a JPG, PNG, WebP or PDF file.");
        const y=await shrink(x);if(y.size>MAX_DOC)throw new Error("“"+x.name+"” is larger than 4 MB. Please choose a smaller file.");files.push({k,file:y})}
      const body={child:v("child"),dob:v("dob"),gender:v("gender"),cls:v("cls"),prevSchool:v("prevSchool"),parent:v("parent"),phone:v("phone"),email:v("email"),notes:v("notes"),consent:true};
      const r=await fetch("/api/apply",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      let d={};try{d=await r.json()}catch(e){}
      if(!r.ok)throw new Error(d.error||"We couldn't submit the application. Please call the school on +233 24 255 4403.");
      const done=[],failed=[];
      for(let i=0;i<files.length;i++){btn.textContent="Uploading document "+(i+1)+" of "+files.length+"…";
        try{await uploadDoc(d.token,files[i].file,files[i].k);done.push(files[i])}catch(err){failed.push({...files[i],err:err.message})}}
      showApplyDone(d,body,done,failed)
    }catch(err){fail(err.message||"Something went wrong. Please try again.");btn.disabled=false;btn.textContent="Submit application"}}}
function showApplyDone(d,body,done,failed){
  const box=$("applyDone"),f=$("apply");f.classList.add("hidden");box.classList.remove("hidden");box.textContent="";
  const wa="https://wa.me/"+SET.wa+"?text="+encodeURIComponent("Hello, I have applied online for "+body.child+" ("+body.cls+"). My reference is "+d.ref+".");
  box.append(h("h2",{style:"margin-top:0"},"Application received ✓"),
    h("p",{},"Thank you, "+body.parent+". Your reference number is:"),
    h("p",{style:"font-size:1.8rem;font-weight:800;letter-spacing:.06em;color:var(--navy);margin:6px 0 12px"},d.ref),
    h("p",{},"The admissions office will call you on "+body.phone+". Please keep this reference."),
    done.length?h("p",{class:"note",style:"color:#1d6b2a;font-weight:700"},"Uploaded: "+done.map(x=>KIND_LABEL[x.k]+" ("+x.file.name+")").join(", ")):"");
  if(failed.length){const list=h("div",{});
    box.append(h("div",{class:"glass card",style:"border-color:#a11d1d;margin:12px 0"},h("b",{style:"color:#a11d1d"},"Some files could not be uploaded"),list,
      h("p",{class:"note"},"Your application is saved. You can try again now, or bring the original documents to the school.")));
    failed.forEach(x=>{const row=h("div",{class:"fr2",style:"margin-top:8px"},h("span",{},KIND_LABEL[x.k]+": "+x.err),
      h("button",{class:"btn o",onclick:async function(){this.disabled=true;this.textContent="Uploading…";try{await uploadDoc(d.token,x.file,x.k);row.textContent="✓ "+KIND_LABEL[x.k]+" uploaded"}catch(err){this.disabled=false;this.textContent="Try again";toast(err.message)}}},"Try again"));list.append(row)})}
  box.append(h("div",{class:"row"},h("a",{class:"btn",target:"_blank",rel:"noopener noreferrer",href:wa},"Tell us on WhatsApp"),h("button",{class:"btn o",onclick:()=>location.reload()},"Start another application")))}

async function fetchDoc(a,d,mode){
  const win=mode==="view"?window.open("","_blank"):null;
  try{const r=await fetch("/api/admin/doc?ref="+encodeURIComponent(a.ref)+"&id="+encodeURIComponent(d.id),{headers:{authorization:"Bearer "+S.get("rc_admin")}});
    if(!r.ok){let e={};try{e=await r.json()}catch(x){}throw new Error(e.error||"Couldn't load the file")}
    const blob=await r.blob(),url=URL.createObjectURL(blob);
    if(win&&!win.closed)win.location=url;else{const x=h("a",{href:url,download:d.name||"document"});document.body.append(x);x.click();x.remove()}
    setTimeout(()=>URL.revokeObjectURL(url),120000)}
  catch(err){if(win)win.close();toast(err.message)}}
function aApps(b){const c=inp("Child's name"),pn=inp("Parent's name"),ph=inp("Phone"),cl=inp("Class");
  const nNew=APPS.filter(a=>a.status==="New").length;
  b.append(h("div",{class:"glass card"},h("h3",{},"Applications ("+APPS.length+(nNew?", "+nNew+" new":"")+")"),
    h("p",{},"Applications from the Admissions page appear here with the parent's details and uploaded documents. Documents are private: only you can open them here."),
    h("div",{class:"row",style:"margin:0 0 12px"},h("button",{class:"btn o",onclick:()=>{const rows=[["Reference","Applied","Child","Date of birth","Gender","Class","Previous school","Parent","Phone","Email","Status","Documents","Notes"]];
      APPS.slice().sort((x,y)=>y.at-x.at).forEach(a=>rows.push([a.ref||"",a.source==="online"?new Date(a.at).toLocaleDateString():"",a.child,a.dob||"",a.gender||"",a.cls,a.prevSchool||"",a.parent,a.phone,a.email||"",a.status,(a.docs||[]).length,a.notes||""]));
      dl("applications-"+today()+".csv",toCsv(rows))}},"Download applications (CSV)")),
    h("h3",{style:"font-size:1rem"},"Add an applicant by hand"),
    h("div",{class:"fr"},c,pn,ph,cl,h("button",{class:"btn",onclick:()=>{if(!c.value.trim())return;const x={child:c.value.trim(),parent:pn.value.trim(),phone:ph.value.trim(),cls:cl.value.trim()};w(async()=>{await api("admin/app-add",x,"rc_admin");await adminLoad();renderAdmin()})}},"Add"))));
  APPS.slice().sort((x,y)=>y.at-x.at).forEach(a=>{const s=sel(STAT);s.value=a.status;s.onchange=()=>w(async()=>{await api("admin/app-update",{id:a.id,status:s.value},"rc_admin");a.status=s.value;renderAdmin()});
    const wn=waNum(a.phone),docs=a.docs||[];
    const lines=[["Parent",a.parent],["Phone",a.phone],["Email",a.email],["Previous school",a.prevSchool],["Notes",a.notes]].filter(x=>x[1]);
    b.append(h("div",{class:"glass card",style:"margin-top:12px"},
      h("div",{class:"fr2"},h("div",{},h("b",{style:"font-size:1.05rem"},a.child),a.ref?h("span",{class:"chip P",style:"margin-left:8px"},a.ref):"",h("br"),
        h("span",{class:"note"},[a.cls,a.dob?"Born "+a.dob:"",a.gender,a.source==="online"?"Applied online "+new Date(a.at).toLocaleDateString():"Added by hand"].filter(Boolean).join(" · "))),
        h("div",{class:"fr",style:"margin:0"},s,delBtn(async()=>{await api("admin/app-delete",{id:a.id},"rc_admin");await adminLoad();renderAdmin()}))),
      lines.map(x=>h("div",{style:"margin-top:6px;font-size:.92rem"},h("b",{},x[0]+": "),x[1])),
      h("div",{class:"row",style:"margin:10px 0 0"},a.phone?h("a",{class:"btn o",href:"tel:"+a.phone.replace(/[^\d+]/g,"")},"Call"):"",wn?h("a",{class:"btn o",target:"_blank",rel:"noopener noreferrer",href:"https://wa.me/"+wn},"WhatsApp"):""),
      a.source==="online"?h("div",{style:"margin-top:14px"},h("b",{},"Documents ("+docs.length+")"),
        docs.length?docs.map(d=>h("div",{class:"fr2",style:"margin-top:8px;padding:8px 12px;border:1px solid var(--line);border-radius:10px"},
          h("span",{},h("b",{},KIND_LABEL[d.kind]||"Document")," · ",h("span",{class:"note"},d.name+" · "+fmtSize(d.size))),
          h("div",{class:"fr",style:"margin:0"},h("button",{class:"btn o",onclick:()=>fetchDoc(a,d,"view")},"View"),h("button",{class:"btn o",onclick:()=>fetchDoc(a,d,"download")},"Download"),
            delBtn(async()=>{await api("admin/doc-delete",{ref:a.ref,id:d.id},"rc_admin");await adminLoad();renderAdmin()})))):h("p",{class:"note"},"No documents uploaded.")):""))});
  if(!APPS.length)b.append(h("p",{class:"note",style:"margin-top:14px"},"No applications yet."))}
function aAnn(b){const i=inp("New announcement");
  b.append(h("div",{class:"fr"},i,h("button",{class:"btn",onclick:()=>{if(!i.value.trim())return;PUB.announcements.unshift({id:uid(),text:i.value.trim(),at:Date.now()});w(savePub)}},"Publish")));
  PUB.announcements.slice().sort((x,y)=>y.at-x.at).forEach(a=>b.append(simpleRow(a.text,()=>{PUB.announcements=PUB.announcements.filter(x=>x.id!==a.id);return savePub()})))}
function aEv(b){const t=inp("Event title"),d=inp("","date"),wh=inp("Time · place");
  b.append(h("div",{class:"fr"},t,d,wh,h("button",{class:"btn",onclick:()=>{if(!t.value.trim()||!d.value)return toast("Add a title and date");PUB.events.push({id:uid(),title:t.value.trim(),date:d.value,where:wh.value.trim()});w(savePub)}},"Add event")));
  PUB.events.slice().sort((x,y)=>x.date<y.date?-1:1).forEach(e=>b.append(simpleRow(e.date+" · "+e.title+(e.where?" · "+e.where:""),()=>{PUB.events=PUB.events.filter(x=>x.id!==e.id);return savePub()})))}
function aStaff(b){const n=inp("Name"),r=inp("Role"),d=sel(DEPT),bi=inp("Short bio");
  b.append(h("div",{class:"fr"},n,r,d,bi,h("button",{class:"btn",onclick:()=>{if(!n.value.trim()||!r.value.trim())return toast("Add a name and role");PUB.staff.push({id:uid(),n:n.value.trim(),r:r.value.trim(),d:d.value,b:bi.value.trim()});w(savePub)}},"Add staff")));
  PUB.staff.forEach(s=>b.append(simpleRow(s.n+" · "+s.r+" ("+s.d+")",()=>{PUB.staff=PUB.staff.filter(x=>x.id!==s.id);return savePub()})))}
function aSet(b){const np=h("input",{type:"checkbox",checked:!!(PUB.settings&&PUB.settings.notifyPresent),style:"width:auto"}),wa=inp("WhatsApp number (digits only, with country code)"),pay=inp("Fee payment instructions shown to parents"),ai=h("textarea",{rows:6,maxLength:2000,placeholder:"e.g. Fees: Primary GH₵1,200 per term. School hours 7:30 to 4:30. Uniform shop open Mondays. Admission needs birth certificate and previous report."});ai.value=(PUB.settings&&PUB.settings.aiInfo)||"";wa.value=SET.wa==="233242554403"?"":SET.wa;pay.value=(PUB.settings&&PUB.settings.pay)||"";
  b.append(h("div",{class:"glass card"},h("h3",{},"Site settings"),lab("WhatsApp number",wa),lab("Fee payment instructions",pay),
    h("label",{style:"display:flex;gap:10px;align-items:center;margin-top:12px"},np,"Also notify parents when their child is marked present"),
    h("button",{class:"btn",style:"margin-top:12px",onclick:()=>{PUB.settings={wa:wa.value.replace(/\D/g,""),pay:pay.value,notifyPresent:np.checked,aiInfo:ai.value.trim()};w(savePub)}},"Save settings")));
  b.append(h("div",{class:"glass card",style:"margin-top:14px"},h("div",{class:"fr2"},h("h3",{style:"margin:0"},"AI assistant"),h("span",{class:"chip "+(AI?"P":"A")},AI?"ON":"OFF")),
    AI?h("p",{style:"margin-top:8px"},"Visitors see an \"Ask AI\" button on every page. It answers questions about admissions, programs, clubs and events using the school facts and the information you write below."):h("p",{style:"margin-top:8px"},"The chat is switched off. To turn it on, add an ANTHROPIC_API_KEY environment variable in Netlify and redeploy (see the README)."),
    lab("Extra information the assistant should know (fees, hours, requirements, rules). Do not put private or personal data here.",ai),
    h("p",{class:"note"},"Click Save settings above after editing. Changes apply immediately, with no redeploy.")))}

// AI assistant (needs ANTHROPIC_API_KEY on the server; hidden otherwise)
let hist=[],busy=false;
$("aiBtn").onclick=()=>$("ai").classList.toggle("on");$("aiX").onclick=()=>$("ai").classList.remove("on");
["How do I apply?","What clubs do you have?","Tell me about the science lab"].forEach(q=>{const b=document.createElement("button");b.textContent=q;b.onclick=()=>ask(q);$("sug").append(b)});
function bubble(t,c){const d=document.createElement("div");d.className="m "+c;d.textContent=t;$("msgs").append(d);$("msgs").scrollTop=1e9;return d}
async function ask(q){
  if(busy||!q.trim())return;busy=true;$("sug").classList.add("hidden");
  bubble(q,"u");hist.push({role:"user",content:q});
  const out=bubble("Thinking…","a");
  try{const d=await api("chat",{messages:hist.slice(-8)});out.textContent=d.text;hist.push({role:"assistant",content:d.text})}
  catch(e){out.textContent="Sorry, I couldn't answer just now. Please try again.";hist.pop()}
  busy=false;$("msgs").scrollTop=1e9}
$("aiF").onsubmit=e=>{e.preventDefault();const q=$("aiI").value;$("aiI").value="";ask(q)};

// testimonials carousel
const TEST=[{n:"Ama Boateng",r:"Parent, Year 5",t:"My son's confidence has grown so much since joining Dasco Eden."},
 {n:"Kofi Mensah",r:"Parent, Playgroup",t:"Caring teachers and excellent communication. We feel part of the family."},
 {n:"Esi Owusu",r:"Alumna, now in senior high",t:"Dasco Eden gave me a strong start and the confidence to lead."},
 {n:"Yaw Darko",r:"Parent, Year 8",t:"The regular tests and reports keep us informed every term."},
 {n:"Abena Sarpong",r:"Parent, Year 2",t:"My daughter loves coding club and cultural dance on Fridays."},
 {n:"Nana Quaye",r:"Alumnus",t:"The science lab sparked my love of research."}];
let ti=0;
function renderT(){const box=$("tbox"),n=innerWidth>900?3:innerWidth>600?2:1;box.textContent="";
  for(let i=0;i<n;i++){const x=TEST[(ti+i)%TEST.length];box.append(h("div",{class:"tc"},h("div",{class:"av"},x.n.split(" ").map(w=>w[0]).join("")),h("div",{},h("p",{},x.t),h("b",{},x.n),h("small",{},x.r))))}
  const d=$("tdots");d.textContent="";TEST.forEach((_,i)=>d.append(h("i",{class:i===ti?"on":""})))}
$("tprev").onclick=()=>{ti=(ti+TEST.length-1)%TEST.length;renderT()};$("tnext").onclick=()=>{ti=(ti+1)%TEST.length;renderT()};
addEventListener("resize",renderT);renderT();

function setAdminLink(){$("adminLink").textContent=S.get("rc_admin")?"Dashboard":"Staff Login"}
function logout(auto){S.set("rc_admin","");admLoaded=false;PARENTS=[];APPS=[];setAdminLink();clearTimeout(idle);
  if(auto)toast("You were signed out after 15 minutes of inactivity.");
  if($("p-admin").classList.contains("on"))go("home")}
let idle;function bump(){clearTimeout(idle);if(S.get("rc_admin")||S.get("rc_teacher"))idle=setTimeout(()=>{if(S.get("rc_admin"))logout(true);if(S.get("rc_teacher"))teacherLogout(true)},15*60e3)}
["click","keydown","touchstart"].forEach(e=>addEventListener(e,bump,{passive:true}));
let lastUnread=0;
function setParentBadge(n){const a=document.querySelector('#nav a[href="/parents"]');if(a)a.textContent=n?"Parents ("+n+")":"Parents"}
async function pollParent(first){if(!S.get("rc_parent"))return;
  try{const d=await api("parent/me",null,"rc_parent"),changed=JSON.stringify(d)!==JSON.stringify(MYDOC);
    if(!first&&d.unread>lastUnread&&"Notification" in window&&Notification.permission==="granted"){const n=(d.notices||[]).find(x=>!x.readAt);if(n)try{new Notification("Dasco Eden International School",{body:noticeText(n)})}catch(e){}}
    lastUnread=d.unread;MYDOC=d;setParentBadge(d.unread);if(changed&&$("p-parent").classList.contains("on"))renderParent()}
  catch(e){if(e.status===401){S.set("rc_parent","");MYDOC=null;setParentBadge(0);if($("p-parent").classList.contains("on"))renderParent()}}}
setInterval(()=>{if(!document.hidden)pollParent()},60000);pollParent(true);
initApply();
setAdminLink();bump();
loadPublic();
route();
