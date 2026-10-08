const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

const logoReloadKey = 'smokeblusser-logo-reload';
if (sessionStorage.getItem(logoReloadKey)) {
  sessionStorage.removeItem(logoReloadKey);
  history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  window.addEventListener('load', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    history.scrollRestoration = 'auto';
  }, { once: true });
}
document.querySelectorAll('.brand, .footer__logo').forEach((logo) => {
  logo.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (document.body.classList.contains('content-layout')) return;
    event.preventDefault();
    sessionStorage.setItem(logoReloadKey, 'true');
    history.scrollRestoration = 'manual';
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.location.reload();
  });
});

const header = document.querySelector('[data-header]');
let headerHeight = header?.offsetHeight || 0;
let headerFrame = 0;
let previousProgress = -1;
const updateHeader = () => {
  headerFrame = 0;
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 20);
  const progress = Math.min(1, Math.max(0, window.scrollY / 180));
  if (progress === previousProgress) return;
  previousProgress = progress;
  const scale = 1 - .34 * progress;
  const top = 18 - 10 * progress;
  header.style.setProperty('--logo-scale', scale);
  header.style.setProperty('--logo-top', `${top}px`);
  header.style.setProperty('--logo-shadow-cutoff', `${(headerHeight - top) / scale}px`);
};
const scheduleHeader = () => {
  if (!headerFrame) headerFrame = requestAnimationFrame(updateHeader);
};
window.addEventListener('scroll', scheduleHeader, { passive: true });
window.addEventListener('resize', () => {
  headerHeight = header?.offsetHeight || 0;
  previousProgress = -1;
  scheduleHeader();
}, { passive: true });
updateHeader();

