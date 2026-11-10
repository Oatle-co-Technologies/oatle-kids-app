import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDIO_ALPHABET, STUDIO_COLOURS, STUDIO_LIMIT, studioPlacement, recordStudioEdit, undoStudioEdit, redoStudioEdit } from '../src/components/freeBuildLogic.js';
const size = { width: 640, height: 420, cell: 64 };
test('offers the full alphabet and six square-block colours', () => {
 assert.equal(STUDIO_ALPHABET.join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'); assert.equal(new Set(STUDIO_COLOURS).size, 6);
});
test('placement snaps square blocks, rejects collisions and allows moving your own block', () => {
 const p = studioPlacement({ x: 103, y: 100 }, size, []);
 assert.equal(p.x * (size.width - size.cell), 64); assert.equal(p.y * (size.height - size.cell), 64);
 const pieces = [{ id:'one',...p }];
 assert.equal(studioPlacement({ x: 103, y:100 }, size, pieces), null);
 assert.deepEqual(studioPlacement({ x:103,y:100 }, size, pieces, 'one'), p);
 assert.notEqual(studioPlacement({ x:220,y:200 }, size, pieces, 'one'), null);
});
test('normalised positions stay within small and large screens after resizing', () => {
 const p = studioPlacement({ x:640,y:420 }, size, []);
 for (const next of [{width:320,height:250,cell:48},size,{width:1300,height:500,cell:64}]) {
  const x=p.x*(next.width-next.cell), y=p.y*(next.height-next.cell);
  assert(x>=0 && y>=0 && x+next.cell<=next.width && y+next.cell<=next.height);
 }
});
test('out-of-stage and malformed drops do not add pieces; the piece cap still allows moves', () => {
 for(const p of [{x:-1,y:20},{x:641,y:20},{x:20,y:421},{x:NaN,y:20},null]) assert.equal(studioPlacement(p,size,[]),null);
 const pieces=Array.from({length:STUDIO_LIMIT},(_,i)=>({id:String(i),x:0,y:0}));
 assert.equal(studioPlacement({x:400,y:200},size,pieces),null);
 assert(studioPlacement({x:400,y:200},size,pieces,'0'));
});
test('undo and redo restore letters, colours, moves and clears; new edits discard redo', () => {
 const block={id:'a',letter:'Q',colour:STUDIO_COLOURS[0],x:0,y:0};
 let state=recordStudioEdit({past:[],pieces:[],future:[]},[block]);
 state=recordStudioEdit(state,[{...block,x:.5}]);
 assert.deepEqual(undoStudioEdit(state).pieces,[block]);
 assert.deepEqual(redoStudioEdit(undoStudioEdit(state)).pieces,state.pieces);
 const cleared=recordStudioEdit(state,[]); assert.deepEqual(undoStudioEdit(cleared).pieces,state.pieces);
 assert.equal(recordStudioEdit(undoStudioEdit(state),[]).future.length,0);
});
