// ===== HELPERS =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const isTouch =
  document.documentElement.classList.contains('is-touch') ||
  window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1024px)').matches;
if (isTouch) document.documentElement.classList.add('is-touch');

function throttle(fn, limit) {
  let waiting = false;
  return function (...args) {
    if (!waiting) {
      fn.apply(this, args);
      waiting = true;
      setTimeout(() => (waiting = false), limit);
    }
  };
}


// ===== NAVIGATION =====
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-link');

  // No scroll listeners on touch — they stutter iOS compositing
  if (!isTouch && navbar) {
    window.addEventListener(
      'scroll',
      throttle(() => navbar.classList.toggle('scrolled', window.scrollY > 10), 100),
      { passive: true }
    );
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('active');
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    links.forEach((link) =>
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  if (isTouch) return;

  const sections = document.querySelectorAll('section[id], header[id]');
  const navItems = document.querySelectorAll('.nav-link[href^="#"]');
  window.addEventListener(
    'scroll',
    throttle(() => {
      const scrollPos = window.scrollY + 120;
      sections.forEach((section) => {
        const id = section.getAttribute('id');
        const item = document.querySelector(`.nav-link[href="#${id}"]`);
        if (!item) return;
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
          navItems.forEach((n) => n.classList.remove('active'));
          item.classList.add('active');
        }
      });
    }, 120),
    { passive: true }
  );
}

