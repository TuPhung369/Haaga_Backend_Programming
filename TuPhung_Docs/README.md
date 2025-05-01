# TuPhung Project Documentation

This repository contains the documentation for the TuPhung Project, built with [Docusaurus](https://docusaurus.io/).

## Getting Started

### Prerequisites

- Node.js (version 16 or above)
- npm (version 7 or above)

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

4. Open your browser and visit [http://localhost:3000](http://localhost:3000)

## Building the Documentation

To build the static files for production:

```bash
npm run build
```

The built files will be in the `build` directory.

## Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment is handled by a GitHub Actions workflow.

To manually deploy the documentation:

```bash
npm run deploy
```

## Project Structure

```
TuPhung_Docs/
├── docs/                 # Documentation files
│   ├── intro.md          # Introduction page
│   ├── architecture.md   # Architecture overview
│   ├── tech-stack.md     # Tech stack details
│   ├── deployment.md     # Deployment guide
│   ├── frontend/         # Frontend documentation
│   └── backend/          # Backend documentation
├── src/                  # Source files
│   ├── components/       # React components
│   ├── css/              # CSS files
│   └── pages/            # Custom pages
├── static/               # Static files
│   └── img/              # Images
├── docusaurus.config.js  # Docusaurus configuration
├── sidebars.js           # Sidebar configuration
└── package.json          # Project dependencies
```

## Contributing

1. Create a new branch for your changes
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the ISC License.