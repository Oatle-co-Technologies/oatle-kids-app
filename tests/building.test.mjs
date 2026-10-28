import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, SHAPES, BUILDS, BOARD, MAX_BLOCKS, containsPoint, freePlacement, matchingTarget } from '../src/components/buildingLogic.js';

test('free blocks snap inside the board, including its edges', () => {
  assert.deepEqual(freePlacement('yellow',{x:0,y:0},[]),{kind:'yellow',x:0,y:0});
  assert.deepEqual(freePlacement('purple',{x:360,y:300},[]),{kind:'purple',x:300,y:180});
  assert.equal(freePlacement('red',{x:-30,y:30},[]),null);
  assert.equal(containsPoint({x:NaN,y:30}),false);
});
test('occupied spaces reject overlap, while touching edges are allowed', () => {
  const pieces=[{id:'one',kind:'red',x:0,y:240}];
  assert.equal(freePlacement('blue',{x:30,y:270},pieces),null);
  assert.deepEqual(freePlacement('blue',{x:90,y:270},pieces),{kind:'blue',x:60,y:240});
  assert.equal(freePlacement('yellow',{x:60,y:270},pieces),null);
});
test('moving a block excludes itself from collision checks', () => {
  const pieces=[{id:'one',kind:'red',x:0,y:240}];
  assert.deepEqual(freePlacement('red',{x:30,y:270},pieces,'one'),{kind:'red',x:0,y:240});
  assert.deepEqual(freePlacement('red',{x:90,y:270},pieces,'one'),{kind:'red',x:60,y:240});
});
test('a full free build allows moving but no extra blocks', () => {
  const pieces=Array.from({length:MAX_BLOCKS},(_,i)=>({id:String(i),kind:'red',x:(i%6)*60,y:Math.floor(i/6)*60}));
  assert.equal(freePlacement('red',{x:330,y:270},pieces),null);
  assert.ok(freePlacement('red',{x:330,y:270},pieces,'0'));
  assert.equal(freePlacement('unknown',{x:30,y:30},[]),null);
});
test('each picture can be completed in any piece order', () => {
  for(const build of BUILDS) {
    const filled=[];
    for(const target of [...build.targets].reverse()) {
      const shape=SHAPES[target.kind];
      const result=matchingTarget(build,target.kind,{x:target.x+shape.width/2,y:target.y+shape.height/2},filled);
      assert.equal(result?.id,target.id);
      filled.push({...result,targetId:result.id});
    }
    assert.equal(filled.length,build.targets.length);
  }
});
test('copy building rejects a wrong shape, distant drop or duplicate target', () => {
  const house=BUILDS[0];
  assert.equal(matchingTarget(house,'circle',{x:180,y:185},[]),null);
  assert.equal(matchingTarget(house,'square',{x:0,y:0},[]),null);
  assert.equal(matchingTarget(house,'square',{x:180,y:185},[{targetId:'wall'}]),null);
  assert.equal(matchingTarget(house,'square',{x:180,y:185},[])?.id,'wall');
});
test('copy placement chooses the nearest remaining matching shape', () => {
  const bridge=BUILDS[1];
  assert.equal(matchingTarget(bridge,'square',{x:243,y:190},[])?.id,'right');
  assert.equal(matchingTarget(bridge,'square',{x:120,y:185},[])?.id,'left');
});
test('every picture and free block fits within the shared drawing coordinates', () => {
  for(const build of BUILDS) {
    assert.equal(new Set(build.targets.map(t=>t.id)).size,build.targets.length);
    for(const t of build.targets) {
      const shape=SHAPES[t.kind];assert.ok(shape);
      assert.ok(t.x>=0&&t.y>=0&&t.x+shape.width<=BOARD.width&&t.y+shape.height<=BOARD.height);
    }
  }
  for(const block of Object.values(BLOCKS)) assert.ok(block.width%60===0&&block.height%60===0);
});
