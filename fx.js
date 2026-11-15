// Calm interactions for visitors: scroll reveals, count-up numbers, a gentle pointer drift on the hero.
// Everything is skipped when the visitor asks for reduced motion, and the page works without this file.
(function(){
if(matchMedia("(prefers-reduced-motion:reduce)").matches||!("IntersectionObserver" in window))return;
const root=document.documentElement;root.classList.add("fx");
const $$=s=>[...document.querySelectorAll(s)];

// 1. Reveal on scroll. The class is removed afterwards so hover lifts on the same element still work.
const reveal=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  reveal.unobserve(e.target);e.target.classList.add("in");
  setTimeout(()=>e.target.classList.remove("rv","in"),900);
}),{rootMargin:"0px 0px -6% 0px"});
function arm(el,i){el.style.setProperty("--d",Math.min(i,4)*70+"ms");el.classList.add("rv");reveal.observe(el)}
$$("section>h2,.stat,.tcard,.topic,.founder,.cta-card,.shortswrap,.reels").forEach((el,i)=>arm(el,[...el.parentNode.children].indexOf(el)));

// Tracker cards appear one after another the first time only, so typing in the search box stays calm.
const list=document.querySelector("#list");
if(list){let seen=false;new MutationObserver(()=>{if(seen||!list.children.length)return;seen=true;[...list.children].forEach(arm)}).observe(list,{childList:true})}

// 2. Count-up numbers when they scroll into view.
const count=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;count.unobserve(e.target);
  const el=e.target,to=parseInt(el.textContent,10);if(!(to>0))return;
  const t0=performance.now(),ms=900;
  (function tick(t){const p=Math.min(1,(t-t0)/ms);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick);else el.textContent=to})(t0);
}),{threshold:.6});
$$("#n-int,#n-conf,#n-vid").forEach(el=>count.observe(el));

// 3. Hero drifts a little with the pointer (the orb and the two floating cards move in opposite directions).
const hv=document.querySelector(".hv");
if(hv&&matchMedia("(hover:hover)").matches){
  let raf=0;
  hv.addEventListener("pointermove",e=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;const r=hv.getBoundingClientRect();
      hv.style.setProperty("--px",((e.clientX-r.left)/r.width*2-1).toFixed(3));
      hv.style.setProperty("--py",((e.clientY-r.top)/r.height*2-1).toFixed(3))});
  });
  hv.addEventListener("pointerleave",()=>{hv.style.setProperty("--px",0);hv.style.setProperty("--py",0)});
}
})();