// Reveal copy once; keep photos and their layout completely still.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heroCopy = document.querySelector('.hero__content');
  const revealItems = heroCopy?.querySelectorAll(':scope > h1, :scope > p, :scope > .actions');
  if (heroCopy && revealItems?.length) {
    revealItems.forEach((item, index) => {
      item.classList.add('content-reveal');
      item.style.setProperty('--reveal-delay', `${index * 100}ms`);
    });
    const reveal = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setTimeout(() => revealItems.forEach(item => item.classList.add('is-revealed')), 150);
      }));
    };
    // Do not wait for below-the-fold images before showing the banner copy.
    reveal();
  }
  const copyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      copyObserver.unobserve(entry.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('main .section-heading, .smoker__copy, .story__copy, .booking__copy').forEach(group => {
    [...group.children].filter(item => item.matches('h2,h3,p,a.button,.actions,.button')).forEach((item, index) => {
      item.classList.add('content-reveal');
      item.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 100}ms`);
      copyObserver.observe(item);
    });
  });
}

// Keep decorative smoke idle outside the viewport or in a hidden tab.
const smokeLayers = [...document.querySelectorAll('.smoke-organic')];
const smokeVisibility = new WeakMap();
const updateSmoke = (layer) => {
  layer.classList.toggle('is-paused', document.hidden || !smokeVisibility.get(layer));
};
const smokeObserver = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    smokeVisibility.set(target, isIntersecting);
    updateSmoke(target);
  });
});
smokeLayers.forEach(layer => {
  layer.classList.add('is-paused');
  smokeObserver.observe(layer);
});
document.addEventListener('visibilitychange', () => smokeLayers.forEach(updateSmoke));

toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
  document.body.style.overflow = open ? '' : 'hidden';
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
    toggle?.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.style.overflow = '';
    toggle?.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!header?.contains(event.target)) {
    toggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
    document.body.style.overflow = '';
  }
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  toggle?.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
  document.body.style.overflow = '';
}));

const dialog = document.querySelector('[data-video-dialog]');
// Measure image-relative anchor points so connections survive every layout change.
const smokerVisual = document.querySelector('.smoker__visual');
if (smokerVisual) {
  const photo = smokerVisual.querySelector('img');
  const overlay = smokerVisual.querySelector('.smoker__connections');
  const anchors = [[.22, .20], [.73, .46], [.045, .73]];
  const labels = [...smokerVisual.querySelectorAll('.annotation')];
  const drawConnections = () => {
    const box = smokerVisual.getBoundingClientRect();
    const image = photo.getBoundingClientRect();
    if (!box.width || !image.height) return;
    overlay.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const mobile = window.matchMedia('(max-width:860px)').matches;
    overlay.innerHTML = labels.map((label, i) => {
      const text = label.getBoundingClientRect();
      const x = image.left - box.left + image.width * anchors[i][0];
      const y = image.top - box.top + image.height * anchors[i][1];
      const endX = text.left - box.left - (mobile ? 8 : 10);
      const endY = text.top - box.top + text.height / 2;
      const route = `M ${x} ${y} V ${endY} H ${endX}`;
      return `<path d="${route}"/><circle cx="${x}" cy="${y}" r="7"/>`;
    }).join('');
  };
  new ResizeObserver(drawConnections).observe(smokerVisual);
  photo.addEventListener('load', drawConnections);
  document.fonts.ready.then(drawConnections);
  window.addEventListener('resize', drawConnections, { passive: true });
  drawConnections();
}
document.querySelector('[data-close-video]')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;

  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${visible.target.id}`;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.1, 0.3] });

observedSections.forEach((section) => sectionObserver.observe(section));

const gallery = document.querySelector('.gallery-slider');
if (gallery) {
  const track = gallery.querySelector('.collage');
  const slides = [...track.children];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  const cycleLength = slides.length * 2;
  let position = cycleLength;
  let phase = 0;
  let busy = false;
  let timer;
  const makeClone = (slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    return clone;
  };
  const cycle = [...slides, ...slides];
  track.append(...slides.map(makeClone));
  track.prepend(...cycle.map(makeClone));
  track.append(...cycle.map(makeClone));
  // Measure only when the viewport resizes, not during each touch event.
  let slideOffset = 0;
  const offset = () => slideOffset;
  const measureSlides = () => {
    slideOffset = track.children[1].offsetLeft - track.children[0].offsetLeft;
    paint();
  };
  const paint = (animate = false) => {
    track.style.transition = animate && !reducedMotion.matches ? '' : 'none';
    track.style.transform = `translateX(${-position * offset()}px)`;
    const mobile = window.matchMedia('(max-width:860px)').matches;
    [...track.children].forEach((slide, number) => {
      const visible = number >= position && number < position + (mobile ? 2 : 3);
      slide.inert = !visible;
      slide.setAttribute('aria-hidden', String(!visible));
    });
  };
  const move = (step) => {
    if (busy || !step) return;
    busy = true;
    position += step;
    phase = ((phase + step) % cycleLength + cycleLength) % cycleLength;
    index = ((index + step) % slides.length + slides.length) % slides.length;
    paint(true);
    gallery.querySelector('[data-gallery-status]').textContent = `Foto ${index + 1} van ${slides.length}`;
    clearTimeout(timer);
    timer = setTimeout(() => {
      position = cycleLength + phase;
      paint();
      busy = false;
    }, reducedMotion.matches ? 0 : 570);
  };
  gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => move(-1));
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => move(1));
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  let touchStart;
  gallery.addEventListener('touchstart', (event) => {
    if (busy) return;
    touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY};
  }, {passive:true});
  gallery.addEventListener('touchmove', (event) => {
    if (!touchStart || busy) return;
    const dx = event.touches[0].clientX - touchStart.x;
    const dy = event.touches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      track.style.transition = 'none';
      track.style.transform = `translateX(${-position * offset() + Math.max(-offset(), Math.min(offset(), dx))}px)`;
    }
  }, {passive:true});
  gallery.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    else paint(true);
    touchStart = null;
  }, {passive:true});
  gallery.addEventListener('touchcancel', () => {
    touchStart = null;
    paint(true);
  }, {passive:true});
  gallery.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-video]')) dialog?.showModal();
  });
  new ResizeObserver(measureSlides).observe(gallery.querySelector('.gallery-slider__viewport'));
  measureSlides();
}
