import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isOrbitViewport, planetOrbitLayout, planetOrbitRoute, planetOrbitClosingPath } from '../src/components/planetOrbitLayout.js';
import { planetJourneyLayout } from '../src/components/planetJourneyLayout.js';

const views = [[375,667],[390,844],[430,932],[768,1024],[820,1180],[667,375],[844,390],[932,430],[812,375]];
test('the breakpoint is exactly 1024px; every requested width selects the intended layout',()=>{
  for(const width of [375,390,430,768,820,1023])assert.equal(isOrbitViewport(width),true);
  for(const width of [1024,1280,1920])assert.equal(isOrbitViewport(width),false);
});

test('all mission counts clear phone insets and use spare bottom space without clipping',()=>{
  const cases=[...views,[375,568],[375,430],[390,600],[430,650],[667,320],[844,320]];
  for(const [w,h]of cases)for(const safeInset of [0,34])for(const topInset of [0,20,47,59])for(const count of [1,2,3,4,5,6,7,8,9]){
    const landscape=w>=560&&w>h&&h<600;
    const nav=(w<=700?72:82)+safeInset;
    const sidebar=landscape?Math.max(110,Math.min(150,w*.19))+12:0;
    const spacing=landscape?(h<=350?8:24):48+(h<=750?168:172);
    const minimum=landscape&&h>350?220:190;
    const contentHeight=Math.max(minimum,h-nav-topInset-spacing);
    const sideInset=landscape?47:0;
    const g=planetOrbitLayout(count,w-32-sidebar-sideInset*2,w,h,nav,contentHeight);
    const context=`${w}x${h}, ${count} missions, bottom inset ${safeInset}, top inset ${topInset}`;
    assert.equal(g.height,contentHeight,context+' uses the available grid height');
    assert.equal(g.centerY,g.height/2+g.lowerOffset,context+' island moves with the whole orbit');
    assert.ok(g.lowerOffset>=0&&g.lowerOffset<=64,context+' bounded downward movement');
    if(landscape)assert.equal(g.lowerOffset,0,context+' short landscape uses the full height');
    assert.ok(g.touch>=44,context+' has accessible targets');
    const ringCenter=g.points[0].cy;
    let top=Infinity,bottom=-Infinity;
    for(let i=0;i<count;i++){
      const a=g.points[i],r=a.touchRect;
      assert.ok(r.x>=-.1&&r.y>=-.1&&r.x+r.width<=g.width+.1&&r.y+r.height<=g.height+.1,context+' target stays visible');
      assert.ok(a.ry-g.touch/2-g.centerSize/2>=11.9,context+' island clears every planet');
      for(let j=i+1;j<count;j++){
        const b=g.points[j];
        assert.ok(Math.hypot(r.x-b.touchRect.x,r.y-b.touchRect.y)>=g.touch-.1,context+' targets do not overlap');
      }
      top=Math.min(top,r.y);bottom=Math.max(bottom,r.y+r.height);
    }
    assert.equal(ringCenter,g.centerY,context+' island stays in the middle of the orbit');
    const extent=g.points[0].ry+g.touch/2;
    assert.ok(g.height-(ringCenter+extent)<=ringCenter-extent+.1,context+' spare space moves above the orbit');
    assert.ok(top>=0&&bottom<=g.height+.1,context);
  }
});

test('a tall phone moves the entire orbit down while a short content area keeps all touch targets visible',()=>{
  const tall=planetOrbitLayout(9,358,390,844,106,487);
  assert.ok(tall.lowerOffset>40);
  assert.ok(tall.height-tall.centerY-tall.points[0].ry-tall.touch/2>=15.9);
  const short=planetOrbitLayout(9,343,375,430,106,190);
  assert.equal(short.lowerOffset,0);
  assert.ok(short.touch>=44);
});

test('orbit points follow clockwise mission order on a true rendered circle, without sorting data',()=>{
  const g=planetOrbitLayout(9,351,375,667);
  for(let i=0;i<9;i++){
    const p=g.points[i],x=p.x/720*g.width,cx=p.cx/720*g.width;
    assert.ok(Math.abs(Math.hypot(x-cx,p.y-p.cy)-p.ry)<.0001);
    if(i)assert.ok(p.angle>g.points[i-1].angle);
  }
});

test('the same arcs support forward, reverse and closing paths for every mission',()=>{
  assert.equal((planetOrbitClosingPath(planetOrbitLayout(1,351,375,667).points).match(/ A /g)||[]).length,2);
  for(const [w,h]of views)for(const count of [2,3,4,5,9]){
    const g=planetOrbitLayout(count,w-24-(w>h&&h<600?162:0),w,h);
    for(let from=0;from<count;from++)for(let to=0;to<count;to++){
      const path=planetOrbitRoute(g.points,from,to);
      assert.ok(path.startsWith(`M ${g.points[from].x} ${g.points[from].y}`));
      assert.ok(path.endsWith(`${g.points[to].x} ${g.points[to].y}`));
      assert.equal((path.match(/ A /g)||[]).length,Math.abs(to-from));
    }
    assert.ok(planetOrbitClosingPath(g.points).endsWith(`${g.points[0].x} ${g.points[0].y}`));
  }
});

test('desktop geometry retains the approved winding composition',()=>{
  assert.deepEqual(planetJourneyLayout(5,'wide'),{height:600,points:[
    {x:165,y:130,row:0,wide:true},{x:320,y:145,row:0,wide:true},{x:475,y:125,row:0,wide:true},{x:630,y:130,row:0,wide:true},{x:360,y:390,row:1,wide:true},
  ]});
  const originalCssHash='e6597d8f638e5852b48c579682eba15194e861dd83e1291fc79eb6986ec1d906';
  return readFile(new URL('../src/components/BigKidsPlanetJourney.css',import.meta.url)).then(css=>assert.equal(createHash('sha256').update(css).digest('hex'),originalCssHash));
});
