(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '905330481070';
  const TITLES = { boyun: 'Boyun', sirt: 'Sırt', bel: 'Bel', legen: 'Leğen' };

  /* ---------- booking builder ---------- */
  const book = document.getElementById('bookBtn');
  const rep = document.getElementById('hasReport');
  if (book && rep) {
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
  }

  /* ---------- entrances ---------- */
  const parts = document.body.classList.contains('sub') ? [] : document.querySelectorAll('main section:not(.visit) :is(h2:not(.sr), h3, p, li, .slip, img, .facts), main .foot p');
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

  /* ---------- appointment form: compose the WhatsApp message ---------- */
  const form = document.getElementById('bookForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form), err = document.getElementById('formError');
    const ad = (f.get('ad') || '').trim(), tel = (f.get('tel') || '').trim();
    if (!ad || !tel) { err.textContent = 'Adınızı ve telefonunuzu yazın.'; return; }
    if (!f.get('kvkk')) { err.textContent = 'Devam etmek için aydınlatma metnini onaylayın.'; return; }
    err.textContent = '';
    const lines = [`Merhaba, değerlendirme randevusu almak istiyorum.`, `Ad: ${ad}`, `Telefon: ${tel}`];
    if (f.get('bolge')) lines.push(`Bölge: ${f.get('bolge')}`);
    const gun = f.getAll('gun'); if (gun.length) lines.push(`Uygun gün: ${gun.join(', ')}`);
    lines.push(`Saat: ${f.get('saat')}`);
    lines.push(f.get('rapor') ? 'Hekim raporum var.' : 'Hekim raporum henüz yok.');
    track('form_submit');
    window.open(`https://wa.me/${WA}?text=` + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

  /* ---------- measurement: events always queue, analytics loads only after consent ---------- */
  const GA_ID = '';   // shortcut: empty until the clinic's GA4 property exists; set it to switch measurement on
  window.dataLayer = window.dataLayer || [];
  function track(name) { window.dataLayer.push({ event: name, page: location.pathname }); }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="https://wa.me"], a[href^="tel:"], [data-track]');
    if (!a) return;
    track(a.dataset.track || (a.href.startsWith('tel:') ? 'phone_click' : 'whatsapp_click'));
  });
  const loadGA = () => {
    if (!GA_ID) return;
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.gtag = function () { window.dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', GA_ID);
  };
  let consent = null; try { consent = localStorage.getItem('consent'); } catch (e) {}
  if (GA_ID && consent === null) {
    const box = document.createElement('div'); box.className = 'consent show'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Çerez bildirimi');
    const up = document.body.classList.contains('sub') && location.pathname.split('/').filter(Boolean).length > 2 ? '../' : '';
    box.innerHTML = `<p>Siteyi geliştirmek için ziyaret ölçümü yapmak istiyoruz. Onay verirseniz ölçüm araçları yüklenir. <a href="${up}gizlilik.html">Ayrıntılar</a></p><div class="row-b"><button class="yes" type="button">Kabul et</button><button class="no" type="button">Reddet</button></div>`;
    document.body.appendChild(box);
    box.querySelector('.yes').onclick = () => { try { localStorage.setItem('consent', 'yes'); } catch (e) {} box.remove(); loadGA(); };
    box.querySelector('.no').onclick = () => { try { localStorage.setItem('consent', 'no'); } catch (e) {} box.remove(); };
  } else if (consent === 'yes') loadGA();

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
