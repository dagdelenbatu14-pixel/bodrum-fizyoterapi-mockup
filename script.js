(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '905330481070';
  const NS = 'http://www.w3.org/2000/svg';

  const REGIONS = {
    boyun: {
      title: 'Boyun', code: 'C1–C7 · 7 omur',
      text: 'Masa başında uzun çalışmaya bağlı boyun ve sırt ağrısı, baş ve boyun ağrıları, boyun fıtığıyla ilişkili ağrılar.',
      apps: ['Osteopatik manuel terapi', 'Klinik pilates'],
      read: ['https://fztmelikekoksalpalaz.com/bilgi/masa-basi-boyun-agrisi.html', 'Masa başı boyun ağrısı']
    },
    sirt: {
      title: 'Sırt', code: 'T1–T12 · 12 omur',
      text: 'Skolyoz, yani omurganın üç boyutlu eğriliği; duruş ve iş yüküyle ilişkili kas gerginliği; omuz ağrıları.',
      apps: ['Skolyoz · 3D Schroth', 'Klinik pilates', 'Reformer pilates'],
      read: ['https://fztmelikekoksalpalaz.com/bilgi/skolyoz.html', 'Skolyoz nedir?']
    },
    bel: {
      title: 'Bel', code: 'L1–L5 · 5 omur',
      text: 'Bel fıtığıyla ilişkili ağrılar, uzun süren bel ağrısı ve kas spazmları.',
      apps: ['Osteopatik manuel terapi', 'Klinik pilates', 'Reformer pilates'],
      read: ['https://fztmelikekoksalpalaz.com/bilgi/bel-boyun-fitigi.html', 'Bel ve boyun fıtığı']
    },
    legen: {
      title: 'Leğen', code: 'Sakrum ve kuyruk sokumu',
      text: 'Pelvik taban rehabilitasyonu ve karın-leğen bölgesine yönelik visseral osteopati. Bu bölgedeki yakınmaların tanısını hekim koyar.',
      apps: ['Pelvik taban rehabilitasyonu', 'Visseral osteopati'],
      read: null
    }
  };

  /* on a phone the name comes first, the spine right under it */
  if (matchMedia('(max-width: 900px)').matches) {
    const st = document.querySelector('.stage'), hero = document.querySelector('.hero');
    if (st && hero) hero.after(st);
  }

  /* ---------- draw the spine (side view, front faces left) ---------- */
  const svg = document.getElementById('spine');
  const labelsBox = document.getElementById('labels');
  if (svg) {
    document.documentElement.classList.add('has-spine');
    // [region, count, height, width]
    const plan = [['boyun', 7, 25, 54], ['sirt', 12, 33, 68], ['bel', 5, 44, 90]];
    const GAP = 7, TOP = 40;
    // centre line: x as a function of progress 0..1 (cervical/lumbar curve forward, thoracic back)
    const keys = [[0, 214], [0.09, 196], [0.17, 206], [0.37, 246], [0.58, 214], [0.74, 188], [0.86, 206], [1, 248]];
    const xAt = t => {
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          const [t0, x0] = keys[i - 1], [t1, x1] = keys[i];
          const u = (t - t0) / (t1 - t0), s = u * u * (3 - 2 * u);
          return x0 + (x1 - x0) * s;
        }
      }
      return keys[keys.length - 1][1];
    };
    const total = plan.reduce((a, [, n, h]) => a + n * (h + GAP), 0) + 150;
    const groups = {};
    const mkGroup = r => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'region'); g.dataset.r = r;
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.setAttribute('aria-label', REGIONS[r].title + ' bölgesini göster');
      svg.appendChild(g); groups[r] = g; return g;
    };
    let y = TOP, idx = 0;
    const labelY = {}, front = {};
    plan.forEach(([r, n, h, w]) => {
      const g = mkGroup(r);
      const start = y;
      for (let i = 0; i < n; i++) {
        const t = (y - TOP) / total, t2 = (y + h - TOP) / total;
        const x = xAt(t + (t2 - t) / 2);
        const ang = Math.atan2(xAt(t2) - xAt(t), h) * -180 / Math.PI;
        const ww = w + (i / n) * 8;
        front[r] = Math.max(front[r] ?? 0, x + ww * 1.3);
        const v = document.createElementNS(NS, 'g');
        v.setAttribute('class', 'vert');
        v.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + h / 2).toFixed(1)}) rotate(${ang.toFixed(1)})`);
        v.style.setProperty('--i', idx++);
        v.innerHTML =
          `<path class="proc" d="M${ww * 0.3} ${-h * 0.32} L${ww * 1.25} ${h * 0.18} Q${ww * 1.32} ${h * 0.42} ${ww * 1.12} ${h * 0.44} L${ww * 0.3} ${h * 0.3} Z"/>` +
          `<rect class="body" x="${-ww / 2}" y="${-h / 2}" width="${ww}" height="${h}" rx="${Math.min(9, h / 3)}"/>` +
          `<circle class="facet" cx="${ww * 0.42}" cy="0" r="${Math.max(3, h * 0.16)}"/>`;
        g.appendChild(v);
        if (i < n - 1 || r !== 'bel') {
          const d = document.createElementNS(NS, 'ellipse');
          const dx = xAt((y + h + GAP / 2 - TOP) / total);
          d.setAttribute('class', 'disc');
          d.setAttribute('cx', dx.toFixed(1)); d.setAttribute('cy', (y + h + GAP / 2).toFixed(1));
          d.setAttribute('rx', (ww / 2 - 3).toFixed(1)); d.setAttribute('ry', (GAP / 2).toFixed(1));
          d.style.setProperty('--i', idx);
          g.appendChild(d);
        }
        y += h + GAP;
      }
      labelY[r] = (start + y) / 2;
    });
    // sacrum + coccyx
    const g = mkGroup('legen');
    const sx = xAt((y - TOP) / total);
    const sac = document.createElementNS(NS, 'path');
    sac.setAttribute('class', 'body vert');
    sac.style.setProperty('--i', idx++);
    sac.setAttribute('d', `M${sx - 44} ${y} L${sx + 48} ${y + 4} Q${sx + 70} ${y + 70} ${sx + 46} ${y + 118} L${sx + 18} ${y + 124} Q${sx - 18} ${y + 70} ${sx - 44} ${y} Z`);
    g.appendChild(sac);
    [0, 1, 2, 3].forEach(k => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'body vert');
      c.style.setProperty('--i', idx++);
      c.setAttribute('cx', (sx + 30 - k * 3).toFixed(1)); c.setAttribute('cy', (y + 136 + k * 13).toFixed(1));
      c.setAttribute('r', (7 - k * 1.3).toFixed(1));
      g.appendChild(c);
    });
    labelY.legen = y + 70; front.legen = sx + 72;
    svg.setAttribute('viewBox', `118 0 302 ${Math.ceil(y + 200)}`);
    svg._vbH = y + 200;

    // labels on the front side, as buttons
    Object.keys(REGIONS).forEach(r => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'lab'; b.dataset.r = r;
      b.style.setProperty('--y', (labelY[r] / svg._vbH * 100).toFixed(2) + '%');
      b.style.setProperty('--x', ((front[r] - 118) / 302 * 100).toFixed(2) + '%');
      b.textContent = REGIONS[r].title;
      labelsBox.appendChild(b);
    });

    if (!reduce) requestAnimationFrame(() => svg.classList.add('built'));
    else svg.classList.add('built', 'still');
  }

  /* ---------- region selection ---------- */
  const card = document.getElementById('regionCard');
  let current = null, pinned = false;
  const waHref = (r, report) => {
    const part = r ? `${REGIONS[r].title.toLowerCase()} bölgem için ` : '';
    const rep = report === undefined ? '' : report ? ' Hekim raporum var.' : ' Hekim raporum henüz yok.';
    return `https://wa.me/${WA}?text=` + encodeURIComponent(`Merhaba, ${part}değerlendirme randevusu almak istiyorum.${rep}`);
  };
  function show(r, how) {
    if (!r || !REGIONS[r]) return;
    if (how === 'scroll' && pinned) return;
    if (how === 'tap') pinned = true;
    if (r === current && how === 'scroll') return;
    current = r;
    document.querySelectorAll('.region, .lab').forEach(el => el.classList.toggle('on', el.dataset.r === r));
    const R = REGIONS[r];
    card.classList.remove('in'); void card.offsetWidth;
    card.innerHTML =
      `<p class="rc-code">${R.code}</p><h2 class="rc-title">${R.title}</h2>` +
      `<p class="rc-text">${R.text}</p>` +
      `<p class="rc-apps">${R.apps.join(' · ')}</p>` +
      `<p class="rc-act"><a class="btn btn-small" href="${waHref(r)}" target="_blank" rel="noopener">Bu bölge için yaz</a>` +
      (R.read ? ` <a class="rc-read" href="${R.read[0]}">${R.read[1]}</a>` : '') + `</p>`;
    card.classList.add('in');
  }
  document.querySelectorAll('.region, .lab').forEach(el => {
    const r = el.dataset.r;
    el.addEventListener('click', () => show(r, 'tap'));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(r, 'tap'); } });
    if (matchMedia('(hover:hover)').matches) el.addEventListener('pointerenter', () => show(r, 'tap'));
  });

  /* scrolling hands the spine to whatever you are reading */
  let lastY = scrollY;
  addEventListener('scroll', () => { if (Math.abs(scrollY - lastY) > 240) { pinned = false; lastY = scrollY; } }, { passive: true });
  const watch = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) show(e.target.dataset.region, 'scroll'); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('main [data-region]').forEach(s => watch.observe(s));

  /* ---------- booking builder ---------- */
  const book = document.getElementById('bookBtn');
  const rep = document.getElementById('hasReport');
  let chosen = null;
  const upd = () => { book.href = waHref(chosen, rep.checked); };
  document.querySelectorAll('#chips button').forEach(b => b.addEventListener('click', () => {
    chosen = chosen === b.dataset.r ? null : b.dataset.r;
    document.querySelectorAll('#chips button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.r === chosen)));
    if (chosen) show(chosen, 'tap');
    upd();
  }));
  rep.addEventListener('change', upd);

  /* ---------- entrances ---------- */
  const parts = document.querySelectorAll('main section:not(.visit) :is(h2:not(.sr), h3, p, li, .slip, img, .facts, .actions), main .foot p');
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

  /* ---------- the name settles as you leave the first screen ---------- */
  const name = document.querySelector('.name');
  const photo = document.querySelector('.visit-photo');
  let ticking = false;
  const frame = () => {
    ticking = false;
    const p = Math.min(1, scrollY / innerHeight);
    if (name && !reduce) name.style.transform = `scale(${1 - p * 0.06})`;
    if (photo && !reduce) {
      const r = photo.getBoundingClientRect();
      const q = (innerHeight - r.top) / (innerHeight + r.height);
      if (q > 0 && q < 1) photo.style.transform = `scale(${1.08 - q * 0.08}) translateY(${(q - 0.5) * -24}px)`;
    }
    if (svg && !reduce) svg.style.setProperty('--sp', (scrollY / (document.body.scrollHeight - innerHeight)).toFixed(3));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* ---------- smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -72 }); }
    }));
  }
})();
