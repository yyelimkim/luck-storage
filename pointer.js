// The pointing hand (Blowing Candles' hand), showing where to tap before the
// first real tap: it comes in, presses on the thing and lifts away, over and
// over, following it if it moves. pointAt(el) starts it and returns the
// function that puts it away.

function pointAt(el, size = 54) {
  const hand = document.createElement('img');
  hand.src = 'assets/candles/hand.svg';
  hand.alt = '';
  hand.setAttribute('aria-hidden', 'true');
  Object.assign(hand.style, {
    position: 'fixed', zIndex: '20', width: `${size}px`, pointerEvents: 'none', opacity: '0',
  });
  document.body.appendChild(hand);
  // its fingertip (a third across, at the very top) on the thing's middle
  let raf = 0;
  const follow = () => {
    const r = el.getBoundingClientRect();
    hand.style.left = `${r.left + r.width / 2 - size * 0.33}px`;
    hand.style.top = `${r.top + r.height / 2 - 2}px`;
    raf = requestAnimationFrame(follow);
  };
  follow();
  const tap = hand.animate([
    { opacity: 0, translate: '22px 26px', scale: 1 },
    { opacity: 1, translate: '0 0', scale: 1, offset: 0.25 },
    { opacity: 1, translate: '0 0', scale: 0.88, offset: 0.45 },
    { opacity: 1, translate: '0 0', scale: 1, offset: 0.6 },
    { opacity: 0, translate: '10px 14px', scale: 1, offset: 0.85 },
    { opacity: 0, translate: '10px 14px', scale: 1 },
  ], { duration: 1600, iterations: Infinity, easing: 'ease-in-out', delay: 400 });
  let gone = false;
  return () => {
    if (gone) return;
    gone = true;
    cancelAnimationFrame(raf);
    tap.cancel();
    hand.remove();
  };
}
