(function () {
  'use strict';

  // ── Config ── Set this to your n8n webhook URL after importing the workflow
  var WEBHOOK_URL = 'https://n8n-production-ecbd8.up.railway.app/webhook/vivi-chat';

  // ── Session persistence ──
  var sessionId = localStorage.getItem('vivi_session');
  if (!sessionId) {
    sessionId = 'vivi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    localStorage.setItem('vivi_session', sessionId);
  }

  var isOpen = false;
  var isLoading = false;

  // ── Styles ──
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '#vivi-pill{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:10px;background:#0A1A1A;border:1.5px solid rgba(46,221,181,0.32);border-radius:999px;padding:10px 18px 10px 12px;cursor:pointer;box-shadow:0 4px 24px rgba(46,221,181,0.15);transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s ease;font-family:Montserrat,sans-serif;user-select:none;}',
    '#vivi-pill:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(46,221,181,0.28);}',
    '#vivi-pill-icon{width:30px;height:30px;background:linear-gradient(135deg,#8FDA0D 0%,#2EDDB5 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '#vivi-pill-title{display:block;font-size:0.78rem;font-weight:700;color:#2EDDB5;letter-spacing:0.03em;}',
    '#vivi-pill-sub{display:block;font-size:0.62rem;font-weight:500;color:rgba(232,245,245,0.4);letter-spacing:0.04em;}',
    '#vivi-window{position:fixed;bottom:86px;right:24px;z-index:9998;width:360px;height:520px;background:#060E0E;border:1px solid rgba(46,221,181,0.16);border-radius:18px;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.65),0 0 0 1px rgba(46,221,181,0.06);overflow:hidden;transform:translateY(16px) scale(0.97);opacity:0;pointer-events:none;transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1),opacity 0.22s ease;font-family:Roboto,sans-serif;}',
    '#vivi-window.vivi-open{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}',
    '#vivi-head{display:flex;align-items:center;gap:10px;padding:13px 14px;background:#0A1616;border-bottom:1px solid rgba(46,221,181,0.09);flex-shrink:0;}',
    '#vivi-av{width:34px;height:34px;background:linear-gradient(135deg,#8FDA0D 0%,#2EDDB5 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.82rem;font-weight:800;color:#060E0E;font-family:Montserrat,sans-serif;flex-shrink:0;}',
    '#vivi-head-name{display:block;font-family:Montserrat,sans-serif;font-size:0.82rem;font-weight:700;color:#e8f5f5;}',
    '#vivi-head-status{display:flex;align-items:center;gap:5px;font-size:0.66rem;color:#2EDDB5;font-weight:500;}',
    '#vivi-dot{width:6px;height:6px;background:#2EDDB5;border-radius:50%;animation:vivi-blink 2s ease infinite;}',
    '@keyframes vivi-blink{0%,100%{opacity:1}50%{opacity:0.35}}',
    '#vivi-x{margin-left:auto;background:none;border:none;cursor:pointer;color:rgba(232,245,245,0.38);padding:5px;border-radius:6px;display:flex;line-height:1;transition:color 0.15s;}',
    '#vivi-x:hover{color:rgba(232,245,245,0.78);}',
    '#vivi-msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin;scrollbar-color:rgba(46,221,181,0.18) transparent;}',
    '#vivi-msgs::-webkit-scrollbar{width:4px;}',
    '#vivi-msgs::-webkit-scrollbar-thumb{background:rgba(46,221,181,0.18);border-radius:2px;}',
    '.vm{max-width:84%;font-size:0.82rem;line-height:1.58;padding:9px 13px;border-radius:14px;word-break:break-word;animation:vivi-up 0.2s ease both;}',
    '@keyframes vivi-up{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}',
    '.vm.bot{background:#0D1C1C;border:1px solid rgba(46,221,181,0.09);color:rgba(232,245,245,0.87);align-self:flex-start;border-bottom-left-radius:4px;}',
    '.vm.usr{background:linear-gradient(135deg,#0B7070 0%,#2EDDB5 100%);color:#060E0E;font-weight:500;align-self:flex-end;border-bottom-right-radius:4px;}',
    '#vivi-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;background:#0D1C1C;border:1px solid rgba(46,221,181,0.09);border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start;animation:vivi-up 0.2s ease both;}',
    '#vivi-typing span{width:6px;height:6px;background:#2EDDB5;border-radius:50%;animation:vivi-dot 1.2s ease infinite;}',
    '#vivi-typing span:nth-child(2){animation-delay:0.2s}',
    '#vivi-typing span:nth-child(3){animation-delay:0.4s}',
    '@keyframes vivi-dot{0%,60%,100%{transform:translateY(0);opacity:0.45}30%{transform:translateY(-5px);opacity:1}}',
    '#vivi-foot{display:flex;align-items:center;gap:7px;padding:9px 11px;border-top:1px solid rgba(46,221,181,0.09);background:#0A1616;flex-shrink:0;}',
    '#vivi-inp{flex:1;background:rgba(46,221,181,0.05);border:1px solid rgba(46,221,181,0.16);border-radius:999px;padding:8px 14px;color:#e8f5f5;font-family:Roboto,sans-serif;font-size:0.82rem;outline:none;transition:border-color 0.2s;}',
    '#vivi-inp::placeholder{color:rgba(232,245,245,0.25);}',
    '#vivi-inp:focus{border-color:rgba(46,221,181,0.4);}',
    '#vivi-btn{width:34px;height:34px;background:linear-gradient(135deg,#8FDA0D 0%,#2EDDB5 100%);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s;}',
    '#vivi-btn:hover{transform:scale(1.1);}',
    '#vivi-btn:disabled{opacity:0.42;cursor:default;transform:none;}',
    '@media(max-width:480px){#vivi-window{width:calc(100vw - 20px);right:10px;bottom:76px;}#vivi-pill{right:10px;bottom:10px;}}'
  ].join('');
  document.head.appendChild(styleEl);

  // ── Pill ──
  var pill = document.createElement('div');
  pill.id = 'vivi-pill';
  pill.setAttribute('role', 'button');
  pill.setAttribute('aria-label', 'Open chat with Vivi');
  pill.innerHTML =
    '<div id="vivi-pill-icon">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#060E0E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '</div>' +
    '<div>' +
      '<span id="vivi-pill-title">Chat with Vivi</span>' +
      '<span id="vivi-pill-sub">AI Assistant</span>' +
    '</div>';

  // ── Chat window ──
  var win = document.createElement('div');
  win.id = 'vivi-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Chat with Vivi');
  win.innerHTML =
    '<div id="vivi-head">' +
      '<div id="vivi-av">V</div>' +
      '<div>' +
        '<span id="vivi-head-name">Vivi</span>' +
        '<div id="vivi-head-status"><span id="vivi-dot"></span>Online · Vivire AI</div>' +
      '</div>' +
      '<button id="vivi-x" aria-label="Close">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>' +
    '<div id="vivi-msgs"></div>' +
    '<div id="vivi-foot">' +
      '<input id="vivi-inp" type="text" placeholder="Ask me anything…" autocomplete="off" />' +
      '<button id="vivi-btn" aria-label="Send">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#060E0E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
    '</div>';

  document.body.appendChild(pill);
  document.body.appendChild(win);

  var msgsEl = document.getElementById('vivi-msgs');
  var inpEl  = document.getElementById('vivi-inp');
  var btnEl  = document.getElementById('vivi-btn');

  // ── Toggle ──
  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      win.classList.add('vivi-open');
      inpEl.focus();
      if (msgsEl.children.length === 0) {
        addMsg("Hi! I'm Vivi, Vivire's AI assistant. I can answer questions about our services, packages, pricing, and how we work. What would you like to know?", 'bot');
      }
    } else {
      win.classList.remove('vivi-open');
    }
  }

  pill.addEventListener('click', toggle);
  document.getElementById('vivi-x').addEventListener('click', toggle);

  // ── Messages ──
  function addMsg(text, type) {
    var el = document.createElement('div');
    el.className = 'vm ' + type;
    el.textContent = text;
    msgsEl.appendChild(el);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function showTyping() {
    var el = document.createElement('div');
    el.id = 'vivi-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(el);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('vivi-typing');
    if (t) t.remove();
  }

  // ── Send ──
  async function send() {
    var text = inpEl.value.trim();
    if (!text || isLoading) return;

    inpEl.value = '';
    isLoading = true;
    btnEl.disabled = true;

    addMsg(text, 'usr');
    showTyping();

    try {
      var res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });
      if (!res.ok) throw new Error('non-200');
      var data = await res.json();
      hideTyping();
      var reply = data.reply || data.output || data.message || data.text || "I didn't catch that — try asking again!";
      addMsg(reply, 'bot');
    } catch (_) {
      hideTyping();
      addMsg("Something went wrong on my end. Please try again in a moment!", 'bot');
    }

    isLoading = false;
    btnEl.disabled = false;
    inpEl.focus();
  }

  btnEl.addEventListener('click', send);
  inpEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

})();
