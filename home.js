// Home page: tracker counts, video grid, Shorts/reels rows, filters and the rub-to-reveal hero.
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

// tracker counts come from data.js
$("#n-int").textContent=OPP.internships.length;
$("#n-conf").textContent=OPP.conferences.length;


// Tags: opp = verified opportunities (MedEngage, MedSRT, IISc), sop = SOP/CV writing, web = webinars & mentorship.
// shortcut: hand-maintained lists with tags guessed from titles and captions; add a line at the top for each new video, Short or reel
const V=[ // [YouTube id, title, tags]
["iguTtv4-fxc","MBBS to IIM Ahmedabad to Bain: Is an MBA Worth It for Doctors?","web"],
["FfjBtuhkMA0","Everyone Says “Write a Good SOP” but Nobody Shows You How: MedSRT SOP and CV, Step by Step","sop opp"],
["_cXrIE4NuPw","Underselling vs Overselling : Getting the balance right in your SOP","sop"],
["Oat_hfZjSiY","The Good OL' DAYS : The MedSRT experience","opp"],
["tYf1YkkxCvE","Is MedSRT Just for Your CV? The Big Picture from a MedSRT Scholar","opp"],
["RfWnzNxs0CE","Mirch Masala : Building the Perfect Appplication","sop"],
["zbIxmXxqhow","Don’t Apply to MedSRT-6 Before Watching This (Deadline 26 Oct)","opp"],
["rmHBwLoY-po","Decoding MBBS / MPH IISc INTERSHIP 2026","opp"],
["Bwi1MsX2wLY","Decoding MedEngage Scholarship 2025","opp"],
["6MeForWec0w","SOP Writing Part 3 | Trushdeep Agrawal – Scholar & Founder, Association of Physicians & Engineers","sop web"],
["KBzmWtcjZcg","SOP Writing Part 2 | Swastik Pandita – IISc Intern & MedEngage Scholar","sop web"],
["jny_66ORkHY","SOP Writing Part 1 | Dr Surya Shanbhog – Khorana, ICMR-STS & Research Scholar","sop web"],
["4Sn6tr0BH-4","Decode the Felix | Journey of Dr Vinay Suresh – Felix Scholar, IISER Pune Intern & Rhodes Finalist","web"],
["QQ7dBUl3DEw","Decode the Rhodes Scholarship | Journey of Dr Varad Puntambekar – Rhodes, Khorana & ICMR-STS Scholar","web"]
];
const S=[ // YouTube Shorts: [id, tags]
["Gbpf2gtUzus","opp"],["EsD3_DshBS8","opp"],["QajNfIBDnIs","opp"],["WXqb10lkVB4","sop opp"],["k_xge0YR4kg","sop opp"],
["jwwn7jBA_3o","opp"],["cvR13iC6LK4",""],["HexB79E_tXA","web"],["Dv_coW2Ydcg","web"],["4DmuFP8Z0X8","web"],
["YXeR2SIOiK8","web"],["iLTVMtdPdZ8","web"],["_--azyzNeYM","web"],["78JuE1GoQlI","web"]
];
const R=[ // Instagram reels, tags read from each caption: [code, tags]
["DfR3f1SAXbM","opp"],["De_9JAcgqO6","web"],["De9pXQWgWQl","opp"],["De6xwedg34Y","sop"],["Dey3ucKgglx","sop opp"],
["DewVjSuks31","sop"],["DewA62NA1MQ","sop"],["Det23xwEpjQ","sop opp"],["DeqNGprko9j","opp"],["DejI6WegA4e","opp"]
];
$("#n-vid").textContent=V.length+S.length+R.length;
const F=[["all","All"],["opp","Verified opportunities"],["sop","SOP writing"],["web","Webinars & mentors"]];
const NOTE={opp:"MedEngage, MedSRT and IISc.",sop:"How to write your SOP and CV.",web:"Sessions with scholars and mentors."};

