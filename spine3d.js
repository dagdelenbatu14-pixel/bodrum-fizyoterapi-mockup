import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const WA = '905330481070';
const REGIONS = {
  boyun: {
    code: 'C1–C7', title: 'Boyun', count: '7 omur',
    text: 'Masa başında uzun çalışmaya bağlı boyun ve sırt ağrısı, baş ve boyun ağrıları, boyun fıtığıyla ilişkili ağrılar.',
    apps: ['Osteopatik manuel terapi', 'Klinik pilates'],
    read: ['bilgi/masa-basi-boyun-agrisi.html', 'Masa başı boyun ağrısı'],
    spots: [['disc', 'Disk'], ['root', 'Sinir kökü'], ['spine', 'Dikensi çıkıntı']]
  },
  sirt: {
    code: 'T1–T12', title: 'Sırt', count: '12 omur',
    text: 'Skolyoz, yani omurganın üç boyutlu eğriliği; duruş ve iş yüküyle ilişkili kas gerginliği; omuz ağrıları.',
    apps: ['Skolyoz · 3D Schroth', 'Klinik pilates', 'Reformer pilates'],
    read: ['bilgi/skolyoz.html', 'Skolyoz nedir?'],
    spots: [['body', 'Omur gövdesi'], ['spine', 'Dikensi çıkıntı'], ['disc', 'Disk']]
  },
  bel: {
    code: 'L1–L5', title: 'Bel', count: '5 omur',
    text: 'Bel fıtığıyla ilişkili ağrılar, uzun süren bel ağrısı ve kas spazmları.',
    apps: ['Osteopatik manuel terapi', 'Klinik pilates', 'Reformer pilates'],
    read: ['bilgi/bel-boyun-fitigi.html', 'Bel ve boyun fıtığı'],
    spots: [['disc', 'Disk'], ['root', 'Sinir kökü'], ['facet', 'Faset eklem']]
  },
  legen: {
    code: 'S–Co', title: 'Leğen', count: 'Sakrum ve kuyruk sokumu',
    text: 'Pelvik taban rehabilitasyonu ve karın-leğen bölgesine yönelik visseral osteopati. Bu bölgedeki yakınmaların tanısını hekim koyar.',
    apps: ['Pelvik taban rehabilitasyonu', 'Visseral osteopati'],
    read: null,
    spots: [['sacrum', 'Sakrum'], ['coccyx', 'Kuyruk sokumu'], ['joint', 'Sakroiliak eklem bölgesi']]
  }
};
const ORDER = ['boyun', 'sirt', 'bel', 'legen'];
const COLORS = { boyun: '#6fbf5a', sirt: '#3fb3a8', bel: '#e0a33a', legen: '#d4708f' };
const waHref = r => `https://wa.me/${WA}?text=` + encodeURIComponent(`Merhaba, ${REGIONS[r].title.toLowerCase()} bölgem için değerlendirme randevusu almak istiyorum.`);

/* fill the overlay panels */
document.querySelectorAll('.stop-region').forEach(el => {
  const R = REGIONS[el.dataset.r];
  el.innerHTML =
    `<p class="code">${R.code}</p>` +
    `<h2>${R.title} <span>${R.count}</span></h2>` +
    `<p class="txt">${R.text}</p>` +
    `<ul class="apps-chips">${R.apps.map(a => `<li>${a}</li>`).join('')}</ul>` +
    `<p class="act"><a class="btn btn-small" href="${waHref(el.dataset.r)}" target="_blank" rel="noopener">Bu bölge için yaz</a>` +
    (R.read ? `<a class="read" href="${R.read[0]}">${R.read[1]}</a>` : '') + `</p>`;
});

// let the first screen paint before the scene is built
await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

