# El-Masreya Contracting Website

A modern, responsive website for El-Masreya Contracting Company (المصرية للمقاولات), a leading construction company in Egypt.

## Features

- **Multi-language Support**: Full Arabic and English language support with RTL/LTR direction switching
- **Responsive Design**: Optimized for all devices (desktop, tablet, mobile)
- **Modern UI/UX**: Clean, elegant design with smooth animations
- **Project Gallery**: Dynamic gallery system with filtering and individual project pages
- **Interactive Elements**: Image galleries, contact information, and navigation

## Pages

1. **Home Page** (`index.html`) - Main landing page with hero slideshow, about section, and services
2. **Previous Experience** (`experience.html`) - Project gallery with filtering capabilities
3. **About Us** (`about.html`) - Company information, team, and certifications
4. **Contact Us** (`contact.html`) - Contact information and location
5. **Individual Project Pages** (`project1.html`, `project2.html`, etc.) - Detailed project information with photo galleries

## File Structure

```
/
├── index.html              # Home page
├── experience.html         # Previous experience page
├── about.html             # About us page
├── contact.html           # Contact page
├── project1.html          # Individual project page 1
├── project2.html          # Individual project page 2
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── script.js          # Main JavaScript functionality
│   ├── gallery.js         # Gallery management
│   └── project.js         # Project page functionality
├── images/                # Hero images and company photos
├── Gallery/               # Project galleries
│   ├── job1/             # Project 1 gallery
│   ├── job2/             # Project 2 gallery
│   └── ...               # Additional project galleries
└── Logo dark for bright bg.svg  # Company logo for light backgrounds
└── Logo bright for dark bg.svg  # Company logo for dark backgrounds
```

## How to Use

### Adding New Projects

1. Create a new folder in the `Gallery` directory (e.g., `Gallery/job7`)
2. Add project images:
   - `thumb.jpg` - Thumbnail for gallery grid (recommended: 300x250px)
   - `1.jpg`, `2.jpg`, `3.jpg`, `4.jpg` - Project photos for detailed view
3. Update the `jobs` array in `js/gallery.js` with the new project information
4. Create a new project page (e.g., `project7.html`) following the template structure

### Customizing Content

- **Company Information**: Update content in HTML files and corresponding JavaScript translations
- **Colors and Styling**: Modify CSS variables in `css/styles.css`
- **Images**: Replace placeholder images with actual project photos
- **Contact Information**: Update contact details in HTML files and footer sections

### Language Management

The website uses a language switching system:
- Arabic content uses `lang-specific lang-ar` classes
- English content uses `lang-specific lang-en` classes
- Navigation uses `data-text="العربية|English"` attributes
- Update translations in the `translations` object in `js/script.js`

## Technical Details

### Technologies Used
- HTML5 with semantic markup
- CSS3 with CSS Grid and Flexbox
- Vanilla JavaScript (ES6+)
- Font Awesome icons
- Google Fonts (Cairo for Arabic, Inter for English)

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Features
- Lazy loading for images
- Optimized CSS with CSS variables
- Responsive images
- Efficient JavaScript with event delegation

## Setup Instructions

1. **Clone or download** the project files
2. **Add your images**:
   - Replace placeholder images in `images/` directory
   - Add project photos in `Gallery/job*/` directories
3. **Customize content**:
   - Update company information in HTML files
   - Modify contact details
   - Add your actual project data
4. **Test the website**:
   - Open `index.html` in a web browser
   - Test language switching
   - Verify responsive design on different devices

## Deployment

The website is built with static files and can be deployed to any web server:

- **GitHub Pages**: Upload files to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder to Netlify's deployment area
- **Traditional Web Hosting**: Upload files via FTP to your web server
- **Local Development**: Use a local server like Live Server (VS Code extension)

## Customization Guide

### Adding New Sections
1. Add HTML structure to the appropriate page
2. Add corresponding CSS styles in `styles.css`
3. Add JavaScript functionality if needed
4. Update language translations if necessary

### Modifying Colors
Update CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #e74c3c;
    /* Add your custom colors */
}
```

### Adding New Pages
1. Create HTML file following the existing template structure
2. Include proper language classes (`lang-specific lang-ar/lang-en`)
3. Add navigation links in all pages
4. Update footer links

## Support

For technical support or customization requests, contact the development team or refer to the documentation in the code comments.

## License

This project is created for El-Masreya Contracting Company. All rights reserved.