const g=$("#grid");
V.forEach(([id,t,tags])=>{
  const a=document.createElement("a");a.className="vid";a.target="_blank";a.rel="noopener";a.dataset.tags=tags;
  a.href="https://www.youtube.com/watch?v="+id;
  a.innerHTML='<span class="th"><img loading="lazy" alt=""><span class="play"><i></i></span></span><span class="t"></span>';
  a.querySelector("img").src="https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";
  a.querySelector(".t").textContent=t;
  g.append(a);
});
// Privacy: YouTube and Instagram load only after a click, so they cannot set cookies on a plain visit.
function row(track,items,title,src,thumb,label){
  const el=$(track);
  items.forEach(([id,tags])=>{
    const b=document.createElement("button");b.className="embed";b.dataset.tags=tags;b.setAttribute("aria-label","Play "+title);
    if(thumb)b.style.backgroundImage="url("+thumb(id)+")";
    b.innerHTML='<span class="pl" aria-hidden="true"></span><span class="lb">'+label+'</span>';
    b.onclick=()=>{const f=document.createElement("iframe");f.title=title;f.allowFullscreen=true;f.allow="autoplay; encrypted-media; picture-in-picture";f.dataset.tags=tags;f.src=src(id);b.replaceWith(f)};
    el.append(b);
  });
  return el;
}
const st=row("#shorts-track",S,"Medinsider YouTube Short",id=>"https://www.youtube-nocookie.com/embed/"+id+"?rel=0&playsinline=1&autoplay=1",id=>"https://i.ytimg.com/vi/"+id+"/oar2.jpg","Plays from YouTube");
const rt=row("#reels-track",R,"Medinsider Instagram reel",id=>"https://www.instagram.com/reel/"+id+"/embed",id=>"img/reels/"+id+".jpg","Plays from Instagram");
[["#sl","#sr",st],["#rl","#rr",rt]].forEach(([l,r,t])=>{const step=()=>((t.querySelector(":scope>:not([hidden])")||{}).offsetWidth||326)+14;$(l).onclick=()=>t.scrollBy({left:-step(),behavior:"smooth"});$(r).onclick=()=>t.scrollBy({left:step(),behavior:"smooth"})});

// show 6 videos first; a filter or "Show all" reveals the rest
const more=$("#more");
more.textContent="Show all "+V.length;
more.onclick=()=>{g.classList.toggle("cap");more.textContent=g.classList.contains("cap")?"Show all "+V.length:"Show fewer"};

