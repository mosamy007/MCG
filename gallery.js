// Modern Gallery - Hybrid approach for local and production
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
        await this.scanProjects();
        this.applyLanguage();
    }

    async scanProjects() {
        if (!this.galleryGrid) return;

        this.showLoading();

        try {
            console.log('Scanning for projects...');
            
            // Try directory scanning first (works locally)
            let projects = await this.scanGalleryDirectory();
            
            // If directory scanning fails, use predefined projects (works on production)
            if (projects.length === 0) {
                console.log('Directory scanning failed, using predefined projects...');
                projects = await this.getPredefinedProjects();
            }
            
            if (projects.length > 0) {
                this.jobs = projects;
                console.log('Found projects:', this.jobs);
                this.renderGallery();
                this.hideLoading();
            } else {
                this.showNoProjects();
            }
            
        } catch (error) {
            console.error('Error scanning projects:', error);
            this.showNoProjects();
        }
    }

    async scanGalleryDirectory() {
        try {
            console.log('Trying directory scanning...');
            const response = await fetch('./Gallery/');
            
            if (!response.ok) {
                throw new Error(`Directory listing not available: ${response.status}`);
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
                    
                    console.log('Found folder:', folderName);
                    const project = await this.scanProjectFolder(folderName, projectId);
                    
                    if (project) {
                        projects.push(project);
                        projectId++;
                    }
                }
            }
            
            console.log('Directory scanning found:', projects.length, 'projects');
            return projects;
            
        } catch (error) {
            console.log('Directory scanning failed:', error.message);
            return [];
        }
    }

    async getPredefinedProjects() {
        console.log('Loading predefined projects...');
        
        // This is where you manually define your projects
        // Update this array with your actual folder names
        const knownFolders = [
            'job1',
            'job2', 
            'job3',
            'job4',
            'Phosphatic and Compound Fertilizers Complex-مجمع الأسمدة الفوسفاتية والمركبة بالعين السخنة'
            // Add all your project folder names here
        ];
        
        const projects = [];
        let projectId = 1;
        
        for (const folderName of knownFolders) {
            const project = await this.scanProjectFolder(folderName, projectId);
            if (project) {
                projects.push(project);
                projectId++;
            }
        }
        
        console.log('Predefined projects found:', projects.length);
        return projects;
    }

    async scanProjectFolder(folderName, projectId) {
        try {
            const folderPath = `Gallery/${folderName}`;
            
            // Try to load the thumbnail directly
            const thumbPath = `${folderPath}/thumb.jpg`;
            const thumbExists = await this.checkImageExists(thumbPath);
            
            if (thumbExists) {
                const projectName = this.generateProjectName(folderName);
                
                return {
                    id: projectId,
                    folder: folderName,
                    thumb: thumbPath,
                    images: await this.getProjectImages(folderPath),
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

    async getProjectImages(folderPath) {
        // For production, we'll assume images are named sequentially
        // You can customize this based on your actual image naming pattern
        const images = [];
        
        // Try common image patterns
        for (let i = 1; i <= 10; i++) {
            const imagePath = `${folderPath}/${i}.jpg`;
            const exists = await this.checkImageExists(imagePath);
            if (exists) {
                images.push({
                    path: imagePath,
                    name: `${i}.jpg`
                });
            }
        }
        
        // Also try other common extensions
        const extensions = ['.jpeg', '.png', '.webp'];
        for (const ext of extensions) {
            const imagePath = `${folderPath}/image1${ext}`;
            const exists = await this.checkImageExists(imagePath);
            if (exists) {
                images.push({
                    path: imagePath,
                    name: `image1${ext}`
                });
                break;
            }
        }
        
        return images;
    }

    async checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            
            // Timeout after 2 seconds
            setTimeout(() => resolve(false), 2000);
        });
    }

    generateProjectName(folderName) {
        let cleanName = folderName;
        
        // Remove special characters and clean up
        cleanName = cleanName
            .replace(/%20/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Check if the name contains both English and Arabic (has a hyphen separator)
        const hyphenIndex = cleanName.indexOf('-');
        if (hyphenIndex > 0) {
            const englishPart = cleanName.substring(0, hyphenIndex).trim();
            const arabicPart = cleanName.substring(hyphenIndex + 1).trim();
            
            // Check if arabicPart actually contains Arabic characters
            const hasArabic = /[\u0600-\u06FF]/.test(arabicPart);
            
            if (hasArabic && englishPart && arabicPart) {
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
