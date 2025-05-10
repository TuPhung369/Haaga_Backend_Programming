# TuPhung Project Documentation

This repository contains the comprehensive documentation for the TuPhung Project, built with [Docusaurus 2](https://docusaurus.io/). The documentation site features a responsive design with custom UI components, interactive elements, and a mobile-friendly navigation system.

## Features

- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Custom Navigation**: Enhanced sidebar with colorful icons and mobile-friendly hamburger menu
- **Interactive Components**: Dynamic content display with collapsible sections
- **Dark/Light Mode**: Automatic and manual theme switching
- **Search Functionality**: Full-text search across all documentation
- **API Documentation**: Interactive API reference with examples
- **Code Highlighting**: Syntax highlighting for multiple programming languages

## Getting Started

### Prerequisites

- Node.js (version 16 or above)
- npm (version 7 or above)
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/TuPhung369/Haaga_Backend_Programming.git
   cd Haaga_Backend_Programming/TuPhung_Docs
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open your browser and visit [http://localhost:3000/Haaga_Backend_Programming/](http://localhost:3000/Haaga_Backend_Programming/)

## Building the Documentation

To build the static files for production:

```bash
npm run build
```

The built files will be in the `build` directory. You can preview the production build locally:

```bash
npm run serve
```

## Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment is handled by a GitHub Actions workflow defined in `.github/workflows/deploy-docusaurus.yml`.

### Automatic Deployment (GitHub Actions)

The GitHub Actions workflow will:

1. Trigger automatically when changes are pushed to the `main` branch in the `TuPhung_Docs` directory
2. Set up Node.js and install dependencies
3. Build the documentation
4. Deploy the built files to the `gh-pages` branch

You can also manually trigger the workflow from the Actions tab in the GitHub repository.

### Manual Deployment

To manually deploy the documentation from your local machine:

```bash
npm run deploy
```

This command will build the site and push to the `gh-pages` branch.

## Project Structure

```
TuPhung_Docs/
├── docs/                    # Documentation files
│   ├── intro.md             # Introduction page
│   ├── architecture.md      # Architecture overview
│   ├── tech-stack.md        # Tech stack details
│   ├── deployment.md        # Deployment guide
│   ├── frontend/            # Frontend documentation
│   │   ├── structure.md     # Project structure
│   │   ├── authentication.md # Authentication system
│   │   ├── state-management.md # State management
│   │   └── ...              # Other frontend topics
│   └── backend/             # Backend documentation
│       ├── structure.md     # Project structure
│       ├── api.md           # API documentation
│       ├── database.md      # Database schema
│       └── ...              # Other backend topics
├── src/                     # Source files
│   ├── components/          # React components
│   ├── css/                 # CSS files
│   │   ├── custom-icons.css # Icon styling
│   │   ├── sidebar-fix.css  # Sidebar enhancements
│   │   └── ...              # Other styling
│   ├── js/                  # JavaScript utilities
│   │   └── sidebar-icons-enhancer.js # Sidebar functionality
│   └── pages/               # Custom pages
├── static/                  # Static files
│   └── img/                 # Images
├── docusaurus.config.js     # Docusaurus configuration
├── sidebars.js              # Sidebar configuration
└── package.json             # Project dependencies
```

## Customization

### Mobile Navigation

The documentation features a custom mobile navigation system with:

- Hamburger menu icon positioned at 4.5px from top and left edges
- Expandable sidebar with a maximum height of 80vh
- Scrollable content area for long navigation lists
- Smooth animations for opening/closing

### Theme Customization

The site uses a custom color scheme and typography defined in:

- `src/css/custom.css` - Main theme variables
- `docusaurus.config.js` - Theme configuration

## Contributing

1. Create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test locally

3. Commit your changes:

   ```bash
   git commit -m "Add your detailed commit message"
   ```

4. Push to your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Submit a pull request

## Troubleshooting

If you encounter any issues:

1. Make sure you have the correct Node.js version
2. Try clearing the cache:
   ```bash
   npm run clear
   ```
3. Check the console for error messages
4. Verify that all dependencies are installed correctly

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please contact the project maintainer at [tuphung010787@gmail.com](mailto:tuphung010787@gmail.com).