const canvas = document.getElementById('bone');
const tour = document.querySelector('.tour');
const stops = [...document.querySelectorAll('.stop')];
const navBtns = [...document.querySelectorAll('.tour-nav button')];
const hotBox = document.getElementById('hotspots');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) document.documentElement.classList.add('rm');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (renderer) {
  document.documentElement.classList.add('has-3d');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const BG = new THREE.Color('#1a1310');
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 90, 170);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  const key = new THREE.DirectionalLight('#fff1dc', 2.6); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight('#8fb3ff', 1.6); rim.position.set(-8, 4, -10); scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffd7b0', 0.5); fill.position.set(-6, -6, 6); scene.add(fill);
  scene.add(new THREE.AmbientLight('#3b2c24', 0.6));

  /* materials */
  const bone = () => new THREE.MeshStandardMaterial({ color: '#e9dfcb', roughness: 0.58, metalness: 0.02, emissive: '#5aa844', emissiveIntensity: 0 });
  const discMat = () => new THREE.MeshPhysicalMaterial({ color: '#b9cfd6', roughness: 0.25, transmission: 0.25, thickness: 0.4, clearcoat: 0.6, emissive: '#7fd36a', emissiveIntensity: 0 });
  const nerveMat = new THREE.MeshStandardMaterial({ color: '#d9b04a', roughness: 0.5, emissive: '#5a3e0c', emissiveIntensity: 0.25 });
  const cordMat = new THREE.MeshStandardMaterial({ color: '#f3dc9a', roughness: 0.45, emissive: '#6b4a10', emissiveIntensity: 0.25 });

  /* the curve the column follows: front is +z */
  const curve = new THREE.CatmullRomCurve3([
    [0, 9.6, 0.15], [0, 8.2, 0.65], [0, 6.6, 0.35], [0, 4.4, -0.55], [0, 1.8, -0.75], [0, -0.6, -0.2],
    [0, -2.6, 0.55], [0, -4.4, 0.45], [0, -5.8, -0.15], [0, -7.4, -0.95], [0, -8.6, -1.0]
  ].map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const LEN = curve.getLength();

  const spine = new THREE.Group();
  scene.add(spine);
  const parts = { boyun: [], sirt: [], bel: [], legen: [] };
  const mats = { boyun: [], sirt: [], bel: [], legen: [] };
  const anchors = {};          // region -> name -> local Vector3 (in spine space)
  const pickables = [];
  const up = new THREE.Vector3(0, 1, 0);

  const plan = [['boyun', 7, 0.42, 0.13, 0.5], ['sirt', 12, 0.56, 0.16, 0.66], ['bel', 5, 0.78, 0.22, 0.9]];
  let dist = 0.25;
  const cordPts = [];
  const add = (r, mesh) => { mesh.userData.region = r; parts[r].push(mesh); pickables.push(mesh); return mesh; };

  plan.forEach(([r, n, h, gap, rad]) => {
    const mBone = bone(), mDisc = discMat(); mBone.emissive.set(COLORS[r]); mDisc.emissive.set(COLORS[r]); mats[r].push(mBone, mDisc);
    for (let i = 0; i < n; i++) {
      const u = (dist + h / 2) / LEN;
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const g = new THREE.Group();
      g.position.copy(p);
      g.quaternion.setFromUnitVectors(up, t.clone().negate());
      const k = rad * (1 + i / n * 0.15);
      // vertebral body (oval)
      const prof = [];
      for (let q = 0; q <= 12; q++) { const v = q / 12, yy = (v - 0.5) * h; const rim = Math.pow(Math.abs(v - 0.5) * 2, 6); prof.push(new THREE.Vector2(k * (0.86 + 0.14 * Math.pow(Math.abs(v - 0.5) * 2, 2)) * (1 - 0.06 * rim), yy)); }
      prof.unshift(new THREE.Vector2(0, -h / 2)); prof.push(new THREE.Vector2(0, h / 2));
      const body = add(r, new THREE.Mesh(new THREE.LatheGeometry(prof, 40), mBone));
      body.scale.z = 0.78; body.position.z = k * 0.2; g.add(body);
      // the arch behind the body, around the canal
      const arch = add(r, new THREE.Mesh(new THREE.TorusGeometry(k * 0.52, k * 0.15, 10, 28, Math.PI), mBone));
      arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI; arch.position.z = -k * 0.62; g.add(arch);
      // spinous process: points back and down (steeper in the thorax)
      const spLen = r === 'bel' ? k * 1.1 : r === 'sirt' ? k * 1.55 : k * 1.2;
      const sp = add(r, new THREE.Mesh(new THREE.CylinderGeometry(k * 0.08, k * 0.17, spLen, 10), mBone));
      const tilt = r === 'sirt' ? 1.05 : r === 'bel' ? 1.45 : 1.3;
      sp.rotation.x = tilt; sp.position.set(0, -spLen * 0.28, -k * 1.15 - spLen * 0.38); g.add(sp);
      // transverse processes
      [-1, 1].forEach(s => {
        const tp = add(r, new THREE.Mesh(new THREE.CylinderGeometry(k * 0.07, k * 0.13, k * 0.95, 8), mBone));
        tp.rotation.z = s * Math.PI / 2.3; tp.rotation.x = 0.25; tp.position.set(s * k * 0.85, 0, -k * 0.65); g.add(tp);
        const fc = add(r, new THREE.Mesh(new THREE.SphereGeometry(k * 0.13, 12, 10), mBone));
        fc.position.set(s * k * 0.45, h * 0.42, -k * 0.75); g.add(fc);
      });
      spine.add(g);
      g.updateMatrix();
      const canal = new THREE.Vector3(0, 0, -k * 0.62).applyMatrix4(g.matrix);
      cordPts.push(canal);
      const mid = i === Math.floor(n / 2);
      if (mid) {
        anchors[r] = anchors[r] || {};
        anchors[r].body = new THREE.Vector3(0, 0, k * 1.0).applyMatrix4(g.matrix);
        anchors[r].spine = new THREE.Vector3(0, -spLen * 0.55, -k * 1.15 - spLen * 0.8).applyMatrix4(g.matrix);
        anchors[r].trans = new THREE.Vector3(k * 1.35, 0, -k * 0.7).applyMatrix4(g.matrix);
        anchors[r].facet = new THREE.Vector3(k * 0.5, h * 0.45, -k * 0.85).applyMatrix4(g.matrix);
        anchors[r].cord = canal.clone();
      }
      dist += h;
      // disc + a pair of nerve roots in the gap below
      if (!(r === 'bel' && i === n - 1)) {
        const ud = (dist + gap / 2) / LEN;
        const pd = curve.getPointAt(ud), td = curve.getTangentAt(ud);
        const d = add(r, new THREE.Mesh(new THREE.CylinderGeometry(k * 0.96, k * 0.96, gap * 0.92, 40), mDisc));
        d.position.copy(pd); d.quaternion.setFromUnitVectors(up, td.clone().negate());
        d.scale.z = 0.78; d.position.add(new THREE.Vector3(0, 0, k * 0.15));
        spine.add(d);
        const dq = d.quaternion;
        [-1, 1].forEach(s => {
          const a = new THREE.Vector3(0, 0, -k * 0.62).applyQuaternion(dq).add(pd);
          const b = new THREE.Vector3(s * k * 1.05, -gap * 1.6, -k * 0.35).applyQuaternion(dq).add(pd);
          const c = new THREE.Vector3(s * k * 1.65, -gap * 3.6, -k * 0.05).applyQuaternion(dq).add(pd);
          const root = add(r, new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, b, c), 10, k * 0.045, 6), nerveMat));
          spine.add(root);
          if (i === Math.floor(n / 2) && s === 1) { anchors[r].root = b.clone(); anchors[r].disc = new THREE.Vector3(0, 0, k * 0.95).applyQuaternion(dq).add(pd); }
        });
        dist += gap;
      }
    }
  });

  /* sacrum, coccyx and a stylised pelvic ring */
  {
    const r = 'legen';
    const mB = bone(); mB.emissive.set(COLORS[r]); mats[r].push(mB);
    const u = Math.min(0.985, (dist + 1.05) / LEN);
    const p = curve.getPointAt(u), t = curve.getTangentAt(u);
    const sh = new THREE.Shape();
    sh.moveTo(-1.05, 1.1); sh.lineTo(1.05, 1.1); sh.quadraticCurveTo(1.0, 0.0, 0.3, -1.15); sh.lineTo(-0.3, -1.15); sh.quadraticCurveTo(-1.0, 0.0, -1.05, 1.1);
    const sac = add(r, new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3, curveSegments: 16 }), mB));
    const g = new THREE.Group(); g.position.copy(p); g.quaternion.setFromUnitVectors(up, t.clone().negate());
    sac.position.set(0, 0, -0.25); g.add(sac);
    const cocc = [];
    for (let j = 0; j < 4; j++) {
      const c = add(r, new THREE.Mesh(new THREE.SphereGeometry(0.2 - j * 0.035, 16, 12), mB));
      c.position.set(0, -1.35 - j * 0.32, 0.05 + j * 0.06); g.add(c); cocc.push(c);
    }
    spine.add(g); g.updateMatrix();
    anchors[r] = {
      sacrum: new THREE.Vector3(0.6, 0.3, 0.6).applyMatrix4(g.matrix),
      coccyx: new THREE.Vector3(0, -2.2, 0.2).applyMatrix4(g.matrix),
      joint: new THREE.Vector3(1.0, 0.7, 0.1).applyMatrix4(g.matrix)
    };
    cordPts.push(new THREE.Vector3(0, 0.6, -0.1).applyMatrix4(g.matrix));
  }

  /* spinal cord through the canals */
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 220, 0.15, 10), cordMat);
  spine.add(cord);

  /* centre the column */
  const box = new THREE.Box3().setFromObject(spine);
  const centre = box.getCenter(new THREE.Vector3());
  spine.children.forEach(c => c.position.sub(centre));
  Object.values(anchors).forEach(a => Object.values(a).forEach(v => v.sub(centre)));
  const regionY = { boyun: anchors.boyun.body.y, sirt: anchors.sirt.body.y, bel: anchors.bel.body.y, legen: anchors.legen.sacrum.y - 0.5 };

  /* camera stops: [target y, distance, spine yaw] */
  const STOPS = [
    { y: 0, d: 38, yaw: null },
    { y: regionY.boyun, d: 12, yaw: -0.95, r: 'boyun' },
    { y: regionY.sirt, d: 16, yaw: -1.25, r: 'sirt' },
    { y: regionY.bel, d: 13, yaw: -1.0, r: 'bel' },
    { y: regionY.legen, d: 14, yaw: -0.55, r: 'legen' },
    { y: 0, d: 40, yaw: null }
  ];

  /* hotspot labels */
  const spotEls = {};
  ORDER.forEach(r => {
    spotEls[r] = REGIONS[r].spots.map(([k, label]) => {
      const el = document.createElement('span');
      el.className = 'spot'; el.innerHTML = `<i></i>${label}`;
      hotBox.appendChild(el);
      return { el, v: anchors[r][k] };
    });
  });

  /* overview: the four regions named beside the column, each in its colour */
  const regLabs = ORDER.map(k => {
    const el = document.createElement('span');
    el.className = 'spot reg'; el.style.setProperty('--c', COLORS[k]);
    el.innerHTML = `<i></i>${REGIONS[k].title}`;
    hotBox.appendChild(el);
    return { el, v: new THREE.Vector3(3.0, regionY[k], 0) };
  });
  navBtns.forEach(b => { const k = ORDER[+b.dataset.go - 1]; if (k) b.style.setProperty('--c', COLORS[k]); });
  const spineH = new THREE.Box3().setFromObject(spine).getSize(new THREE.Vector3()).y;

  /* sizing */
  let W = 1, H = 1, wide = true;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight; wide = W > 900;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    // overview distance: the whole column between the bar and the region buttons (phones: above the text panel)
    const room = wide ? (H - 64 - 96) / H : 0.34;
    const fit = (spineH / 2 + 0.8) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / room;
    STOPS[0].d = fit; STOPS[5].d = fit * 0.94;
    STOPS[0].y = STOPS[5].y = wide ? 0.6 : 0;
  }
  addEventListener('resize', resize); resize();

  /* scroll → progress through the stops */
  const N = STOPS.length - 1;
  function progress() {
    const r = tour.getBoundingClientRect();
    const span = r.height - innerHeight;
    return Math.min(1, Math.max(0, -r.top / span));
  }
  const ease = x => x * x * (3 - 2 * x);
  const hold = f => ease(Math.min(1, Math.max(0, (f - 0.3) / 0.4)));   // each stop holds before travelling on
  const lerp = (a, b, f) => a + (b - a) * f;

  let s = 0, sSmooth = 0, yaw = 0, spin = 0, hover = null, active = null;
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function setActive(r) {
    if (r === active) return;
    active = r;
    ORDER.forEach(k => mats[k].forEach(m => { m.userData.target = k === r ? 1 : 0; }));
  }

  /* picking */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pick(ev) {
    const b = canvas.getBoundingClientRect();
    ptr.set(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.region : null;
  }
  function go(i) {
    const top = tour.getBoundingClientRect().top + scrollY;
    const y = top + (tour.offsetHeight - innerHeight) * (i / N);
    if (window.lenis) window.lenis.scrollTo(y, { duration: 1.6 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  canvas.addEventListener('pointermove', ev => { hover = pick(ev); canvas.style.cursor = hover ? 'pointer' : ''; });
  canvas.addEventListener('pointerleave', () => { hover = null; });
  canvas.addEventListener('click', ev => { const r = pick(ev); if (!r) return; if (reduce) document.querySelector(`.stop[data-r="${r}"]`).scrollIntoView(); else go(ORDER.indexOf(r) + 1); });
  navBtns.forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
  window.spineGo = r => go(ORDER.indexOf(r) + 1);

  /* render only while the tour is on screen */
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(tour);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    s = reduce ? 0 : progress() * N;
    sSmooth = reduce ? s : lerp(sSmooth, s, 1 - Math.pow(0.0015, dt));
    const i = Math.min(N - 1, Math.floor(sSmooth)), f = hold(sSmooth - i);
    const A = STOPS[i], B = STOPS[i + 1];

    // yaw: overview spins slowly, region stops turn the column to a three-quarter view
    spin += dt * (reduce ? 0 : 0.18);
    const yA = A.yaw ?? spin, yB = B.yaw ?? spin;
    yaw = lerp(yA, yB, f);
    spine.rotation.y = yaw;

    const ty = lerp(A.y, B.y, f), d = lerp(A.d * (A.r && !wide ? 1.35 : 1), B.d * (B.r && !wide ? 1.35 : 1), f);
    camTgt.set(0, ty, 0);
    scene.fog.near = d + 12; scene.fog.far = d + 70;   // fog follows the camera so a far overview is never washed out
    camPos.set(0, ty + d * 0.08, d);
    // a slow drift so held frames breathe
    camPos.x += Math.sin(clock.elapsedTime * 0.25) * 0.35;
    camera.position.copy(camPos); camera.lookAt(camTgt);

    // push the subject to the right of the text on wide screens, up on phones
    if (wide) camera.setViewOffset(W, H, -W * 0.2, 0, W, H);
    else camera.setViewOffset(W, H, 0, H * 0.25, W, H);

    // which stop are we at
    const near = Math.round(s), off = Math.abs(s - near);   // text follows the scroll exactly; the camera eases behind it
    const stopR = STOPS[near].r || null;
    const overview = reduce || !stopR;
    ORDER.forEach(k => mats[k].forEach(m => {
      m.userData.target = hover === k ? 1 : off < 0.35 ? (overview ? 0.55 : stopR === k ? 1 : 0.06) : 0.3;
    }));
    if (!reduce) stops.forEach((el, k) => {
      const o = k === near ? Math.max(0, 1 - off / 0.28) : 0;
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${((1 - o) * (k < near ? -24 : 24)).toFixed(1)}px)`;
      el.style.visibility = o > 0.02 ? 'visible' : 'hidden';
      el.toggleAttribute('inert', o < 0.5);
    });
    navBtns.forEach((b, k) => b.classList.toggle('on', k === (near === 5 ? 0 : near)));
    document.documentElement.style.setProperty('--tour', (s / N).toFixed(3));

    // glow the chosen region
    ORDER.forEach(k => mats[k].forEach(m => {
      const tgt = m.userData.target || 0;
      m.userData.v = lerp(m.userData.v || 0, tgt, 1 - Math.pow(0.002, dt));
      if (!m.userData.base) { m.userData.base = m.color.clone(); m.userData.tint = new THREE.Color(COLORS[k]); }
      m.color.lerpColors(m.userData.base, m.userData.tint, m.userData.v * (m.isMeshPhysicalMaterial ? 0.95 : 0.85));
      m.emissiveIntensity = m.userData.v * (m.isMeshPhysicalMaterial ? 0.5 : 0.22);
    }));

    renderer.render(scene, camera);

    // region names in the overview
    const showReg = overview && (reduce || off < 0.25);
    regLabs.forEach(({ el, v }) => {
      if (!showReg) { el.style.opacity = '0'; return; }
      tmp.copy(v).project(camera);
      el.style.opacity = '1';
      el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px, ${((1 - tmp.y) / 2 * H).toFixed(1)}px)`;
    });

    // hotspot labels follow their anchors
    ORDER.forEach(k => {
      const show = stopR === k && off < 0.25;
      spotEls[k].forEach(({ el, v }) => {
        if (!show) { el.style.opacity = '0'; return; }
        tmp.copy(v).applyAxisAngle(up, spine.rotation.y).project(camera);
        el.style.opacity = '1';
        el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px, ${((1 - tmp.y) / 2 * H).toFixed(1)}px)`;
      });
    });
  }
  frame();
}
