// The cards, keyed by their Korean names; their artwork is the English set
// in cards/english cards/. Shared by the desktop page (script.js) and the
// iPhone prototype (mobile.js).
const IMAGES = [
  '걱정인형.png',
  '꽃잎 점.png',
  '네잎 클로버 찾기.png',
  '돌팝 쌓기.png',
  '돼지꿈.png',
  '드림캐쳐.png',
  '명태 액막이.png',
  '민들레 소원 빌기.png',
  '부처님 배 만지기.png',
  '빨간 옷 입기.png',
  '손바닥의 인 쓰기.png',
  '시험 전 날 떡 먹기.png',
  '악마의 눈.png',
  '촛불 한번에 불기.png',
  '테루테루보즈.png',
  '포도 12알 먹기.png',
];
const IMAGES_VERSION = 6;  // bump when artwork files are replaced

// Cards with back artwork in cards/backs/ (same file name as the front);
// the rest flip to a blank back
const BACKS = new Set([
  '명태 액막이.png',
]);

const backSrc = (name) => `cards/backs/${encodeURIComponent(name)}?v=${IMAGES_VERSION}`;

// English artwork in cards/english cards/, keyed by the Korean file name
const ENGLISH = {
  '걱정인형.png': 'Worry Doll.png',
  '꽃잎 점.png': 'Love me, love me not.png',
  '네잎 클로버 찾기.png': 'Four-Leaf Clover.png',
  '돌팝 쌓기.png': 'Stacking Stones.png',
  '돼지꿈.png': 'Pig Dreams.png',
  '드림캐쳐.png': 'Dreamcatcher.png',
  '명태 액막이.png': 'Pollock Protection Charm.png',
  '민들레 소원 빌기.png': 'Making a Dandelion Wish.png',
  '부처님 배 만지기.png': 'Rubbing Buddha’s Belly.png',
  '빨간 옷 입기.png': 'Wearing Red.png',
  '손바닥의 인 쓰기.png': 'Hito (人) on Palm.png',
  '시험 전 날 떡 먹기.png': 'Rice Cakes Before an Exam.png',
  '악마의 눈.png': 'Evil Eye.png',
  '촛불 한번에 불기.png': 'Blowing Out Candles in One.png',
  '테루테루보즈.png': 'Teru Teru Bozu.png',
  '포도 12알 먹기.png': '12 Grapes at Midnight.png',
};
// A card's English name: its artwork's file name, unless renamed here
const RENAMED = {
  '촛불 한번에 불기.png': 'Blowing Candles',
  '명태 액막이.png': 'Pollock Charm',
  '시험 전 날 떡 먹기.png': 'Rice Cakes',
  '민들레 소원 빌기.png': 'Dandelion Wish',
  '포도 12알 먹기.png': '12 Grapes',
  '부처님 배 만지기.png': 'Buddha’s Belly',
};
const cardName = (name) => RENAMED[name] || ENGLISH[name].replace('.png', '');

// Each card's small drawing (Figma 428:7921, 428:7922): in colour, filled in
// the card's own colour, for its back and the profile's earned luck; and in
// white line, for the Daily Fortune's lucky ritual. [file, width, height]
const MINI = {
  '걱정인형.png': ['worry-doll', 150, 96],
  '꽃잎 점.png': ['love-me', 91, 105],
  '네잎 클로버 찾기.png': ['clover', 106, 114],
  '돌팝 쌓기.png': ['stones', 103, 102],
  '돼지꿈.png': ['pig', 91, 91],
  '드림캐쳐.png': ['dreamcatcher', 67, 160],
  '명태 액막이.png': ['pollock', 104, 100],
  '민들레 소원 빌기.png': ['dandelion', 107, 114],
  '부처님 배 만지기.png': ['buddha', 111, 109],
  '빨간 옷 입기.png': ['red', 97, 65],
  '손바닥의 인 쓰기.png': ['palm', 99, 113],
  '시험 전 날 떡 먹기.png': ['rice-cake', 94, 78],
  '악마의 눈.png': ['evil-eye', 53, 159],
  '촛불 한번에 불기.png': ['candles', 113, 101],
  '테루테루보즈.png': ['teru', 56, 131],
  '포도 12알 먹기.png': ['grapes', 86, 118],
};
// <img> of a card's mini drawing, 'color' or 'line', at most h tall
function miniImg(name, kind, h, cls = '') {
  const [file, w0, h0] = MINI[name];
  const k = Math.min(1, h / h0);
  return `<img class="${cls}" src="assets/minis/${kind}/${file}.svg" width="${Math.round(w0 * k)}" height="${Math.round(h0 * k)}" alt="">`;
}
const englishSrc = (name) => `cards/english%20cards/${encodeURIComponent(ENGLISH[name])}?v=${IMAGES_VERSION}`;

