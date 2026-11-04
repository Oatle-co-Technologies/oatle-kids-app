import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareMathQuestion, mathsQuestionNarration, isCoreMathQuestion } from '../src/utils/mathsLanguage.js';
import { shapeFactQuestions } from '../src/data/shapeQuestions.js';

test('arithmetic gives the child the starting amount and action, never just symbols', () => {
  const cases = [
    { type:'addition-numbers', values:[2,3], answer:'5' },
    { type:'subtraction-objects', values:[5,2], answer:'3', object:'circle' },
    { type:'multiplication-numbers', values:[2,3], answer:'6' },
    { type:'division-numbers', dividend:6, divisor:2, answer:'3' },
  ];
  for (const original of cases) {
    const q = prepareMathQuestion(original);
    assert(!/[+×÷=−]/.test(q.prompt));
    assert.equal(q.answer, original.answer);
    assert(!/\d|[+×÷=−]/.test(mathsQuestionNarration(q)));
  }
  assert.match(prepareMathQuestion(cases[1]).prompt,/Start with 5 circles\. Take away 2/);
  assert.match(prepareMathQuestion(cases[2]).prompt,/2 groups\. Each group has 3/);
  assert.deepEqual(prepareMathQuestion(cases[3]).groups,[3,3]);
});
test('teaching explanations are spoken, but answer explanations never leak into practice narration', () => {
  const q = prepareMathQuestion({type:'subtraction-introduction',teaching:true});
  assert.match(mathsQuestionNarration(q),/crossed-out circles/);
  assert.match(mathsQuestionNarration(q),/There are two left/);
  assert(!mathsQuestionNarration({...q,teaching:false}).includes('There are two left'));
});
test('check-in excludes enrichment vocabulary; current game content remains available as extras', () => {
  assert(isCoreMathQuestion({type:'shape-recognition',shape:'triangle'}));
  assert(!isCoreMathQuestion({type:'shape-recognition',shape:'octagon'}));
  assert(!isCoreMathQuestion({type:'colour-mixing',answer:'vermilion'}));
  assert(prepareMathQuestion({type:'number',answer:'15'}).extension);
});
test('curved shapes have an unambiguous straight-side count and selectable correct answer', () => {
  const sides = Object.fromEntries(shapeFactQuestions.filter(q=>q.type==='shape-sides').map(q=>[q.shape,q]));
  for (const [shape, answer] of [['circle','0'],['oval','0'],['heart','0'],['crescent','0'],['semicircle','1']]) {
    assert.equal(sides[shape].answer,answer);assert(sides[shape].options.includes(answer));
  }
});
test('sorting speech describes the actual drag interaction', () => {
  const q=prepareMathQuestion({type:'sorting',items:[{}],zones:[{targetShape:'circle'}]});
  assert.match(q.prompt,/Drag the circles into the box/);
  assert(!q.prompt.includes('Tap'));
});

test('the main question always names the pictured shapes, not the helper counters', () => {
  for (const type of ['addition-introduction','addition-numbers','subtraction-introduction','subtraction-numbers','multiplication-introduction','multiplication-numbers','division-introduction','division-numbers']) {
    const q=prepareMathQuestion({type,teaching:true,values:[4,2],dividend:4,divisor:2});
    assert.match(q.prompt,/circles/);
    assert(!/counter/i.test(mathsQuestionNarration(q)));
  }
  assert.match(prepareMathQuestion({type:'addition-objects',values:[2,3],object:'square'}).prompt,/squares/);
});
