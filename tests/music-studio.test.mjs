import test from 'node:test';
import assert from 'node:assert/strict';
import { validTune, encodeWave, scheduleTunePlayback } from '../src/components/musicStudioData.js';
import { createMusicAudio, renderMusicWave } from '../src/components/musicAudio.js';

test('saved tunes reject malformed, out-of-order and unbounded event data',()=>{
 const note={kind:'violin',pitch:2,time:0};
 assert.ok(validTune([note,{kind:'piano',pitch:12,time:60}]));
 for(const value of [null,[],[{}],[{...note,kind:'unknown'}],[{...note,pitch:13}],[{...note,time:Infinity}],[{...note,time:-1}],[{...note,time:61}],[{...note,time:2},note],Array(257).fill(note)])assert.equal(validTune(value),false);
});
test('WAV output has a valid mono PCM header and clips samples safely',()=>{
 const wave=encodeWave({sampleRate:44100,getChannelData:()=>new Float32Array([-2,-.5,0,.5,2])});
 const view=new DataView(wave),bytes=new Uint8Array(wave);
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(new TextDecoder().decode(bytes.slice(8,12)),'WAVE');
 assert.equal(view.getUint32(4,true),wave.byteLength-8);assert.equal(view.getUint32(40,true),10);assert.equal(view.getUint32(24,true),44100);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint16(34,true),16);
 assert.equal(view.getInt16(44,true),-32768);assert.equal(view.getInt16(52,true),32767);
});
function fakeContext(){const voices=[];const param=()=>({value:0,setValueAtTime(value,time){this.value=value;this.time=time;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});const node=()=>({connect(){},disconnect(){}});return {voices,state:'running',currentTime:0,destination:{},resume:async()=>{},close:async()=>{},createGain:()=>({...node(),gain:param()}),createDynamicsCompressor:node,createOscillator(){const voice={...node(),frequency:param(),start(time){this.startTime=time;},stop(){this.stopped=true;}};voices.push(voice);return voice;}};}
test('violin preserves note pitch and higher bongo head has a distinct pitch; stop releases voices',async()=>{
 const context=fakeContext(),old=globalThis.window;globalThis.window={};try{const audio=createMusicAudio({context});assert.ok(await audio.unlock());audio.hit('violin',.5,12);assert.equal(context.voices[0].frequency.value,1046.5);assert.equal(context.voices[0].startTime,.5);audio.hit('bongos',0,0);audio.hit('bongos',0,5);assert.ok(context.voices[4].frequency.value>context.voices[2].frequency.value);audio.stop();assert.ok(context.voices.every(v=>v.stopped));}finally{globalThis.window=old;}
});
test('audio export schedules the whole saved tune, including more than 32 notes',async()=>{
 let offline;const old=globalThis.window;globalThis.window={OfflineAudioContext:class{constructor(channels,length,sampleRate){Object.assign(this,fakeContext());offline=this;this.sampleRate=sampleRate;this.length=length;}async startRendering(){return {sampleRate:this.sampleRate,getChannelData:()=>new Float32Array(this.length)};}}};
 try{const notes=Array.from({length:50},(_,i)=>({kind:i%2?'violin':'piano',pitch:2,time:i*.1}));const blob=await renderMusicWave(notes);assert.equal(blob.type,'audio/wav');assert.equal(offline.voices.length,100);assert.equal(offline.voices.at(-1).startTime,4.9);assert.ok(blob.size>44);await assert.rejects(()=>renderMusicWave([{kind:'piano',pitch:0,time:99}]));}finally{globalThis.window=old;}
});

test('long recording playback creates each sound only when its recorded time arrives',()=>{
 const notes=Array.from({length:256},(_,i)=>({kind:i%2?'violin':'piano',pitch:i%13,time:i*.2}));
 const pending=[],heard=[];let complete=false;
 assert.equal(scheduleTunePlayback(notes,(callback,ms)=>pending.push({callback,ms}),note=>heard.push(note),()=>{complete=true;}),true);
 assert.equal(heard.length,0,'no future sounds are created up front');
 pending.sort((a,b)=>a.ms-b.ms);
 for(let i=0;i<256;i++){assert.equal(pending[i].ms,notes[i].time*1000);pending[i].callback();assert.equal(heard.length,i+1);assert.equal(complete,false);}
 assert.deepEqual(heard,notes,'all notes including the last one play');
 assert.ok(pending.at(-1).ms>notes.at(-1).time*1000);pending.at(-1).callback();assert.equal(complete,true);
});
test('stopping playback can cancel every remaining note through the shared timer queue',()=>{
 const pending=new Map();let next=0,heard=0;
 scheduleTunePlayback([{kind:'piano',pitch:0,time:0},{kind:'violin',pitch:2,time:40}],callback=>pending.set(++next,callback),()=>heard++,()=>{});
 pending.get(1)();pending.delete(1);pending.clear();
 assert.equal(heard,1);assert.equal(pending.size,0);
});
