(() => {
  const yearElement = document.getElementById('currentYear');
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  // ===== Rolagem animada ao clicar nos links internos =====
  const header = document.querySelector('.site-header');
  const menu = document.getElementById('mainNav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let rafId = 0;

  function animateScrollTo(targetY, onDone) {
    cancelAnimationFrame(rafId);
    const startY = window.scrollY;
    const endY = Math.max(0, Math.min(targetY, document.documentElement.scrollHeight - window.innerHeight));
    const distance = endY - startY;

    if (reduceMotion.matches || Math.abs(distance) < 2) {
      window.scrollTo({ top: endY, behavior: 'instant' });
      if (onDone) onDone();
      return;
    }

    const duration = Math.min(1000, Math.max(500, Math.abs(distance) * 0.4));
    const userEvents = ['wheel', 'touchstart', 'keydown'];
    const cleanup = () => userEvents.forEach((name) => window.removeEventListener(name, cancel));
    function cancel() { cancelAnimationFrame(rafId); cleanup(); } // o usuário assumiu o controle
    userEvents.forEach((name) => window.addEventListener(name, cancel, { passive: true }));

    let startTime = null;
    const step = (now) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo({ top: startY + distance * easeInOutCubic(progress), behavior: 'instant' });
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        cleanup();
        if (onDone) onDone();
      }
    };
    rafId = requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const hash = link.getAttribute('href');
    if (hash.length < 2 || !document.querySelector(hash)) return;

    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const target = document.querySelector(hash);

      const run = () => {
        const y = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
        animateScrollTo(y, () => {
          history.pushState(null, '', hash);
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        });
      };

      // No celular, espera o menu fechar para medir a posição final corretamente
      if (menu && menu.classList.contains('show') && window.bootstrap) {
        menu.addEventListener('hidden.bs.collapse', run, { once: true });
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
      } else {
        run();
      }
    });
  });

  // ===== Destaque do item de menu da seção visível =====
  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('#mainNav .nav-link')];
    const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href')));
    const visible = new Set();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      const current = sections.filter((s) => visible.has(s)).pop(); // a mais abaixo na página
      navLinks.forEach((link, i) => {
        const on = sections[i] === current;
        link.classList.toggle('active', on);
        if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach((s) => s && spy.observe(s));

    // Pausa a animação decorativa quando o hero sai da tela
    const hero = document.querySelector('.hero');
    if (hero) new IntersectionObserver(([e]) => hero.classList.toggle('is-offscreen', !e.isIntersecting)).observe(hero);
  }

  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name: { input: document.getElementById('name'), error: document.getElementById('nameError'), message: 'Informe seu nome completo.' },
    email: { input: document.getElementById('email'), error: document.getElementById('emailError'), message: 'Informe um e-mail válido.' },
    subject: { input: document.getElementById('subject'), error: document.getElementById('subjectError'), message: 'Informe o assunto da mensagem.' },
    message: { input: document.getElementById('message'), error: document.getElementById('messageError'), message: 'Escreva uma mensagem.' }
  };
  const submitButton = document.getElementById('submitButton');
  const feedback = document.getElementById('formFeedback');
  let processing = false;

  function validateField(key) {
    const field = fields[key];
    const value = field.input.value.trim();
    let error = '';
    if (!value) error = field.message;
    else if (key === 'email' && !field.input.validity.valid) error = field.message;

    field.input.classList.toggle('is-invalid', Boolean(error));
    field.input.classList.toggle('is-valid', !error);
    field.input.setAttribute('aria-invalid', String(Boolean(error)));
    field.error.textContent = error;
    return !error;
  }

  Object.keys(fields).forEach((key) => {
    fields[key].input.addEventListener('blur', () => validateField(key));
    fields[key].input.addEventListener('input', () => {
      if (fields[key].input.classList.contains('is-invalid')) validateField(key);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (processing) return;

    const valid = Object.keys(fields).map(validateField).every(Boolean);
    feedback.className = 'form-feedback';
    feedback.textContent = '';
    if (!valid) {
      form.querySelector('.is-invalid')?.focus();
      feedback.textContent = 'Revise os campos destacados antes de continuar.';
      feedback.classList.add('is-visible', 'error');
      return;
    }

    processing = true;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Processando... <span class="spinner-border spinner-border-sm ms-2" aria-hidden="true"></span>';
    window.setTimeout(() => {
      feedback.textContent = 'Demonstração concluída: sua mensagem não foi enviada, pois este site ainda não possui um serviço de envio configurado.';
      feedback.classList.add('is-visible', 'success');
      form.reset();
      Object.values(fields).forEach(({ input, error }) => {
        input.classList.remove('is-valid', 'is-invalid');
        input.removeAttribute('aria-invalid');
        error.textContent = '';
      });
      processing = false;
      submitButton.disabled = false;
      submitButton.innerHTML = 'Enviar mensagem <i class="bi bi-arrow-right ms-2" aria-hidden="true"></i>';
      feedback.focus();
    }, 600);
  });

})();
