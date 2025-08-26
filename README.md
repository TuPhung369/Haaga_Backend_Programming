# Enterprise Nexus - Haaga Backend Programming

<div align="center">

![Enterprise Nexus](https://img.shields.io/badge/Enterprise-Nexus-blue?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.4-brightgreen?style=for-the-badge&logo=spring)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript)
![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=java)
![MySQL](https://img.shields.io/badge/MySQL-8.0.39-blue?style=for-the-badge&logo=mysql)

**Transforming Enterprise Management Through Innovation**

_A state-of-the-art enterprise management platform that seamlessly integrates cutting-edge technologies to revolutionize workplace productivity, security, and collaboration._

</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [🏗️ Project Structure](#️-project-structure)
- [🚀 Technology Stack](#-technology-stack)
- [⚙️ Prerequisites](#️-prerequisites)
- [🔧 Installation & Setup](#-installation--setup)
- [🏃‍♂️ Running the Application](#️-running-the-application)
- [🐳 Docker Setup](#-docker-setup)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🔒 Security Features](#-security-features)
- [🤖 AI Integration](#-ai-integration)
- [📚 Documentation](#-documentation)
- [🛠️ Development Tools](#️-development-tools)
- [🔧 Troubleshooting](#-troubleshooting)
- [📞 Support](#-support)

## 🌟 Overview

**Enterprise Nexus** is a comprehensive enterprise management platform designed for modern businesses seeking digital transformation. The platform combines a responsive TypeScript React frontend with a robust Spring Boot backend, enhanced by advanced AI capabilities and multi-layered security protocols.

### Key Features

- 🔐 **Advanced Security Framework** - Multi-layered encryption with OAuth2 integration
- 🤖 **AI-Powered Intelligence** - Speech processing and intelligent automation
- ⚡ **Real-time Collaboration** - WebSocket-powered communication and task management
- 📊 **Enterprise Management** - Comprehensive business intelligence and workflow automation
- 🌐 **Multi-platform Support** - Web and mobile-responsive design
- 🔄 **Scalable Architecture** - Microservices-ready with cloud deployment support

## 🏗️ Project Structure

```
Haaga_Backend_Programming/
├── 📁 study/
│   ├── 📁 study/                    # Spring Boot Backend (Java 17)
│   │   ├── 📄 pom.xml              # Maven configuration
│   │   ├── 📁 src/main/java/       # Java source code
│   │   ├── 📁 src/main/resources/  # Application resources
│   │   └── 📁 target/              # Build output
│   ├── 📁 typescript-react/        # React Frontend (TypeScript)
│   │   ├── 📄 package.json         # npm configuration
│   │   ├── 📁 src/                 # React source code
│   │   └── 📄 vite.config.ts       # Vite configuration
│   ├── 📁 react-study/             # Alternative React Frontend
│   └── 📁 pemFiles/                # AWS EC2 access keys
├── 📁 TuPhung_Docs/                # Docusaurus Documentation
│   ├── 📄 package.json             # Documentation dependencies
│   ├── 📁 docs/                    # Documentation content
│   └── 📁 src/                     # Documentation components
├── 📁 models/                      # AI/ML Models
│   ├── 📁 models--Systran--faster-whisper-large-v3/
│   └── 📁 wav2vec2-finnish/
└── 📄 README.md                    # This file
```

## 🚀 Technology Stack

### Frontend Technologies

- **⚛️ React 18.3.1** - Component-based UI library with concurrent rendering
- **📘 TypeScript 5.7.3** - Static typing for enhanced code quality
- **🔄 Redux Toolkit 2.5.1** - State management with simplified logic
- **🧭 React Router 7.2.0** - Declarative routing for SPA
- **🐜 Ant Design 5.24.1** - Enterprise-grade UI component library
- **🎨 TailwindCSS** - Utility-first CSS framework
- **⚡ Vite 6.1.1** - Next-generation frontend build tool
- **🔌 SockJS & STOMP** - WebSocket communication for real-time features

### Backend Technologies

- **🍃 Spring Boot 3.4.4** - Java-based framework for microservices
- **🔒 Spring Security** - Authentication and authorization framework
- **🗄️ Spring Data JPA** - Data access abstraction with Hibernate
- **🔑 JWT 0.12.6** - JSON Web Token implementation
- **📧 Spring Mail** - Email service integration
- **🔌 WebSocket** - Real-time communication support
- **📊 MapStruct 1.6.3** - Java bean mapping
- **🔧 Lombok 1.18.38** - Boilerplate code reduction

### Database & Storage

- **🗄️ MySQL 8.0.39** - Primary relational database
- **🐳 Docker** - Containerized database deployment
- **☁️ AWS S3** - Object storage for static assets
- **💾 H2** - In-memory database for testing

### AI & Machine Learning

- **🧠 SpeechBrain** - Speech processing and recognition
- **🎤 Whisper** - OpenAI's speech recognition model
- **🔊 Wav2Vec2** - Finnish language speech recognition
- **🤖 AI Services** - Intelligent automation and analytics

### DevOps & Deployment

- **🐳 Docker** - Containerization platform
- **☁️ AWS EC2** - Cloud computing instances
- **☁️ AWS S3** - Static website hosting
- **🌐 Google Cloud** - Alternative cloud deployment
- **🔧 Maven** - Java build automation
- **📦 npm** - Node.js package manager
- **🚀 GitHub Actions** - CI/CD pipeline

### Testing & Quality

- **🧪 JUnit 5** - Java unit testing framework
- **🎭 Mockito** - Java mocking framework
- **📊 JaCoCo** - Code coverage analysis
- **🧪 React Testing Library** - React component testing
- **🔍 TestContainers** - Integration testing with containers

## ⚙️ Prerequisites

### System Requirements

- **Java 17 or higher** (Amazon Corretto recommended for AWS deployment)
- **Node.js 18+** and **npm 9+**
- **Maven 3.8+**
- **MySQL 8.0+** or **Docker** for database
- **Git** for version control

### Development Environment

- **Visual Studio Code** (recommended IDE)
- **Spring Boot Dashboard Extension** (for VS Code)
- **PowerShell** (for Windows users)
- **Docker Desktop** (optional, for containerized database)

### Environment Variables Setup

Create `.env` files in the respective directories:

**Backend (.env in `study/study/`):**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=enterprise_nexus
DB_USERNAME=root
DB_PASSWORD=root

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Novu Configuration
NOVU_API_KEY=your-novu-api-key
```

**Frontend (.env in `study/typescript-react/`):**

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_WEBSOCKET_URL=ws://localhost:8080/ws
```

## 🔧 Installation & Setup

### 1. Clone the Repository

```powershell
git clone https://github.com/your-username/Haaga_Backend_Programming.git
Set-Location "Haaga_Backend_Programming"
```

### 2. Backend Setup (Spring Boot)

```powershell
# Navigate to backend directory
Set-Location "study\study"

# Install dependencies and build
mvn clean install -DskipTests

# Or build with tests
mvn clean install
```

### 3. Frontend Setup (React TypeScript)

```powershell
# Navigate to frontend directory
Set-Location "..\..\study\typescript-react"

# Install dependencies
npm install

# Copy TinyMCE assets
npm run copy-tinymce
```

### 4. Documentation Setup (Optional)

```powershell
# Navigate to documentation directory
Set-Location "..\..\TuPhung_Docs"

# Install dependencies
npm install
```

## 🏃‍♂️ Running the Application

### Method 1: Using Visual Studio Code (Recommended)

1. **Start Database:**

   ```powershell
   docker run --name mysql-8.0.39 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0.39-debian
   ```

2. **Start Backend:**

   - Open `study/study/src/main/java/com/database/study/StudyApplication.java`
   - Right-click and select "Run Java"
   - Ensure `application.yaml` profile is set to `dev`

3. **Start Frontend:**

   ```powershell
   Set-Location "study\typescript-react"
   npm run dev
   ```

4. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Default Login: `adminTom` / `Thanhcong6(`

### Method 2: Command Line

1. **Start Database:**

   ```powershell
   docker run --name mysql-8.0.39 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0.39-debian
   ```

2. **Start Backend:**

   ```powershell
   Set-Location "study\study"
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

3. **Start Frontend:**
   ```powershell
   Set-Location "..\typescript-react"
   npm run dev
   ```

### Method 3: Production Build

1. **Build Backend:**

   ```powershell
   Set-Location "study\study"
   mvn clean package -DskipTests
   java -jar target\study-0.0.1-SNAPSHOT.jar
   ```

2. **Build Frontend:**
   ```powershell
   Set-Location "..\typescript-react"
   npm run build
   npm run preview
   ```

## 🐳 Docker Setup

### MySQL Database with Docker

```powershell
# Start MySQL container
docker run --name mysql-8.0.39 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0.39-debian

# Connect to MySQL (optional)
docker exec -it mysql-8.0.39 mysql -u root -p
```

### Using XAMPP Alternative

```powershell
# Start XAMPP and open Shell
# mysql -u root -p
# Enter password when prompted
```

## 🧪 Testing

### Backend Testing

```powershell
Set-Location "study\study"

# Run all tests
mvn clean test

# Run tests with coverage report
mvn clean test jacoco:report

# View coverage report
Set-Location "target\site\jacoco"
start index.html
```

### Frontend Testing

```powershell
Set-Location "study\typescript-react"

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **JaCoCo Reports:** `study/study/target/site/jacoco/index.html`
- **Frontend Coverage:** Generated in `study/typescript-react/coverage/`

## 🚀 Deployment

### Local Development Deployment

1. **Prerequisites:**

   - Docker running
   - DBeaver (database management)
   - Application built and configured

2. **Deployment Steps:**

   ```powershell
   # Step 1: Start Docker
   docker start mysql-8.0.39

   # Step 2: Start DBeaver and connect to database

   # Step 3: Run application
   Set-Location "study\study"
   mvn spring-boot:run
   ```

### Google Cloud Deployment (Haaga-Helia)

1. **Build Application:**

   ```powershell
   Set-Location "study\study"
   mvn package -DskipTests
   ```

2. **Upload to Cloud:**

   ```powershell
   Set-Location "target"
   scp study-0.0.1-SNAPSHOT.jar bhm352@softala.haaga-helia.fi:
   ```

3. **Deploy on Server:**

   ```bash
   # SSH to server
   ssh bhm352@softala.haaga-helia.fi
   # Password: tuphung

   # Check Java version
   java --version

   # Run application
   java -jar study-0.0.1-SNAPSHOT.jar
   ```

4. **Service Configuration:**

   ```bash
   # Copy to service directory
   sudo cp study-0.0.1-SNAPSHOT.jar /home/matias/

   # Create service file
   sudo cp /etc/systemd/system/sophiabookstore.service /etc/systemd/system/tuphungbookstore.service

   # Edit service configuration
   sudo nano /etc/systemd/system/tuphungbookstore.service

   # Start service
   sudo service tuphungbookstore start

   # Check status
   sudo service tuphungbookstore status
   ```

5. **Port Forwarding:**

   ```powershell
   # Backend database access
   ssh -L 3306:localhost:3306 bhm352@softala.haaga-helia.fi

   # Frontend access
   ssh -L 9095:localhost:9095 bhm352@softala.haaga-helia.fi
   ```

6. **Access URLs:**
   - Frontend: http://softala.haaga-helia.fi:9095/login
   - Local tunneled: http://localhost:9095

### AWS EC2 Deployment

1. **Prepare EC2 Instance:**

   ```powershell
   Set-Location "pemFiles"

   # Set permissions
   chmod 400 "spingboot369.pem"

   # Connect to EC2
   ssh -i "spingboot369.pem" ec2-user@ec2-16-170-143-177.eu-north-1.compute.amazonaws.com
   ```

2. **Install Java 21 on EC2:**

   ```bash
   # Import Corretto key
   sudo rpm --import https://yum.corretto.aws/corretto.key

   # Add Corretto repository
   sudo curl -L -o /etc/yum.repos.d/corretto.repo https://yum.corretto.aws/corretto.repo

   # Install Java 21
   sudo yum install -y java-21-amazon-corretto

   # Verify installation
   java --version
   ```

3. **Deploy Application:**

   ```powershell
   # Build application locally
   Set-Location "study\study"
   mvn package -DskipTests

   # Upload to EC2
   Set-Location "target"
   scp -i ..\..\pemFiles\spingboot369.pem study-0.0.1-SNAPSHOT.jar ec2-user@ec2-16-170-143-177.eu-north-1.compute.amazonaws.com:/home/ec2-user
   ```

### AWS S3 Frontend Deployment

1. **Create S3 Bucket:**

   - Create bucket with unique name
   - Disable "Block public access"
   - Enable static website hosting

2. **Configure Bucket Policy:**

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

3. **Build and Upload:**

   ```powershell
   Set-Location "study\typescript-react"
   npm run build

   # Upload dist folder contents to S3 bucket
   ```

4. **Configure Static Website:**
   - Index document: `index.html`
   - Error document: `index.html`

## 🔒 Security Features

### Authentication & Authorization

- **Multi-factor Authentication** - TOTP and email OTP support
- **OAuth2 Integration** - Google, Facebook, and GitHub login
- **JWT Token Management** - Secure token generation and validation
- **Role-based Access Control** - Granular permission system
- **Session Management** - Secure session handling with refresh tokens

### Data Protection

- **End-to-end Encryption** - All data in transit encrypted
- **Dynamic Key Generation** - Secure token and key management
- **SQL Injection Prevention** - Parameterized queries and JPA
- **XSS Protection** - Content Security Policy implementation
- **CSRF Protection** - Cross-site request forgery prevention

### Security Headers

- **HTTPS Enforcement** - SSL/TLS encryption required
- **Secure Cookies** - HttpOnly and Secure flags
- **CORS Configuration** - Cross-origin resource sharing control
- **Rate Limiting** - API request throttling

## 🤖 AI Integration

### Speech Processing

- **SpeechBrain Integration** - Advanced speech recognition
- **Whisper Model** - OpenAI's speech-to-text capability
- **Wav2Vec2 Finnish** - Finnish language speech recognition
- **Text-to-Speech** - Voice synthesis capabilities

### AI Models Location

```
models/
├── models--Systran--faster-whisper-large-v3/
└── wav2vec2-finnish/
    ├── models--aapot--wav2vec2-xlsr-1b-finnish-lm-v2/
    └── models--aapot--wav2vec2-xlsr-300m-finnish/
```

### Testing AI Integration

```powershell
# Test Whisper import
python -c "import whisper; print('Success')"
```

## 📚 Documentation

### Docusaurus Documentation Site

```powershell
Set-Location "TuPhung_Docs"

# Start development server
npm start
# Access: http://localhost:3030

# Build documentation
npm run build

# Serve built documentation
npm run serve
```

### Documentation Structure

- **Introduction** - Project overview and vision
- **Technology Stack** - Detailed technology breakdown
- **Architecture** - System design and components
- **Backend Guide** - Spring Boot development guide
- **Frontend Guide** - React development guide
- **Deployment** - Comprehensive deployment instructions

### API Documentation

- **REST API Endpoints** - Available at `/swagger-ui.html`
- **WebSocket Events** - Real-time communication documentation
- **Authentication Flow** - OAuth2 and JWT implementation details

## 🛠️ Development Tools

### Recommended VS Code Extensions

- **Spring Boot Dashboard** - Manage Spring Boot applications
- **Java Extension Pack** - Complete Java development support
- **ES7+ React/Redux/React-Native snippets** - React development snippets
- **TypeScript Importer** - Auto import TypeScript modules
- **Prettier** - Code formatting
- **ESLint** - JavaScript/TypeScript linting

### PowerShell Environment Setup

```powershell
# Reload environment PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "Machine")
```

### VS Code Terminal Integration

Add to VS Code settings.json:

```json
{
  "terminal.integrated.env.windows": {
    "PATH": "${env:PATH}"
  }
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Port Conflicts

**Problem:** Port 8080 or 9090 already in use

**Solution:**

```powershell
# Find process using port
netstat -ano | findstr :8080

# Kill process (replace PID with actual process ID)
taskkill /F /PID 28408
```

#### Database Connection Issues

**Problem:** MySQL connection refused

**Solutions:**

1. **Check Docker container:**

   ```powershell
   docker ps
   docker start mysql-8.0.39
   ```

2. **Verify database credentials in application.yaml**

3. **Check firewall settings**

#### MySQL Access Denied

**Problem:** Access denied for root@localhost

**Solution:**

1. Create `mysql-init.txt` in C:\ with:

   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
   FLUSH PRIVILEGES;
   ```

2. Stop MySQL service

3. Run as Administrator:

   ```powershell
   Set-Location "C:\Program Files\MySQL\MySQL Server 9.0\bin"
   mysqld --defaults-file="C:\\ProgramData\\MySQL\\MySQL Server 9.0\\my.ini" --init-file=c:\\mysql-init.txt --console
   ```

4. Start MySQL service and connect:
   ```powershell
   mysql -u root -p
   ```

#### Frontend Build Issues

**Problem:** TinyMCE assets not found

**Solution:**

```powershell
Set-Location "study\typescript-react"
npm run copy-tinymce
```

#### Java Version Conflicts

**Problem:** Wrong Java version

**Solution:**

```powershell
# Check Java version
java --version

# Set JAVA_HOME if needed
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

### Environment-Specific Issues

#### Windows PowerShell Commands

- Use `;` instead of `&&` for command chaining
- Use `Set-Location` instead of `cd` for directory changes
- Use `New-Item -ItemType Directory -Force` instead of `mkdir -p`

#### Cloud Deployment Issues

- Ensure Java 17+ is installed on target server
- Verify network security groups allow required ports
- Check SSL certificate configuration for HTTPS

## 📞 Support

### Getting Help

1. **Documentation:** Check the comprehensive documentation in `TuPhung_Docs/`
2. **Issues:** Create GitHub issues for bugs and feature requests
3. **Discussions:** Use GitHub Discussions for questions and community support

### Development Team Contacts

- **Project Lead:** TuPhung
- **Backend Development:** Spring Boot Team
- **Frontend Development:** React Team
- **DevOps:** Cloud Infrastructure Team

### Useful Resources

- **Spring Boot Documentation:** https://spring.io/projects/spring-boot
- **React Documentation:** https://react.dev/
- **TypeScript Documentation:** https://www.typescriptlang.org/
- **Ant Design Documentation:** https://ant.design/
- **MySQL Documentation:** https://dev.mysql.com/doc/

---

<div align="center">

**Enterprise Nexus** - Transforming Enterprise Management Through Innovation

Made with ❤️ by the Haaga Backend Programming Team

</div>
