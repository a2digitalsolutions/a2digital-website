/* A2Digital Solutions — interazioni del sito */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
  const bump = el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
  const pad = n => String(n).padStart(2, '0');

  $('#year').textContent = new Date().getFullYear();

  /* ---------- navigazione ---------- */
  const nav = $('#nav'), burger = $('#burger'), mnav = $('#mnav'), bar = $('#progress');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 30);
    bar.style.transform = `scaleX(${h > 0 ? Math.min(y / h, 1) : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const closeMenu = () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    mnav.classList.toggle('open', open);
  });
  $$('a', mnav).forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const navLinks = $$('.nav-links a');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) secObs.observe(s); });

  /* ---------- comparsa allo scorrimento ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
  });
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revObs.observe(el));

  /* ---------- contatori ---------- */
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      countObs.unobserve(el);
      if (reduce) { el.textContent = end + suf; return; }
      const t0 = performance.now(), dur = 1600;
      const step = t => {
        const k = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        el.textContent = v + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObs.observe(el));

  /* ---------- tracciato di crescita ---------- */
  const growth = $('.growth');
  if (growth) {
    const p = $('#growthPath');
    growth.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1);
    new IntersectionObserver((en, o) => {
      if (en[0].isIntersecting) { growth.classList.add('drawn'); o.disconnect(); }
    }, { threshold: 0.4 }).observe(growth);
  }

  /* ---------- effetti al passaggio del mouse ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', (e.clientX - r.left - r.width / 2) * 0.22 + 'px');
        b.style.setProperty('--my', (e.clientY - r.top - r.height / 2) * 0.3 + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
    $$('[data-tilt]').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--px', x * 100 + '%');
        c.style.setProperty('--py', y * 100 + '%');
        c.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 5}deg) translateY(-4px)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  /* ---------- polvere d'oro sullo sfondo ---------- */
  const cv = $('#dust');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let W, H, dpr, parts = [], raf;
    const make = (y) => ({ x: Math.random() * W, y: y ?? Math.random() * H, r: 0.4 + Math.random() * 1.6, vy: 0.08 + Math.random() * 0.3, ph: Math.random() * 6.28, sp: 0.004 + Math.random() * 0.01 });
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(80, Math.round(W * H / 20000));
      parts = Array.from({ length: n }, () => make());
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy; p.ph += p.sp; p.x += Math.sin(p.ph) * 0.2;
        if (p.y < -10) Object.assign(p, make(H + 10));
        const a = 0.25 + Math.sin(p.ph * 2) * 0.2 + 0.2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(243,205,106,${a})`;
        ctx.shadowColor = 'rgba(233,185,73,.8)'; ctx.shadowBlur = p.r * 6;
        ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    size(); draw();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 200); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else draw(); });
  }

  /* ---------- notifiche animate nell'hero ---------- */
  const chipSets = [
    ['<i class="ic ic-cart"></i> Vendita registrata <b>+ 89,00 €</b>', '<i class="ic ic-cart"></i> Ordine online <b>+ 106,70 €</b>', '<i class="ic ic-cart"></i> Tavolo 7 · ordine in cucina'],
    ['<i class="ic ic-gift"></i> Gift card validata', '<i class="ic ic-gift"></i> Tessera caffè: 10 su 10 ☕', '<i class="ic ic-gift"></i> Nuovo cliente fidelity'],
    ['<i class="ic ic-gate"></i> Cancello aperto · 18:30', '<i class="ic ic-gate"></i> Tavolo per 4 · ore 20:30', '<i class="ic ic-gate"></i> Campo 2 prenotato · 19:00']
  ];
  const chips = $$('.hero-art .chip');
  if (chips.length && !reduce) {
    let k = 0;
    setInterval(() => {
      k++;
      chips.forEach((c, i) => setTimeout(() => {
        c.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 250, fill: 'forwards' }).onfinish = () => {
          c.innerHTML = chipSets[i][k % chipSets[i].length];
          c.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 350, fill: 'forwards' });
        };
      }, i * 500));
    }, 4200);
  }

  /* ---------- schede Sartonero ---------- */
  const sfView = $('#sf-view');
  $$('.sf-tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.sf-tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    sfView.classList.add('swap');
    setTimeout(() => { sfView.src = b.dataset.shot; sfView.alt = b.dataset.alt; sfView.onload = () => sfView.classList.remove('swap'); }, 200);
  }));

  /* ---------- filtro portfolio ---------- */
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.filter;
    $$('.work').forEach(w => w.classList.toggle('hide', f !== 'all' && w.dataset.cat !== f));
  }));

  /* ---------- contatti ---------- */
  const MAIL = 'aduedigital@gmail.com';
  const form = $('#cform');
  $$('[data-subject]').forEach(a => a.addEventListener('click', () => {
    const msg = form.elements.msg;
    if (!msg.value) msg.value = a.dataset.subject + '. ';
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    ['nome', 'msg'].forEach(n => {
      const f = form.elements[n], bad = !f.value.trim();
      f.closest('.field').classList.toggle('err', bad);
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    const ints = $$('input[name="int"]:checked', form).map(i => i.value);
    const nome = form.elements.nome.value.trim(), att = form.elements.attivita.value.trim();
    const subject = 'Richiesta informazioni' + (ints.length ? ' · ' + ints.join(', ') : '') + ' · ' + nome;
    const body = `Ciao A2Digital,\n\n${form.elements.msg.value.trim()}\n\n` +
      (ints.length ? `Mi interessa: ${ints.join(', ')}\n` : '') +
      (att ? `Attività: ${att}\n` : '') + `\n${nome}`;
    location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  const copyBtn = $('#copyMail');
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(MAIL); copyBtn.textContent = 'Copiata ✓'; }
    catch { copyBtn.textContent = MAIL; }
    setTimeout(() => { copyBtn.textContent = 'Copia'; }, 2200);
  });

  /* =========================================================
     LABORATORIO
     ========================================================= */
  const tabs = $$('.lab-tabs [role="tab"]');
  const selectTab = (t, focus) => {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
    t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  // i link «Provalo qui» aprono direttamente la demo giusta
  $$('[data-lab]').forEach(a => a.addEventListener('click', () => selectTab($('#' + a.dataset.lab))));

  const confetti = host => {
    if (reduce) return;
    const box = document.createElement('div');
    box.className = 'confetti';
    const cols = ['#f3cd6a', '#e9b949', '#fff1c1', '#8fb4ff', '#5fd39a', '#ff8a8a'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = cols[i % cols.length];
      c.style.setProperty('--x', (Math.random() * 160 - 80) + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      c.style.animationDelay = Math.random() * 0.4 + 's';
      box.appendChild(c);
    }
    host.appendChild(box);
    setTimeout(() => box.remove(), 2600);
  };

  // da telefono il pannello del gestore è sotto: lo mostriamo dopo l'azione
  const showBiz = btn => {
    if (innerWidth >= 900) return;
    const biz = btn.closest('.lab-panel').querySelector('.lab-side.biz');
    setTimeout(() => biz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 1300);
  };

  /* --- 1. prenotazione tavolo --- */
  (() => {
    const days = $('#bkDays'), times = $('#bkTimes'), go = $('#bkGo'), out = $('#bkPeople');
    const done = $('#bkDone'), floor = $('#bkFloor'), feed = $('#bkFeed');
    const covers = $('#bkCovers'), free = $('#bkFree'), dayLabel = $('#bkDayLabel');
    const names = ['Giulia', 'Salvo', 'Martina', 'Ciccio', 'Elena', 'Davide', 'Rosaria'];
    const tables = [
      { n: 1, s: 2, round: 1 }, { n: 2, s: 2, busy: 1 }, { n: 3, s: 4 }, { n: 4, s: 4, busy: 1 },
      { n: 5, s: 6, busy: 1 }, { n: 6, s: 4, busy: 1 }, { n: 7, s: 2, round: 1, busy: 1 }, { n: 8, s: 8 }
    ];
    let people = 2, day = 0, time = null, guest = 0;
    const wd = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
    const dayList = Array.from({ length: 5 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
    const wdFull = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    const whenText = () => { const d = dayList[day]; return day === 0 ? 'stasera' : day === 1 ? 'domani' : `${wdFull[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`; };
    const slots = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

    const drawFloor = () => {
      floor.innerHTML = tables.map(t => `<div class="table${t.round ? ' round' : ''}${t.busy ? ' busy' : ''}${t.fresh ? ' new' : ''}">T${t.n}<small>${t.s} posti</small></div>`).join('');
      free.textContent = tables.filter(t => !t.busy).length;
    };
    const drawDays = () => {
      days.innerHTML = dayList.map((d, i) => `<button type="button" class="${i === day ? 'on' : ''}" data-i="${i}">${i === 0 ? 'Oggi' : i === 1 ? 'Domani' : wd[d.getDay()][0].toUpperCase() + wd[d.getDay()].slice(1)}<small>${d.getDate()}/${d.getMonth() + 1}</small></button>`).join('');
    };
    const drawTimes = () => {
      times.innerHTML = slots.map((s, i) => {
        const full = (i + day * 2) % 5 === 1;
        return `<button type="button" ${full ? 'disabled aria-label="' + s + ' completo"' : ''} class="${s === time ? 'on' : ''}">${s}</button>`;
      }).join('');
    };
    const refreshBtn = () => {
      go.disabled = !time;
      go.textContent = time ? `Conferma · ${people} ${people > 1 ? 'persone' : 'persona'} alle ${time}` : 'Scegli un orario';
    };
    days.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      day = +b.dataset.i; time = null; drawDays(); drawTimes(); refreshBtn();
      const d = dayList[day];
      dayLabel.textContent = day === 0 ? 'stasera' : day === 1 ? 'domani sera' : `${wd[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    });
    times.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      time = b.textContent; drawTimes(); refreshBtn();
    });
    $$('[data-bk]').forEach(b => b.addEventListener('click', () => {
      people = Math.max(1, Math.min(8, people + (b.dataset.bk === 'plus' ? 1 : -1)));
      out.textContent = people; refreshBtn();
    }));
    go.addEventListener('click', () => {
      tables.forEach(t => delete t.fresh);
      let t = tables.filter(x => !x.busy && x.s >= people).sort((a, b) => a.s - b.s)[0];
      if (!t) { tables.forEach((x, i) => { x.busy = [1, 3, 4].includes(i) ? 1 : 0; }); t = tables.filter(x => !x.busy && x.s >= people).sort((a, b) => a.s - b.s)[0]; }
      t.busy = 1; t.fresh = 1;
      const name = names[guest++ % names.length];
      $('#bkSummary').innerHTML = `<strong>${name}</strong>, ti aspettiamo ${whenText()} alle <strong>${time}</strong><br>${people} ${people > 1 ? 'persone' : 'persona'} · tavolo ${t.n}`;
      done.hidden = false;
      covers.textContent = +covers.textContent + people; bump(covers); bump(free);
      drawFloor();
      const li = document.createElement('li');
      li.className = 'fresh';
      li.innerHTML = `<b>${time}</b> ${name} · ${people} pers. <em>tavolo ${t.n}</em>`;
      feed.prepend(li);
      while (feed.children.length > 3) feed.lastElementChild.remove();
      showBiz(go);
    });
    $('#bkAgain').addEventListener('click', () => { done.hidden = true; time = null; drawTimes(); refreshBtn(); });
    drawFloor(); drawDays(); drawTimes(); refreshBtn();
  })();

  /* --- 2. ordine dal tavolo --- */
  (() => {
    const items = [
      { e: '🍅', n: 'Bruschette', d: 'Pomodoro e basilico', p: 6, gf: 0 },
      { e: '🍙', n: 'Arancina al ragù', d: 'Come la fa la nonna', p: 3.5, gf: 0 },
      { e: '🍝', n: 'Pasta alla Norma', d: 'Melanzane e ricotta salata', p: 12, gf: 1 },
      { e: '🍕', n: 'Pizza Margherita', d: 'Anche con impasto senza glutine', p: 8, gf: 1 },
      { e: '🐟', n: 'Pesce spada', d: 'Alla griglia, con insalata', p: 16, gf: 1 },
      { e: '🥗', n: 'Insalata di arance', d: 'Finocchi e olive', p: 7, gf: 1 },
      { e: '🍰', n: 'Cannolo', d: 'Ricotta fresca', p: 4, gf: 0 },
      { e: '🍹', n: 'Spritz', d: 'Aperitivo della casa', p: 6, gf: 1 }
    ];
    const list = $('#mnList'), count = $('#mnCount'), send = $('#mnSend'), done = $('#mnDone');
    const tk = $('#mnTickets'), gfT = $('#mnGf');
    let q = items.map(() => 0), t7open = false;
    const draw = () => {
      list.innerHTML = items.map((it, i) => `<li class="${gfT.checked && !it.gf ? 'hide' : ''}"><span class="emo" aria-hidden="true">${it.e}</span><span class="nm"><b>${it.n}${it.gf ? '<span class="gf">SENZA GLUTINE</span>' : ''}</b><small>${it.d} · ${eur.format(it.p)}</small></span><button type="button" class="add" data-i="${i}" aria-label="Aggiungi ${it.n}">+${q[i] ? `<span class="q">${q[i]}</span>` : ''}</button></li>`).join('');
      const n = q.reduce((a, b) => a + b, 0), tot = q.reduce((a, b, i) => a + b * items[i].p, 0);
      count.textContent = n ? `${n} ${n > 1 ? 'piatti' : 'piatto'} · ${eur.format(tot)}` : 'Nessun piatto';
      send.disabled = !n;
    };
    list.addEventListener('click', e => { const b = e.target.closest('.add'); if (!b) return; q[+b.dataset.i]++; draw(); });
    gfT.addEventListener('change', draw);
    // timer dei comandi in cucina
    const timers = $$('.ticket time', tk).map(t => { const [m, s] = t.textContent.split(':'); return { el: t, sec: +m * 60 + +s }; });
    setInterval(() => timers.forEach(t => { t.sec++; t.el.textContent = pad(Math.floor(t.sec / 60)) + ':' + pad(t.sec % 60); }), 1000);
    send.addEventListener('click', () => {
      const lines = items.map((it, i) => q[i] ? `<li>${q[i]}× ${it.n}</li>` : '').join('');
      const t = document.createElement('div');
      t.className = 'ticket fresh';
      t.innerHTML = `<header><b>Tavolo 7</b><time>00:00</time></header><ul>${lines}</ul><span class="st">Nuovo · in preparazione</span>`;
      tk.prepend(t);
      const ko = $('#mnOrders'); ko.textContent = +ko.textContent + 1; bump(ko);
      if (!t7open) { t7open = true; const kt = $('#mnTables'); kt.textContent = +kt.textContent + 1; bump(kt); }
      while (tk.children.length > 4) tk.lastElementChild.remove();
      timers.push({ el: $('time', t), sec: 0 });
      $('#mnState').textContent = 'Ordine inviato!';
      $('#mnStateSub').textContent = 'La cucina lo sta già preparando.';
      done.hidden = false;
      showBiz(send);
      setTimeout(() => {
        t.classList.add('ready'); $('.st', t).textContent = 'Pronto · in arrivo';
        $('#mnState').textContent = 'È pronto! 🍽️';
        $('#mnStateSub').textContent = 'Il cameriere sta arrivando al tavolo 7.';
      }, 6500);
    });
    $('#mnAgain').addEventListener('click', () => { q = items.map(() => 0); done.hidden = true; draw(); });
    draw();
  })();

  /* --- 3. tessera del bar --- */
  (() => {
    const cups = $('#fdCups'), msg = $('#fdMsg'), btn = $('#fdStamp'), week = $('#fdWeek'), today = $('#fdBars .today');
    const app = $('.fid-app');
    let n = 3;
    const draw = (stampIdx) => {
      cups.innerHTML = Array.from({ length: 10 }, (_, i) => {
        const prize = i === 9, on = i < n;
        return `<span class="cup${on ? ' on' : ''}${prize ? ' prize' : ''}" ${i === stampIdx ? '' : 'style="animation:none"'}>${prize ? (on ? '🎁' : '★') : on ? '☕' : ''}</span>`;
      }).join('');
      const left = 9 - n;
      msg.textContent = n >= 10 ? 'Caffè offerto! Goditelo ☕🎉' : left <= 0 ? 'Il prossimo caffè è offerto!' : `Ancora ${left} ${left > 1 ? 'caffè' : 'caffè'} e il prossimo è offerto`;
      btn.textContent = n >= 10 ? '↺ Ricomincia la tessera' : '☕ Il barista scansiona la tessera';
    };
    btn.addEventListener('click', () => {
      if (n >= 10) { n = 0; draw(); return; }
      n++;
      draw(n - 1);
      week.textContent = +week.textContent + 1; bump(week);
      const h = Math.min(100, parseFloat(today.style.getPropertyValue('--h')) + 3);
      today.style.setProperty('--h', h + '%');
      if (n === 10) confetti(app);
    });
    const toast = $('#fdToast');
    $('#fdPush').addEventListener('click', () => {
      toast.textContent = '✓ Offerta «colazione a 2 €» inviata a 17 clienti su WhatsApp';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3800);
    });
    draw();
  })();

  /* --- 4. cassa del negozio --- */
  (() => {
    const prods = [
      { n: 'T-shirt in cotone', p: 19.9, s: 24, max: 30 },
      { n: 'Jeans slim', p: 59, s: 12, max: 20 },
      { n: 'Felpa con cappuccio', p: 45, s: 9, max: 15 },
      { n: 'Sneakers bianche', p: 79, s: 6, max: 12 },
      { n: 'Cappellino', p: 15, s: 18, max: 25 }
    ];
    const scan = $('#posScan'), cart = $('#posCart'), total = $('#posTotal'), pay = $('#posPay'), rec = $('#posReceipt');
    const stock = $('#posStock'), day = $('#posDay'), receipts = $('#posReceipts'), sync = $('#posSync'), net = $('#posNet'), off = $('#posOffline');
    let idx = 0, items = [], dayTot = 1284, pending = [];
    const drawStock = (flash = []) => {
      stock.innerHTML = prods.map((p, i) => `<li class="${flash.includes(i) ? 'flash' : ''}${p.s <= 5 ? ' low' : ''}"><span>${p.n}</span><b>${p.s} pz</b><span class="meter"><i style="width:${p.s / p.max * 100}%"></i></span></li>`).join('');
    };
    const drawCart = () => {
      cart.innerHTML = items.length ? items.map(i => `<li><span>${prods[i].n}</span><b>${eur.format(prods[i].p)}</b></li>`).join('') : '<li class="empty">Il carrello è vuoto</li>';
      cart.scrollTop = cart.scrollHeight;
      total.textContent = eur.format(items.reduce((a, i) => a + prods[i].p, 0));
      pay.disabled = !items.length;
    };
    const applySale = sale => {
      sale.items.forEach(i => { prods[i].s = Math.max(0, prods[i].s - 1); });
      dayTot += sale.tot; day.textContent = eur.format(dayTot); bump(day);
      receipts.textContent = +receipts.textContent + 1; bump(receipts);
      drawStock(sale.items);
    };
    const setSync = () => {
      if (off.checked) {
        sync.className = 'live off';
        sync.innerHTML = `<i></i>offline · ${pending.length} ${pending.length === 1 ? 'vendita' : 'vendite'} in attesa`;
        net.className = 'net off'; net.textContent = '● Offline · si vende lo stesso';
      } else {
        sync.className = 'live'; sync.innerHTML = '<i></i>sincronizzato';
        net.className = 'net'; net.textContent = '● Online';
      }
    };
    scan.addEventListener('click', () => {
      rec.classList.remove('print');
      scan.classList.remove('go'); void scan.offsetWidth; scan.classList.add('go');
      setTimeout(() => { items.push(idx++ % prods.length); drawCart(); }, reduce ? 0 : 450);
    });
    pay.addEventListener('click', () => {
      const tot = items.reduce((a, i) => a + prods[i].p, 0), now = new Date();
      rec.innerHTML = `<p class="c">NEGOZIO CENTRO</p><p class="c">${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}</p><p>--------------------------</p>` +
        items.map(i => `<p><span>${prods[i].n}</span><span>${eur.format(prods[i].p)}</span></p>`).join('') +
        `<p>--------------------------</p><p><b>TOTALE</b><b>${eur.format(tot)}</b></p><p class="c">Grazie e a presto!</p>`;
      rec.classList.remove('print'); void rec.offsetWidth; rec.classList.add('print');
      const sale = { items: [...items], tot };
      if (off.checked) { pending.push(sale); setSync(); } else applySale(sale);
      items = []; drawCart();
      showBiz(pay);
    });
    off.addEventListener('change', () => {
      if (!off.checked && pending.length) {
        sync.className = 'live off'; sync.innerHTML = '<i></i>sincronizzazione…';
        net.className = 'net'; net.textContent = '● Online';
        setTimeout(() => { pending.forEach(applySale); pending = []; setSync(); }, 1200);
      } else setSync();
    });
    drawStock(); drawCart(); setSync();
  })();

  /* --- 5. buono regalo --- */
  (() => {
    const view = $('#gfView'), verdict = $('#gfVerdict'), scanB = $('#gfScan'), useB = $('#gfUse'), card = $('.gcard');
    let used = null, busy = false, rejected = false;
    const setVerdict = (cls, html) => { verdict.className = 'verdict' + (cls ? ' ' + cls : ''); verdict.innerHTML = html; };
    scanB.addEventListener('click', () => {
      if (busy) return;
      if (rejected) {
        rejected = false; used = null; card.classList.remove('used');
        scanB.textContent = 'Scansiona il buono';
        setVerdict('', 'Nuovo buono pronto: inquadra il QR');
        return;
      }
      busy = true; useB.hidden = true;
      setVerdict('', 'Lettura del codice…');
      view.classList.remove('go'); void view.offsetWidth; view.classList.add('go');
      setTimeout(() => {
        busy = false;
        if (!used) {
          setVerdict('ok', '✓ Buono valido · € 50,00 · Profumeria Aurora');
          useB.hidden = false;
        } else {
          setVerdict('ko', `✕ Buono già utilizzato il ${used}.<br>Non si può usare due volte.`);
          rejected = true;
          scanB.textContent = 'Prova con un buono nuovo';
        }
      }, reduce ? 50 : 1800);
    });
    useB.addEventListener('click', () => {
      const d = new Date();
      used = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} alle ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      useB.hidden = true;
      card.classList.add('used');
      setVerdict('done', 'Buono incassato ✓ Ora prova a scansionarlo di nuovo.');
      scanB.textContent = 'Scansiona di nuovo';
    });
  })();
})();
