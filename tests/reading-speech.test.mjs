import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadingSpeechText } from '../src/utils/readingSpeech.js';

test('every reading assessment task has a spoken instruction without revealing its answer', () => {
  for (const [skill, extra] of Object.entries({ capital:{target:'A'},lowercase:{target:'a'},matching:{target:'A'},'word-order':{word:'cat'},reading:{answer:'cat'},missing:{word:'dog'},sentences:{words:['I','can','run']} })) {
    const prompt=getReadingSpeechText(9,{skill,type:skill,...extra});
    assert.ok(prompt && prompt.trim(),skill);
    if (['reading','word-order','missing'].includes(skill)) assert.ok(!prompt.includes(extra.answer || extra.word),skill+' must not reveal the answer');
  }
  assert.match(getReadingSpeechText(9,{skill:'reading',type:'reading',answer:'cat'}),/What is this/);
  assert.equal(getReadingSpeechText(8,{text:['Once upon a time.','A rocket flew.']}),'Once upon a time. A rocket flew.');
  assert.equal(getReadingSpeechText(5,{answer:'dog'}),'What is this?');
});
