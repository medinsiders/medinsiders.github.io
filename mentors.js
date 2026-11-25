// Research mentors page: groups from data.js (MENTORS) plus approved mentor applications, with approved reviews from the Apps Script backend.
// Sign-in uses Google Identity Services; the backend checks the ID token, verifies the student (institute email or ID card) and holds every review as Pending until approved.
(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const API=window.OPP_API,CID=window.GOOGLE_CLIENT_ID;
const FEE={free:"Free",semi:"Semi-paid",paid:"Paid"};
const stars=n=>{const r=Math.round(n*2)/2;let s="";for(let i=1;i<=5;i++)s+=`<i class="${r>=i?"on":r>=i-.5?"half":""}"></i>`;return `<span class="stars" aria-label="${n.toFixed(1)} out of 5">${s}</span>`};
const date=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

let groups=(window.MENTORS||[]).slice(),reviews=[],tab="all",user=null,token=null;

function card(g){
  const rs=reviews.filter(r=>r.group===g.id),avg=rs.length?rs.reduce((a,r)=>a+r.stars,0)/rs.length:0;
  const fee=g.fee?FEE[g.fee]:"Fee not stated";
  return `<article class="card mcard" id="g-${esc(g.id)}">
    <div class="top"><span class="lg mono" aria-hidden="true">${esc(g.name.replace(/[^A-Za-z ]/g,"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join(""))}</span><span class="badge ${g.fee?"s-open":"s-na"}">${fee}</span></div>
    <h3>${esc(g.name)}</h3>
    <p class="org"><svg class="ico"><use href="#pin"/></svg>${esc(g.base||"")}</p>
    <div class="rating">${rs.length?`<b>${avg.toFixed(1)}</b>${stars(avg)}<span>${rs.length} review${rs.length>1?"s":""}</span>`:`<span>No reviews yet</span>`}</div>
    <p class="about">${esc(g.about)}</p>
    <div class="links">${(g.links||[]).map(l=>`<a class="lk" href="${esc(l.u)}" target="_blank" rel="noopener"><svg class="ico"><use href="#web"/></svg>${esc(l.t)}</a>`).join("")}</div>
    <p class="chk">${g.claimed?"Mentor verified with LinkedIn and publication links":"Listed by Medinsider from the group's own page · not yet claimed"}</p>
    ${rs.length?`<details class="revs"><summary>Read reviews</summary>
      <div class="sort" role="group" aria-label="Sort reviews"><button aria-pressed="true" data-s="rel">Most relevant</button><button aria-pressed="false" data-s="new">Most recent</button></div>
      <div class="rlist">${list(rs,"rel")}</div></details>`:""}
    <button class="btn line wr" data-g="${esc(g.id)}">Write a review</button>
  </article>`;
}
// shortcut: "most relevant" = longest review first, then newest; switch to helpful-votes if voting is added
function list(rs,how){
  const s=rs.slice().sort(how=="new"?(a,b)=>b.date.localeCompare(a.date):(a,b)=>b.text.length-a.text.length||b.date.localeCompare(a.date));
  return s.map(r=>`<div class="rev">${stars(r.stars)}<span class="who">${esc(r.who)}</span><span class="when">${date(r.date)}</span><p>${esc(r.text)}</p></div>`).join("");
}
function draw(){
  const show=groups.filter(g=>tab=="all"||(tab=="na"?!g.fee:g.fee==tab));
  $("#list").innerHTML=show.length?show.map(card).join(""):`<p class="card">No groups in this category yet.</p>`;
  $$tabs();
}
function $$tabs(){
  const t=$("#tabs");t.textContent="";
  [["all","All"],["free","Free"],["semi","Semi-paid"],["paid","Paid"],["na","Fee not stated"]].forEach(([k,l])=>{
    const n=groups.filter(g=>k=="all"||(k=="na"?!g.fee:g.fee==k)).length;
    const b=document.createElement("button");b.className="chip";b.textContent=`${l} · ${n}`;b.setAttribute("aria-pressed",k==tab);
    b.onclick=()=>{tab=k;draw()};t.append(b);
  });
}
$("#list").addEventListener("click",e=>{
  const s=e.target.closest(".sort button");
  if(s){const c=s.closest(".mcard"),g=c.id.slice(2);s.parentNode.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b==s));c.querySelector(".rlist").innerHTML=list(reviews.filter(r=>r.group===g),s.dataset.s);return}
  const w=e.target.closest(".wr");if(w)openReview(w.dataset.g);
});
draw();

