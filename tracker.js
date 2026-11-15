// Renders a tracker page from data.js. The page sets <body data-kind="internships|conferences">.
(function(){
const list=(window.OPP||{})[document.body.dataset.kind]||[];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ic=(id,cls="")=>`<svg class="ico ${cls}"><use href="#${id}"/></svg>`;
const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const LABEL={open:"Open",soon:"Closing soon",closed:"Closed",na:"Date not stated"};
const ORDER={open:0,soon:1,na:2,closed:3};

function status(o){
  if(o.status)return o.status;
  if(!o.deadline)return"na";
  const days=Math.ceil((new Date(o.deadline+"T23:59:59")-new Date())/864e5);
  return days<0?"closed":days<=14?"soon":"open";
}
const fact=(icon,label,val)=>`<div class="fact">${ic(icon)}<small>${label}</small>${val?`<span>${esc(val)}</span>`:`<span class="na">Not stated</span>`}</div>`;

function card(o,s){
  const apply=o.applyText||(o.deadline?fmt(o.deadline):null);
  return `<article class="card" data-s="${s}">
    <div class="top"><span class="type">${esc(o.type)}</span><span class="badge s-${s}">${LABEL[s]}</span></div>
    <h3>${esc(o.name)}</h3>
    <p class="org">${ic("pin")}${esc([o.org,o.place].filter(Boolean).join(" · "))}</p>
    <div class="facts">
      ${fact("cap","Who can apply",o.who)}
      ${fact("rupee","Pay / cost",o.pay)}
      ${fact("cal","Dates",o.dates)}
      ${fact("clock","Apply by",apply)}
    </div>
    ${(o.perks||[]).length?`<div class="links">${o.perks.map(p=>`<span class="lk">${ic("check")}${esc(p)}</span>`).join("")}</div>`:""}
    <div class="links">${(o.links||[]).map(l=>`<a class="lk" href="${esc(l.u)}" target="_blank" rel="noopener">${ic(l.k,l.k)}${esc(l.t)}</a>`).join("")}</div>
  </article>`;
}

const rows=list.map(o=>({o,s:status(o)})).sort((a,b)=>ORDER[a.s]-ORDER[b.s]);
const box=$("#list");
function draw(f){
  const show=rows.filter(r=>f=="all"||(f=="open"?(r.s=="open"||r.s=="soon"):r.s=="closed"));
  box.innerHTML=show.length?show.map(r=>card(r.o,r.s)).join(""):`<p class="card" style="grid-column:1/-1">Nothing here yet.</p>`;
}
[["all","All"],["open","Open"],["closed","Closed"]].forEach(([k,label])=>{
  const n=k=="all"?rows.length:rows.filter(r=>k=="open"?(r.s=="open"||r.s=="soon"):r.s=="closed").length;
  const b=document.createElement("button");b.className="chip";b.textContent=`${label} · ${n}`;b.setAttribute("aria-pressed",k=="all");
  b.onclick=()=>{[...$("#chips").children].forEach(c=>c.setAttribute("aria-pressed",c===b));draw(k)};
  $("#chips").append(b);
});
draw("all");
})();
