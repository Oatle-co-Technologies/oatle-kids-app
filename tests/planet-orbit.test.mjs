import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isOrbitViewport, planetOrbitLayout, planetOrbitRoute, planetOrbitClosingPath } from '../src/components/planetOrbitLayout.js';
import { planetJourneyLayout } from '../src/components/planetJourneyLayout.js';

const views = [[375,667],[390,844],[430,932],[768,1024],[820,1180],[667,375],[844,390],[932,430],[812,375]];
const intersects = (a,b) => Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.1 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.1;
const circleHitsRect = (c,r) => {
  const x=c.x+c.width/2,y=c.y+c.height/2;
  return Math.hypot(x-Math.max(r.x,Math.min(x,r.x+r.width)),y-Math.max(r.y,Math.min(y,r.y+r.height)))<c.width/2-.1;
};

test('the breakpoint is exactly 1024px; every requested width selects the intended layout',()=>{
  for(const width of [375,390,430,768,820,1023])assert.equal(isOrbitViewport(width),true);
  for(const width of [1024,1280,1920])assert.equal(isOrbitViewport(width),false);
});

test('all current adventure counts fit without overlapping planet targets, labels or the central title',()=>{
  for(const [w,h]of views)for(const safeInset of [0,34])for(const count of [1,2,3,4,5,9]){
    const landscape=w>h&&h<600;
    const g=planetOrbitLayout(count,w-24-(landscape?162:0),w,h,(w<=700?72:82)+safeInset);
    const context=`${w}x${h}, ${count} missions, inset ${safeInset}`;
    const topSpace=landscape?10:h<=750?106:128;
    assert.ok(g.height+topSpace<=h-(w<=700?72:82)-safeInset+.5,context+' fits above navigation');
    const center={x:g.width/2-g.centerWidth/2,y:g.centerY-g.centerHeight/2,width:g.centerWidth,height:g.centerHeight};
    assert.ok(g.touch>=44,context);
    assert.ok(g.labelFont>=10,context);
    for(let i=0;i<count;i++){
      const a=g.points[i];
      for(const r of [a.touchRect,a.labelRect]){
        assert.ok(r.x>=-.1&&r.y>=-.1&&r.x+r.width<=g.width+.1&&r.y+r.height<=g.height+.1,context);
      }
      assert.equal(intersects(a.labelRect,center)||circleHitsRect(a.touchRect,center),false,context);
      for(let j=i+1;j<count;j++){
        const b=g.points[j];
        assert.equal(intersects(a.labelRect,b.labelRect)||circleHitsRect(a.touchRect,b.labelRect)||circleHitsRect(b.touchRect,a.labelRect),false,context);
        assert.ok(Math.hypot(a.touchRect.x-b.touchRect.x,a.touchRect.y-b.touchRect.y)>=g.touch-.1,context);
      }
    }
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