if(API){
  fetch(API+"?kind=reviews").then(r=>r.json()).then(a=>{reviews=a.filter(r=>r&&r.stars>=1&&r.stars<=5);draw()}).catch(()=>{});
  fetch(API+"?kind=mentors").then(r=>r.json()).then(a=>{a.forEach(m=>{if(!groups.some(g=>g.id===m.id))groups.push(Object.assign({claimed:true},m))});draw()}).catch(()=>{});
}

// ---- sign-in, verification, review and mentor forms ----
const dlg=$("#dlg"),body=$("#dlgbody");
function show(html){body.innerHTML=html;dlg.showModal()}
$("#dlgclose").onclick=()=>dlg.close();
function post(o){return fetch(API,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(Object.assign({token},o))}).then(r=>r.json())}

function needLogin(next){
  if(!CID||!API){show(`<h3>Opening soon</h3><p>Sign-in for reviews and mentor listings opens very soon.</p>`);return}
  if(token)return next();
  if(!window.google||!google.accounts){show(`<p>Sign-in is still loading. Please try again in a moment.</p>`);return}
  show(`<h3>Sign in to continue</h3><p>We use your Google account only to check who you are. Your email and ID are never shown on the site.</p><div id="gbtn"></div>`);
  google.accounts.id.initialize({client_id:CID,callback:r=>{token=r.credential;post({op:"me"}).then(m=>{user=m;next()}).catch(()=>show(`<p>Could not sign in. Please try again.</p>`))}});
  google.accounts.id.renderButton($("#gbtn"),{theme:"outline",size:"large",text:"signin_with"});
}

function openReview(gid){
  needLogin(()=>{
    if(!user||!user.ok)return show(`<p>Could not sign in. Please try again.</p>`);
    if(user.status==="Verified")return reviewForm(gid);
    if(user.status==="Pending")return show(`<h3>Verification pending</h3><p>We are checking your ID card. You can write reviews as soon as it is approved.</p>`);
    verifyForm(gid);
  });
}

function verifyForm(gid){
  show(`<h3>Verify that you are a student</h3>
  <p>Only verified students can write reviews. ${user.institutional?"Your institute email is accepted, so just confirm your details.":"Sign in with your institute email to be verified at once, or upload your college ID card. We delete the ID photo as soon as you are verified."}</p>
  <form id="vf">
    <label>College<input name="college" required maxlength="120"></label>
    <label>Year<select name="year" required><option value="">Choose</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>Final year</option><option>Intern</option><option>Graduate</option></select></label>
    ${user.institutional?"":`<label>College ID card (photo, under 3 MB)<input name="idcard" type="file" accept="image/*" required></label>`}
    <button class="btn">Submit</button><p class="msg" role="status"></p>
  </form>`);
  const f=$("#vf"),msg=f.querySelector(".msg");
  f.onsubmit=async e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(f));delete d.idcard;
    const file=f.elements.idcard&&f.elements.idcard.files[0];
    if(file){if(file.size>3e6){msg.textContent="Please choose a photo under 3 MB.";return}
      d.idType=file.type;d.idData=await new Promise(r=>{const x=new FileReader();x.onload=()=>r(String(x.result).split(",")[1]);x.readAsDataURL(file)})}
    msg.textContent="Sending...";
    post(Object.assign({op:"verify"},d)).then(m=>{user=m;m.status==="Verified"?reviewForm(gid):show(`<h3>Thank you</h3><p>We will check your ID card soon. You can write reviews once it is approved.</p>`)})
      .catch(()=>msg.textContent="Could not send. Please try again.");
  };
}

