// src/SoundEffects.js
const zzfxX = new (window.AudioContext || window.webkitAudioContext)();
const zzfxR = 44100;

// Boosted ZzFX Play Function
const zzfx = (...t) => {
  let e = zzfxX.createBufferSource(), f = zzfxX.createBuffer(t.length, t[0].length, zzfxR);
  t.map((d, i) => f.getChannelData(i).set(d));
  e.buffer = f;
  
  // ADDED: Gain Node for extra punch
  let gain = zzfxX.createGain();
  gain.gain.value = 2.0; // Double the master output volume
  
  e.connect(gain);
  gain.connect(zzfxX.destination);
  e.start();
  return e;
};

const zzfxG = (q = 1, k = 0.05, t = 220, e = 0, f = 0, h = 0.1, p = 0, q2 = 1, m = 0, s = 0, r = 0, d = 0, g = 0, v = 0, l = 0, j = 0, u = 0, a = 1, n = 0, b = 0) => {
  let b2 = 2 * Math.PI, h2 = zzfxR, z = (q *= h2) + (f *= h2) + (h *= h2) + (p *= h2) + (q2 *= h2), j2 = 0, k2 = 0, m2 = 0, n2 = 0, p2 = 0, q3 = 0, r2 = 0, t2 = b2 * t / h2, u2 = b2 * m / h2, v2 = 0, w = 0, x = 0, y = new Float32Array(z);
  for (f = 0; f < z; ++f) { if (++r2 > (d ? d * h2 : 500)) { r2 = 0; d = (d ? d : 500); t2 += b2 * g / h2; u2 += b2 * v / h2; } if (f < q) j2 = f / q; else if (f < q + f) j2 = 1 - (f - q) / f * (1 - k); else if (f < q + f + h) j2 = k; else if (f < q + f + h + p) j2 = k * (1 - (f - q - f - h) / p); else j2 = 0; if (f >= q + f + h + p + q2) j2 = 0; w += t2 += b2 * e / h2; x += u2 += b2 * s / h2; v2 += Math.cos(x); y[f] = j2 * a * (f < q ? f / q : 1) * (j ? (j > 0 ? (f / z < j ? 0 : 1) : (f / z > 1 + j ? 0 : 1)) : 1) * (u ? Math.cos(w + u * Math.sin(v2)) : Math.cos(w)) * Math.sin(v2 * n2); }
  return y;
};

export const playSFX = (type) => {
    if (zzfxX.state === 'suspended') zzfxX.resume();

    switch (type) {
        case "explode":
            // Volume bumped to 5.0
            zzfx(zzfxG(...[5.0,,78,.05,.13,.43,4,2.6,-5,8,,,,1.6,4.6,.8,.16,.3,.13]));
            break;
        case "hit":
            // Volume bumped to 4.0
            console.log("play hit sound")
            zzfx(zzfxG(...[4.0,,274,.02,.06,.19,4,2.4,,-2,,,.01,1.1,,.2,,.83,.02,.11]));
            break;
        case "jump":
            // Volume bumped to 4.0
            zzfx(zzfxG(...[4.0,,267,.02,.02,.05,1,2.3,,110,,,,,,.1,.01,.67,.03,,113]));
            break;
    }
};