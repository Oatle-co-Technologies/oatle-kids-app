export const MUSIC_INSTRUMENTS = ['drum','bongos','bell','piano','xylophone'];
export const COPY_INSTRUMENTS = ['drum', 'bongos', 'bell', 'piano', 'xylophone'];
export const DANCE_SONGS = [
  { id:'carefree', title:'Carefree', symbol:'sun', isrc:'USUAN1400037' },
  { id:'life-of-riley', title:'Life of Riley', symbol:'rainbow', isrc:'USUAN1400054' },
  { id:'monkeys-spinning-monkeys', title:'Monkeys Spinning Monkeys', symbol:'star', isrc:'USUAN1400011' },
  { id:'fluffing-a-duck', title:'Fluffing a Duck', symbol:'flower', isrc:'USUAN1100768' },
].map(song=>({...song,src:`/music-garden/${song.id}.mp3`,source:`https://incompetech.com/music/royalty-free/index.html?isrc=${song.isrc}`}));
export const MUSIC_LICENCE = 'https://creativecommons.org/licenses/by/4.0/';