// Each card's category, as printed in its header (see the .tag component in
// design-system.css)
const CATEGORY = {
  '걱정인형.png': 'calm',
  '꽃잎 점.png': 'luck',
  '네잎 클로버 찾기.png': 'luck',
  '돌팝 쌓기.png': 'luck',
  '돼지꿈.png': 'success',
  '드림캐쳐.png': 'calm',
  '명태 액막이.png': 'protection',
  '민들레 소원 빌기.png': 'luck',
  '부처님 배 만지기.png': 'success',
  '빨간 옷 입기.png': 'success',
  '손바닥의 인 쓰기.png': 'calm',
  '시험 전 날 떡 먹기.png': 'success',
  '악마의 눈.png': 'protection',
  '촛불 한번에 불기.png': 'luck',
  '테루테루보즈.png': 'protection',
  '포도 12알 먹기.png': 'luck',
};

// Markup for a category tag. It reads the category's name unless given a
// label (a card's name), in which case it grows to fit it.
function categoryTag(category, label) {
  const text = label || category[0].toUpperCase() + category.slice(1);
  return `<span class="tag${label ? ' tag--named' : ''}" data-category="${category}"><i class="tag--icon"></i><span class="tag--label">${text}</span><i class="tag--icon"></i></span>`;
}

// Each card's background colour, for its back when turned over: always a
// design-system colour. (Pollock's and Evil Eye's front artwork is drawn in
// #dad449, a yellow outside the system; their backs use Yellow-Green.)
const CARD_COLOR = {
  '걱정인형.png': 'var(--yellow-green)',
  '꽃잎 점.png': 'var(--hot-pink)',
  '네잎 클로버 찾기.png': 'var(--yellow-green)',
  '돌팝 쌓기.png': 'var(--v2-blue)',
  '돼지꿈.png': 'var(--v2-blue)',
  '드림캐쳐.png': 'var(--v2-blue)',
  '명태 액막이.png': 'var(--yellow-green)',
  '민들레 소원 빌기.png': 'var(--v2-blue)',
  '부처님 배 만지기.png': 'var(--forest-green)',
  '빨간 옷 입기.png': 'var(--forest-green)',
  '손바닥의 인 쓰기.png': 'var(--v2-blue)',
  '시험 전 날 떡 먹기.png': 'var(--hot-pink)',
  '악마의 눈.png': 'var(--yellow-green)',
  '촛불 한번에 불기.png': 'var(--forest-green)',
  '테루테루보즈.png': 'var(--v2-blue)',
  '포도 12알 먹기.png': 'var(--hot-pink)',
};

// The deep shade of each card colour, glowing behind "Luck Claimed!"
const GLOW_COLOR = {
  'var(--v2-blue)': '#016acd',
  'var(--forest-green)': '#077947',
  'var(--hot-pink)': '#a40245',
  'var(--yellow-green)': '#c99f05',
};

