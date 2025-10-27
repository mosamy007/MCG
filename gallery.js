// Modern Gallery - Uses manifest.json for project data
class PhotoGallery {
    constructor() {
        this.galleryGrid = document.getElementById('galleryGrid');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.noProjects = document.getElementById('noProjects');
        this.jobs = [];
        this.currentLang = localStorage.getItem('language') || 'ar';

        this.init();
    }

    async init() {
        console.log('Gallery initializing...');
        await this.loadProjects();
        this.applyLanguage();
    }

    async loadProjects() {
        if (!this.galleryGrid) return;

        this.showLoading();

        try {
            console.log('Loading projects from manifest...');
            
            // Try to load from manifest.json
            const response = await fetch('manifest.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.status}`);
            }
            
            const manifest = await response.json();
            console.log('Manifest loaded:', manifest);
            
            if (manifest.projects && manifest.projects.length > 0) {
                this.jobs = manifest.projects;
                console.log(`Found ${this.jobs.length} projects`);
                this.renderGallery();
            } else {
                console.log('No projects found in manifest');
                this.showNoProjects();
            }
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading projects:', error);
            console.log('Falling back to directory scanning...');
            
            // Fallback to directory scanning (will work locally but not on Vercel)
            await this.scanProjectsFallback();
        }
    }

    async scanProjectsFallback() {
        try {
            // Try directory scanning as fallback
            const projects = await this.scanGalleryDirectory();
            
            if (projects.length > 0) {
                this.jobs = projects;
                console.log('Found projects via fallback:', this.jobs);
                this.renderGallery();
            } else {
                this.showNoProjects();
            }
            
            this.hideLoading();
        } catch (error) {
            console.error('Fallback scanning failed:', error);
            this.showNoProjects();
            this.hideLoading();
        }
    }

    async scanGalleryDirectory() {
        try {
            console.log('Attempting directory scan...');
            const response = await fetch('./Gallery/');
            
            if (!response.ok) {
                throw new Error(`Cannot access Gallery directory: ${response.status}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            const projects = [];
            let projectId = 1;
            
            for (const link of links) {
                const href = link.getAttribute('href');
                
                if (href && href.endsWith('/') && href !== '../' && href !== './') {
                    const folderName = href.replace('/', '').replace('./', '');
                    
                    if (folderName === '' || folderName === '.') continue;
                    
                    const project = await this.scanProjectFolder(folderName, projectId);
                    
                    if (project) {
                        projects.push(project);
                        projectId++;
                    }
                }
            }
            
            return projects;
            
        } catch (error) {
            console.log('Directory scanning not available:', error);
            return [];
        }
    }

    async scanProjectFolder(folderName, projectId) {
        try {
            const folderPath = `Gallery/${folderName}`;
            const response = await fetch(folderPath);
            
            if (!response.ok) {
                return null;
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
            
            if (!thumb && images.length > 0) {
                thumb = images[0].path;
            }
            
            if (thumb) {
                const projectName = this.generateProjectName(folderName);
                
                return {
                    id: projectId,
                    folder: folderName,
                    thumb: thumb,
                    images: images,
                    name: projectName.ar,
                    nameEn: projectName.en,
                    description: 'مشروع إنشائي متميز من المصرية للمقاولات',
                    descriptionEn: 'Distinguished construction project by El-Masreya Contracting',
                    category: this.detectCategory(folderName)
                };
            }
            
            return null;
        } catch (error) {
            console.log(`Error scanning project folder ${folderName}:`, error);
            return null;
        }
    }

    generateProjectName(folderName) {
        let cleanName = folderName;
        try {
            cleanName = decodeURIComponent(folderName);
        } catch (e) {
            console.log('Could not decode folder name:', folderName);
        }
        
        cleanName = cleanName
            .replace(/%20/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const hyphenIndex = cleanName.indexOf('-');
        if (hyphenIndex > 0) {
            const englishPart = cleanName.substring(0, hyphenIndex).trim();
            const arabicPart = cleanName.substring(hyphenIndex + 1).trim();
            
            const hasArabic = /[\u0600-\u06FF]/.test(arabicPart);
            
            if (hasArabic && englishPart && arabicPart) {
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

    detectCategory(folderName) {
        const name = folderName.toLowerCase();
        if (name.includes('commercial') || name.includes('shop') || name.includes('mall') || name.includes('compound') || name.includes('complex')) {
            return 'commercial';
        } else if (name.includes('restoration') || name.includes('renovation') || name.includes('repair')) {
            return 'restoration';
        } else {
            return 'residential';
        }
    }

    renderGallery() {
        if (!this.galleryGrid) return;

        this.galleryGrid.innerHTML = '';

        if (this.jobs.length === 0) {
            this.showNoProjects();
            return;
        }

        console.log('Rendering gallery with', this.jobs.length, 'projects');
        
        this.jobs.forEach((job, index) => {
            const card = this.createPhotoCard(job);
            this.galleryGrid.appendChild(card);
            
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 50);
        });
    }

    createPhotoCard(job) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.id = job.id;

        const title = this.currentLang === 'ar' ? job.name : job.nameEn;
        const buttonText = this.currentLang === 'ar' ? 'عرض المشروع' : 'View Project';

        card.innerHTML = `
            <div class="project-image">
                <img 
                    src="${job.thumb}" 
                    alt="${title}" 
                    loading="lazy"
                    onerror="this.style.background='#f0f0f0'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size:2rem;color:#ccc;\\'></i>';">
                <div class="project-overlay">
                    <div class="project-info">
                        <h3 class="project-name">${title}</h3>
                        <a href="project.html?folder=${encodeURIComponent(job.folder)}" class="view-project-btn">
                            <i class="fas fa-eye"></i>
                            <span>${buttonText}</span>
                        </a>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'flex';
        }
        if (this.galleryGrid) {
            this.galleryGrid.innerHTML = '';
        }
        if (this.noProjects) {
            this.noProjects.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
    }

    showNoProjects() {
        this.hideLoading();
        if (this.noProjects) {
            this.noProjects.style.display = 'flex';
        }
    }

    applyLanguage() {
        this.currentLang = localStorage.getItem('language') || 'ar';
        this.renderGallery();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing gallery...');
    window.photoGallery = new PhotoGallery();
});

// Listen for language changes
document.addEventListener('languageChanged', () => {
    if (window.photoGallery) {
        window.photoGallery.applyLanguage();
    }
});