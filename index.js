const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const slides = document.querySelectorAll('.hero-slideshow .slide');
const dotsContainer = document.getElementById('slideDots');
const heroWrapper = document.querySelector('.hero-wrapper');
const sections = document.querySelectorAll('.section');
let currentSlide = 0;
let slideTimer;
let scrollTicking = false;
let revealObserver;
let sectionObserver;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setSlide(index) {
  if (!slides.length || !dotsContainer) return;

  slides[currentSlide].classList.remove('active');
  dotsContainer.children[currentSlide].classList.remove('active');
  dotsContainer.children[currentSlide].setAttribute('aria-current', 'false');

  currentSlide = index;

  slides[currentSlide].classList.add('active');
  dotsContainer.children[currentSlide].classList.add('active');
  dotsContainer.children[currentSlide].setAttribute('aria-current', 'true');
}

function startSlideshow() {
  if (prefersReducedMotion.matches || slides.length < 2) return;

  stopSlideshow();
  slideTimer = window.setInterval(() => {
    setSlide((currentSlide + 1) % slides.length);
  }, 4000);
}

function stopSlideshow() {
  if (slideTimer) {
    window.clearInterval(slideTimer);
    slideTimer = undefined;
  }
}

function setupSlideshow() {
  if (!slides.length || !dotsContainer) return;

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot' + (index === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Show slide ' + (index + 1));
    dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => {
      setSlide(index);
      startSlideshow();
    });
    dotsContainer.appendChild(dot);
  });

  heroWrapper?.addEventListener('mouseenter', stopSlideshow);
  heroWrapper?.addEventListener('mouseleave', startSlideshow);
  heroWrapper?.addEventListener('focusin', stopSlideshow);
  heroWrapper?.addEventListener('focusout', startSlideshow);
  startSlideshow();
}

function getRevealItems() {
  const revealSelectors = [
    '.section-meta',
    '.section-title',
    '.about-text',
    '.contact-intro',
    '.skill-card',
    '.project-card',
    '.tl-item',
    '.contact-card'
  ];
  const items = [];

  sections.forEach((section) => {
    section.querySelectorAll(revealSelectors.join(',')).forEach((item, index) => {
      item.classList.add('reveal-item');
      item.style.setProperty('--reveal-delay', Math.min(index * 70, 360) + 'ms');

      if (item.matches('.skill-card, .project-card, .contact-card')) {
        item.classList.add('reveal-card');
        item.style.setProperty('--reveal-duration', '620ms');
      } else if (item.matches('.tl-item')) {
        item.classList.add('reveal-left');
        item.style.setProperty('--reveal-duration', '640ms');
      } else {
        item.classList.add('reveal-copy');
      }

      items.push(item);
    });
  });

  document.querySelectorAll('.footer p').forEach((item) => {
    item.classList.add('reveal-item', 'reveal-copy');
    item.style.setProperty('--reveal-delay', '80ms');
    items.push(item);
  });

  return items;
}

const revealItems = getRevealItems();
document.body.classList.add('animations-ready');

function revealEverything() {
  sections.forEach((section) => section.classList.add('visible'));
  revealItems.forEach((item) => item.classList.add('revealed'));
}

function setupRevealObservers() {
  sectionObserver?.disconnect();
  revealObserver?.disconnect();

  if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) {
    revealEverything();
    return;
  }

  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -14% 0px',
    threshold: 0.12
  });

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.16
  });

  sections.forEach((section) => sectionObserver.observe(section));
  revealItems.forEach((item) => revealObserver.observe(item));
}

function updateHeroMotion() {
  scrollTicking = false;

  if (!heroWrapper || prefersReducedMotion.matches) return;

  const rect = heroWrapper.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

  if (rect.bottom < 0 || rect.top > viewportHeight) return;

  const progress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
  const bgY = Math.round(progress * 72);
  const depthY = Math.round(progress * 48);
  const streakY = Math.round(depthY * -0.26);
  const lineY = Math.round(depthY * 0.18);
  const contentY = Math.round(progress * -28);
  const contentOpacity = clamp(1 - progress * 1.15, 0.18, 1);
  const overlayOpacity = clamp(1 - progress * 0.18, 0.82, 1);
  const bgScale = 1.015 + progress * 0.035;

  heroWrapper.style.setProperty('--hero-bg-y', bgY + 'px');
  heroWrapper.style.setProperty('--hero-bg-scale', bgScale.toFixed(3));
  heroWrapper.style.setProperty('--hero-content-y', contentY + 'px');
  heroWrapper.style.setProperty('--hero-content-opacity', contentOpacity.toFixed(3));
  heroWrapper.style.setProperty('--hero-overlay-opacity', overlayOpacity.toFixed(3));
  heroWrapper.style.setProperty('--hero-depth-y', depthY + 'px');
  heroWrapper.style.setProperty('--hero-streak-y', streakY + 'px');
  heroWrapper.style.setProperty('--hero-line-y', lineY + 'px');
  heroWrapper.style.setProperty('--hero-line-scale', (1 + progress * 0.18).toFixed(3));
}

function requestHeroMotionUpdate() {
  if (scrollTicking || prefersReducedMotion.matches) return;

  scrollTicking = true;
  window.requestAnimationFrame(updateHeroMotion);
}

function setupScrollMotion() {
  if (!heroWrapper || prefersReducedMotion.matches) return;

  window.removeEventListener('scroll', requestHeroMotionUpdate);
  window.removeEventListener('resize', requestHeroMotionUpdate);
  updateHeroMotion();
  window.addEventListener('scroll', requestHeroMotionUpdate, { passive: true });
  window.addEventListener('resize', requestHeroMotionUpdate);
}

function resetHeroMotion() {
  if (!heroWrapper) return;

  window.removeEventListener('scroll', requestHeroMotionUpdate);
  window.removeEventListener('resize', requestHeroMotionUpdate);
  heroWrapper.style.setProperty('--hero-bg-y', '0px');
  heroWrapper.style.setProperty('--hero-bg-scale', '1.015');
  heroWrapper.style.setProperty('--hero-content-y', '0px');
  heroWrapper.style.setProperty('--hero-content-opacity', '1');
  heroWrapper.style.setProperty('--hero-overlay-opacity', '1');
  heroWrapper.style.setProperty('--hero-depth-y', '0px');
  heroWrapper.style.setProperty('--hero-streak-y', '0px');
  heroWrapper.style.setProperty('--hero-line-y', '0px');
  heroWrapper.style.setProperty('--hero-line-scale', '1');
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = document.querySelector(anchor.getAttribute('href'));

    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
      block: 'start'
    });
  });
});

setupSlideshow();
setupRevealObservers();
setupScrollMotion();

if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      stopSlideshow();
      revealEverything();
      resetHeroMotion();
    } else {
      startSlideshow();
      setupRevealObservers();
      setupScrollMotion();
    }
  });
}
