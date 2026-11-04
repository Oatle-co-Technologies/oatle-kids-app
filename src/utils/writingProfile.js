const fields = [
  ['name', 'nickname'], ['age', 'age'],
  ['favouriteColour', 'favourite colour'], ['siblings', 'number of siblings'],
];
export function missingWritingProfileFields(profile = {}) {
  return fields.filter(([key]) => {
    const value = String(profile[key] ?? '').trim();
    if (!value) return true;
    if (key === 'age' || key === 'siblings') {
      const number = Number(value);
      return !Number.isInteger(number) || number < 0 || number > (key === 'age' ? 18 : 20);
    }
    return false;
  }).map(([, label]) => label);
}
