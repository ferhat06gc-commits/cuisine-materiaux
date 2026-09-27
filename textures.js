/* Fabrique de matières procédurales : bruit de valeur périodique, carte de
   relief dérivée par Sobel, carte de rugosité. Aucune image externe. */
import * as THREE from 'three';

const P = 256;                                   /* période : les textures se raccordent */
function h2(ix, iy, seed) {
  ix = ((ix % P) + P) % P; iy = ((iy % P) + P) % P;
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = h2(x0, y0, seed), b = h2(x0 + 1, y0, seed);
  const c = h2(x0, y0 + 1, seed), d = h2(x0 + 1, y0 + 1, seed);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}
export function fbm(x, y, seed, oct = 5, gain = 0.5) {
  let s = 0, amp = 1, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += amp * vnoise(x * f, y * f, seed + i * 17); norm += amp; amp *= gain; f *= 2; }
  return s / norm;
}

function canvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }

function normalFromHeight(height, size, strength) {
  const c = canvas(size), g = c.getContext('2d'), img = g.createImageData(size, size);
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
    const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * size + x) * 4;
    img.data[i] = (dx / l * 0.5 + 0.5) * 255;
    img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255;
    img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* opts : base [r,g,b] 0-255, mottle, grain, relief, roughBase, roughVar, seed,
          scale (fréquence du grain), veines (pour le bois) */
export function matiere(opts) {
  const S = opts.size || 512;
  const col = canvas(S), cg = col.getContext('2d'), cimg = cg.createImageData(S, S);
  const rgh = canvas(S), rg = rgh.getContext('2d'), rimg = rg.createImageData(S, S);
  const height = new Float32Array(S * S);
  const sc = (opts.scale || 8) * P / S;
  const [br, bg, bb] = opts.base;

  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S * P, v = y / S * P;
    let big = fbm(u * 0.05, v * 0.05, opts.seed, 4);            /* taches larges */
    let fine = fbm(u * sc, v * sc, opts.seed + 101, 4);          /* grain */
    let micro = vnoise(u * sc * 4, v * sc * 4, opts.seed + 7);   /* micro-grain */

    if (opts.carrelage) {                                        /* faïence : carreaux + joints */
      const n = opts.carrelage, cw = P / n;
      const cu = Math.floor(u / cw), cv = Math.floor(v / cw);
      const ju = Math.min(u % cw, cw - (u % cw)), jv = Math.min(v % cw, cw - (v % cw));
      const joint = Math.min(ju, jv) < 1.6 ? 1 : 0;
      const tint = (h2(cu, cv, opts.seed + 3) - 0.5);
      big = 0.5 + tint * 0.55;
      fine = joint ? 0.06 : 0.5 + (fine - 0.5) * 0.25;
      if (joint) { big = 0.5 - 0.30; }
    }

    if (opts.planches) {                                         /* sol : lames de bois */
      const pw = P / 6, row = Math.floor(v / pw);
      const off = (row * 37) % P;
      big = fbm((u + off) * 0.6, v * 0.04, opts.seed + row * 13, 4);
      const edge = Math.min((v % pw) / 3, (pw - (v % pw)) / 3, 1);
      fine = fine * 0.5 + (1 - edge) * 0.5;
    }

    const k = (big - 0.5) * (opts.mottle || 0) + (fine - 0.5) * (opts.grain || 0) + (micro - 0.5) * (opts.micro || 0);
    const i = (y * S + x) * 4;
    cimg.data[i]     = Math.max(0, Math.min(255, br * (1 + k)));
    cimg.data[i + 1] = Math.max(0, Math.min(255, bg * (1 + k)));
    cimg.data[i + 2] = Math.max(0, Math.min(255, bb * (1 + k)));
    cimg.data[i + 3] = 255;

    const r = Math.max(0, Math.min(1, (opts.roughBase ?? 0.9) + (fine - 0.5) * (opts.roughVar || 0.2)));
    rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = r * 255;
    rimg.data[i + 3] = 255;

    height[y * S + x] = fine * 0.75 + micro * 0.25 + big * 0.2;
  }
  cg.putImageData(cimg, 0, 0);
  rg.putImageData(rimg, 0, 0);
  const nrm = normalFromHeight(height, S, opts.relief ?? 12);

  const mk = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: mk(col, true), roughnessMap: mk(rgh, false), normalMap: mk(nrm, false) };
}

export function materiau(opts) {
  const t = matiere(opts);
  const rep = opts.repeat || [1, 1];
  for (const k of ['map', 'roughnessMap', 'normalMap']) t[k].repeat.set(rep[0], rep[1]);
  return new THREE.MeshStandardMaterial({
    map: t.map, roughnessMap: t.roughnessMap, normalMap: t.normalMap,
    normalScale: new THREE.Vector2(opts.normalScale ?? 1, opts.normalScale ?? 1),
    roughness: 1, metalness: 0, color: 0xffffff
  });
}

/* Ciel dégradé équirectangulaire -> éclairage d'environnement (IBL) */
export function cielEnv(renderer, haut, bas, soleil) {
  const W = 512, H = 256, c = canvas(W); c.height = H;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, haut); grad.addColorStop(0.52, bas); grad.addColorStop(1, '#3B3026');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  const sg = g.createRadialGradient(W * 0.72, H * 0.22, 4, W * 0.72, H * 0.22, 90);
  sg.addColorStop(0, soleil); sg.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = sg; g.fillRect(0, 0, W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}
