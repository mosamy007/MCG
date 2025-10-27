// Modern Gallery - Dynamic project scanning
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
            
            // Try to scan Gallery directory
            const projects = await this.scanGalleryDirectory();
            
            if (projects.length > 0) {
                this.jobs = projects;
                console.log('Found projects:', this.jobs);
            } else {
                console.log('No projects found in Gallery directory');
                this.showNoProjects();
            }
            
            this.renderGallery();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error scanning projects:', error);
            this.showNoProjects();
        }
    }

    async scanGalleryDirectory() {
        try {
            console.log('Fetching Gallery directory...');
            const response = await fetch('./Gallery/');
            
            if (!response.ok) {
                throw new Error(`Cannot access Gallery directory: ${response.status}`);
            }
            
            const html = await response.text();
            console.log('Gallery directory HTML received');
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            console.log('Found links:', links.length);
            
            const projects = [];
            let projectId = 1;
            
            for (const link of links) {
                const href = link.getAttribute('href');
                console.log('Processing link:', href);
                
                // Look for directories (end with / and not parent directory)
                if (href && href.endsWith('/') && href !== '../' && href !== './') {
                    const folderName = href.replace('/', '').replace('./', '');
                    
                    // Skip if it's the current directory marker
                    if (folderName === '' || folderName === '.') continue;
                    
                    console.log('Found project folder:', folderName);
                    const project = await this.scanProjectFolder(folderName, projectId);
                    
                    if (project) {
                        projects.push(project);
                        projectId++;
                        console.log('Successfully loaded project:', project.name, project.nameEn);
                    } else {
                        console.log('Failed to load project from folder:', folderName);
                    }
                }
            }
            
            console.log('Total projects found:', projects.length);
            return projects;
            
        } catch (error) {
            console.log('Gallery directory scanning failed:', error);
            // Try alternative scanning method
            return await this.scanProjectDirectories();
        }
    }

    async scanProjectFolder(folderName, projectId) {
        try {
            console.log(`Scanning project folder: ${folderName}`);
            const folderPath = `Gallery/${folderName}`;
            const response = await fetch(folderPath);
            
            if (!response.ok) {
                console.log(`Folder ${folderName} not accessible: ${response.status}`);
                return null;
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            const images = [];
            let thumb = null;
            
            console.log(`Found ${links.length} files in ${folderName}`);
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && this.isImageFile(href)) {
                    const imagePath = `${folderPath}/${href}`;
                    
                    if (href.toLowerCase() === 'thumb.jpg') {
                        thumb = imagePath;
                        console.log(`Found thumbnail for ${folderName}: ${thumb}`);
                    } else {
                        images.push({
                            path: imagePath,
                            name: href
                        });
                    }
                }
            });
            
            // If no thumb found but we have images, use the first one
            if (!thumb && images.length > 0) {
                thumb = images[0].path;
                console.log(`Using first image as thumb for ${folderName}: ${thumb}`);
            }
            
            if (thumb) {
                // Generate project name from folder name
                const projectName = this.generateProjectName(folderName);
                
                const projectData = {
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
                
                console.log(`Created project data for ${folderName}:`, projectData);
                return projectData;
            } else {
                console.log(`No thumbnail found for folder: ${folderName}`);
            }
            
            return null;
        } catch (error) {
            console.log(`Error scanning project folder ${folderName}:`, error);
            return null;
        }
    }

    async scanProjectDirectories() {
        console.log('Using alternative directory scanning method...');
        
        // Alternative method: try to manually check common folder patterns
        const projects = [];
        let projectId = 1;
        
        // Common folder patterns to try
        const commonPatterns = [
            'job1', 'job2', 'job3', 'job4', 'job5',
            'project1', 'project2', 'project3', 'project4', 'project5',
            'work1', 'work2', 'work3', 'work4', 'work5'
        ];
        
        for (const folder of commonPatterns) {
            const project = await this.scanProjectFolder(folder, projectId);
            if (project) {
                projects.push(project);
                projectId++;
            }
        }
        
        // Also try to scan for any folders that might exist
        // This is a fallback that tries to guess folder names
        if (projects.length === 0) {
            console.log('Trying to guess folder names...');
            // You can add specific folder names you know exist here
            const knownFolders = ['Phosphatic and Compound Fertilizers Complex-مجمع الأسمدة الفوسفاتية والمركبة بالعين السخنة'];
            
            for (const folder of knownFolders) {
                const project = await this.scanProjectFolder(folder, projectId);
                if (project) {
                    projects.push(project);
                    projectId++;
                }
            }
        }
        
        console.log('Alternative scanning found projects:', projects.length);
        return projects;
    }

    generateProjectName(folderName) {
        // Decode URL-encoded characters first
        let cleanName = folderName;
        try {
            cleanName = decodeURIComponent(folderName);
        } catch (e) {
            console.log('Could not decode folder name:', folderName);
        }
        
        // Remove special characters and clean up
        cleanName = cleanName
            .replace(/%20/g, ' ') // Replace %20 with spaces
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
        
        console.log('Processing folder name:', folderName, '->', cleanName);
        
        // Check if the name contains both English and Arabic (has a hyphen separator)
        const hyphenIndex = cleanName.indexOf('-');
        if (hyphenIndex > 0) {
            const englishPart = cleanName.substring(0, hyphenIndex).trim();
            const arabicPart = cleanName.substring(hyphenIndex + 1).trim();
            
            console.log('Split names - English:', englishPart, 'Arabic:', arabicPart);
            
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

        console.log('Creating card for:', title);

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