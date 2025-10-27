// Dynamic Project Loader with Fullscreen Image Viewer - Uses manifest.json
class DynamicProjectLoader {
    constructor() {
        this.projectFolder = this.getProjectFolderFromURL();
        this.currentLang = localStorage.getItem('language') || 'ar';
        this.project = null;
        this.currentImageIndex = 0;
        this.manifest = null;
        this.init();
    }

    getProjectFolderFromURL() {
        const params = new URLSearchParams(window.location.search);
        const folder = params.get('folder');
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
            console.log('Loading project:', this.projectFolder);
            
            // Try to load from manifest first
            await this.loadManifest();
            
            if (this.manifest) {
                // Find project in manifest
                this.project = this.manifest.projects.find(p => 
                    p.folder === this.projectFolder
                );
                
                if (this.project) {
                    console.log('Project found in manifest:', this.project);
                    this.renderProject();
                    return;
                } else {
                    console.log('Project not found in manifest, trying fallback...');
                }
            }
            
            // Fallback to directory scanning
            this.project = await this.scanProjectFolder(this.projectFolder);
            
            if (this.project) {
                console.log('Project loaded via fallback:', this.project);
                this.renderProject();
            } else {
                this.showError('Project not found');
            }
            
        } catch (error) {
            console.error('Error loading project:', error);
            this.showError('Error loading project');
        }
    }

    async loadManifest() {
        try {
            console.log('Loading manifest...');
            const response = await fetch('manifest.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.status}`);
            }
            
            this.manifest = await response.json();
            console.log('Manifest loaded successfully');
            
        } catch (error) {
            console.log('Could not load manifest:', error);
            this.manifest = null;
        }
    }

    async scanProjectFolder(folderName) {
        try {
            console.log(`Attempting to scan project folder: ${folderName}`);
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
        let cleanName = folderName
            .replace(/[-_]/g, ' ')
            .replace(/%20/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        console.log('Processing project folder name:', folderName, '->', cleanName);
        
        const hyphenIndex = cleanName.indexOf('-');
        if (hyphenIndex > 0) {
            const englishPart = cleanName.substring(0, hyphenIndex).trim();
            const arabicPart = cleanName.substring(hyphenIndex + 1).trim();
            
            console.log('Split project names - English:', englishPart, 'Arabic:', arabicPart);
            
            const hasArabic = /[\u0600-\u06FF]/.test(arabicPart);
            
            if (hasArabic) {
                return {
                    ar: arabicPart,
                    en: englishPart
                };
            }
        }
        
        const hasArabic = /[\u0600-\u06FF]/.test(cleanName);
        if (hasArabic) {
            return {
                ar: cleanName,
                en: `Project ${cleanName}`
            };
        }
        
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

        const title = this.currentLang === 'ar' ? this.project.name : this.project.nameEn;
        document.title = `${title} - المصرية للمقاولات`;

        this.renderHero();
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

        if (!this.project.images || this.project.images.length === 0) {
            this.showNoImages();
            return;
        }

        // Set main image to first image
        mainImage.src = this.project.images[0].path;
        mainImage.alt = this.project.name;

        // Make main image clickable for fullscreen
        mainImageContainer.onclick = () => {
            this.openModal(0);
        };

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
    }

    bindModalEvents() {
        const modal = document.getElementById('imageModal');
        const modalClose = document.getElementById('modalClose');
        const modalPrev = document.getElementById('modalPrev');
        const modalNext = document.getElementById('modalNext');

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modalPrev) {
            modalPrev.addEventListener('click', () => {
                this.showPreviousImage();
            });
        }

        if (modalNext) {
            modalNext.addEventListener('click', () => {
                this.showNextImage();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal && modal.classList.contains('active')) {
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
        if (!this.project.images || this.project.images.length === 0) return;

        this.currentImageIndex = imageIndex;
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');

        if (modal && modalImage) {
            modalImage.src = this.project.images[this.currentImageIndex].path;
            modalImage.alt = this.project.name + ' - ' + (this.currentImageIndex + 1);
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showNextImage() {
        if (this.project.images && this.project.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.project.images.length;
            this.updateModalImage();
        }
    }

    showPreviousImage() {
        if (this.project.images && this.project.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.project.images.length) % this.project.images.length;
            this.updateModalImage();
        }
    }

    updateModalImage() {
        const modalImage = document.getElementById('modalImage');
        if (modalImage && this.project.images) {
            modalImage.src = this.project.images[this.currentImageIndex].path;
            modalImage.alt = this.project.name + ' - ' + (this.currentImageIndex + 1);
        }
    }

    showNoImages() {
        const gallerySection = document.querySelector('.project-gallery-section');
        if (gallerySection) {
            gallerySection.innerHTML = `
                <div class="container">
                    <div class="no-images">
                        <i class="fas fa-images"></i>
                        <h3 class="lang-specific lang-ar">لا توجد صور متاحة</h3>
                        <h3 class="lang-specific lang-en">No images available</h3>
                    </div>
                </div>
            `;
            
            // Apply language display
            this.updateLanguageDisplay();
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

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });

        this.updateLanguageDisplay();
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);

        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        this.updateLanguageDisplay();
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
            
            this.updateLanguageDisplay();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.projectLoader = new DynamicProjectLoader();
});