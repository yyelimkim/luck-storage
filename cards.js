// Card artwork in cards/ (slide2.png is not a card). Shared by the desktop
// page (script.js) and the iPhone prototype (mobile.js).
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
const IMAGES_VERSION = 5;  // bump when artwork files are replaced

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

// Markup for a category tag
function categoryTag(category) {
  const label = category[0].toUpperCase() + category.slice(1);
  return `<span class="tag" data-category="${category}"><i class="tag--icon"></i><span class="tag--label">${label}</span><i class="tag--icon"></i></span>`;
}
