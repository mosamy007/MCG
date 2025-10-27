// Dynamic Project Loader with Fullscreen Image Viewer
class DynamicProjectLoader {
    constructor() {
        this.projectFolder = this.getProjectFolderFromURL();
        this.currentLang = localStorage.getItem('language') || 'ar';
        this.project = null;
        this.currentImageIndex = 0;
        this.init();
    }

    getProjectFolderFromURL() {
        const params = new URLSearchParams(window.location.search);
        const folder = params.get('folder');
        // Decode the folder name from URL
        return folder ? decodeURIComponent(folder) : null;
    }

    async init() {
        if (!this.projectFolder) {
            this.showError('Project not found');
            return;
        }

        await this.loadProject();
        this.bindLanguageEvents();
        this.bindModalEvents();
        this.applyInitialLanguage();
    }

    async loadProject() {
        try {
            this.project = await this.scanProjectFolder(this.projectFolder);
            
            if (this.project) {
                this.renderProject();
            } else {
                this.showError('Project not found');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            this.showError('Error loading project');
        }
    }

    async scanProjectFolder(folderName) {
        try {
            const folderPath = `Gallery/${encodeURIComponent(folderName)}`;
            const response = await fetch(folderPath);
            if (!response.ok) {
                throw new Error('Folder not found');
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            const images = [];
            let thumb = null;
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && this.isImageFile(href)) {
                    const imagePath = `${folderPath}/${href}`;
                    
                    if (href.toLowerCase() === 'thumb.jpg') {
                        thumb = imagePath;
                    } else {
                        images.push({
                            path: imagePath,
                            name: href
                        });
                    }
                }
            });
            
            // Generate project name from folder name
            const projectName = this.generateProjectName(folderName);
            
            if (images.length > 0 || thumb) {
                return {
                    folder: folderName,
                    name: projectName.ar,
                    nameEn: projectName.en,
                    thumb: thumb,
                    images: images
                };
            }
            
            return null;
        } catch (error) {
            console.log(`Error scanning project folder ${folderName}:`, error);
            return null;
        }
    }

    generateProjectName(folderName) {
        // Clean folder name and generate proper project name
        let cleanName = folderName
            .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
            .replace(/%20/g, ' ') // Replace %20 with spaces
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
        
        console.log('Processing project folder name:', folderName, '->', cleanName);
        
        // Check if the name contains both English and Arabic (has a hyphen separator)
        const hyphenIndex = cleanName.indexOf('-');
        if (hyphenIndex > 0) {
            const englishPart = cleanName.substring(0, hyphenIndex).trim();
            const arabicPart = cleanName.substring(hyphenIndex + 1).trim();
            
            console.log('Split project names - English:', englishPart, 'Arabic:', arabicPart);
            
            // Check if arabicPart actually contains Arabic characters
            const hasArabic = /[\u0600-\u06FF]/.test(arabicPart);
            
            if (hasArabic) {
                return {
                    ar: arabicPart,
                    en: englishPart
                };
            }
        }
        
        // Check if the name is primarily Arabic (contains Arabic characters)
        const hasArabic = /[\u0600-\u06FF]/.test(cleanName);
        if (hasArabic) {
            return {
                ar: cleanName,
                en: `Project ${cleanName}`
            };
        }
        
        // Default: English name with Arabic prefix
        return {
            ar: `مشروع ${cleanName}`,
            en: cleanName
        };
    }

    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        return imageExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
    }

    renderProject() {
        if (!this.project) return;

        // Update page title
        const title = this.currentLang === 'ar' ? this.project.name : this.project.nameEn;
        document.title = `${title} - المصرية للمقاولات`;

        // Render hero section
        this.renderHero();

        // Render gallery
        this.renderGallery();
    }

    renderHero() {
        const hero = document.getElementById('heroContent');
        if (!hero) return;

        const title = this.currentLang === 'ar' ? this.project.name : this.project.nameEn;

        hero.innerHTML = `
            <h1 class="hero-title">${title}</h1>
            <p class="hero-description">${this.currentLang === 'ar' ? 'معرض الصور' : 'Photo Gallery'}</p>
        `;
    }

    renderGallery() {
        const mainImage = document.getElementById('mainImage');
        const mainImageContainer = document.getElementById('mainImageContainer');
        const thumbnailGallery = document.getElementById('thumbnailGallery');

        if (!this.project.images.length) {
            this.showNoImages();
            return;
        }

        // Set main image to first image
        mainImage.src = this.project.images[0].path;
        mainImage.alt = this.project.name;

        // Make main image clickable for fullscreen
        mainImageContainer.addEventListener('click', () => {
            this.openModal(0);
        });

        // Generate thumbnails
        thumbnailGallery.innerHTML = this.project.images.map((img, index) => `
            <div class="thumbnail-container ${index === 0 ? 'active' : ''}">
                <img 
                    src="${img.path}" 
                    alt="${this.project.name} - ${index + 1}" 
                    class="thumbnail"
                    data-index="${index}"
                    loading="lazy">
            </div>
        `).join('');

        // Add click handler to thumbnails
        this.bindThumbnailEvents();
    }

    bindThumbnailEvents() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.getElementById('mainImage');
        const mainImageContainer = document.getElementById('mainImageContainer');
        
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                // Update main image
                mainImage.src = this.project.images[index].path;
                
                // Update active thumbnail
                document.querySelectorAll('.thumbnail-container').forEach(container => {
                    container.classList.remove('active');
                });
                thumb.parentElement.classList.add('active');

                // Update current image index for modal
                this.currentImageIndex = index;
            });
        });

        // Make main image clickable for fullscreen from thumbnails too
        mainImageContainer.addEventListener('click', () => {
            this.openModal(this.currentImageIndex);
        });
    }

    bindModalEvents() {
        const modal = document.getElementById('imageModal');
        const modalClose = document.getElementById('modalClose');
        const modalPrev = document.getElementById('modalPrev');
        const modalNext = document.getElementById('modalNext');
        const modalImage = document.getElementById('modalImage');

        // Close modal
        modalClose.addEventListener('click', () => {
            this.closeModal();
        });

        // Previous image
        modalPrev.addEventListener('click', () => {
            this.showPreviousImage();
        });

        // Next image
        modalNext.addEventListener('click', () => {
            this.showNextImage();
        });

        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closeModal();
                } else if (e.key === 'ArrowLeft') {
                    this.showPreviousImage();
                } else if (e.key === 'ArrowRight') {
                    this.showNextImage();
                }
            }
        });
    }

    openModal(imageIndex) {
        if (!this.project.images.length) return;

        this.currentImageIndex = imageIndex;
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');

        modalImage.src = this.project.images[this.currentImageIndex].path;
        modalImage.alt = this.project.name + ' - ' + (this.currentImageIndex + 1);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    closeModal() {
        const modal = document.getElementById('imageModal');
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
    }

    showNextImage() {
        if (this.project.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.project.images.length;
            this.updateModalImage();
        }
    }

    showPreviousImage() {
        if (this.project.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.project.images.length) % this.project.images.length;
            this.updateModalImage();
        }
    }

    updateModalImage() {
        const modalImage = document.getElementById('modalImage');
        modalImage.src = this.project.images[this.currentImageIndex].path;
        modalImage.alt = this.project.name + ' - ' + (this.currentImageIndex + 1);
    }

    showNoImages() {
        const gallerySection = document.querySelector('.project-gallery-section');
        if (gallerySection) {
            gallerySection.innerHTML = `
                <div class="no-images">
                    <i class="fas fa-images"></i>
                    <h3 class="lang-specific lang-ar">لا توجد صور متاحة</h3>
                    <h3 class="lang-specific lang-en">No images available</h3>
                </div>
            `;
        }
    }

    bindLanguageEvents() {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            });
        });
    }

    applyInitialLanguage() {
        this.currentLang = localStorage.getItem('language') || 'ar';
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;

        // Update button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });

        this.updateLanguageDisplay();
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);

        // Update HTML direction and language
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Update button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update language-specific content
        this.updateLanguageDisplay();

        // Re-render hero with new language
        this.renderHero();
    }

    updateLanguageDisplay() {
        document.querySelectorAll('.lang-specific').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll(`.lang-${this.currentLang}`).forEach(el => {
            el.style.display = 'block';
        });
    }

    showError(message) {
        const hero = document.getElementById('heroContent');
        if (hero) {
            hero.innerHTML = `
                <h1 class="hero-title" style="color: #e74c3c;">خطأ / Error</h1>
                <p class="hero-description">${message}</p>
                <a href="experience.html" class="view-project-btn" style="margin-top: 2rem;">
                    <i class="fas fa-arrow-left"></i>
                    <span class="lang-specific lang-ar">العودة للمشاريع</span>
                    <span class="lang-specific lang-en">Back to Projects</span>
                </a>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.projectLoader = new DynamicProjectLoader();
});