document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Año dinámico en el footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menú móvil a pantalla completa
  const header = document.getElementById('header');
  const navToggle = document.getElementById('nav-toggle');

  if (navToggle && header) {
    const setMenuOpen = (isOpen) => {
      header.classList.toggle('nav-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    navToggle.addEventListener('click', () => {
      setMenuOpen(!header.classList.contains('nav-open'));
    });

    document.querySelectorAll('.main-nav a, .header-cta').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
  }

  // Header transparente al inicio, con fondo oscuro tipo cristal al hacer scroll
  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Botón "descubre más" del hero
  const scrollCue = document.getElementById('scroll-cue');
  const promoSection = document.getElementById('promo');
  if (scrollCue && promoSection) {
    scrollCue.addEventListener('click', () => {
      promoSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // Animaciones al hacer scroll (reveal)
  const revealTargets = document.querySelectorAll(
    '.service-card, .gallery-item, .testimonial-card, .promo-card, .promo-visual, .contact-copy, .contact-card-visual, .spotlight-content'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => observer.observe(el));

  /* =========================================================
     HERO — motion de nivel Big Tech (JS nativo, sin librerías)
     ========================================================= */
  const hero = document.getElementById('hero');
  const heroMedia = document.getElementById('hero-media');
  const heroAurora = document.getElementById('hero-aurora');
  const floatCard1 = document.getElementById('float-card-1');
  const floatCard2 = document.getElementById('float-card-2');
  const spotlightMedia = document.querySelector('.spotlight-media');

  if (hero && !prefersReducedMotion) {
    // --- Parallax de scroll (transform, no top/left → fluido en GPU) ---
    let ticking = false;
    const applyScrollParallax = () => {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight || 1;
      const progress = Math.min(scrollY / heroHeight, 1.4);

      if (heroMedia) {
        heroMedia.style.transform = `translate3d(0, ${progress * 60}px, 0) scale(${1 + progress * 0.06})`;
      }
      if (spotlightMedia) {
        const rect = spotlightMedia.getBoundingClientRect();
        const viewportH = window.innerHeight || 1;
        if (rect.top < viewportH && rect.bottom > 0) {
          const centered = (rect.top + rect.height / 2 - viewportH / 2) / viewportH;
          spotlightMedia.style.transform = `translate3d(0, ${centered * -40}px, 0) scale(1.06)`;
        }
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(applyScrollParallax);
        ticking = true;
      }
    }, { passive: true });
    applyScrollParallax();

    // --- Parallax de mouse con suavizado (lerp) para el aurora y las tarjetas flotantes ---
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      });

      const lerp = (a, b, n) => a + (b - a) * n;

      const raf = () => {
        currentX = lerp(currentX, targetX, 0.06);
        currentY = lerp(currentY, targetY, 0.06);
        const t = performance.now() / 1000;

        if (heroAurora) {
          heroAurora.style.transform = `translate(calc(-50% + ${currentX * 24}px), calc(-50% + ${currentY * 18}px))`;
        }
        if (floatCard1) {
          const idleY = Math.sin(t * 0.6) * 8;
          floatCard1.style.transform = `translate3d(${currentX * 10}px, ${currentY * 10 + idleY}px, 0) rotate(${currentX * 1.2}deg)`;
        }
        if (floatCard2) {
          const idleY = Math.sin(t * 0.5 + 2) * 8;
          floatCard2.style.transform = `translate3d(${currentX * -12}px, ${currentY * -12 + idleY}px, 0) rotate(${currentX * -1.2}deg)`;
        }
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  /* =========================================================
     Red de partículas conectadas en el hero (canvas nativo)
     ========================================================= */
  const canvas = document.getElementById('hero-canvas');
  if (canvas && hero && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const MAX_DIST = 175;
    // Paleta de la marca: dorado, rosa y azul, como el logo arcoíris
    const COLORS = ['198, 160, 92', '217, 156, 174', '134, 172, 200', '227, 204, 154'];

    let width = 0, height = 0, particles = [];
    let animId = null;
    let running = false;

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const count = Math.min(50, Math.max(18, Math.round(area / 22000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.6 + 1.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.strokeStyle = `rgba(198, 160, 92, ${(1 - dist / MAX_DIST) * 0.42})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color}, 0.85)`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      animId = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    };

    resize();
    start();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    // Pausa la animación cuando el hero no está en pantalla o la pestaña está oculta
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      });
    }, { threshold: 0 });
    visibilityObserver.observe(hero);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (hero.getBoundingClientRect().bottom > 0) start();
    });
  }

  // Efecto máquina de escribir en la segunda línea del título del hero:
  // itera para siempre entre varias frases (escribe, pausa, borra, siguiente)
  const TYPE_PHRASES = [
    'el evento de tus sueños',
    'tu revelación de género',
    'tu baby shower ideal',
    'un pedacito de cielo'
  ];
  const TYPE_SPEED = 55;
  const DELETE_SPEED = 30;
  const PAUSE_FULL = 1900;
  const PAUSE_EMPTY = 400;

  const runTypewriter = () => {
    const el = document.querySelector('.hero-typewriter');
    if (!el) return;

    if (prefersReducedMotion) {
      el.textContent = TYPE_PHRASES[0];
      return;
    }

    el.classList.add('is-typing');
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const word = TYPE_PHRASES[wordIndex];

      if (!deleting) {
        charIndex++;
        el.textContent = word.slice(0, charIndex);
        if (charIndex >= word.length) {
          deleting = true;
          setTimeout(tick, PAUSE_FULL);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        charIndex--;
        el.textContent = word.slice(0, charIndex);
        if (charIndex <= 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % TYPE_PHRASES.length;
          setTimeout(tick, PAUSE_EMPTY);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    };

    setTimeout(tick, 900);
  };

  // Preloader: se oculta cuando la página termina de cargar
  const preloader = document.getElementById('preloader');
  const finishLoading = () => {
    if (preloader) {
      preloader.classList.add('is-hidden');
      setTimeout(() => preloader.remove(), 700);
    }
    document.body.classList.add('loaded');
    runTypewriter();
  };

  if (document.readyState === 'complete') {
    setTimeout(finishLoading, 350);
  } else {
    window.addEventListener('load', () => setTimeout(finishLoading, 350));
  }
});
