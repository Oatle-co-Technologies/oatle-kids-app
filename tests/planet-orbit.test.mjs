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

test('all mission counts fit and stay centred in the measured content area, including short screens and safe areas',()=>{
  const cases=[...views,[375,568],[375,430],[390,600],[430,650],[667,320],[844,320]];
  for(const [w,h]of cases)for(const safeInset of [0,34])for(const count of [1,2,3,4,5,6,7,8,9]){
    const landscape=w>h&&h<600;
    const nav=(w<=700?72:82)+safeInset;
    const sidebar=landscape?Math.max(110,Math.min(150,w*.19))+12:0;
    const topSpace=landscape?(h<=350?8:20):h<=750?118:140;
    const contentHeight=h-nav-topSpace;
    const g=planetOrbitLayout(count,w-24-sidebar,w,h,nav,contentHeight);
    const context=`${w}x${h}, ${count} missions, inset ${safeInset}`;
    assert.equal(g.height,contentHeight,context+' uses the available grid height');
    assert.equal(g.centerY,g.height/2,context+' island is vertically centred');
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
    assert.ok(Math.abs(ringCenter-g.height/2)<.01,context+' entire orbit is balanced');
    assert.ok(top>=0&&bottom<=g.height+.1,context);
  }
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
  const originalCssHash='25cc536ca91442b3b1a3ecad82ced9f32790ea6477b6916e79a96f4f4590c174';
  return readFile(new URL('../src/components/BigKidsPlanetJourney.css',import.meta.url)).then(css=>assert.equal(createHash('sha256').update(css).digest('hex'),originalCssHash));
});
