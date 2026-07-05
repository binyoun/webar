/* ar-app.js : builds the AR scene from config.json
 * URL pattern:  ar.html?work=<slug>
 *
 * Modules (all optional, set per work in config.json):
 *   trigger: {type:"gps"|"compass", ...}  gate before AR starts
 *   overlay: {type:"video"|"image"|"model"|"lenses", ...}
 *   audio:   {type:"sonify", source:"caption"|<string>}  deterministic melody
 *
 * Lineage: gps -> Gelora Mycelium Network, compass -> geloracompass,
 * lenses -> SELECT PERCEPTION ENGINE, sonify -> Vanishing Waters,
 * NFC needs no code here (a tag simply stores this page's URL).
 */

let audioCtx = null;

async function init() {
  let config;
  try {
    config = await (await fetch("config.json")).json();
  } catch (e) {
    return showError("config.json could not be loaded. Are you serving over http(s), not file:// ?");
  }

  const slug = new URLSearchParams(location.search).get("work");
  const work = config.works.find((w) => w.slug === slug);
  if (!work) {
    return showError(
      slug
        ? `No work with slug "${slug}" in config.json.`
        : "No work selected. Open this page from the gallery, or add ?work=<slug> to the URL."
    );
  }

  document.title = `${work.title} \u00b7 AR`;
  document.getElementById("work-title").textContent = work.title;
  document.getElementById("work-meta").textContent = `${work.artist} \u00b7 ${work.year}`;
  if (work.caption) document.getElementById("work-caption").textContent = work.caption;

  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const isSecure = location.protocol === "https:" || location.hostname === "localhost";
  if (!hasCamera || !isSecure) return showFallback(work, isSecure);

  if (work.trigger) {
    const passed = await runTrigger(work.trigger);
    if (!passed) return; // gate screen stays up until unlocked or bypassed
  }

  buildScene(work);
}

/* ---------------- trigger gates ---------------- */

function gateScreen(html) {
  const mount = document.getElementById("scene-mount");
  mount.innerHTML = `<div class="fallback">${html}
    <button id="bypass" class="ghost">studio mode: continue anyway</button></div>`;
  return mount;
}

function runTrigger(t) {
  if (t.type === "gps") return gpsGate(t);
  if (t.type === "compass") return compassGate(t);
  return Promise.resolve(true);
}

/* GPS geofence: the work only opens near its coordinates.
   Lineage: Gelora Mycelium Network (Bagua/GPS, MMU Malaysia). */
function gpsGate(t) {
  return new Promise((resolve) => {
    const mount = gateScreen(`
      <p class="mono">this work lives at a place</p>
      <p id="gate-line">locating you\u2026</p>
      <p class="mono dim">it opens within ${t.radius || 50} m of its site</p>`);
    mount.querySelector("#bypass").onclick = () => resolve(true);

    if (!navigator.geolocation) {
      mount.querySelector("#gate-line").textContent = "geolocation unavailable on this device";
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const d = haversine(pos.coords.latitude, pos.coords.longitude, t.lat, t.lng);
        const line = mount.querySelector("#gate-line");
        if (!line) return;
        if (d <= (t.radius || 50)) {
          navigator.geolocation.clearWatch(watch);
          resolve(true);
        } else {
          line.textContent = `${Math.round(d)} m away \u00b7 keep walking`;
        }
      },
      () => { const l = mount.querySelector("#gate-line"); if (l) l.textContent = "location permission denied"; },
      { enableHighAccuracy: true }
    );
  });
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* Compass bearing: face a direction to unlock.
   Lineage: geloracompass. iOS needs a permission tap first. */
