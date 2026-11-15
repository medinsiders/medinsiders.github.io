// Tracker entries, checked 15 Nov 2026. Sources: Pavan's own videos, Shorts and reels, plus the official ghc.gaims.org site for GHC 2026.
// A field set to null shows as "Not stated": never guess eligibility, pay or dates, add them only when an official source says so.
// To add an entry: copy one object, fill what is known, keep the rest null.
// deadline (YYYY-MM-DD) makes Open / Closing soon / Closed automatic. Optional: status ("open"|"closed") to set it by hand,
// applyText to override the "Apply by" line, perks (short chips) for extras like free workshops.
// Approved community submissions come from this Google Apps Script web app (see backend/Code.gs). Empty = form shows "opens soon".
window.OPP_API="https://script.google.com/macros/s/AKfycbz6WmT6rawYOV3C69JjY__-5GVbOzz_2qHyc-K2P3vcOpJYej3YcyFjLxcqGn7vwNNN/exec";
window.OPP={
internships:[
{name:"MedSRT-6",org:"CSIR-CCMB",place:"Hyderabad",type:"Research internship",
 who:"MBBS Phase II and Phase III Part 1",pay:"Free to attend · stipend not stated",dates:"7–19 Dec 2026",deadline:"2026-10-26",
 links:[{k:"yt",t:"Watch before applying",u:"https://www.youtube.com/watch?v=zbIxmXxqhow"},{k:"yt",t:"Short",u:"https://www.youtube.com/shorts/Gbpf2gtUzus"},{k:"ig",t:"Reel",u:"https://www.instagram.com/reel/DeqNGprko9j/"}]},
{name:"MedEngage Scholarship",org:"MedEngage",place:null,type:"Scholarship / research grant",
 who:"MBBS and PG (MD / MS / DNB)",pay:"₹30,000",dates:null,deadline:null,
 links:[{k:"ig",t:"Reel",u:"https://www.instagram.com/reel/DfR3f1SAXbM/"},{k:"yt",t:"Decoding MedEngage",u:"https://www.youtube.com/watch?v=Bwi1MsX2wLY"}]},
{name:"IISc MBBS / MPH Internship 2026",org:"Indian Institute of Science",place:"Bengaluru",type:"Internship",
 who:null,pay:null,dates:null,deadline:null,
 links:[{k:"yt",t:"SOPs and Q&A",u:"https://www.youtube.com/watch?v=rmHBwLoY-po"}]}
],
conferences:[
{name:"Global Healthcare Conclave 2026",org:"GAIMS",place:"Bharat Mandapam, New Delhi",type:"Conference",
 who:"Registered delegates, researchers and policymakers",pay:"₹2,500 GAIMS Elite · ₹3,000 others",dates:"28–29 Nov 2026",deadline:null,
 status:"open",applyText:"Registration open · abstracts closed 10 Nov",
 perks:["2 free workshops","Workshop certificates"],
 links:[{k:"web",t:"Official site",u:"https://ghc.gaims.org/#ghc-timeline"}]},
{name:"Research poster competition",org:"AIIMS Nagpur · SYBS India",place:"Nagpur",type:"Poster competition",
 who:null,pay:"₹1.5 lakh for 1 poster · ₹30 lakh total prize pool",dates:null,deadline:null,
 links:[{k:"ig",t:"Reel",u:"https://www.instagram.com/reel/De9pXQWgWQl/"}]}
]};