// one filter drives the chips, the video grid, the Shorts row and the reels row
function setFilter(k){
  const hit=el=>k=="all"||el.dataset.tags.split(" ").includes(k);
  $$(".chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.k==k));
  $$(".vid").forEach(v=>{const show=hit(v);v.hidden=!show;if(show){v.style.animation="none";v.offsetWidth;v.style.animation=""}});
  [st,rt].forEach(t=>{[...t.children].forEach(f=>f.hidden=!hit(f));t.scrollTo({left:0})});
  g.classList.toggle("cap",k=="all");more.style.display=k=="all"?"":"none";
  if(k=="all")more.textContent="Show all "+V.length;
  $("#vh").textContent=k=="all"?"Watch.":F.find(x=>x[0]==k)[1]+".";
  const n=$("#fnote");n.textContent=k=="all"?"":NOTE[k]+" ";
  if(k!="all"){const a=document.createElement("a");a.href="#";a.textContent="Show all";a.onclick=e=>{e.preventDefault();setFilter("all")};n.append(a)}
}
F.forEach(([k,label])=>{
  const b=document.createElement("button");b.className="chip";b.textContent=label;b.dataset.k=k;b.setAttribute("aria-pressed",k=="all");
  b.onclick=()=>setFilter(k);$("#chips").append(b);
});
$$(".topic[data-f]").forEach(t=>t.addEventListener("click",e=>{e.preventDefault();setFilter(t.dataset.f);$("#watch").scrollIntoView({behavior:"smooth"})}));
// Rub to reveal: the student photo is drawn on the canvas and erased under the pointer, showing the intern photo behind it.
(function(){
  const hero=$("#hero"),cv=$("#rub"),ctx=cv.getContext("2d"),first=hero.querySelector("img"),btn=$("#rubbtn"),im=new Image();
  let last=null,w=0;
  function paint(){
    const r=hero.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),px=innerWidth<=900?.78:.8;
    cv.width=r.width*d;cv.height=r.height*d;w=r.width;
    const s=Math.max(cv.width/im.naturalWidth,cv.height/im.naturalHeight),iw=im.naturalWidth*s,ih=im.naturalHeight*s;
    ctx.globalCompositeOperation="source-over";ctx.drawImage(im,(cv.width-iw)*px,(cv.height-ih)*.3,iw,ih); // same crop as the CSS 80% 30%
    first.style.opacity=0;
  }
  function dab(x,y){
    const k=cv.width/w,R=(innerWidth<=900?64:96)*k,g=ctx.createRadialGradient(x*k,y*k,R*.35,x*k,y*k,R);
    g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.globalCompositeOperation="destination-out";ctx.fillStyle=g;ctx.beginPath();ctx.arc(x*k,y*k,R,0,7);ctx.fill();
  }
  hero.addEventListener("pointermove",e=>{
    if(hero.classList.contains("done")||!w)return;
    const r=hero.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};
    if(last){const n=Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/24);for(let i=1;i<=n;i++)dab(last.x+(p.x-last.x)*i/n,last.y+(p.y-last.y)*i/n)}else dab(p.x,p.y);
    last=p;hero.classList.add("touched");
  });
  ["pointerleave","pointerup","pointercancel"].forEach(t=>hero.addEventListener(t,()=>last=null));
  btn.onclick=()=>{const on=hero.classList.toggle("done");btn.setAttribute("aria-pressed",on);btn.textContent=on?"Start over":"Show the intern";if(!on)paint()};
  addEventListener("resize",()=>{if(Math.abs(hero.getBoundingClientRect().width-w)>1&&!hero.classList.contains("done"))paint()});
  im.onload=paint;im.src=first.currentSrc||first.src;
})();

// Team application form. It replaces "Apply by email" only when the Sheet script answers as version 2 or later,
// so nobody's application is lost while the old script is still deployed.
(function(){
  const API=window.OPP_API,btn=$("#apply"),dlg=$("#adlg"),form=$("#aform"),msg=form.querySelector(".msg");
  if(!API||!dlg.showModal)return;
  fetch(API+"?kind=version").then(r=>r.json()).then(v=>{
    if(!(v&&v.v>=2))return;
    btn.firstChild.textContent="Apply now";btn.removeAttribute("target");
    $("#applynote").textContent="Keep your CV ready. The form takes about two minutes.";
    btn.addEventListener("click",e=>{e.preventDefault();form.hidden=false;$("#adone").hidden=true;dlg.showModal()});
  }).catch(()=>{});
  $("#adlgclose").onclick=()=>dlg.close();
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!form.checkValidity()){form.reportValidity();return}
    const d=Object.fromEntries(new FormData(form)),file=form.elements.cv.files[0];delete d.cv;delete d.ok;
    if(!file||file.size>3e6){msg.textContent="Please choose a CV file under 3 MB.";return}
    const type=file.type||(/\.pdf$/i.test(file.name)?"application/pdf":/\.docx$/i.test(file.name)?"application/vnd.openxmlformats-officedocument.wordprocessingml.document":"application/msword");
    const b=form.querySelector("button.btn");b.disabled=true;msg.textContent="Sending...";
    d.apply=1;d.cvType=type;d.cvData=await new Promise(r=>{const x=new FileReader();x.onload=()=>r(String(x.result).split(",")[1]);x.readAsDataURL(file)});
    fetch(API,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(d)}).then(r=>r.json()).then(r=>{
      b.disabled=false;
      if(r.ok){form.reset();msg.textContent="";form.hidden=true;$("#adone").hidden=false}
      else msg.textContent=r.error=="cv"?"That CV file did not go through. Use a PDF or Word file under 3 MB.":r.error=="email"?"Please check your email address.":r.error=="busy"?"Too many applications right now. Please try again in an hour.":"Could not send. Please check the form and try again.";
    }).catch(()=>{b.disabled=false;msg.textContent="Could not send. Please check your internet and try again."});
  });
})();
