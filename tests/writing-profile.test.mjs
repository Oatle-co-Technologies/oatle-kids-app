import test from 'node:test';
import assert from 'node:assert/strict';
import { missingWritingProfileFields } from '../src/utils/writingProfile.js';
test('sentence profiles need all four details, with zero siblings valid', () => {
  assert.equal(missingWritingProfileFields().length, 4);
  assert.deepEqual(missingWritingProfileFields({name:'Sam',age:'6',favouriteColour:'blue',siblings:0}), []);
  assert.deepEqual(missingWritingProfileFields({name:'  ',age:'6.5',favouriteColour:'blue',siblings:'-1'}), ['nickname','age','number of siblings']);
});
