// Hero Slideshow - Scans images folder for any JPG/PNG files
class HeroSlideshow {
    constructor() {
        this.slideshow = document.getElementById('heroSlideshow');
        this.slideNav = document.getElementById('slideNav');
        this.prevBtn = document.getElementById('prevSlide');
        this.nextBtn = document.getElementById('nextSlide');
        this.slides = [];
        this.currentSlide = 0;
        this.slideInterval = null;
        this.init();
    }

    async init() {
        console.log('Hero slideshow initializing...');
        await this.scanHeroImages();
        if (this.slides.length > 0) {
            this.renderSlides();
            this.bindEvents();
            this.startAutoSlide();
        } else {
            console.warn('No hero images found');
            this.showFallbackImage();
        }
    }

    async scanHeroImages() {
        try {
            console.log('Scanning for hero images...');
            
            // Try to fetch from images directory
            const response = await fetch('images/');
            if (!response.ok) {
                throw new Error('Cannot access images directory');
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            const imageFiles = [];
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && this.isImageFile(href)) {
                    // Skip thumbnails and specific excluded files
                    if (!href.toLowerCase().includes('thumb') && 
                        !href.toLowerCase().includes('logo')) {
                        imageFiles.push(`images/${href}`);
                    }
                }
            });
            
            this.slides = imageFiles;
            console.log('Found hero images:', this.slides);
            
        } catch (error) {
            console.log('Directory scanning failed, trying alternative method...');
            await this.scanImagesAlternative();
        }
    }

    async scanImagesAlternative() {
        // Alternative method: try common image names
        const commonImages = [
            'hero1.jpg', 'hero2.jpg', 'hero3.jpg',
            'slide1.jpg', 'slide2.jpg', 'slide3.jpg',
            'background1.jpg', 'background2.jpg',
            'banner1.jpg', 'banner2.jpg'
        ];
        
        const foundImages = [];
        
        for (const imgName of commonImages) {
            const exists = await this.checkImageExists(`images/${imgName}`);
            if (exists) {
                foundImages.push(`images/${imgName}`);
            }
        }
        
        // If no common images found, try any JPG/PNG files
        if (foundImages.length === 0) {
            const extensions = ['jpg', 'jpeg', 'png', 'webp'];
            for (const ext of extensions) {
                const testImage = `images/image1.${ext}`;
                const exists = await this.checkImageExists(testImage);
                if (exists) {
                    foundImages.push(testImage);
                    break;
                }
            }
        }
        
        this.slides = foundImages;
    }

    async checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        return imageExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
    }

    showFallbackImage() {
        if (!this.slideshow) return;
        
        // Create a simple gradient background as fallback
        this.slideshow.innerHTML = `
            <div class="slide active">
                <div style="width:100%;height:100%;background:linear-gradient(135deg, #2c3e50 0%, #3498db 100%);display:flex;align-items:center;justify-content:center;color:white;font-size:2rem;">
                    <div style="text-align:center;">
                        <i class="fas fa-building" style="font-size:4rem;margin-bottom:1rem;"></i>
                        <p>المصرية للمقاولات</p>
                        <p>El-Masreya Contracting</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSlides() {
        if (!this.slideshow) return;

        // Create slide elements
        this.slideshow.innerHTML = this.slides.map((img, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="${img}" alt="Slide ${index + 1}" loading="lazy">
            </div>
        `).join('');

        // Create navigation dots
        if (this.slideNav) {
            this.slideNav.innerHTML = this.slides.map((_, index) => `
                <button class="slide-btn ${index === 0 ? 'active' : ''}" data-slide="${index}"></button>
            `).join('');

            // Bind dot clicks
            document.querySelectorAll('.slide-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.goToSlide(parseInt(e.target.dataset.slide));
                });
            });
        }
    }

    bindEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Pause on hover
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.addEventListener('mouseenter', () => this.pauseAutoSlide());
            hero.addEventListener('mouseleave', () => this.startAutoSlide());
        }
    }

    goToSlide(index) {
        // Remove active class from all slides
        document.querySelectorAll('.slide').forEach(slide => {
            slide.classList.remove('active');
        });
        document.querySelectorAll('.slide-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current slide
        this.currentSlide = index;
        const slides = document.querySelectorAll('.slide');
        const btns = document.querySelectorAll('.slide-btn');
        
        if (slides[this.currentSlide]) {
            slides[this.currentSlide].classList.add('active');
        }
        if (btns[this.currentSlide]) {
            btns[this.currentSlide].classList.add('active');
        }
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    startAutoSlide() {
        if (this.slides.length > 1) {
            this.slideInterval = setInterval(() => {
                this.nextSlide();
            }, 5000);
        }
    }

    pauseAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing hero slideshow...');
    window.heroSlideshow = new HeroSlideshow();
});