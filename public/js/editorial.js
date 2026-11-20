(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 761px)');
  const finePointer = matchMedia('(pointer: fine)');
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } },
  };
  const queryLanguage = new URLSearchParams(location.search).get('lang');
  const savedLanguage = storage.get('gravitic-lang');
  let language = [queryLanguage, savedLanguage].find(value => value === 'en' || value === 'ar') || 'en';
  let userPaused = storage.get('gravitic-motion') === 'paused';
  let motion = !reducedMotion.matches && !userPaused;
  let scheduled = false;
  let snap = true;
  let lastScrollY = 0;
  // Scroll-linked values ease toward their targets so pinned scenes glide instead of stepping.
  const eased = { hero: 0, story: 0 };
  const target = { hero: 0, story: 0 };
  let activePhase = -1;
  const header = $('.site-header');
  const heroArt = $('.hero-art');
  const progressBar = $('.reading-progress');
  const story = $('.gravity-story');
  const stickyStory = $('.gravity-sticky');
  const phases = $$('.phase');
  const phaseButtons = $$('[data-phase]');
  const nav = $('#navigation');
  const menu = $('#menu-toggle');
  const hero = $('.hero');
  let words = [];

  function splitStatement() {
    const statement = $('.word-reveal');
    const text = statement.textContent.trim();
    statement.replaceChildren();
    statement.setAttribute('aria-label', text);
    words = text.split(/\s+/).map(word => {
      const span = document.createElement('span');
      span.textContent = word;
      span.setAttribute('aria-hidden', 'true');
      statement.append(span, document.createTextNode(' '));
      return span;
    });
  }

  function setMenu(open, restoreFocus = false) {
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', language === 'ar' ? (open ? 'إغلاق القائمة' : 'فتح القائمة') : (open ? 'Close menu' : 'Open menu'));
    if (open) nav.querySelector('a').focus();
    if (restoreFocus) menu.focus();
  }

  function updateMotionLabel() {
    const button = $('#motion-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(!motion));
    button.setAttribute('aria-label', language === 'ar' ? (motion ? 'إيقاف الحركة' : 'تشغيل الحركة') : (motion ? 'Pause animation' : 'Enable animation'));
    button.querySelector('span').textContent = motion ? 'Ⅱ' : '▷';
    button.disabled = reducedMotion.matches;
    button.title = reducedMotion.matches ? (language === 'ar' ? 'تقليل الحركة مفعّل في إعدادات جهازك' : 'Reduced motion is enabled in your device settings') : '';
  }

  function applyLanguage() {
    root.lang = language;
    root.dir = 'ltr';
    $$('#home, #work, #process, #contact, .services-intro, .about-heading, #about > .section-label, #footer').forEach(section => {
      section.dir = language === 'ar' ? 'rtl' : 'ltr';
    });
    $$('[data-en][data-ar]').forEach(element => {
      element.dir = language === 'ar' ? 'rtl' : 'ltr';
      element.replaceChildren();
      element.dataset[language].split('↵').forEach((line, index) => {
        if (index) element.append(document.createElement('br'));
        element.append(document.createTextNode(line));
      });
    });
    $('#language').textContent = language === 'en' ? 'عربي' : 'EN';
    $('#language').setAttribute('aria-label', language === 'en' ? 'Switch to Arabic' : 'Switch to English');
    $('#close-identity').setAttribute('aria-label', language === 'ar' ? 'إغلاق المشروع' : 'Close project');
    document.title = 'GRAIVITIC — Ideas have gravity.';
    $('meta[name="description"]').content = 'GRAIVITIC is an independent creative digital agency in Amman. Brand strategy, websites and purposeful digital experiences.';
    const canonicalUrl = 'https://www.graivitic.com/';
    const socialTitle = 'GRAIVITIC — Creative Digital Agency in Amman';
    const socialDescription = 'Brand strategy, websites, digital marketing and purposeful creative experiences from Amman, Jordan.';
    $('link[rel="canonical"]').href = canonicalUrl;
    $('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
    $('meta[property="og:locale"]')?.setAttribute('content', 'en_US');
    $('meta[property="og:title"]')?.setAttribute('content', socialTitle);
    $('meta[property="og:description"]')?.setAttribute('content', socialDescription);
    $('meta[name="twitter:title"]')?.setAttribute('content', socialTitle);
    $('meta[name="twitter:description"]')?.setAttribute('content', socialDescription);
    setMenu(false);
    updateMotionLabel();
    splitStatement();
    measure();
  }

  $('#language').addEventListener('click', () => {
    language = language === 'en' ? 'ar' : 'en';
    storage.set('gravitic-lang', language);
    applyLanguage();
  });

  function selectPhase(index) {
    if (index === activePhase) return;
    activePhase = index;
    phases.forEach((phase, i) => {
      phase.classList.toggle('active', i === index);
      phase.setAttribute('aria-hidden', String(i !== index));
    });
    phaseButtons.forEach((button, i) => {
      button.classList.toggle('active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    $('#phase-number').textContent = String(index + 1).padStart(2, '0');
  }

  function measure() {
    snap = true;
    schedule();
  }

  function updateHeader() {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 60);
    if (Math.abs(y - lastScrollY) > 6) {
      header.classList.toggle('is-hidden', motion && y > lastScrollY && y > innerHeight * .6 && !nav.classList.contains('open'));
      lastScrollY = y;
    }
  }

  function update() {
    scheduled = false;
    const scrollable = root.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${scrollable > 0 ? clamp(scrollY / scrollable) : 0})`;
    updateHeader();
    if (!motion) return;
    target.hero = clamp(-hero.getBoundingClientRect().top / hero.offsetHeight);
    const storyTravel = Math.max(1, story.offsetHeight - stickyStory.offsetHeight);
    target.story = clamp(-story.getBoundingClientRect().top / storyTravel);
    let moving = false;
    Object.keys(eased).forEach(key => {
      const delta = target[key] - eased[key];
      if (snap || Math.abs(delta) < .0004) eased[key] = target[key];
      else { eased[key] += delta * .16; moving = true; }
    });
    snap = false;

    heroArt.style.transform = `translateY(${eased.hero * 110}px) scale(${1 + eased.hero * .09})`;
    hero.style.setProperty('--hero-p', eased.hero.toFixed(4));

    const statementBox = $('.word-reveal').getBoundingClientRect();
    const reveal = clamp((innerHeight * .85 - statementBox.top) / (innerHeight * .55));
    words.forEach((word, i) => word.classList.toggle('lit', i / words.length <= reveal));

    const storyProgress = eased.story;
    selectPhase(Math.min(2, Math.floor(target.story * 3)));
    story.style.setProperty('--rotation', `${storyProgress * 210 - 35}deg`);
    story.style.setProperty('--core-scale', String(.8 + storyProgress * .45));
    story.style.setProperty('--spread', clamp(1 - (storyProgress - .2) / .3).toFixed(3));
    story.style.setProperty('--advance', clamp((storyProgress - .62) / .38).toFixed(3));
    phaseButtons.forEach((button, i) => button.style.setProperty('--fill', clamp(storyProgress * 3 - i).toFixed(3)));
    if (moving) schedule();
  }

  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }

  function applyMotion() {
    motion = !userPaused && !reducedMotion.matches;
    root.classList.toggle('motion-enabled', motion);
    root.classList.toggle('motion-paused', !motion);
    if (!motion) {
      heroArt.style.transform = '';
      hero.style.removeProperty('--hero-p');
      header.classList.remove('is-hidden');
      ['--rotation', '--core-scale', '--spread', '--advance'].forEach(name => story.style.removeProperty(name));
      phaseButtons.forEach(button => button.style.removeProperty('--fill'));
      $$('.magnetic').forEach(element => element.style.transform = '');
    }
    updateMotionLabel();
    measure();
  }

  $('#motion-toggle')?.addEventListener('click', () => {
    userPaused = !userPaused;
    storage.set('gravitic-motion', userPaused ? 'paused' : 'enabled');
    applyMotion();
  });
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (!nav.classList.contains('open')) return;
    if (event.key === 'Escape') { setMenu(false, true); return; }
    if (event.key === 'Tab') {
      const focusable = [...nav.querySelectorAll('a'), ...$('.header-controls').querySelectorAll('button:not(:disabled)')];
      const current = focusable.indexOf(document.activeElement);
      const next = event.shiftKey ? (current - 1 + focusable.length) % focusable.length : (current + 1) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    try { history.replaceState(null, '', `#${id}`); } catch { /* History is optional (sandboxed previews). */ }
    target.scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }));
  phaseButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.phase);
    if (!motion) { selectPhase(index); return; }
    const travel = story.offsetHeight - stickyStory.offsetHeight;
    scrollTo({ top: story.getBoundingClientRect().top + scrollY + travel * (index + .4) / 3, behavior: 'smooth' });
  }));
  const dialog = $('#identity-dialog');
  $('#open-identity').addEventListener('click', () => { dialog.showModal(); document.body.classList.add('dialog-open'); });
  $('#close-identity').addEventListener('click', () => dialog.close());
  $('#dialog-contact').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: .08 });
  $$('.reveal').forEach(element => observer.observe(element));
  $$('.magnetic').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (!motion || !finePointer.matches) return;
      const box = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - box.left - box.width / 2) * .1}px,${(event.clientY - box.top - box.height / 2) * .12}px)`;
    });
    element.addEventListener('pointerleave', () => element.style.transform = '');
  });
  function updateClock() {
    $('#amman-time').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  }
  updateClock();
  setInterval(updateClock, 60000);
  $('#year').textContent = new Date().getFullYear();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  desktop.addEventListener('change', () => { setMenu(false); measure(); });
  reducedMotion.addEventListener('change', applyMotion);
  window.addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  applyLanguage();
  applyMotion();
  selectPhase(0);
})();
