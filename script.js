// ========================================
// EL Masreya - Main JavaScript
// ========================================

(function() {
  'use strict';

  // ========================================
  // State
  // ========================================
  const state = {
    lang: 'en',
    currentSlide: 0,
    heroSlides: document.querySelectorAll('.hero-slide'),
    isViewerOpen: false,
    currentImageIndex: 0,
    get portfolioImages() {
      return (typeof window !== 'undefined' && window.portfolioData) ? window.portfolioData : [];
    }
  };

  // ========================================
  // DOM Elements
  // ========================================
  const elements = {
    navbar: document.getElementById('navbar'),
    navLogo: document.getElementById('nav-logo'),
    langToggle: document.getElementById('lang-toggle'),
    mobileToggle: document.getElementById('mobile-toggle'),
    navMenu: document.getElementById('nav-menu'),
    viewer: document.getElementById('photo-viewer'),
    viewerImage: document.getElementById('viewer-image'),
    viewerClose: document.getElementById('viewer-close'),
    viewerPrev: document.getElementById('viewer-prev'),
    viewerNext: document.getElementById('viewer-next'),
    viewerCounter: document.getElementById('viewer-counter'),
    portfolioGrid: document.getElementById('portfolio-grid'),
    clientsGrid: document.getElementById('clients-grid')
  };

  // ========================================
  // Language Toggle
  // ========================================
  function setLanguage(lang) {
    state.lang = lang;
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Update all translatable elements
    document.querySelectorAll('[data-en][data-ar]').forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = el.getAttribute('data-' + lang);
      } else {
        el.textContent = el.getAttribute('data-' + lang);
      }
    });

    // Update toggle button appearance
    const currentSpan = elements.langToggle.querySelector('.lang-current');
    const altSpan = elements.langToggle.querySelector('.lang-alt');
    if (lang === 'ar') {
      currentSpan.textContent = 'AR';
      altSpan.textContent = 'EN';
    } else {
      currentSpan.textContent = 'EN';
      altSpan.textContent = 'AR';
    }

    // Update logo based on background
    updateLogo();
  }

  elements.langToggle.addEventListener('click', () => {
    setLanguage(state.lang === 'en' ? 'ar' : 'en');
  });

  // ========================================
  // Navbar Scroll Effect + Logo Switch
  // ========================================
  function updateLogo() {
    const isScrolled = window.scrollY > 50;
    const isDarkBg = isScrolled || document.querySelector('.hero');
    if (isScrolled) {
      elements.navLogo.src = 'Assests/Logo/Logo bright for dark bg.svg';
    } else {
      elements.navLogo.src = 'Assests/Logo/Logo bright for dark bg.svg';
    }
  }

  function onScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      elements.navbar.classList.add('scrolled');
    } else {
      elements.navbar.classList.remove('scrolled');
    }
    updateLogo();
    highlightActiveNav();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ========================================
  // Active Nav Link Highlighting
  // ========================================
  function highlightActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 150;
    let activeId = '';

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        activeId = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
    });
  }

  // ========================================
  // Mobile Menu
  // ========================================
  elements.mobileToggle.addEventListener('click', () => {
    elements.mobileToggle.classList.toggle('active');
    elements.navMenu.classList.toggle('active');
    document.body.style.overflow = elements.navMenu.classList.contains('active') ? 'hidden' : '';
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      elements.mobileToggle.classList.remove('active');
      elements.navMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // ========================================
  // Hero Slider
  // ========================================
  function nextHeroSlide() {
    state.heroSlides[state.currentSlide].classList.remove('active');
    state.currentSlide = (state.currentSlide + 1) % state.heroSlides.length;
    state.heroSlides[state.currentSlide].classList.add('active');
  }

  setInterval(nextHeroSlide, 6000);

  // ========================================
  // Photo Viewer (Fixed Controls)
  // ========================================
  function openViewer(index) {
    state.currentImageIndex = index;
    state.isViewerOpen = true;
    elements.viewerImage.src = state.portfolioImages[index].src;
    elements.viewerImage.alt = state.portfolioImages[index].title;
    elements.viewerCounter.textContent = `${index + 1} / ${state.portfolioImages.length}`;
    elements.viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    state.isViewerOpen = false;
    elements.viewer.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showPrevImage() {
    state.currentImageIndex = (state.currentImageIndex - 1 + state.portfolioImages.length) % state.portfolioImages.length;
    updateViewerImage();
  }

  function showNextImage() {
    state.currentImageIndex = (state.currentImageIndex + 1) % state.portfolioImages.length;
    updateViewerImage();
  }

  function updateViewerImage() {
    const img = state.portfolioImages[state.currentImageIndex];
    elements.viewerImage.src = img.src;
    elements.viewerImage.alt = img.title;
    elements.viewerCounter.textContent = `${state.currentImageIndex + 1} / ${state.portfolioImages.length}`;
  }

  // ========================================
  // Portfolio Grid Renderer
  // ========================================
  const INITIAL_ITEMS = 6;
  let portfolioExpanded = false;

  function renderPortfolio() {
    if (!elements.portfolioGrid) return;
    const svgIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';
    elements.portfolioGrid.innerHTML = state.portfolioImages.map((img, i) => `
      <div class="portfolio-item ${i >= INITIAL_ITEMS ? 'contracted' : ''}" data-index="${i}">
        <img src="${img.src}" alt="" loading="lazy">
        <div class="portfolio-overlay">
          <button class="portfolio-view" aria-label="View Image">${svgIcon}</button>
        </div>
      </div>
    `).join('');

    // Bind click events to dynamically rendered items
    elements.portfolioGrid.querySelectorAll('.portfolio-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(item.dataset.index, 10);
        openViewer(index);
      });
    });

    // Toggle button visibility
    const toggleBtn = document.getElementById('portfolio-toggle');
    if (toggleBtn) {
      toggleBtn.style.display = state.portfolioImages.length > INITIAL_ITEMS ? 'inline-flex' : 'none';
    }
  }

  function togglePortfolio() {
    const toggleBtn = document.getElementById('portfolio-toggle');
    if (!toggleBtn) return;
    portfolioExpanded = !portfolioExpanded;
    elements.portfolioGrid.querySelectorAll('.portfolio-item').forEach(item => {
      const index = parseInt(item.dataset.index, 10);
      if (index >= INITIAL_ITEMS) {
        item.classList.toggle('contracted', !portfolioExpanded);
      }
    });
    // Update button text
    const enText = portfolioExpanded ? 'View Less' : 'View More';
    const arText = portfolioExpanded ? 'عرض أقل' : 'عرض المزيد';
    toggleBtn.setAttribute('data-en', enText);
    toggleBtn.setAttribute('data-ar', arText);
    toggleBtn.textContent = state.lang === 'ar' ? arText : enText;
    // Smooth scroll
    if (portfolioExpanded) {
      toggleBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  document.getElementById('portfolio-toggle')?.addEventListener('click', togglePortfolio);

  elements.viewerClose.addEventListener('click', closeViewer);
  elements.viewerPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrevImage(); });
  elements.viewerNext.addEventListener('click', (e) => { e.stopPropagation(); showNextImage(); });
  elements.viewer.querySelector('.viewer-backdrop').addEventListener('click', closeViewer);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!state.isViewerOpen) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });

  // ========================================
  // Clients Grid Renderer
  // ========================================
  const clientsList = [
    { src: 'Assests/Clients/A-build Egypt.png', title: 'A-build Egypt' },
    { src: 'Assests/Clients/AMOC.png', title: 'AMOC' },
    { src: 'Assests/Clients/ANRPC.png', title: 'ANRPC' },
    { src: 'Assests/Clients/EgyptAnode.png', title: 'Egypt Anode' },
    { src: 'Assests/Clients/Egyptian Petrochemicals Company.png', title: 'Egyptian Petrochemicals Company' },
    { src: 'Assests/Clients/El Nasr Mining.png', title: 'El Nasr Mining' },
    { src: 'Assests/Clients/ETHYDCO.png', title: 'ETHYDCO' },
    { src: 'Assests/Clients/Ezz-Steel.png', title: 'Ezz Steel' },
    { src: 'Assests/Clients/Hassan Allam.png', title: 'Hassan Allam' },
    { src: 'Assests/Clients/Midor.png', title: 'Midor' },
    { src: 'Assests/Clients/Misr Phosphate.png', title: 'Misr Phosphate' },
    { src: 'Assests/Clients/Petromaint.png', title: 'Petromaint' },
    { src: 'Assests/Clients/Xervon.png', title: 'Xervon' },
    { src: 'Assests/Clients/Egyptian Propylene & Polypropylene.png', title: 'Egyptian Propylene & Polypropylene' }
  ];

  function renderClients() {
    if (!elements.clientsGrid) return;
    elements.clientsGrid.innerHTML = clientsList.map(client => `
      <div class="client-logo" title="${client.title}">
        <img src="${client.src}" alt="${client.title}" loading="lazy">
      </div>
    `).join('');
  }

  // ========================================
  // Scroll Reveal Animation
  // ========================================
  function initReveal() {
    const reveals = document.querySelectorAll('.service-card, .portfolio-item, .about-grid, .contact-card, .client-logo');
    reveals.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 3) * 0.1}s`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = elements.navbar.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ========================================
  // Initialize
  // ========================================
  function init() {
    onScroll();
    renderPortfolio();
    renderClients();
    initReveal();
    highlightActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
