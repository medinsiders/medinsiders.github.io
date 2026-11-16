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
$$("section>h2,.door,.topic,.founder,.cta-card,.shortswrap,.reels").forEach((el,i)=>arm(el,[...el.parentNode.children].indexOf(el)));

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

// 3. Cursor follow: a soft light tracks the pointer on [data-glow] bands, and .tilt cards lean toward it.
if(matchMedia("(hover:hover)").matches){
  const pos=(el,e)=>{const r=el.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
  $$("[data-glow]").forEach(el=>el.addEventListener("pointermove",e=>{const[x,y]=pos(el,e);el.style.setProperty("--mx",x*100+"%");el.style.setProperty("--my",y*100+"%")}));
  $$(".tilt").forEach(el=>{
    el.addEventListener("pointermove",e=>{const[x,y]=pos(el,e);el.style.setProperty("--ry",((x-.5)*7).toFixed(2)+"deg");el.style.setProperty("--rx",((.5-y)*7).toFixed(2)+"deg")});
    el.addEventListener("pointerleave",()=>{el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg")});
  });
}
})();
