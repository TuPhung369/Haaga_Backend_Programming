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