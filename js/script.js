(() => {
  const year = document.getElementById('currentYear');
  if (year) year.textContent = new Date().getFullYear();

  const whatsappNumber = ''; // Configure com DDI + DDD + número, somente dígitos.
  const form = document.getElementById('contactForm');
  const submitButton = document.getElementById('submitButton');
  const status = document.getElementById('whatsappStatus');
  const setupNote = document.getElementById('formSetupNote');
  const feedback = document.getElementById('formFeedback');
  const configuredNumber = whatsappNumber.replace(/\D/g, '');

  if (submitButton && configuredNumber) {
    submitButton.disabled = false;
    if (status) status.textContent = 'Canal disponível para solicitar orçamento.';
    if (setupNote) setupNote.hidden = true;
  }

  if (form) {
    const fields = {
      name: { input: document.getElementById('name'), error: document.getElementById('nameError'), message: 'Informe seu nome.' },
      email: { input: document.getElementById('email'), error: document.getElementById('emailError'), message: 'Informe um e-mail válido.' },
      service: { input: document.getElementById('service'), error: document.getElementById('serviceError'), message: 'Selecione o serviço de interesse.' },
      message: { input: document.getElementById('message'), error: document.getElementById('messageError'), message: 'Conte um pouco sobre sua ideia.' }
    };

    function validateField(key) {
      const field = fields[key];
      const value = field.input.value.trim();
      let error = '';
      if (!value) error = field.message;
      else if (key === 'email' && !field.input.validity.valid) error = field.message;
      field.input.classList.toggle('is-invalid', Boolean(error));
      field.input.setAttribute('aria-invalid', String(Boolean(error)));
      field.error.textContent = error;
      return !error;
    }

    Object.keys(fields).forEach((key) => {
      fields[key].input.addEventListener('blur', () => validateField(key));
      fields[key].input.addEventListener('input', () => {
        if (fields[key].input.classList.contains('is-invalid')) validateField(key);
      });
      fields[key].input.addEventListener('change', () => {
        if (fields[key].input.classList.contains('is-invalid')) validateField(key);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!configuredNumber) return;
      const valid = Object.keys(fields).map(validateField).every(Boolean);
      feedback.className = 'form-feedback';
      feedback.textContent = '';
      if (!valid) {
        form.querySelector('.is-invalid')?.focus();
        return;
      }

      const values = new FormData(form);
      const message = [
        'Olá! Gostaria de solicitar um orçamento.',
        '',
        `Nome: ${values.get('name').trim()}`,
        `E-mail: ${values.get('email').trim()}`,
        `Serviço: ${values.get('service')}`,
        `Projeto: ${values.get('message').trim()}`
      ].join('\n');
      window.location.href = `https://wa.me/${configuredNumber}?text=${encodeURIComponent(message)}`;
    });
  }

  document.querySelectorAll('[data-portfolio-card]').forEach((card) => {
    const slides = [...card.querySelectorAll('[data-slide]')];
    const count = card.querySelector('[data-slide-count]');
    let active = 0;

    card.querySelectorAll('[data-slide-step]').forEach((button) => {
      button.addEventListener('click', () => {
        slides[active].hidden = true;
        active = (active + Number(button.dataset.slideStep) + slides.length) % slides.length;
        slides[active].hidden = false;
        count.textContent = `${active + 1} / ${slides.length}`;
      });
    });
  });

  const menu = document.getElementById('mainNav');
  document.querySelectorAll('#mainNav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (menu?.classList.contains('show') && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('#mainNav .nav-link')];
    const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach((section) => observer.observe(section));
  }
})();
