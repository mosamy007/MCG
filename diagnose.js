// diagnose.js - Diagnostic tool for El-Masreya Contracting website
const fs = require('fs');
const path = require('path');

console.log('=== El-Masreya Contracting - Diagnostic Tool ===\n');

// Check directories
function checkDirectory(dirPath, name) {
    console.log(`\n📁 Checking ${name}...`);
    console.log(`   Path: ${path.resolve(dirPath)}`);
    
    if (!fs.existsSync(dirPath)) {
        console.log(`   ❌ NOT FOUND - Directory does not exist!`);
        return false;
    }
    
    console.log(`   ✅ EXISTS`);
    
    try {
        const files = fs.readdirSync(dirPath);
        console.log(`   📊 Contains ${files.length} items`);
        
        // List contents
        if (files.length > 0) {
            console.log(`   Contents:`);
            files.slice(0, 10).forEach(file => {
                const fullPath = path.join(dirPath, file);
                const stat = fs.statSync(fullPath);
                const type = stat.isDirectory() ? '[DIR]' : '[FILE]';
                const size = stat.isFile() ? `(${(stat.size / 1024).toFixed(1)} KB)` : '';
                console.log(`      ${type} ${file} ${size}`);
            });
            
            if (files.length > 10) {
                console.log(`      ... and ${files.length - 10} more items`);
            }
        }
        
        return true;
    } catch (error) {
        console.log(`   ❌ ERROR reading directory: ${error.message}`);
        return false;
    }
}

// Check if manifest exists
function checkManifest() {
    console.log('\n\n📄 Checking manifest.json...');
    
    if (!fs.existsSync('./manifest.json')) {
        console.log('   ❌ NOT FOUND');
        console.log('   ⚠️  You need to generate it!');
        console.log('   Run: npm run generate-manifest');
        return false;
    }
    
    console.log('   ✅ EXISTS');
    
    try {
        const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
        console.log(`   📊 Statistics:`);
        console.log(`      - Version: ${manifest.version}`);
        console.log(`      - Projects: ${manifest.stats?.totalProjects || 0}`);
        console.log(`      - Total images: ${manifest.stats?.totalImages || 0}`);
        console.log(`      - Hero images: ${manifest.stats?.totalHeroImages || 0}`);
        console.log(`      - Generated: ${manifest.generatedAt}`);
        
        // Check for issues
        if (manifest.stats?.totalProjects === 0) {
            console.log('\n   ⚠️  WARNING: No projects in manifest!');
            console.log('      Add folders to Gallery/ and regenerate');
        }
        
        if (manifest.stats?.totalHeroImages === 0) {
            console.log('\n   ⚠️  WARNING: No hero images in manifest!');
            console.log('      Add images to images/ folder and regenerate');
        }
        
        return true;
    } catch (error) {
        console.log(`   ❌ ERROR reading manifest: ${error.message}`);
        console.log('   The manifest file might be corrupted');
        console.log('   Try regenerating: npm run generate-manifest');
        return false;
    }
}

// Check image files
function checkImages(dirPath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    let imageCount = 0;
    let totalSize = 0;
    
    if (!fs.existsSync(dirPath)) {
        return { count: 0, size: 0 };
    }
    
    function scanDir(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (stat.isFile()) {
                const ext = path.extname(file).toLowerCase();
                if (imageExtensions.includes(ext)) {
                    imageCount++;
                    totalSize += stat.size;
                }
            }
        });
    }
    
    scanDir(dirPath);
    return { count: imageCount, size: totalSize };
}

// Check HTML files
function checkHTMLFiles() {
    console.log('\n\n📝 Checking HTML files...');
    
    const htmlFiles = [
        'index.html',
        'experience.html',
        'project.html',
        'about.html',
        'contact.html'
    ];
    
    htmlFiles.forEach(file => {
        if (fs.existsSync(`./${file}`)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} - NOT FOUND`);
        }
    });
}

// Check JavaScript files
function checkJSFiles() {
    console.log('\n\n📜 Checking JavaScript files...');
    
    const jsFiles = [
        { name: 'script.js', required: true },
        { name: 'gallery.js', required: true },
        { name: 'hero-slideshow.js', required: true },
        { name: 'project.js', required: true },
        { name: 'generate-manifest.js', required: true }
    ];
    
    jsFiles.forEach(file => {
        if (fs.existsSync(`./${file.name}`)) {
            const content = fs.readFileSync(`./${file.name}`, 'utf8');
            
            // Check for manifest usage
            const usesManifest = content.includes('manifest.json');
            const status = usesManifest ? '✅' : '⚠️';
            const note = usesManifest ? '' : ' (might need update)';
            
            console.log(`   ${status} ${file.name}${note}`);
        } else if (file.required) {
            console.log(`   ❌ ${file.name} - REQUIRED FILE NOT FOUND!`);
        }
    });
}

// Run all checks
console.log('Starting diagnostic checks...\n');

const galleryOK = checkDirectory('./Gallery', 'Gallery directory');
const imagesOK = checkDirectory('./images', 'Images directory');

if (galleryOK) {
    const galleryStats = checkImages('./Gallery');
    console.log(`\n   🖼️  Total images in Gallery: ${galleryStats.count}`);
    console.log(`   💾 Total size: ${(galleryStats.size / 1024 / 1024).toFixed(2)} MB`);
}

if (imagesOK) {
    const heroStats = checkImages('./images');
    console.log(`\n   🖼️  Total images for hero: ${heroStats.count}`);
    console.log(`   💾 Total size: ${(heroStats.size / 1024 / 1024).toFixed(2)} MB`);
}

const manifestOK = checkManifest();
checkHTMLFiles();
checkJSFiles();

// Summary
console.log('\n\n' + '='.repeat(50));
console.log('📋 SUMMARY');
console.log('='.repeat(50));

const issues = [];

if (!galleryOK) {
    issues.push('❌ Gallery directory missing');
} else {
    const galleryStats = checkImages('./Gallery');
    if (galleryStats.count === 0) {
        issues.push('⚠️  No images in Gallery directory');
    }
}

if (!imagesOK) {
    issues.push('❌ images directory missing');
} else {
    const heroStats = checkImages('./images');
    if (heroStats.count === 0) {
        issues.push('⚠️  No images in images directory (hero slideshow will be empty)');
    }
}

if (!manifestOK) {
    issues.push('❌ manifest.json missing or invalid');
}

if (issues.length === 0) {
    console.log('\n✅ All checks passed!');
    console.log('\nNext steps:');
    console.log('1. If manifest is outdated: npm run generate-manifest');
    console.log('2. Test locally by opening index.html');
    console.log('3. Deploy to Vercel');
} else {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
    
    console.log('\n🔧 Recommended actions:');
    
    if (!galleryOK || !imagesOK) {
        console.log('   1. Create missing directories');
        console.log('   2. Add your images to the directories');
    }
    
    if (!manifestOK || issues.some(i => i.includes('No images'))) {
        console.log('   3. Run: npm run generate-manifest');
    }
    
    console.log('   4. Run this diagnostic again: node diagnose.js');
}

console.log('\n' + '='.repeat(50) + '\n');