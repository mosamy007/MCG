// Language Manager - Applies to all pages
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'ar';
        this.init();
    }

    init() {
        this.applyLanguage(this.currentLang);
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            });
        });
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
        
        // Dispatch custom event for other scripts to listen to
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }

    applyLanguage(lang) {
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Show/hide language-specific content
        document.querySelectorAll('.lang-specific').forEach(el => {
            el.style.display = 'none';
        });

        // Show content for current language
        const langClass = lang === 'ar' ? 'lang-ar' : 'lang-en';
        document.querySelectorAll(`.${langClass}`).forEach(el => {
            el.style.display = 'block';
        });

        // Update language button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// Mobile Menu Toggle
class MobileMenu {
    constructor() {
        this.toggle = document.getElementById('mobileMenuToggle');
        this.menu = document.getElementById('navMenu');
        this.init();
    }

    init() {
        if (this.toggle && this.menu) {
            this.toggle.addEventListener('click', () => this.toggleMenu());
            
            // Close menu when link clicked
            this.menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
        }
    }

    toggleMenu() {
        this.menu.classList.toggle('active');
        this.toggle.classList.toggle('active');
    }

    closeMenu() {
        this.menu.classList.remove('active');
        this.toggle.classList.remove('active');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language manager first
    window.languageManager = new LanguageManager();
    
    // Initialize mobile menu
    window.mobileMenu = new MobileMenu();
});