// ===== PARALLAX ENGINE =====
function initParallax() {
  if (prefersReducedMotion) return;
  const els = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!els.length) return;
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    els.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const delta = center - vh / 2;
      el.style.transform = `translate3d(0, ${(-delta * speed).toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', update);
  update();
}

// ===== HERO SCROLL-AWAY =====
function initHeroScroll() {
  if (prefersReducedMotion) return;
  const copy = document.querySelector('.hero-copy');
  if (!copy) return;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const p = Math.min(y / 600, 1);
    copy.style.transform = `translateY(${y * 0.14}px)`;
    copy.style.opacity = String(1 - p * 0.9);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

// ===== HERO MOUSE PARALLAX =====
function initHeroMouse() {
  if (prefersReducedMotion || !isFinePointer) return;
  const hero = document.getElementById('home');
  const aurora = document.querySelector('.aurora');
  const editor = document.getElementById('code-editor');
  if (!hero) return;
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (aurora) aurora.style.transform = `translate(${x * 28}px, ${y * 28}px)`;
    if (editor) {
      editor.style.transform = `perspective(1400px) rotateY(${-4 + x * 7}deg) rotateX(${1.5 - y * 7}deg)`;
    }
  });
  hero.addEventListener('mouseleave', () => {
    if (aurora) aurora.style.transform = '';
    if (editor) editor.style.transform = '';
  });
}

// ===== DIRECTIONAL ENTRY REVEALS =====
function initDirectionalReveals() {
  document.querySelectorAll('.entry.reveal').forEach((el, i) => {
    el.setAttribute('data-dir', i % 2 === 0 ? 'left' : 'right');
  });
}

// ===== MARQUEE (seamless loop) =====
function initMarquee() {
  ['marquee-track', 'marquee-track-2'].forEach((id) => {
    const track = document.getElementById(id);
    if (!track) return;
    track.innerHTML += track.innerHTML;
  });
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener(
    'scroll',
    throttle(() => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.transform = `scaleX(${Math.min(scrolled, 1)})`;
    }, 16)
  );
}

// ===== TEXT SCRAMBLE =====
class Scramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.frame = 0;
    this.queue = [];
    this.frameRequest = null;
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 28);
      const end = start + Math.floor(Math.random() * 28);
      this.queue.push({ from, to, start, end, char: '' });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve && this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

function initScramble() {
  const el = document.querySelector('[data-scramble]');
  if (!el) return;
  const text = el.getAttribute('data-scramble');
  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }
  const fx = new Scramble(el);
  setTimeout(() => fx.setText(text), 280);
  el.addEventListener('mouseenter', () => fx.setText(text));
}

// ===== CODE EDITOR TYPING REVEAL =====
function initCodeReveal() {
  const editor = document.getElementById('editor-body');
  if (!editor) return;
  const lines = Array.from(editor.querySelectorAll('.code-line'));
  if (prefersReducedMotion) {
    lines.forEach((l) => l.classList.add('typed'));
    return;
  }
  const caret = document.createElement('span');
  caret.className = 'editor-caret';
  const stepMs = isTouch ? 55 : 120;
  const startMs = isTouch ? 180 : 400;

  let i = 0;
  const revealNext = () => {
    if (i >= lines.length) {
      lines[lines.length - 1].querySelector('.code-txt').appendChild(caret);
      return;
    }
    const line = lines[i];
    line.classList.add('typed');
    if (i > 0) {
      const prevCaret = lines[i - 1].querySelector('.editor-caret');
      if (prevCaret) prevCaret.remove();
    }
    line.querySelector('.code-txt').appendChild(caret);
    i++;
    setTimeout(revealNext, stepMs);
  };
  setTimeout(revealNext, startMs);
}

// ===== COUNT UP =====
function animateCount(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString() + suffix;
    return;
  }
  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target).toLocaleString() + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ===== SPLIT TITLES =====
function initSplitTitles() {
  document.querySelectorAll('[data-split]').forEach((title) => {
    const words = title.textContent.split(' ');
    title.innerHTML = words
      .map((w, idx) => `<span class="split-word" style="transition-delay:${idx * 55}ms">${w}</span>`)
      .join(' ');
  });
}

// ===== STAGGER INDICES =====
// Assign --i to direct .reveal children of [data-stagger] groups for cascading motion
function initStaggerIndices() {
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    let i = 0;
    Array.from(group.children).forEach((child) => {
      if (child.classList.contains('reveal')) {
        child.style.setProperty('--i', i);
        i += 1;
      }
    });
  });
}

// ===== SCROLL REVEAL =====
let revealObserver;
let revealWave = 0;
function initReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // Cascade newly entering items so batches don't all snap at once
          if (!el.style.getPropertyValue('--i')) {
            el.style.setProperty('--i', String(revealWave % 5));
            revealWave += 1;
          }
          el.classList.add('in-view');
          const counter = el.querySelector('[data-count]');
          if (counter && !counter.dataset.done) {
            counter.dataset.done = '1';
            animateCount(counter);
          }
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
  }
  document.querySelectorAll('.reveal:not(.in-view)').forEach((el) => revealObserver.observe(el));
}

// ===== TIMELINE DRAW =====
function initTimeline() {
  const timeline = document.getElementById('experience-timeline');
  if (!timeline) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timeline.classList.add('in-view');
          obs.unobserve(timeline);
        }
      });
    },
    { threshold: 0.15 }
  );
  obs.observe(timeline);
}

// ===== HIGHLIGHT SPOTLIGHT =====
function initHighlightSpotlight() {
  document.querySelectorAll('.highlight').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

// ===== SECTION RAIL + IN-PAGE NAV (no scroll snap) =====
function initSectionNav() {
  // Touch: let the browser handle #hash jumps — no JS scroll hijacking
  if (isTouch) return;

  const panels = Array.from(document.querySelectorAll('.snap-panel'));
  const railItems = Array.from(document.querySelectorAll('.snap-rail-item'));
  if (!panels.length) return;

  const headerOffset = () => {
    const nav = document.querySelector('.navbar');
    return (nav ? nav.offsetHeight : 68) + 8;
  };

  const setActiveById = (id) => {
    railItems.forEach((item) => {
      item.classList.toggle('is-active', item.getAttribute('data-snap') === id);
    });
  };

  const scrollToPanel = (panel) => {
    if (!panel) return;
    const top = panel.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    setActiveById(panel.id);
  };

  const onNavClick = (e) => {
    const link = e.currentTarget;
    const id = link.getAttribute('data-snap') || link.getAttribute('href')?.slice(1);
    if (!id) return;
    const panel = panels.find((p) => p.id === id);
    if (!panel) return;
    e.preventDefault();
    scrollToPanel(panel);
  };

  railItems.forEach((item) => item.addEventListener('click', onNavClick));
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href')?.slice(1);
    if (id && panels.some((p) => p.id === id)) {
      link.addEventListener('click', onNavClick);
    }
  });

  const syncRail = throttle(() => {
    let bestId = panels[0]?.id;
    let bestDist = Infinity;
    panels.forEach((p) => {
      const d = Math.abs(p.getBoundingClientRect().top - headerOffset());
      if (d < bestDist) {
        bestDist = d;
        bestId = p.id;
      }
    });
    if (bestId) setActiveById(bestId);
  }, 120);

  window.addEventListener('scroll', syncRail, { passive: true });
  setActiveById(panels[0]?.id);
}

// ===== FORCE TOP ON LOAD / REFRESH =====
function initScrollToTop() {
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (e) {}
  // On touch: one quiet reset only — never fight the user mid-scroll
  if (isTouch) {
    if (!location.hash) window.scrollTo(0, 0);
    return;
  }
  try {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
  const toTop = () => window.scrollTo(0, 0);
  toTop();
  requestAnimationFrame(toTop);
  [0, 50, 150, 400].forEach((ms) => setTimeout(toTop, ms));
  window.addEventListener('load', toTop, { once: true });
}

// ===== MAGNETIC BUTTONS =====
function initMagnetic() {
  if (prefersReducedMotion || !isFinePointer) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = 0.35;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
}

// ===== CUSTOM CURSOR =====
function initCursor() {
  if (prefersReducedMotion || !isFinePointer) return;
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  document.body.classList.add('has-custom-cursor');

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.opacity = ring.style.opacity = '1';
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = ring.style.opacity = '0';
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  };
  loop();

  const interactive = 'a, button, input, textarea, .project-card, .skill-list span';
  document.querySelectorAll(interactive).forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
  });
}

// ===== PROJECT CARD SPOTLIGHT =====
function bindCardSpotlight(scope) {
  scope.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

// ===== PROJECTS (inlined — no extra network round-trip on mobile) =====
const PROJECTS = [
  {
    title: 'BC Environment NLP Pipeline',
    desc: 'NLP pipeline for the Government of BC that classifies scanned environmental PDFs (regex + BERT), detects duplicates (ROUGE + RapidFuzz), and falls back to local LLMs via Ollama.',
    impact: 'Reliable metadata extraction and cautious, accurate releasability predictions.',
    tech: ['Python', 'BERT', 'Ollama', 'ROUGE', 'RapidFuzz'],
    links: [
      { label: 'Repository', href: 'https://github.com/bcgov/nr-site-tagging-pilot' },
      { label: 'Docs', href: 'https://github.com/bcgov/nr-site-tagging-pilot/blob/main/README.md' },
    ],
  },
  {
    title: 'Lay Summarization Pipeline',
    desc: 'Biomedical lay-summarization system comparing zero-shot, few-shot, fine-tuned, and RAG approaches, with a full evaluation harness (ROUGE, BERTScore, SummaC, and more).',
    impact: 'Abstract-only LLaMA2 beat fine-tuned variants on limited hardware; RAG gave the best factuality.',
    tech: ['Python', 'LLaMA2', 'RAG', 'Transformers'],
    links: [{ label: 'Repository', href: 'https://github.com/jnadal14/Lay_Summarization_LLM_Pipeline' }],
  },
  {
    title: 'Agentic Moderation & Detoxification Pipeline',
    desc: 'An agentic pipeline that detects language, translates, classifies sentiment and toxicity, and conditionally detoxifies text — using LangDetect, UBC NLP Toucan, and IBM Granite.',
    impact: 'Multilingual moderation agent — 0.65 sentiment accuracy, 7.7 / 10 detox quality.',
    tech: ['Python', 'LangChain', 'IBM Granite', 'Agents'],
    links: [
      { label: 'Repository', href: 'https://github.com/jnadal14/Detoxification_LLM_Dataflow' },
      { label: 'Paper', href: 'https://github.com/jnadal14/Detoxification_LLM_Dataflow/blob/main/Final_Report.pdf' },
    ],
  },
  {
    title: 'Movie Review Corpus & UI',
    desc: 'A movie-review corpus with a custom annotation schema and UI, plus a framework comparing GPT vs human labels for sentiment analysis.',
    impact: 'Prototyped a sentiment-analysis research tool.',
    tech: ['Python', 'Corpus', 'Annotation', 'GPT'],
    links: [{ label: 'Repository', href: 'https://github.com/jnadal14/Movie_Review_Corpus_Annotation' }],
  },
];

function loadProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  grid.innerHTML = PROJECTS.map(
    (project, idx) => `
      <article class="project-card reveal">
        <div class="project-card-main">
          <div class="project-index">0${idx + 1} / 0${PROJECTS.length}</div>
          <h3 class="project-title">${project.title}</h3>
          <p class="project-description">${project.desc}</p>
        </div>
        <div class="project-card-side">
          ${
            project.impact
              ? `<div class="project-impact">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                   <span>${project.impact}</span>
                 </div>`
              : ''
          }
          <div class="project-tech">
            ${(project.tech || []).map((t) => `<span class="tag">${t}</span>`).join('')}
          </div>
          <div class="project-links">
            ${project.links
              .map(
                (link) => `
              <a href="${link.href}" target="_blank" rel="noopener" class="project-link">
                ${link.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>`
              )
              .join('')}
          </div>
        </div>
      </article>`
  ).join('');

  grid.querySelectorAll('.project-card').forEach((card, i) => {
    card.style.setProperty('--i', i);
  });
  if (document.documentElement.classList.contains('js-anim')) {
    initStaggerIndices();
    initReveal();
  } else {
    grid.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
  }
  if (isFinePointer) bindCardSpotlight(grid);
}

// ===== BACK TO TOP =====
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn || isTouch) return; // hidden on touch; zero scroll listeners
  window.addEventListener(
    'scroll',
    throttle(() => btn.classList.toggle('visible', window.scrollY > 600), 100),
    { passive: true }
  );
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  );
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Sending…</span>';
    submitBtn.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Request failed');
      showNotification('Thanks — your message has been sent.', 'success');
      form.reset();
    } catch (error) {
      showNotification('Something went wrong. Please email me directly.', 'error');
    } finally {
      submitBtn.innerHTML = original;
      submitBtn.disabled = false;
    }
  });
}

function showNotification(message, type = 'info') {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    padding: 0.85rem 1.25rem; border-radius: 0.625rem; color: #fff;
    font-size: 0.9rem; font-weight: 500; box-shadow: 0 16px 40px rgba(15,23,42,0.25);
    background: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
    transform: translateX(120%); transition: transform 0.3s ease;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => (el.style.transform = 'translateX(0)'));
  setTimeout(() => {
    el.style.transform = 'translateX(120%)';
    setTimeout(() => el.remove(), 350);
  }, 4500);
}

// ===== YEAR =====
function updateYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ===== LEGACY SERVICE WORKER CLEANUP =====
function cleanupServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  }
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

// ===== INIT =====
function initAnalytics() {
  const boot = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-M46WFFM9WL');
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-M46WFFM9WL';
    document.head.appendChild(s);
  };
  if (isTouch) {
    // Way later on phones — never compete with first scroll
    window.addEventListener('load', () => setTimeout(boot, 6000), { once: true });
    return;
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(boot, { timeout: 4000 });
  } else {
    window.addEventListener('load', () => setTimeout(boot, 1500), { once: true });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollToTop();
  initNavigation();
  loadProjects();
  updateYear();

  const useAnim = document.documentElement.classList.contains('js-anim') && !prefersReducedMotion;

  if (prefersReducedMotion || isTouch) {
    // Mobile: paint + native scroll only. No observers, marquees, or scroll handlers.
    document.querySelectorAll('.reveal, .code-line').forEach((el) => el.classList.add('in-view', 'typed'));
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = el.getAttribute('data-count');
      const suffix = el.getAttribute('data-suffix') || '';
      if (target) el.textContent = Number(target).toLocaleString() + suffix;
    });
    const timeline = document.getElementById('experience-timeline');
    if (timeline) timeline.classList.add('in-view');
    document.body.classList.add('is-ready');
    // Defer non-critical work until after first paint / idle
    const later = () => {
      initContactForm();
      cleanupServiceWorker();
      initAnalytics();
    };
    if ('requestIdleCallback' in window) requestIdleCallback(later, { timeout: 3000 });
    else setTimeout(later, 1200);
    return;
  }

  initBackToTop();
  initContactForm();
  initSectionNav();
  cleanupServiceWorker();
  initAnalytics();

  if (useAnim) {
    initMarquee();
    initScrollProgress();
    initSplitTitles();
    initCodeReveal();
    initDirectionalReveals();
    initStaggerIndices();
    initReveal();
    initTimeline();
    initScramble();
    if (isFinePointer) {
      initMagnetic();
      initCursor();
      initParallax();
      initHeroScroll();
      initHeroMouse();
      initHighlightSpotlight();
    }
  }

  requestAnimationFrame(() => {
    setTimeout(() => document.body.classList.add('is-ready'), 60);
    initScrollToTop();
  });
});
