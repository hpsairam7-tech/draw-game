(function(){
  // --- Helpers ---
  const $ = s => document.querySelector(s);
  const roomFromHash = () => {
    let r = location.hash.replace('#','').trim();
    if (!r) { r = [...crypto.getRandomValues(new Uint8Array(6))].map(x=>('0'+x.toString(16)).slice(-2)).join('').slice(0,6); location.hash = r; }
    return r;
  };
  const now = () => new Date().toISOString();
  const throttle = (fn, wait) => {
    let last = 0;
    return (...args) => {
      const t = Date.now();
      if (t - last >= wait) { last = t; fn(...args); }
    };
  };

  // --- Firebase ---
  if (!window.firebaseConfig) {
    alert("Please edit config.js and add your Firebase config.");
  }
  const app = firebase.initializeApp(window.firebaseConfig);
  const db = firebase.database();

  // --- Room Setup ---
  const roomId = roomFromHash();
  $("#roomId").textContent = roomId;
  $("#copyLink").onclick = async () => {
    const url = location.href;
    try { await navigator.clipboard.writeText(url); $("#copyLink").textContent = "Copied!"; setTimeout(()=>$("#copyLink").textContent="Copy Invite Link", 1200); }
    catch(e){ alert(url); }
  };

  // --- Canvas Drawing ---
  const canvas = $("#board");
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let size = +$("#size").value;
  let color = $("#color").value;
  let drawMode = $("#drawToggle").checked;

  function setStrokeStyle(){
    ctx.lineCap = 'round'; ctx.lineJoin='round'; ctx.lineWidth=size; ctx.strokeStyle=color;
  }
  setStrokeStyle();

  $("#size").addEventListener('input', e => { size = +e.target.value; setStrokeStyle(); });
  $("#color").addEventListener('input', e => { color = e.target.value; setStrokeStyle(); });
  $("#drawToggle").addEventListener('change', e => { drawMode = e.target.checked; });

  function pos(ev){
    const rect = canvas.getBoundingClientRect();
    if (ev.touches && ev.touches[0]) {
      return { x: ev.touches[0].clientX - rect.left, y: ev.touches[0].clientY - rect.top };
    }
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  let lastPoint = null;
  function start(ev){ if(!drawMode) return; drawing = true; lastPoint = pos(ev); ev.preventDefault(); }
  function move(ev){
    if(!drawing || !drawMode) return;
    const p = pos(ev);
    drawLine(lastPoint, p, {size, color});
    sendStroke(lastPoint, p, {size, color});
    lastPoint = p; ev.preventDefault();
  }
  function end(){ drawing = false; lastPoint = null; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, {passive:false});
  canvas.addEventListener('touchmove', move, {passive:false});
  window.addEventListener('touchend', end);

  function drawLine(a,b,style){
    ctx.save();
    ctx.lineWidth = style.size;
    ctx.strokeStyle = style.color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  // Clear board
  $("#clear").onclick = ()=>{
    ctx.clearRect(0,0,canvas.width, canvas.height);
    db.ref(`rooms/${roomId}/strokes`).set(null);
  };

  // Broadcast strokes (throttled)
  const sendStroke = throttle((a,b,style)=>{
    db.ref(`rooms/${roomId}/strokes`).push({
      ax:a.x, ay:a.y, bx:b.x, by:b.y,
      size:style.size, color:style.color, t:now()
    });
  }, 12);

  // Listen for strokes
  db.ref(`rooms/${roomId}/strokes`).on('child_added', snap => {
    const s = snap.val(); if(!s) return;
    drawLine({x:s.ax, y:s.ay}, {x:s.bx, y:s.by}, {size:s.size, color:s.color});
  });

  // --- Word setting (simple visibility cue) ---
  $("#setWord").onclick = ()=>{
    const w = $("#wordInput").value.trim();
    if(!w) return;
    db.ref(`rooms/${roomId}/word`).set({w, t:now()});
  };
  db.ref(`rooms/${roomId}/word`).on('value', snap => {
    const v = snap.val();
    $("#currentWord").textContent = v ? `Word set at ${new Date(v.t).toLocaleTimeString()}` : "";
  });

  // --- Chat / Guess ---
  $("#send").onclick = sendChat;
  $("#message").addEventListener('keydown', e=>{ if(e.key==='Enter') sendChat(); });

  function sendChat(){
    const who = $("#name").value.trim() || "Player";
    const text = $("#message").value.trim();
    if(!text) return;
    db.ref(`rooms/${roomId}/chat`).push({who, text, t:now()});
    $("#message").value = "";
  }

  const chatEl = $("#chat");
  function addMsg(m){
    const d = document.createElement('div');
    d.className = 'msg';
    const time = new Date(m.t).toLocaleTimeString();
    d.innerHTML = `<span class="who">${m.who}</span> <span class="muted">${time}</span><div>${escapeHTML(m.text)}</div>`;
    chatEl.appendChild(d);
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  function escapeHTML(s){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  db.ref(`rooms/${roomId}/chat`).on('child_added', snap => {
    const m = snap.val(); if(!m) return;
    addMsg(m);
  });
})();