// What each card's sheet says under its name: what the custom is, and how
// to perform it
const CARD_TEXT = {
  '걱정인형.png': {
    about: 'A small doll from Guatemala, rooted in Mayan tradition, that you tell your worries to before sleep, believed to carry them away by morning.',
    howTo: 'Choose a doll, tell it your worries, then tuck it under your pillow.',
  },
  '꽃잎 점.png': {
    about: 'An old French flower-petal game (“effeuiller la marguerite”) used to predict whether someone loves you back, one petal at a time.',
    howTo: 'Say who you’re thinking of, then pluck the petals one at a time.',
  },
  '네잎 클로버 찾기.png': {
    about: 'An Irish belief that finding a rare four-leaf clover among ordinary three-leaf ones is a sign of good luck.',
    howTo: 'Swipe through a field of 3-leaf clovers searching, then tap the one 4-leaf clover when it appears.',
  },
  '돌팝 쌓기.png': {
    about: 'A practice found across many cultures, including Scottish, Scandinavian, Buddhist, and Native American traditions, where a balanced stack of stones is believed to hold a wish in place.',
    howTo: 'Stack stones by tapping where you want it to land',
  },
  '돼지꿈.png': {
    about: 'A Korean belief that dreaming of a pig (돼지꿈) brings wealth, often prompting people to buy a lottery ticket that day.',
    howTo: 'Shake to “wake up,” then scratch-reveal like a lottery ticket.',
  },
  '드림캐쳐.png': {
    about: 'A craft originating with the Ojibwe people of North America, hung above a bed and believed to catch bad dreams while letting good ones through.',
    howTo: 'Tap to spin it. Floating bad-dream icons drift in and get caught, then fade.',
  },
  '명태 액막이.png': {
    about: 'An old Korean custom of hanging a dried pollack by the door, believed to keep bad luck and evil spirits from entering the home.',
    howTo: 'Tap or shake it to “hit” it, knocking the bad luck loose.',
  },
  '민들레 소원 빌기.png': {
    about: 'A folk tradition from Western Europe and America. Blowing the seeds off a dandelion while making a wish is believed to carry that wish into the wind.',
    howTo: 'Swipe/blow gesture scatters the seeds off the stem across the screen.',
  },
  '부처님 배 만지기.png': {
    about: 'A Chinese folk Buddhist custom of rubbing the belly of Budai, the round-bellied figure, believed to bring good fortune to whoever touches it.',
    howTo: 'Rub the belly in circles to make it glow.',
  },
  '빨간 옷 입기.png': {
    about: 'A belief rooted in Chinese tradition and shared across East Asia that wearing red brings good fortune and wards off bad luck, especially on important days.',
    howTo: 'Drag red clothing onto the figure to dress it.',
  },
  '손바닥의 인 쓰기.png': {
    about: 'A Japanese custom of drawing the character for “person” on your palm and swallowing it, believed to calm nerves before something stressful.',
    howTo: 'Trace 人 on the palm with your finger, then tap to “swallow” it.',
  },
  '시험 전 날 떡 먹기.png': {
    about: 'A Korean tradition of eating sticky rice cake (찹쌀떡) before an exam, believed to help your answers “stick” and bring good results.',
    howTo: 'Drag the rice cake to your mouth. It visually “sticks” in place.',
  },
  '악마의 눈.png': {
    about: 'A charm widely used across Mediterranean and Middle Eastern cultures, believed to ward off envy and ill will directed at you.',
    howTo: 'Tap each bit of bad luck to send it into the eye.',
  },
  '촛불 한번에 불기.png': {
    about: 'A widespread Western birthday custom. Blowing out every candle in a single breath is believed to make your wish come true.',
    howTo: 'Swipe across the candles in one motion to blow them out!',
  },
  '테루테루보즈.png': {
    about: 'A small handmade doll from Japan, hung outside the window the night before and believed to bring clear skies and keep the rain away.',
    howTo: 'Drag it upward to hang it from the top of the screen.',
  },
  '포도 12알 먹기.png': {
    about: 'A Spanish New Year’s tradition of eating twelve grapes as the clock strikes midnight, one for each month of luck ahead.',
    howTo: 'Tap all 12 grapes before the 12 seconds run out.',
  },
};

// Interactive pieces: on desktop they fill the canvas beside an opened card;
// on the phone they take the illustration's place on the card's sheet
const CANVAS_PAGES = {
  '명태 액막이.png': 'charm.html?v=27',  // the fish charm
  '촛불 한번에 불기.png': 'candles.html?v=22',  // make a wish, blow them all out
  '부처님 배 만지기.png': 'buddha.html?v=13',  // rub the belly round till it glows
  '포도 12알 먹기.png': 'grapes.html?v=13',  // eat all twelve before the clock runs out
  '돌팝 쌓기.png': 'stones.html?v=22',  // drop the stones in, the wish on top
  '악마의 눈.png': 'evileye.html?v=5',  // the eye takes the bad luck, and cracks
  '걱정인형.png': 'worry.html?v=13',  // tell the doll your worries, tuck it in
  '꽃잎 점.png': 'love.html?v=6',  // loves me, loves me not... ends on love
};
