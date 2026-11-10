import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const path=new URL('../src/utils/speech.js',import.meta.url);
function engine() {
 const timers=new Map(),listeners={},utterances=[];let id=0;
 const synthesis={getVoices:()=>[{name:'Samantha',lang:'en-US',localService:true}],addEventListener(){},cancel(){},resume(){},speak(utterance){utterances.push(utterance);}};
 const window={speechSynthesis:synthesis,setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},addEventListener(name,fn){listeners[name]=fn;}};
 const context=vm.createContext({window,navigator:{userAgent:'Chrome',platform:'MacIntel',maxTouchPoints:0},Capacitor:{isNativePlatform:()=>false},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},TextToSpeech:{},QueueStrategy:{}});
 const code=readFileSync(path,'utf8').replace(/import[\s\S]*?from\s*["'][^"']+["'];/g,'').replaceAll('export function','function');
 vm.runInContext(code+'\nthis.api={speak,stopSpeech};',context);
 const flush=ms=>{for(const [id,timer]of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn();}};
 return {...context.api,timers,listeners,utterances,flush};
}
test('only the latest speech prompt plays; stopping clears pending speech',()=>{
 const e=engine();e.speak('First question');e.speak('Next question');e.flush(0);
 assert.deepEqual(e.utterances.map(u=>u.text),['Next question']);
 e.utterances[0].onstart();assert.equal(e.timers.size,0);
 e.speak('Leave this screen');e.stopSpeech();e.flush(0);assert.equal(e.utterances.length,1);
});
test('blocked speech retries on a child gesture and a silent engine uses a default-voice retry',()=>{
 const e=engine();e.speak('What is this?');e.flush(0);e.utterances[0].onerror({error:'not-allowed'});
 e.listeners.pointerdown();e.flush(0);assert.equal(e.utterances[1].text,'What is this?');assert.equal(e.utterances[1].voice,undefined);
 e.utterances[1].onstart();assert.equal(e.timers.size,0);
 const stalled=engine();stalled.speak('Find A.');stalled.flush(0);stalled.flush(1400);stalled.flush(0);
 assert.equal(stalled.utterances.length,2);assert.equal(stalled.utterances[1].voice,undefined);
 stalled.stopSpeech();stalled.listeners.pointerdown();stalled.flush(0);assert.equal(stalled.utterances.length,2);
});