function reviewForm(gid){
  const g=groups.find(x=>x.id===gid);
  show(`<h3>Review ${esc(g.name)}</h3>
  <form id="rf">
    <fieldset class="pick"><legend>Your rating</legend>${[5,4,3,2,1].map(n=>`<input type="radio" name="stars" value="${n}" id="s${n}" required><label for="s${n}" title="${n} star${n>1?"s":""}">★</label>`).join("")}</fieldset>
    <label>Your experience<textarea name="text" required minlength="30" maxlength="1500" rows="5" placeholder="What did you do with them, what did it cost, and what came out of it?"></textarea></label>
    <label class="chk"><input type="checkbox" name="showName"> Show my name (${esc(user.name)}). Leave unticked to post as anonymous.</label>
    <p class="note">Shown as: ${esc(user.college)} · ${esc(user.year)}. Reviews appear after a quick check by our team.</p>
    <button class="btn">Submit review</button><p class="msg" role="status"></p>
  </form>`);
  const f=$("#rf"),msg=f.querySelector(".msg");
  f.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));msg.textContent="Sending...";
    post({op:"review",group:gid,stars:Number(d.stars),text:d.text,showName:!!d.showName})
      .then(r=>r.ok?show(`<h3>Thank you</h3><p>Your review will appear after a quick check.</p>`):msg.textContent=r.error=="dup"?"You have already reviewed this group.":"Could not send. Please try again.")
      .catch(()=>msg.textContent="Could not send. Please try again.")};
}

$("#addgroup").onclick=()=>needLogin(()=>{
  show(`<h3>List your research group</h3>
  <p>Every listing is checked by our team. Give your LinkedIn and at least one of Google Scholar or PubMed.</p>
  <form id="mf">
    <label>Your full name<input name="person" required maxlength="120"></label>
    <label>Your role and institution<input name="role" required maxlength="160" placeholder="e.g. Founder · Resident, AIIMS Delhi"></label>
    <label>Group name<input name="name" required maxlength="120"></label>
    <label>What you offer<textarea name="about" required maxlength="500" rows="3"></textarea></label>
    <label>Fee<select name="fee" required><option value="">Choose</option><option value="free">Free</option><option value="semi">Semi-paid</option><option value="paid">Paid</option></select></label>
    <label>Group website or page<input name="site" type="url" required placeholder="https://"></label>
    <label>Your LinkedIn profile<input name="linkedin" type="url" required placeholder="https://www.linkedin.com/in/..."></label>
    <label>Your Google Scholar profile<input name="scholar" type="url" placeholder="https://scholar.google.com/citations?user=..."></label>
    <label>PubMed link to your papers<input name="pubmed" type="url" placeholder="https://pubmed.ncbi.nlm.nih.gov/?term=..."></label>
    <button class="btn">Send for review</button><p class="msg" role="status"></p>
  </form>`);
  const f=$("#mf"),msg=f.querySelector(".msg");
  f.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));
    if(!/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(d.linkedin)){msg.textContent="Please paste your LinkedIn profile link.";return}
    if(!d.scholar&&!d.pubmed){msg.textContent="Please add Google Scholar or PubMed.";return}
    if(d.scholar&&!/^https:\/\/scholar\.google\.[a-z.]+\//i.test(d.scholar)){msg.textContent="The Google Scholar link should start with https://scholar.google.";return}
    if(d.pubmed&&!/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//i.test(d.pubmed)){msg.textContent="The PubMed link should start with https://pubmed.ncbi.nlm.nih.gov/";return}
    msg.textContent="Sending...";
    post(Object.assign({op:"mentor"},d)).then(r=>r.ok?show(`<h3>Thank you</h3><p>We will check your details and list your group once approved.</p>`):msg.textContent="Could not send. Please try again.")
      .catch(()=>msg.textContent="Could not send. Please try again.")};
});
})();
