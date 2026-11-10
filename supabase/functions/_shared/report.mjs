export const skills = {
 reading: [
 ['capital','Capital letters','Find capital letters on food packets and say their names together.'],
 ['lowercase','Lowercase letters','Choose three lowercase letters in a book and find more examples together.'],
 ['matching','Upper/lowercase matching','Make pairs of capital and lowercase letter cards and play a matching game.'],
 ['word-order','Listening and building words','Say a short word slowly, then help your child arrange its letter cards.'],
 ['reading','Reading simple words','Read a short picture book together and sound out one simple word at a time.'],
 ['missing','Missing letters','Write a familiar three-letter word with one letter missing and say each sound together.'],
 ['sentences','Building simple sentences','Write a short sentence on separate word cards and arrange them together.']],
 maths: [
 ['number-recognition','Number recognition','Find numbers around your home and match each to a small group of objects.'],
 ['shapes','Shapes','Look for circles, triangles and rectangles at home; count their sides and corners.'],
 ['counting','Counting','Count a small set of toys, touching each toy once as you say its number.'],
 ['colour-recognition','Colour recognition','Sort household objects by colour and name each group together.'],
 ['colour-mixing','Colour mixing','Mix small amounts of washable primary-colour paint and describe what changes.'],
 ['matching-and-sorting','Matching and sorting','Sort safe objects by colour, then shape, then both properties.'],
 ['addition','Addition','Join two small groups of counters and count how many there are altogether.'],
 ['subtraction','Subtraction','Start with a few counters, take some away and count what remains.'],
 ['multiplication','Equal groups and repeated adding','Make equal groups of blocks and count the total group by group.'],
 ['division','Sharing into equal groups','Share counters equally between two toy characters and check each has the same amount.']]
};
export function validateReport(subject, scores) {
 const expected = skills[subject];
 if (!expected || !scores || Array.isArray(scores) || Object.keys(scores).length !== expected.length) throw new Error('invalid_report');
 const total = subject === 'reading' ? 4 : 2;
 for (const [id] of expected) {
  const s = scores[id];
  if (!s || s.total !== total || !Number.isInteger(s.correct) || s.correct < 0 || s.correct > total) throw new Error('invalid_report');
 }
 return scores;
}
export function reportText(subject, scores) {
 validateReport(subject, scores);
 const rows = skills[subject].map(([id,name,tip]) => {
  const s = scores[id], percent = Math.round(100*s.correct/s.total);
  const status = percent >= 75 ? 'Keep practising' : 'Practise together';
  return `${name}: ${s.correct}/${s.total} (${percent}%). ${status}.\nAt home: ${tip}`;
 });
 return `Your ${subject === 'reading' ? 'Reading (Pluto)' : 'Maths (Mission 9)'} learning snapshot\n\n${rows.join('\n\n')}\n\nTry one activity for five minutes, praise effort, and revisit it another day. These results describe this app attempt, not a diagnosis or a formal level assessment. No child name or other profile details are included.\n\nThis is an educational service report, separate from optional marketing emails.`;
}
export function eligibleForReminder(user, preference, subscriptions, entitlements, now = Date.now()) {
 if (!user?.email_confirmed_at || !preference?.opted_in) return false;
 if (subscriptions.some(s => ['active','trialing','past_due'].includes(s.status) || (s.current_period_end && Date.parse(s.current_period_end) > now))) return false;
 return !entitlements.some(e => e.status === 'active' && (!e.expires_at || Date.parse(e.expires_at) > now));
}
