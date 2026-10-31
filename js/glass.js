/* ==========================================================================
   EGE Football — liquid glass
   Sam's look for the Cards tab island (2026-10-31), after the example he
   sent, github.com/samasante/liquid-glass (MIT, Sam Asante): clear glass
   that bends the page behind it at its rim rather than a tinted or frosted
   pane. The technique is that library's "material" mode, rewritten here
   without React and for one element:

   - The element's own rounded-rect shape is drawn as a signed-distance
     field into a displacement map, one canvas pixel per CSS pixel. Red and
     green are how far to push the page in x and y (128 is not at all), blue
     is a highlight: a bright band along the edge that pools in the corners
     facing the light (top left and bottom right) and a soft glow inside.
   - An SVG filter runs the page behind the element through that map three
     times, red, green and blue a little apart (the colour fringing at the
     edge of real glass), and adds the highlight on top.
   - The filter goes on as backdrop-filter: blur() saturate() url(#…).

   Only Chrome and Edge (Blink) bend what is behind an element with
   backdrop-filter: url(). Safari and Firefox would throw out the whole
   backdrop-filter for having it in, so they are left with the blur and the
   edge site.css draws, and never get the url(). Blink is told apart the
   way the library does it, by navigator.userAgentData, which only Blink has
   (and no browser on an iPhone, all of which are Safari underneath).

   Markup: data-liquid-glass on the element. Size and corner radius are read
   off it and the map is drawn again whenever its size changes.

   The map's maths and the optics below follow liquid-glass, whose licence
   is:

   MIT License

   Copyright (c) 2026 Sam Asante

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.glass = (function () {
  'use strict';

  /* The library's material defaults (MATERIAL_OPTICS), which are what its
     own examples look like. */
  var OPTICS = {
    strength: 0.05,     /* the most a pixel moves, as a share of the box */
    depth: 0.5,         /* how far in from the edge the bend reaches */
    curvature: 0.3,     /* the gentle dome over the whole of it */
    bend: 0.45,         /* the extra bend in a thin band just inside the rim */
    bendWidth: 0.16,
    dispersion: 0.32,   /* red, green and blue pulled apart at the edge */
    frost: 6,           /* blur, px */
    saturate: 1.15,
    sheen: 0.32,        /* the bright edge */
    sheenWidth: 3,
    sheenFalloff: 1.5,
    sheenAngle: 45,
    glow: 0.1,          /* the soft glow inside the edge */
    glowSpread: 1,
    glowFalloff: 0.5,
    specular: 1
  };
  var SPREAD = 0.22;    /* how much further red is pushed than blue */
  var SVGNS = 'http://www.w3.org/2000/svg';

  function blink() {
    var ua = navigator.userAgent || '';
    if (navigator.userAgentData != null) { return true; }
    return /\b(?:Chrome|Chromium|Edg)\//.test(ua) &&
      !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) && !/iPhone|iPad|iPod/.test(ua);
  }

  function erf(x) { return Math.tanh(Math.sqrt(Math.PI) * x); }

  /* Distance from a point to a rounded rectangle centred on the origin,
     negative inside. */
  function roundedSdf(px, py, halfW, halfH, r) {
    var ex = Math.abs(px) - halfW + r;
    var ey = Math.abs(py) - halfH + r;
    var ox = ex > 0 ? ex : 0;
    var oy = ey > 0 ? ey : 0;
    return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(ex, ey), 0) - r;
  }

  /* A spherical cap's slope, x / sqrt(R^2 - x^2), scaled so it averages 0.5
     across the half-width: the dome. */
  function dome(cap, half) {
    var c = Math.max(0.01, Math.min(cap, half - 1));
    var R = (half * half + c * c) / (2 * c);
    var mean = (R - Math.sqrt(R * R - half * half)) / half;
    return { R: R, scale: mean > 0 ? 0.5 / mean : 1 };
  }
  function slope(d, x) {
    var ax = Math.min(Math.abs(x), d.R * (1 - 1e-3));
    var s = (ax / Math.sqrt(d.R * d.R - ax * ax)) * d.scale;
    return x < 0 ? -s : s;
  }

  function encode(v) { return Math.max(0, Math.min(255, Math.round((0.5 + v) * 255))); }

  /* The displacement map for a w x h box with corners of radius r. */
  function drawMap(w, h, r, o) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    var image = ctx.createImageData(w, h);
    var data = image.data;

    var halfW = w / 2;
    var halfH = h / 2;
    var radius = Math.min(r, halfW, halfH);
    var minHalf = Math.min(halfW, halfH);
    var depthPx = Math.min(o.depth * minHalf, minHalf - 1);
    var innerW = Math.max(0, halfW - depthPx);
    var innerH = Math.max(0, halfH - depthPx);
    var innerR = Math.max(0, Math.min(radius, innerW, innerH));
    var falloff = depthPx > 0 ? Math.SQRT1_2 / depthPx : 1e6;
    var cap = o.curvature * minHalf;
    var domeX = dome(cap, halfW);
    var domeY = dome(cap, halfH);
    var bandInv = 1 / Math.max(2, o.bendWidth * minHalf);
    var edgeInv = o.sheenWidth > 0 ? 1 / o.sheenWidth : 0;
    var glowInv = 1 / Math.max(2, o.glowSpread * minHalf);
    var angle = o.sheenAngle * Math.PI / 180;
    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);

    for (var y = 0; y < h; y += 1) {
      /* Up is positive, as in the library, so the light sits top left. */
      var py = halfH - (y + 0.5);
      for (var x = 0; x < w; x += 1) {
        var px = (x + 0.5) - halfW;
        var i = (y * w + x) * 4;
        var sdf = roundedSdf(px, py, halfW, halfH, radius);
        if (sdf >= 0) {
          data[i] = data[i + 1] = data[i + 2] = 128;
          data[i + 3] = 255;
          continue;
        }
        /* Pushed outward along the dome's slope, fading in from the inner
           edge of the band the bend reaches. */
        var dirX = -slope(domeX, px);
        var dirY = slope(domeY, py);
        var edge = 0.5 * (1 + erf(roundedSdf(px, py, innerW, innerH, innerR) * falloff));
        var dx = 0.5 * dirX * edge;
        var dy = 0.5 * dirY * edge;
        /* The lip: a little more bend in a thin band just inside the rim,
           nothing at the rim itself. */
        var s = Math.max(0, 1 + sdf * bandInv);
        var len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (s > 0 && len > 1e-4) {
          var lip = (0.5 * o.bend * 6.75 * s * s * (1 - s) * edge) / len;
          dx += dirX * lip;
          dy += dirY * lip;
        }

        /* The highlight: the edge band, brightest in the corners on the
           light's diagonal, and the glow inside it. */
        var nx = Math.max(-1, Math.min(1, -px / halfW));    /* left is + */
        var ny = Math.max(-1, Math.min(1, py / halfH));
        var axis = Math.min(1, Math.abs(nx * cosA + ny * sinA) * Math.SQRT1_2);
        var spec = 0;
        var band = Math.max(0, 1 + sdf * edgeInv);
        spec += o.sheen * Math.pow(band, o.sheenFalloff) * (0.16 + 0.84 * Math.pow(axis, 1.6));
        var t = 1 - Math.min(1, -sdf * glowInv);
        spec += o.glow * Math.pow(t * t * (3 - 2 * t), o.glowFalloff) * edge * (0.6 + 0.4 * axis);
        spec = Math.min(1, spec);

        /* Over 128 reads from the right (red) or below (green): inward on
           the top left, so the middle of the page is drawn out to the rim
           like a lens. */
        data[i] = encode(dx);
        data[i + 1] = encode(dy);
        data[i + 2] = Math.round(127 * spec + 128);
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL();
  }

  function node(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* The filter: the map over neutral grey (so a pixel pushed past the box
     edge reads the page, not black), the three colour passes added back
     together, and the highlight added over them. */
  function buildFilter(svg, id, w, h, map, o) {
    var norm = Math.sqrt((w * w + h * h) / 2);
    var scale = o.strength * norm;
    var margin = Math.ceil(scale * 1.2 * 0.5 + 28);
    var filter = node('filter', {
      id: id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB',
      x: -margin, y: -margin, width: w + 2 * margin, height: h + 2 * margin
    });
    filter.appendChild(node('feFlood', { 'flood-color': 'rgb(128,128,128)', 'flood-opacity': 1, result: 'mapBg' }));
    var img = node('feImage', { x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'rawMap' });
    img.setAttribute('href', map);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', map);
    filter.appendChild(img);
    filter.appendChild(node('feComposite', { in: 'rawMap', in2: 'mapBg', operator: 'over', result: 'map' }));
    [['R', 1 + SPREAD * o.dispersion, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
     ['G', 1 + SPREAD * 0.5 * o.dispersion, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
     ['B', 1, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0']].forEach(function (pass) {
      filter.appendChild(node('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'map', scale: scale * pass[1],
        xChannelSelector: 'R', yChannelSelector: 'G', result: 'shift' + pass[0]
      }));
      filter.appendChild(node('feColorMatrix', { in: 'shift' + pass[0], type: 'matrix', values: pass[2], result: 'only' + pass[0] }));
    });
    filter.appendChild(node('feComposite', { in: 'onlyR', in2: 'onlyG', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'onlyRG' }));
    filter.appendChild(node('feComposite', { in: 'onlyRG', in2: 'onlyB', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'lens' }));
    filter.appendChild(node('feColorMatrix', {
      in: 'map', type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 ' + (-128 / 255), result: 'shine'
    }));
    filter.appendChild(node('feComposite', { in: 'shine', in2: 'lens', operator: 'arithmetic', k1: 0, k2: o.specular, k3: 1, k4: 0 }));
    svg.appendChild(filter);
  }

  var count = 0;

  function liquid(el) {
    var o = OPTICS;
    var frost = 'blur(' + o.frost + 'px) saturate(' + o.saturate + ')';
    if (!blink() || !window.ResizeObserver) { return; }

    var svg = node('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    document.body.appendChild(svg);
    var key = '';
    var version = 0;
    var base = 'ege-glass-' + (count += 1);

    function draw() {
      var w = Math.round(el.offsetWidth);
      var h = Math.round(el.offsetHeight);
      if (!w || !h) { return; }
      var r = Math.min(parseFloat(window.getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
      var now = w + 'x' + h + 'r' + r;
      if (now === key) { return; }
      key = now;
      /* A new id each time: Blink keeps what a filter drew by its id. */
      version += 1;
      var id = base + '-v' + version;
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      buildFilter(svg, id, w, h, drawMap(w, h, r, o), o);
      var value = frost + ' url(#' + id + ')';
      el.style.backdropFilter = value;
      el.style.setProperty('-webkit-backdrop-filter', value);
      el.classList.add('is-liquid');
    }

    var queued = false;
    new window.ResizeObserver(function () {
      if (queued) { return; }
      queued = true;
      window.requestAnimationFrame(function () { queued = false; draw(); });
    }).observe(el);
    draw();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-liquid-glass]'), liquid);

  return { liquid: liquid };
})();
