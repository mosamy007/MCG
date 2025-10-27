// generate-manifest.js
// Run this script to generate manifest files for projects and images
// Usage: node generate-manifest.js

const fs = require('fs');
const path = require('path');

// Configuration
const GALLERY_DIR = './Gallery';
const IMAGES_DIR = './images';
const OUTPUT_FILE = './manifest.json';

// Image file extensions to include
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Check if a file is an image based on extension
 */
function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Scan a directory recursively and return all image files
 */
function scanDirectory(dirPath, relativePath = '') {
    const items = [];
    
    if (!fs.existsSync(dirPath)) {
        console.log(`Warning: Directory not found: ${dirPath}`);
        return items;
    }

    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const relPath = path.join(relativePath, file).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Recursively scan subdirectories
            items.push(...scanDirectory(fullPath, relPath));
        } else if (isImageFile(file)) {
            items.push({
                name: file,
                path: relPath,
                size: stat.size
            });
        }
    });
    
    return items;
}

/**
 * Scan gallery folders for projects
 */
function scanGalleryProjects() {
    const projects = [];
    
    if (!fs.existsSync(GALLERY_DIR)) {
        console.log(`Warning: Gallery directory not found: ${GALLERY_DIR}`);
        console.log('Creating Gallery directory...');
        fs.mkdirSync(GALLERY_DIR, { recursive: true });
        return projects;
    }
    
    const folders = fs.readdirSync(GALLERY_DIR);
    
    folders.forEach((folder, index) => {
        const folderPath = path.join(GALLERY_DIR, folder);
        const stat = fs.statSync(folderPath);
        
        if (stat.isDirectory()) {
            console.log(`Scanning project: ${folder}`);
            
            const images = scanDirectory(folderPath, folder);
            
            if (images.length > 0) {
                // Find thumbnail (thumb.jpg) or use first image
                const thumbImage = images.find(img => 
                    img.name.toLowerCase() === 'thumb.jpg'
                ) || images[0];
                
                // Generate project names
                const projectName = generateProjectName(folder);
                
                projects.push({
                    id: index + 1,
                    folder: folder,
                    name: projectName.ar,
                    nameEn: projectName.en,
                    thumb: `Gallery/${thumbImage.path}`,
                    images: images.map(img => ({
                        name: img.name,
                        path: `Gallery/${img.path}`,
                        size: img.size
                    })),
                    imageCount: images.length
                });
                
                console.log(`  ✓ Found ${images.length} images`);
            } else {
                console.log(`  ✗ No images found in ${folder}`);
            }
        }
    });
    
    return projects;
}

/**
 * Generate Arabic and English project names from folder name
 */
function generateProjectName(folderName) {
    // Decode URL-encoded characters
    let cleanName = folderName;
    try {
        cleanName = decodeURIComponent(folderName);
    } catch (e) {
        console.log(`Could not decode folder name: ${folderName}`);
    }
    
    // Clean up the name
    cleanName = cleanName
        .replace(/%20/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Check if name contains both English and Arabic (separated by hyphen)
    const hyphenIndex = cleanName.indexOf('-');
    if (hyphenIndex > 0) {
        const englishPart = cleanName.substring(0, hyphenIndex).trim();
        const arabicPart = cleanName.substring(hyphenIndex + 1).trim();
        
        // Check if arabicPart contains Arabic characters
        const hasArabic = /[\u0600-\u06FF]/.test(arabicPart);
        
        if (hasArabic && englishPart && arabicPart) {
            return {
                ar: arabicPart,
                en: englishPart
            };
        }
    }
    
    // Check if name is primarily Arabic
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

/**
 * Scan images directory for hero slideshow images
 */
function scanHeroImages() {
    console.log('\nScanning hero images...');
    console.log(`Looking in: ${path.resolve(IMAGES_DIR)}`);
    
    if (!fs.existsSync(IMAGES_DIR)) {
        console.log(`❌ Images directory not found: ${IMAGES_DIR}`);
        console.log('Creating images directory...');
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
        console.log('✓ Created images directory. Please add images and run again.');
        return [];
    }
    
    const files = fs.readdirSync(IMAGES_DIR);
    console.log(`Found ${files.length} total files in images directory`);
    
    const heroImages = [];
    
    files.forEach(file => {
        const filePath = path.join(IMAGES_DIR, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            console.log(`  ⊳ Skipping directory: ${file}`);
            return;
        }
        
        if (stat.isFile() && isImageFile(file)) {
            // Skip thumbnails and logos
            if (file.toLowerCase().includes('thumb')) {
                console.log(`  ⊳ Skipping thumbnail: ${file}`);
                return;
            }
            if (file.toLowerCase().includes('logo')) {
                console.log(`  ⊳ Skipping logo: ${file}`);
                return;
            }
            
            heroImages.push({
                name: file,
                path: `images/${file}`,
                size: stat.size
            });
            console.log(`  ✓ ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
        } else if (stat.isFile()) {
            console.log(`  ⊳ Skipping non-image: ${file}`);
        }
    });
    
    console.log(`\n📊 Found ${heroImages.length} hero images`);
    
    if (heroImages.length === 0) {
        console.log('\n⚠️  WARNING: No hero images found!');
        console.log('   Add JPG/PNG images to the "images" folder');
        console.log('   Example: images/1.jpg, images/2.jpg, etc.');
    }
    
    return heroImages;
}

/**
 * Main function
 */
function generateManifest() {
    console.log('=== El-Masreya Contracting - Manifest Generator ===\n');
    
    console.log('Scanning gallery projects...');
    const projects = scanGalleryProjects();
    console.log(`\nTotal projects found: ${projects.length}\n`);
    
    const heroImages = scanHeroImages();
    
    const manifest = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        projects: projects,
        heroImages: heroImages,
        stats: {
            totalProjects: projects.length,
            totalImages: projects.reduce((sum, p) => sum + p.imageCount, 0),
            totalHeroImages: heroImages.length
        }
    };
    
    // Write manifest file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n✓ Manifest generated successfully: ${OUTPUT_FILE}`);
    console.log(`  - Projects: ${manifest.stats.totalProjects}`);
    console.log(`  - Total project images: ${manifest.stats.totalImages}`);
    console.log(`  - Hero images: ${manifest.stats.totalHeroImages}`);
}

// Run the generator if called directly
if (require.main === module) {
    generateManifest();
}

module.exports = { generateManifest };