function compassGate(t) {
  return new Promise((resolve) => {
    const target = t.heading ?? 0, tol = t.tolerance ?? 15;
    const mount = gateScreen(`
      <p class="mono">this work faces ${target}\u00b0</p>
      <div id="dial">\u25b3</div>
      <p id="gate-line">turn until the mark settles</p>`);
    mount.querySelector("#bypass").onclick = () => { cleanup(); resolve(true); };

    function onOrient(e) {
      let heading = null;
      if (typeof e.webkitCompassHeading === "number") heading = e.webkitCompassHeading; // iOS
      else if (e.absolute && typeof e.alpha === "number") heading = 360 - e.alpha;      // Android
      if (heading == null) return;
      const dial = mount.querySelector("#dial");
      const line = mount.querySelector("#gate-line");
      if (!dial) return;
      let diff = ((target - heading + 540) % 360) - 180; // signed shortest turn
      dial.style.transform = `rotate(${diff}deg)`;
      if (Math.abs(diff) <= tol) { cleanup(); resolve(true); }
      else if (line) line.textContent = `${Math.round(Math.abs(diff))}\u00b0 to go`;
    }
    function cleanup() {
      window.removeEventListener("deviceorientationabsolute", onOrient, true);
      window.removeEventListener("deviceorientation", onOrient, true);
    }
    function listen() {
      window.addEventListener("deviceorientationabsolute", onOrient, true);
      window.addEventListener("deviceorientation", onOrient, true);
    }
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      const btn = document.createElement("button");
      btn.className = "ghost"; btn.textContent = "enable compass";
      btn.onclick = () => DeviceOrientationEvent.requestPermission().then((s) => {
        if (s === "granted") { btn.remove(); listen(); }
      });
      mount.querySelector(".fallback").prepend(btn);
    } else listen();
  });
}

/* ---------------- deterministic sonification ----------------
   Text -> melody, same text always the same melody.
   Lineage: Vanishing Waters / Perforated Atlas (memory -> perforation
   pattern -> sound and light). Char codes index a pentatonic scale. */
function sonify(text) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33]; // A minor pentatonic-ish
  const now = audioCtx.currentTime + 0.05;
  const step = 0.16;
  [...text].slice(0, 64).forEach((ch, i) => {
    const code = ch.codePointAt(0);
    if (code <= 32) return; // rests on spaces
    const f = scale[code % scale.length];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine"; osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, now + i * step);
    gain.gain.exponentialRampToValueAtTime(0.18, now + i * step + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * step + step * 0.9);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * step); osc.stop(now + i * step + step);
    setTimeout(() => pulseHud(), (0.05 + i * step) * 1000); // light follows sound
  });
}
function pulseHud() {
  const hud = document.getElementById("hud");
  hud.classList.add("pulse");
  setTimeout(() => hud.classList.remove("pulse"), 120);
}

/* ---------------- scene ---------------- */

