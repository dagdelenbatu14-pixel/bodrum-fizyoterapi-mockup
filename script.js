(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '905330481070';
  const TITLES = { boyun: 'Boyun', sirt: 'Sırt', bel: 'Bel', legen: 'Leğen' };

  /* ---------- booking builder ---------- */
  const book = document.getElementById('bookBtn');
  const rep = document.getElementById('hasReport');
  let chosen = null;
  const upd = () => {
    const part = chosen ? `${TITLES[chosen].toLowerCase()} bölgem için ` : '';
    const r = rep.checked ? ' Hekim raporum var.' : '';
    book.href = `https://wa.me/${WA}?text=` + encodeURIComponent(`Merhaba, ${part}değerlendirme randevusu almak istiyorum.${r}`);
  };
  document.querySelectorAll('#chips button').forEach(b => b.addEventListener('click', () => {
    chosen = chosen === b.dataset.r ? null : b.dataset.r;
    document.querySelectorAll('#chips button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.r === chosen)));
    upd();
  }));
  rep.addEventListener('change', upd);

  /* ---------- entrances ---------- */
  const parts = document.querySelectorAll('main section:not(.visit) :is(h2:not(.sr), h3, p, li, .slip, img, .facts), main .foot p');
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim');
    const seen = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('seen'); seen.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    parts.forEach(p => {
      const sib = [...p.parentElement.children].indexOf(p);
      p.style.setProperty('--d', Math.min(sib, 6) * 70 + 'ms');
      seen.observe(p);
    });
  }

  /* ---------- the contact photo drifts as it passes ---------- */
  const photo = document.querySelector('.visit-photo');
  let ticking = false;
  const frame = () => {
    ticking = false;
    if (!photo || reduce) return;
    const r = photo.getBoundingClientRect();
    const q = (innerHeight - r.top) / (innerHeight + r.height);
    if (q > 0 && q < 1) photo.style.transform = `scale(${1.08 - q * 0.08}) translateY(${(q - 0.5) * -24}px)`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

  /* ---------- smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    window.lenis = lenis;
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -64 }); }
    }));
  }
})();
