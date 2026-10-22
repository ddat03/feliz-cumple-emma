/* =========================================================
   PIXEL — paisaje estilo videojuego retro, personajes e íconos
   Todo se dibuja en un canvas de baja resolución y se escala
   con image-rendering: pixelated.
   ========================================================= */
(function () {
  'use strict';

  var PALETA = {
    k: '#2b1b33', h: '#2a1c1c', H: '#5a3a30', s: '#f0b48c', S: '#cf8a63', e: '#1d1420',
    w: '#ffffff', l: '#dff0ff', c: '#f58ea0', m: '#b8435a',
    j: '#2f2f42', J: '#4c4c68', r: '#e2384d', p: '#3e6fc4', P: '#2c4f94', b: '#1d1420',
    g: '#a07ac8', t: '#ff6fae', T: '#d94a8c', f: '#fff4fb', F: '#f3c6dd', z: '#ff9ccb'
  };

  // personajes (relleno; el contorno se agrega solo)
  var PAPA = [
    '...hhhhh...',
    '.hhhhhhhhh.',
    'hhhhHHhhhhh',
    'hhhhhhhhhhh',
    'hhsssssshhh',
    'hsssssssssh',
    'hssesssessh',
    'hssesssessh',
    '.sssssssss.',
    '.SsssmsssS.',
    '..SSSSSSS..',
    '....sss....',
    '..jjjrjjj..',
    '.jjjjrjjjj.',
    'jjjjjrjjjjj',
    'jJjjjrjjjJj',
    'jJjjjrjjjJj',
    'sjjjjrjjjjs',
    '..jjjjjjj..',
    '..ppppppp..',
    '..ppp.ppp..',
    '..ppp.ppp..',
    '..PPp.pPP..',
    '..ppp.ppp..',
    '.bbbb.bbbb.'
  ];
  var EMMA = [
    '...hhhhh...',
    '.hhhhhhhhh.',
    'hhhHHhhhhhh',
    'hhhhhhhhhhh',
    'hhsssssssHh',
    'hsgggsgggsh',
    'hglegsgelgh',
    'hsgggsgggsh',
    'hcsssmsssch',
    'hhssssssshh',
    'hh..sss..hh',
    'hhtttzttthh',
    'httttztttth',
    'sTttttttTTs',
    '.fFfffffFf.',
    'fffFfffFfff',
    '.fffffffff.',
    '...ss.ss...',
    '...ss.ss...',
    '..ttt.ttt..'
  ];

  function contornear(filas, color) {
    var h = filas.length, w = 0;
    filas.forEach(function (f) { w = Math.max(w, f.length); });
    var g = [];
    for (var y = 0; y < h + 2; y++) { g.push([]); for (var x = 0; x < w + 2; x++) g[y].push('.'); }
    filas.forEach(function (f, y) { for (var x = 0; x < f.length; x++) g[y + 1][x + 1] = f.charAt(x); });
    var out = g.map(function (r) { return r.slice(); });
    for (var y2 = 0; y2 < h + 2; y2++) for (var x2 = 0; x2 < w + 2; x2++) {
      if (g[y2][x2] !== '.') continue;
      var vecino = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) {
        var yy = y2 + d[1], xx = x2 + d[0];
        return yy >= 0 && yy < h + 2 && xx >= 0 && xx < w + 2 && g[yy][xx] !== '.';
      });
      if (vecino) out[y2][x2] = color || 'k';
    }
    return out;
  }

  function pintarGrilla(ctx, grilla, x0, y0, paleta, reemplazos) {
    paleta = paleta || PALETA;
    for (var y = 0; y < grilla.length; y++) for (var x = 0; x < grilla[y].length; x++) {
      var ch = grilla[y][x];
      if (reemplazos && reemplazos[ch]) ch = reemplazos[ch];
      if (ch === '.') continue;
      ctx.fillStyle = paleta[ch] || ch;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }

  var SPR_PAPA = contornear(PAPA), SPR_EMMA = contornear(EMMA);

  /* ---------- utilidades de dibujo ---------- */
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function aleatorio(semilla) {
    var s = semilla || 7;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function nube(rnd, ancho) {
    var alto = Math.round(ancho * 0.45), g = [];
    var bolas = [[0.22, 0.62, 0.3], [0.45, 0.42, 0.4], [0.7, 0.55, 0.32], [0.85, 0.7, 0.22]];
    for (var y = 0; y < alto; y++) {
      g.push([]);
      for (var x = 0; x < ancho; x++) {
        var dentro = bolas.some(function (b) {
          var dx = (x / ancho - b[0]) * ancho, dy = (y / alto - b[1]) * alto;
          return dx * dx + dy * dy * 1.6 < Math.pow(b[2] * ancho * 0.62, 2);
        }) && y < alto - 1;
        g[y].push(dentro ? (y > alto * 0.6 ? 'N' : (y < alto * 0.3 ? 'W' : 'n')) : '.');
      }
    }
    return contornear(g.map(function (r) { return r.join(''); }), 'O');
  }
  var PAL_NUBE = { W: '#ffffff', n: '#f3eeff', N: '#c9bff5', O: '#8f86d6' };

  function mezclarColores(colores, t, x, y) {
    var u = Math.max(0, Math.min(0.9999, t)) * (colores.length - 1);
    var i = Math.floor(u), f = u - i;
    return f * 16 > BAYER[y & 3][x & 3] ? colores[Math.min(i + 1, colores.length - 1)] : colores[i];
  }

  /* ---------- escena ---------- */
  var VARIANTES = {
    atardecer: {
      cielo: ['#6fa8c9', '#93b4d2', '#c6a6c9', '#eaa3b6', '#f8b79d', '#ffd58f'],
      sol: true, montLejos: '#c993b8', montCerca: '#9c6b9f', arboles: '#6d4c7d', arbolesOsc: '#553a68'
    },
    rosa: {
      cielo: ['#d58cb4', '#e09bbf', '#eab0cb', '#f3c3d6', '#f9d4df'],
      sol: false, montLejos: '#c48ab5', montCerca: '#a8739f', arboles: '#8a5a8e', arbolesOsc: '#6f467a'
    }
  };

  function crearEscena(canvas, opciones) {
    opciones = opciones || {};
    var v = VARIANTES[opciones.variante] || VARIANTES.atardecer;
    var ctx = canvas.getContext('2d');
    var fondo = document.createElement('canvas'), fctx = fondo.getContext('2d');
    var W = 0, H = 0, suelo = 0, nubes = [], parpadeo = 0, t0 = performance.now(), activo = true, ultimo = 0;
    var animar = opciones.animar !== false && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

    function medir() {
      var cw = canvas.clientWidth || window.innerWidth, ch = canvas.clientHeight || window.innerHeight;
      var P = Math.max(3, Math.round(Math.min(cw, ch * 1.2) / (opciones.pixelesAncho || 92)));
      W = Math.ceil(cw / P); H = Math.ceil(ch / P);
      canvas.width = fondo.width = W; canvas.height = fondo.height = H;
      suelo = Math.round(H * (opciones.suelo || 0.8));
      dibujarFondo();
      var rnd = aleatorio(11);
      nubes = [];
      var cantidad = Math.max(3, Math.round(W / 26));
      for (var i = 0; i < cantidad; i++) {
        nubes.push({ spr: nube(rnd, 14 + Math.round(rnd() * 12)), x: rnd() * W, y: 2 + rnd() * suelo * 0.42, vel: 0.6 + rnd() * 1.2 });
      }
    }

    function dibujarFondo() {
      var rnd = aleatorio(3), x, y;
      var horizonte = Math.round(suelo * 0.78);
      // cielo con tramado
      for (y = 0; y < suelo; y++) for (x = 0; x < W; x++) {
        fctx.fillStyle = mezclarColores(v.cielo, y / horizonte, x, y);
        fctx.fillRect(x, y, 1, 1);
      }
      // montañas
      function cordillera(base, alto, color, sem, nieve) {
        var r2 = aleatorio(sem), f1 = 0.06 + r2() * 0.05, f2 = 0.17 + r2() * 0.08, fase = r2() * 9;
        for (x = 0; x < W; x++) {
          var hgt = alto * (0.55 + 0.3 * Math.sin(x * f1 + fase) + 0.15 * Math.abs(Math.sin(x * f2 + fase * 2)));
          var top = Math.round(base - hgt);
          for (y = top; y < suelo; y++) {
            fctx.fillStyle = (nieve && y < top + 2 && hgt > alto * 0.75) ? '#f6e6f2' : color;
            fctx.fillRect(x, y, 1, 1);
          }
        }
      }
      cordillera(horizonte + 2, Math.min(suelo * 0.3, W * 0.2), v.montLejos, 5, true);
      // sol
      if (v.sol) {
        var cx = Math.round(W * 0.62), cy = horizonte - 1, R = Math.max(7, Math.round(Math.min(W, H) * 0.13));
        for (y = cy - R - 3; y <= cy; y++) for (x = cx - R - 3; x <= cx + R + 3; x++) {
          var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          if (d <= R) {
            if (y > cy - R * 0.45 && (cy - y) % 3 === 0) continue; // franjas retro
            fctx.fillStyle = d < R * 0.6 ? '#fff4c8' : '#ffe08a';
            fctx.fillRect(x, y, 1, 1);
          } else if (d <= R + 2 && BAYER[y & 3][x & 3] < 6) {
            fctx.fillStyle = '#ffd6a0'; fctx.fillRect(x, y, 1, 1);
          }
        }
      }
      cordillera(horizonte + 6, Math.min(suelo * 0.18, W * 0.12), v.montCerca, 9, false);
      // pinos
      function pino(px, alto, color) {
        for (var k = 0; k < alto; k++) {
          var mitad = Math.floor((k / alto) * alto * 0.36) + (k % 3 === 2 ? 1 : 0);
          fctx.fillStyle = color;
          fctx.fillRect(px - mitad, suelo - alto + k, mitad * 2 + 1, 1);
        }
      }
      for (x = -2; x < W + 2; x += 3 + Math.round(rnd() * 4)) pino(x, 7 + Math.round(rnd() * 10), rnd() < 0.5 ? v.arboles : v.arbolesOsc);
      // pasto y tierra
      for (x = 0; x < W; x++) {
        var tope = suelo - (rnd() < 0.25 ? 1 : 0);
        for (y = tope; y < H; y++) {
          var dy = y - suelo, col;
          if (dy < 0) col = '#5df05d';
          else if (dy < 2) col = ((x >> 1) + (y >> 1)) % 2 ? '#3fd84a' : '#2fbf3c';
          else if (dy < 4) col = ((x >> 1) + (y >> 1)) % 2 ? '#26a535' : '#1f8a2e';
          else if (dy === 4) col = '#3a2347';
          else {
            var bloque = ((x >> 1) + (y >> 1)) % 2;
            col = bloque ? '#a65a2a' : '#8b4a24';
            if (BAYER[y & 3][x & 3] === 0 && rnd() < 0.5) col = '#6e3a1c';
          }
          fctx.fillStyle = col; fctx.fillRect(x, y, 1, 1);
        }
      }
      // florecitas sobre el pasto
      for (x = 2; x < W - 2; x += 4 + Math.round(rnd() * 7)) {
        fctx.fillStyle = ['#ffffff', '#ffd34d', '#ff8fc8', '#b56bff'][Math.floor(rnd() * 4)];
        fctx.fillRect(x, suelo - 1, 1, 1);
      }
      // decoración: girasol y hongo
      if (opciones.decoracion !== false) {
        girasol(Math.round(W * 0.74), suelo);
        hongo(Math.round(W * 0.86), suelo);
      }
    }

    function girasol(x, base) {
      fctx.fillStyle = '#2f9e44';
      fctx.fillRect(x, base - 9, 1, 9);
      fctx.fillRect(x - 2, base - 4, 2, 1); fctx.fillRect(x + 1, base - 6, 2, 1);
      var pet = [[0, -3], [-1, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2], [-2, 1], [2, 1], [-1, -3], [1, -3]];
      fctx.fillStyle = '#ffcc1f';
      pet.forEach(function (p) { fctx.fillRect(x + p[0], base - 12 + p[1], 1, 1); });
      fctx.fillStyle = '#7a3f12';
      fctx.fillRect(x - 1, base - 13, 3, 3);
    }
    function hongo(x, base) {
      var cap = ['..rrrrr..', '.rrwrrrr.', 'rrrrrwrrr', 'rwrrrrrwr', 'rrrrrrrrr', '..sssss..', '..sssss..', '..sssss..'];
      pintarGrilla(fctx, contornear(cap), x - 5, base - 9, { r: '#e8343f', w: '#ffffff', s: '#f6e7d0', k: '#3a1d2b' });
    }

    function personajes(reloj) {
      if (opciones.personajes === false) return;
      var x0 = Math.round(W * (opciones.xPersonajes || 0.06));
      var bob1 = Math.floor(reloj * 2) % 2, bob2 = Math.floor(reloj * 2 + 1) % 2;
      pintarGrilla(ctx, SPR_PAPA, x0, suelo - SPR_PAPA.length + 1 + bob1);
      var parpadea = (reloj % 3.4) < 0.15;
      pintarGrilla(ctx, SPR_EMMA, x0 + 13, suelo - SPR_EMMA.length + 1 + bob2, null, parpadea ? { e: 'l' } : null);
    }

    function cuadro(ahora) {
      if (!activo) return;
      if (animar) requestAnimationFrame(cuadro);
      if (ahora - ultimo < 80) return; // ~12 fps, se siente retro
      var dt = Math.min(0.2, (ahora - (ultimo || ahora)) / 1000);
      ultimo = ahora;
      var reloj = (ahora - t0) / 1000;
      ctx.drawImage(fondo, 0, 0);
      nubes.forEach(function (n) {
        n.x += n.vel * dt;
        if (n.x > W + 2) n.x = -n.spr[0].length - 2;
        pintarGrilla(ctx, n.spr, Math.round(n.x), Math.round(n.y), PAL_NUBE);
      });
      personajes(reloj);
    }

    medir();
    var rz;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { medir(); ultimo = 0; cuadro(performance.now()); }, 200); });
    cuadro(performance.now() + 100);
    if (!animar) { ultimo = 0; cuadro(performance.now() + 100); }
    return {
      detener: function () { activo = false; },
      reanudar: function () { if (!activo) { activo = true; if (animar) requestAnimationFrame(cuadro); } }
    };
  }

  /* ---------- íconos del menú (se devuelven como dataURL) ---------- */
  function icono(nombre) {
    var c = document.createElement('canvas'), n = 20;
    c.width = c.height = n;
    var g = c.getContext('2d'), x, y;
    function px(xx, yy, col) { g.fillStyle = col; g.fillRect(xx, yy, 1, 1); }
    if (nombre === 'disco') {
      var arco = ['#ff4fa3', '#ffd34d', '#5df05d', '#36d6c3', '#6fa8ff', '#b56bff'];
      for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
        var dx = x - 9.5, dy = y - 9.5, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
        if (d > 9.3) continue;
        if (d > 8.4) px(x, y, '#2b1b33');
        else if (d < 1.6) continue;
        else if (d < 2.6) px(x, y, '#2b1b33');
        else if (d < 3.6) px(x, y, '#e9e4f5');
        else px(x, y, arco[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 6) % 6]);
      }
    } else if (nombre === 'sobre') {
      for (y = 4; y < 16; y++) for (x = 1; x < 19; x++) {
        var borde = y === 4 || y === 15 || x === 1 || x === 18;
        var diag = (y - 4) === Math.abs(x - 9.5) * 0.75 | 0 && y < 12;
        px(x, y, borde ? '#2b1b33' : diag ? '#b04a6a' : '#e6a0b3');
      }
      for (x = 2; x < 18; x++) { y = 5 + Math.round(Math.abs(x - 9.5) * -0.75 + 7); if (y > 5 && y < 15) px(x, y, '#b04a6a'); }
      [[8, 9], [9, 9], [10, 9], [11, 9], [8, 10], [9, 10], [10, 10], [11, 10], [9, 11], [10, 11], [8, 8], [11, 8]].forEach(function (p) { px(p[0], p[1], '#e8343f'); });
    } else if (nombre === 'corazon') {
      pintarGrilla(g, contornear(['.xx...xx.', 'xwwx.xxxx', 'xwxxxxxxx', 'xxxxxxxxx', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '...xxx...', '....x....']),
        4, 5, { x: '#ff3d7f', w: '#ffd6e6', k: '#2b1b33' });
    } else if (nombre === 'claqueta') {
      for (y = 7; y < 18; y++) for (x = 2; x < 18; x++) px(x, y, (y === 7 || y === 17 || x === 2 || x === 17) ? '#2b1b33' : '#3d3552');
      for (y = 3; y < 7; y++) for (x = 2; x < 18; x++) {
        var franja = Math.floor((x + (y - 3)) / 3) % 2;
        px(x, y, (y === 3 || y === 6 || x === 2 || x === 17) ? '#2b1b33' : franja ? '#ffffff' : '#2b1b33');
      }
      for (y = 10; y < 15; y++) for (x = 8; x < 8 + (y < 12.5 ? (y - 9) * 2 : (15 - y) * 2); x++) px(x, y, '#ffd34d');
    } else if (nombre === 'ruleta') {
      var sect = ['#ff4fa3', '#ffd34d', '#36d6c3', '#b56bff', '#ff8f3d', '#6fa8ff', '#5df05d', '#ff8fc8'];
      for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
        var ddx = x - 9.5, ddy = y - 10.5, dd = Math.sqrt(ddx * ddx + ddy * ddy), aa = Math.atan2(ddy, ddx);
        if (dd > 8.6) continue;
        if (dd > 7.6) px(x, y, '#2b1b33');
        else if (dd < 1.6) px(x, y, '#ffffff');
        else px(x, y, sect[Math.floor(((aa + Math.PI) / (Math.PI * 2)) * 8) % 8]);
      }
      for (y = 0; y < 4; y++) for (x = 9 - (3 - y); x <= 10 + (3 - y) - 1; x++) px(x, y, y === 0 ? '#2b1b33' : '#e8343f');
    } else if (nombre === 'regalo') {
      for (y = 8; y < 18; y++) for (x = 3; x < 17; x++) px(x, y, (y === 8 || y === 17 || x === 3 || x === 16) ? '#2b1b33' : (x === 9 || x === 10) ? '#ffd34d' : '#b56bff');
      for (y = 6; y < 9; y++) for (x = 2; x < 18; x++) px(x, y, (y === 6 || x === 2 || x === 17) ? '#2b1b33' : (x === 9 || x === 10) ? '#ffd34d' : '#d08bff');
      [[6, 3], [7, 3], [5, 4], [8, 4], [6, 5], [7, 5], [8, 5], [12, 3], [13, 3], [11, 4], [14, 4], [11, 5], [12, 5], [13, 5]].forEach(function (p) { px(p[0], p[1], '#ffd34d'); });
    }
    return c.toDataURL();
  }

  /* corazón de vida en SVG */
  function corazonSVG(lleno) {
    var g = contornear(['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...']);
    if (lleno) g[2][2] = 'w';
    var col = { k: '#2b1b33', x: lleno ? '#ff3d6e' : '#7d6a86', w: '#ffd0dc' }, r = '';
    g.forEach(function (fila, y) { fila.forEach(function (ch, x) {
      if (ch !== '.') r += '<rect x="' + x + '" y="' + y + '" width="1.04" height="1.04" fill="' + col[ch] + '"/>';
    }); });
    return '<svg viewBox="0 0 9 8" aria-hidden="true" shape-rendering="crispEdges">' + r + '</svg>';
  }

  window.Pixel = { crearEscena: crearEscena, icono: icono, corazonSVG: corazonSVG };
})();