function buildScene(work) {
  const scene = document.createElement("a-scene");
  scene.setAttribute(
    "mindar-image",
    `imageTargetSrc: ${work.target}; uiScanning: yes; uiLoading: yes; autoStart: true`
  );
  scene.setAttribute("color-space", "sRGB");
  scene.setAttribute("renderer", "colorManagement: true");
  scene.setAttribute("embedded", "");
  scene.setAttribute("vr-mode-ui", "enabled: false");
  scene.setAttribute("device-orientation-permission-ui", "enabled: false");

  const assets = document.createElement("a-assets");
  scene.appendChild(assets);

  const camera = document.createElement("a-camera");
  camera.setAttribute("position", "0 0 0");
  camera.setAttribute("look-controls", "enabled: false");
  scene.appendChild(camera);

  const target = document.createElement("a-entity");
  target.setAttribute("mindar-image-target", "targetIndex: 0");

  const o = work.overlay;

  if (o.type === "video") {
    const vid = document.createElement("video");
    vid.id = "overlay-video";
    vid.src = o.src;
    vid.setAttribute("preload", "auto");
    vid.setAttribute("loop", "");
    vid.setAttribute("muted", ""); vid.muted = true; // mobile autoplay rule
    vid.setAttribute("playsinline", "");
    vid.setAttribute("crossorigin", "anonymous");
    assets.appendChild(vid);
    const plane = document.createElement("a-video");
    plane.setAttribute("src", "#overlay-video");
    plane.setAttribute("width", o.width || 1);
    plane.setAttribute("height", o.height || 1);
    plane.setAttribute("position", o.position || "0 0 0");
    target.appendChild(plane);
    target.addEventListener("targetFound", () => vid.play().catch(() => {}));
    target.addEventListener("targetLost", () => vid.pause());
  }

  if (o.type === "image") {
    const img = document.createElement("img");
    img.id = "overlay-image"; img.src = o.src;
    img.setAttribute("crossorigin", "anonymous");
    assets.appendChild(img);
    const plane = document.createElement("a-image");
    plane.setAttribute("src", "#overlay-image");
    plane.setAttribute("width", o.width || 1);
    plane.setAttribute("height", o.height || 1);
    plane.setAttribute("position", o.position || "0 0 0");
    target.appendChild(plane);
  }

  if (o.type === "model") {
    const model = document.createElement("a-gltf-model");
    model.setAttribute("src", o.src);
    model.setAttribute("scale", o.scale || "0.3 0.3 0.3");
    model.setAttribute("position", o.position || "0 0 0.1");
    model.setAttribute("rotation", o.rotation || "0 0 0");
    if (o.animation !== false) {
      model.setAttribute("animation",
        "property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true");
    }
    target.appendChild(model);
  }

  /* Multiple interpretive layers on one target; tap to switch lens.
     Lineage: SELECT PERCEPTION ENGINE. */
  if (o.type === "lenses") {
    let idx = 0;
    o.lenses.forEach((lens, i) => {
      const img = document.createElement("img");
      img.id = `lens-${i}`; img.src = lens.src;
      img.setAttribute("crossorigin", "anonymous");
      assets.appendChild(img);
    });
    const plane = document.createElement("a-image");
    plane.setAttribute("src", "#lens-0");
    plane.setAttribute("width", o.width || 1);
    plane.setAttribute("height", o.height || 1);
    target.appendChild(plane);
    const lensLabel = document.getElementById("lens-label");
    const applyLens = () => {
      plane.setAttribute("src", `#lens-${idx}`);
      lensLabel.textContent = `lens ${idx + 1}/${o.lenses.length} \u00b7 ${o.lenses[idx].label}`;
      lensLabel.style.display = "block";
      if (o.lenses[idx].text)
        document.getElementById("work-caption").textContent = o.lenses[idx].text;
    };
    applyLens();
    document.body.addEventListener("click", (e) => {
      if (e.target.closest("a,button")) return;
      idx = (idx + 1) % o.lenses.length;
      applyLens();
    });
  }

  /* sonification layer: plays on target found, after first user tap
     (mobile browsers require a gesture before audio) */
  if (work.audio && work.audio.type === "sonify") {
    const text = work.audio.source === "caption" || !work.audio.source
      ? (work.caption || work.title)
      : work.audio.source;
    let armed = false;
    const chip = document.createElement("button");
    chip.className = "ghost chip"; chip.textContent = "tap to arm sound";
    document.body.appendChild(chip);
    chip.onclick = () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume();
      armed = true; chip.textContent = "sound armed \u00b7 find the target";
      setTimeout(() => chip.remove(), 1500);
    };
    target.addEventListener("targetFound", () => { if (armed) sonify(text); });
  }

  target.addEventListener("targetFound", () =>
    document.getElementById("hud").classList.add("found"));
  target.addEventListener("targetLost", () =>
    document.getElementById("hud").classList.remove("found"));

  scene.appendChild(target);
  document.getElementById("scene-mount").appendChild(scene);
}

/* Desktop / no-camera / non-https fallback: show the work directly */
function showFallback(work, isSecure) {
  const mount = document.getElementById("scene-mount");
  const o = work.overlay;
  let media = "";
  if (o.type === "video")
    media = `<video src="${o.src}" controls loop playsinline style="width:100%;max-width:640px;"></video>`;
  else if (o.type === "image")
    media = `<img src="${o.src}" style="width:100%;max-width:640px;" alt="${work.title}" />`;
  else if (o.type === "lenses")
    media = o.lenses.map((l) =>
      `<figure style="max-width:320px"><img src="${l.src}" style="width:100%" alt="${l.label}" />
       <figcaption class="mono dim">${l.label}</figcaption></figure>`).join("");
  else
    media = `<p class="mono">This work uses a 3D overlay. Open on a phone to view it in AR.</p>`;

  mount.innerHTML = `
    <div class="fallback">
      <p class="mono">${
        isSecure
          ? "no camera detected \u00b7 showing the overlay directly"
          : "AR needs https \u00b7 open the GitHub Pages URL on your phone"
      }</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center">${media}</div>
      <p class="mono dim">the printed photograph is the missing half of this work</p>
    </div>`;
}

function showError(msg) {
  document.getElementById("scene-mount").innerHTML =
    `<div class="fallback"><p class="mono">${msg}</p></div>`;
}

init();
