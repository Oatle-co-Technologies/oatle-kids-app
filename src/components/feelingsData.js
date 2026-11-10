export const FEELINGS = {
  happy: { label: 'Happy', colour: '#ffe6a0', hint: 'Look for a smiling mouth.' },
  sad: { label: 'Sad', colour: '#bbdffa', hint: 'Look for a mouth that turns down.' },
  angry: { label: 'Angry', colour: '#ffc7b0', hint: 'Look at the eyebrows pointing down towards the nose.' },
  surprised: { label: 'Surprised', colour: '#ddcdfa', hint: 'Look for wide eyes and a round, open mouth.' },
  scared: { label: 'Scared', colour: '#d4d3fa', hint: 'This friend has worried eyebrows and wide eyes.' },
  calm: { label: 'Calm', colour: '#bfebd5', hint: 'This friend has relaxed eyes and a gentle smile.' },
};

export const LITTLE_FEELING_ROUNDS = [
  { id: 'happy-one', target: 'happy', choices: ['happy', 'sad'] },
  { id: 'sad-one', target: 'sad', choices: ['happy', 'sad'] },
  { id: 'surprised-one', target: 'surprised', choices: ['surprised', 'angry'] },
  { id: 'angry-one', target: 'angry', choices: ['surprised', 'angry'] },
  { id: 'sad-two', target: 'sad', choices: ['sad', 'surprised'] },
  { id: 'happy-two', target: 'happy', choices: ['angry', 'happy'] },
  { id: 'angry-two', target: 'angry', choices: ['angry', 'happy'] },
  { id: 'surprised-two', target: 'surprised', choices: ['sad', 'surprised'] },
];

