// Evil Eye (Figma 519:247): hung on a string as the pollock charm is (charm.js
// does the dropping, swinging, hitting and dragging). Its string is the
// pollock's, in the eye's dark brown, threaded down to the knot on top.
// Each hit knocks bad luck into the eye, and a crack runs further across it.

// Each layer's box in the 221 x 647 frame (the Figma group's own bounds)
window.CHARM = {
  dir: 'evileye',
  parts: [
    // the string, straight, its end tucked under the knot (the pollock's
    // string, its knot spot on the eye's)
    { src: 'string', string: true, box: [78.33, -71.0, 46.193, 260.124], inner: [39.235, 259.162], rot: -1.54, inset: '-0.29% -1.91%', fish: false },
    { src: 'tail', box: [76.652, 388.215, 54, 259], inner: [54, 259], rot: 0, inset: '0' },
    { src: 'eye', box: [1.122, 147.497, 218, 246], inner: [218, 246], rot: 0, inset: '0' },
  ],
  pin: [98.8, -69.7],
  fit: [-10, 647],
};

// The cracks run out from the knot's side of the eye and across it, a
// stretch with each hit (in the frame's units; the eye's middle is 109, 285)
const CRACKS = [
  'M150 196L141 222L150 241L137 259',
  'M137 259L121 266L128 284',
  'M128 284L105 296L93 318L99 340',
  'M99 340L75 352L60 371L33 379',
  'M99 340L111 362L104 384M150 241L174 249L199 268',
];
const NS = 'http://www.w3.org/2000/svg';
const crackSvg = document.createElementNS(NS, 'svg');
crackSvg.setAttribute('class', 'eye--cracks');
crackSvg.setAttribute('viewBox', '0 0 221 647');
crackSvg.setAttribute('aria-hidden', 'true');
const runs = CRACKS.map((d) => {
  const pair = ['is-edge', ''].map((cls) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    if (cls) p.classList.add(cls);
    crackSvg.appendChild(p);
    return p;
  });
  return pair;
});
// over the eye, swinging with it
addEventListener('DOMContentLoaded', () => document.getElementById('fish').appendChild(crackSvg));

addEventListener('charm-hit', (e) => {
  const n = e.detail;
  runs.forEach((pair, i) => pair.forEach((p) => p.classList.toggle('is-run', i < n)));
  if (n) setTimeout(() => Sounds.crack(n === CRACKS.length), 60);
});
