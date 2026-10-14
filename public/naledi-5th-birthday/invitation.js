const opening=document.getElementById('opening'),details=document.getElementById('details');
document.getElementById('open').addEventListener('click',()=>{opening.hidden=true;details.hidden=false;fitDetails();details.classList.add('reveal');details.focus({preventScroll:true});window.scrollTo(0,0)});
document.getElementById('back').addEventListener('click',()=>{details.hidden=true;opening.hidden=false;fitPhone();document.getElementById('open').focus({preventScroll:true});window.scrollTo(0,0)});
const svg=opening.querySelector('svg');
const originalChildren=[...svg.children];
const balloonGroup=svg.querySelector('.birthday-balloons');
const imageRect=originalChildren.find(e=>e.tagName==='rect'&&e.getAttribute('fill')?.startsWith('url('));
let canvasHeight=1350;
function fitPhone(){
 const box=opening.getBoundingClientRect();if(!box.width||!box.height)return;canvasHeight=Math.max(1350,1080*box.height/box.width);
 svg.setAttribute('viewBox','0 0 1080 '+canvasHeight);
 svg.setAttribute('preserveAspectRatio','xMidYMid meet');
 originalChildren[0].setAttribute('height',canvasHeight);
 if(balloonGroup)balloonGroup.setAttribute('transform','translate(0 '+Math.max(320,120+(canvasHeight-1350)*.24)+')');
 if(imageRect){imageRect.setAttribute('x','64');imageRect.setAttribute('width','1056');imageRect.setAttribute('height','1120');imageRect.setAttribute('y',Math.max(230,160+(canvasHeight-1350)*.24));}
}
let detailNodes;
function fitDetails(){
 const ds=details.querySelector('svg');const h=Math.max(1350,1080*(window.innerHeight-64)/document.querySelector('main').getBoundingClientRect().width);
 ds.setAttribute('viewBox','0 0 1080 '+h);ds.setAttribute('preserveAspectRatio','xMidYMid meet');
 const group=ds.querySelector('g');const nodes=detailNodes||(detailNodes=[...group.children]);nodes[0].setAttribute('height',h);
 if(!ds.querySelector('.details-heading')){const titleGroup=document.createElementNS('http://www.w3.org/2000/svg','g');titleGroup.setAttribute('class','details-heading');titleGroup.setAttribute('transform','translate(499 170) scale(1.6) translate(-499 -170)');group.appendChild(titleGroup);nodes.slice(202,208).forEach(e=>titleGroup.appendChild(e));}
 ds.querySelectorAll('clipPath rect').forEach(r=>r.setAttribute('height',h));
 nodes.forEach((e,i)=>{if(i>=1&&i<=198&&e.getAttribute('d')?.includes('13')){const first=e.getAttribute('d').match(/^M[\d.]+ ([\d.]+)/);if(first&&Number(first[1])>1200)e.setAttribute('transform','translate(0 '+(h-1350)+')')}});
 if(nodes[199])nodes[199].setAttribute('y',150+(h-1350)*.24);
 if(nodes[200])nodes[200].setAttribute('transform','translate(0 '+(835+(h-1350)*.63)+')');
 if(nodes[201])nodes[201].setAttribute('transform','translate(0 '+(h-1350)*.16+')');
 if(nodes[208])nodes[208].setAttribute('transform','translate(0 '+(1190+(h-1350)*.80)+')');
}
fitDetails();window.addEventListener('resize',fitDetails);
fitPhone();window.addEventListener('resize',fitPhone);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const flakes=[...opening.querySelectorAll('.flake')].map((el,i)=>({el,y:el.getBBox().y,x:el.getBBox().x,speed:45+(i*17%40),soft:i%3===0}));
let start;
function snow(t){if(start===undefined)start=t;const seconds=(t-start)/1000;if(!opening.hidden&&!reduced.matches){for(const f of flakes){const y=((f.y*canvasHeight/1350+30+seconds*f.speed)%(canvasHeight+60))-30;f.el.setAttribute('transform','translate(0 '+(y-f.y)+')');const overText=(y<300)||(y>canvasHeight*.77&&y<canvasHeight*.91&&f.x>160&&f.x<900);f.el.setAttribute('opacity',overText?'.14':(f.soft?'.3':'.85'))}}requestAnimationFrame(snow)}requestAnimationFrame(snow);
reduced.addEventListener('change',()=>{if(reduced.matches)flakes.forEach(f=>f.el.removeAttribute('transform'))});
