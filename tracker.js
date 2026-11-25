// Renders a tracker page from data.js plus approved community submissions (window.OPP_API). The page sets <body data-kind="internships|conferences">.
(function(){
const kind=document.body.dataset.kind;
const base=(window.OPP||{})[kind]||[];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ic=(id,cls="")=>`<svg class="ico ${cls}"><use href="#${id}"/></svg>`;
const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const LABEL={open:"Open",soon:"Closing soon",later:"Opens soon",closed:"Closed",na:"Date not stated"};
const ORDER={open:0,soon:1,later:2,na:3,closed:4};
const NOUN=kind=="internships"?"internship":"conference";

function status(o){
  if(o.status)return o.status;
  if(!o.deadline)return"na";
  const days=Math.ceil((new Date(o.deadline+"T23:59:59")-new Date())/864e5);
  return days<0?"closed":days<=14?"soon":"open";
}
const fact=(icon,label,val,cls="")=>`<div class="fact ${cls}">${ic(icon)}<small>${label}</small>${val?`<span>${esc(val)}</span>`:`<span class="na">Not stated</span>`}</div>`;

function card(o,s){
  const apply=o.applyText||(o.deadline?fmt(o.deadline):null);
  const fee=o.fee!==undefined?o.fee:o.pay;
  const mark=o.logo?`<span class="lg${o.dark?" dark":""}"><img src="${esc(o.logo)}" alt="" loading="lazy"></span>`:`<span class="lg mono" aria-hidden="true">${esc(o.mono||(o.short||o.org||"?").slice(0,3).toUpperCase())}</span>`;
  return `<article class="card" data-s="${s}">
    <div class="top">${mark}<span class="badge s-${s}">${LABEL[s]}</span></div>
    <h3>${esc(o.name)}</h3>
    <p class="org">${ic("pin")}${esc([o.org,o.place].filter(Boolean).join(" · "))}</p>
    <div class="facts">
      ${fact("clock",kind=="conferences"?"Deadline":"Apply by",apply,kind=="conferences"?"":"wide")}
      ${kind=="conferences"?fact("rupee","Registration fee",fee):""}
    </div>
    <div class="links">${(o.links||[]).map(l=>`<a class="lk" href="${esc(l.u)}" target="_blank" rel="noopener">${ic(l.k,l.k)}${esc(l.t)}</a>`).join("")}</div>
    ${o.checked?`<p class="chk">Checked on the official site, ${fmt(o.checked)}</p>`:""}
  </article>`;
}

// shortcut: community submissions carry no country, so they are listed under India; add a country field to the form if international ones start coming in
const intl=o=>o.intl!==undefined?!!o.intl:/^US conference/.test(o.type||"");
let rows=[],filter="all",q="",scope="all";
const box=$("#list");
const hit=o=>!q||[o.name,o.org,o.place,o.type,o.about,o.who,o.benefits,o.pay,o.dates].join(" ").toLowerCase().includes(q);
const pick=k=>rows.filter(r=>hit(r.o)&&(scope=="all"||(scope=="intl")==intl(r.o))&&(k=="all"||(k=="open"?(r.s=="open"||r.s=="soon"):k=="later"?r.s=="later":r.s=="closed")));
const count=k=>pick(k).length;
function draw(){
  const show=pick(filter);
  const group=(title,icon,list)=>list.length?`<h2 class="grp">${ic(icon)}${title} <small>${list.length}</small></h2><div class="tlist">${list.map(r=>card(r.o,r.s)).join("")}</div>`:"";
  box.innerHTML=show.length?group("India","flag",show.filter(r=>!intl(r.o)))+group("International","plane",show.filter(r=>intl(r.o))):`<p class="card">Nothing here yet.</p>`;
}
const chips=$("#chips");
const seg=document.createElement("div");seg.className="seg";seg.setAttribute("role","group");seg.setAttribute("aria-label","Where");
function paintSeg(){
  seg.textContent="";
  [["all","All"],["nat","India"],["intl","International"]].forEach(([k,label])=>{
    const b=document.createElement("button");b.textContent=label;b.setAttribute("aria-pressed",k==scope);
    b.onclick=()=>{scope=k;paintSeg();paint()};seg.append(b);
  });
}
function paint(){
  chips.textContent="";
  [["all","All"],["open","Open"],["later","Opens soon"],["closed","Closed"]].filter(([k])=>k!="later"||rows.some(r=>r.s=="later")).forEach(([k,label])=>{
    const b=document.createElement("button");b.className="chip";b.textContent=`${label} · ${count(k)}`;b.setAttribute("aria-pressed",k==filter);
    b.onclick=()=>{filter=k;paint()};
    chips.append(b);
  });
  draw();
}
function build(extra){
  rows=base.concat(extra).map(o=>({o,s:status(o)})).sort((a,b)=>ORDER[a.s]-ORDER[b.s]);
  paint();
}
const search=document.createElement("input");search.type="search";search.className="tsearch";
search.placeholder="Search "+NOUN+"s by name, place, eligibility...";search.setAttribute("aria-label","Search "+NOUN+"s");
search.oninput=()=>{q=search.value.trim().toLowerCase();paint()};
chips.before(search);chips.before(seg);paintSeg();
build([]);

// Approved community submissions. Only rows the owner set to "Approved" in the Google Sheet are returned.
const fromSheet=r=>({name:r.name,org:r.org,type:"Community · "+NOUN,about:r.what,who:r.who,pay:r.fee,dates:r.dates,benefits:r.benefits,
  deadline:/^\d{4}-\d\d-\d\d$/.test(r.deadline)?r.deadline:null,
  links:/^https?:\/\//i.test(r.url)?[{k:"web",t:"Official website",u:r.url}]:[]});
if(window.OPP_API)fetch(window.OPP_API).then(r=>r.json()).then(a=>build(a.filter(r=>r.kind==kind).map(fromSheet))).catch(()=>{});

// Submission form
const F=(id,label,type,hint,opt)=>`<label for="f-${id}">${label}${opt?"":" *"}</label>${type=="textarea"?`<textarea id="f-${id}" name="${id}" rows="3" maxlength="700" ${opt?"":"required"} placeholder="${hint}"></textarea>`:`<input id="f-${id}" name="${id}" type="${type}" maxlength="300" ${opt?"":"required"} placeholder="${hint}">`}`;
const sec=document.createElement("details");sec.className="submit";sec.id="submit";
sec.innerHTML=`<summary class="btn">${ic("arrow")}Add a${kind=="internships"?"n":""} ${NOUN}</summary>
<form novalidate>
  <p class="note">Everything is checked before it goes live. Details must come from the official source.</p>
  ${F("name","Name of the "+NOUN,"text","e.g. Summer research internship 2027")}
  ${F("org","Organiser or institute","text","Who runs it")}
  ${F("what","What is it?","textarea","Two or three lines")}
  ${F("deadline","Last date to apply","date","")}
  ${F("who","Who is eligible?","text","e.g. MBBS final year and interns")}
  ${F("dates","Program dates","text","e.g. 4–15 Jan 2027")}
  ${F("benefits","Benefits of the program","textarea","Stipend, certificate, mentorship, travel, ...")}
  ${F("fee","Registration fee","text","Write None if there is no fee")}
  ${F("url","Official website link","url","https://")}
  ${F("contact","Your email (private, we only use it if we have a question)","email","",1)}
  <input name="hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
  <label class="chk"><input type="checkbox" name="ok" required> I got these details from the official source.</label>
  <button class="btn cta" type="submit">Submit for review</button>
  <p class="msg" role="status" aria-live="polite"></p>
</form>`;
$(".cta-card").before(sec);
const form=sec.querySelector("form"),msg=sec.querySelector(".msg");
form.addEventListener("submit",e=>{
  e.preventDefault();
  if(!window.OPP_API){msg.textContent="Submissions open very soon. Please try again later.";return}
  if(!form.checkValidity()){form.reportValidity();return}
  const d=Object.fromEntries(new FormData(form));delete d.ok;d.kind=kind;
  if(!/^https?:\/\//i.test(d.url)){msg.textContent="Please paste the full website link, starting with https://";return}
  const btn=form.querySelector("button");btn.disabled=true;msg.textContent="Sending...";
  // Apps Script cannot answer cross-site POSTs, so this is fire-and-forget (no-cors, text/plain).
  fetch(window.OPP_API,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify(d)})
    .then(()=>{form.reset();msg.textContent="Thank you! We will check it and publish it if it is genuine.";btn.disabled=false})
    .catch(()=>{msg.textContent="Could not send. Please check your internet and try again.";btn.disabled=false});
});
})();
