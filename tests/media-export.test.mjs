import test from 'node:test';
import assert from 'node:assert/strict';
import { canShareMedia, shareMedia } from '../src/components/mediaExport.js';
import { isLittleMissionLocked } from '../src/components/littleMissionCatalog.js';

test('both drawing missions stay available with no previous progress, while learning missions still unlock in order',()=>{
 const drawing={id:'scribble',planets:[{id:1},{id:2}]};
 assert.equal(isLittleMissionLocked(drawing,0,()=>false),false);
 assert.equal(isLittleMissionLocked(drawing,1,()=>false),false);
 const music={...drawing,id:'music'};
 assert.equal(isLittleMissionLocked(music,1,()=>false),true);
 assert.equal(isLittleMissionLocked(music,1,()=>true),false);
 assert.equal(isLittleMissionLocked({...music,planets:[{}, {free:true}]},1,()=>false),false);
});
test('picture and music exports pass real typed files to the phone share options directly from the action',async()=>{
 for(const [name,type] of [['drawing.png','image/png'],['tune.wav','audio/wav']]){
 const file=new File(['contents'],name,{type});let received;
 const api={canShare:({files})=>files[0]===file,share:options=>{received=options;return Promise.resolve();}};
 assert.equal(canShareMedia(file,api),true);
 const result=shareMedia(file,api);assert.deepEqual(received,{files:[file]});assert.equal(await result,'shared');
 }
});
test('cancelled or blocked share options do not silently download to the wrong directory',async()=>{
 const file=new File(['x'],'drawing.png',{type:'image/png'});
 assert.equal(await shareMedia(file,{share:async()=>{throw Object.assign(new Error(),{name:'AbortError'});}}),'cancelled');
 await assert.rejects(()=>shareMedia(file,{share:async()=>{throw Object.assign(new Error('blocked'),{name:'NotAllowedError'});}}),/blocked/);
 assert.equal(canShareMedia(file,{}),false);
 assert.equal(canShareMedia(file,{share(){},canShare(){throw new Error();}}),false);
});
