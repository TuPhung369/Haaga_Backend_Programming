---
description: Repository Information Overview
alwaysApply: true
---

# Haaga Backend Programming Information

## Summary

A multi-project repository containing a Spring Boot backend application, React frontend, and Docusaurus documentation site. The project focuses on authentication workflows, including OAuth2 integration with Google, GitHub, and Facebook. It includes database connectivity (MySQL), JWT token management, and deployment configurations for various environments (local, Google Cloud, AWS).

## Structure

- **study/study/**: Spring Boot backend application with Java 21
- **study/typescript-react/**: React frontend with TypeScript and Vite
- **study/react-study/**: Alternative React frontend
- **TuPhung_Docs/**: Docusaurus documentation site
- **models/**: Machine learning models for speech recognition
- **pemFiles/**: AWS EC2 access keys

## Projects

### Backend (study/study/)

**Configuration File**: pom.xml

#### Language & Runtime

**Language**: Java
**Version**: 21
**Build System**: Maven
**Package Manager**: Maven

#### Dependencies

**Main Dependencies**:

- Spring Boot 3.4.4 (Web, Security, JPA, OAuth2)
- MySQL Connector 9.1.0
- JWT 0.12.6
- Lombok 1.18.38
- MapStruct 1.6.3
- Novu Notification 1.2.0

#### Build & Installation

```bash
mvn clean install -DskipTests
mvn package
```

#### Testing

**Framework**: JUnit Jupiter, Mockito
**Test Location**: src/test/java/com/database/study/
**Configuration**: Maven Surefire Plugin, JaCoCo
**Run Command**:

```bash
mvn clean test jacoco:report
```

### Frontend (study/typescript-react/)

**Configuration File**: package.json

#### Language & Runtime

**Language**: TypeScript
**Version**: 5.7.3
**Build System**: Vite 6.1.1
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:

- React 18.3.1
- Redux 5.0.1
- Axios 1.7.9
- Ant Design 5.24.1
- React Router 7.2.0
- TinyMCE 7.8.0
- OAuth2 Google 0.12.1

#### Build & Installation

```bash
npm install
npm run dev
npm run build
```

### Documentation (TuPhung_Docs/)

**Configuration File**: package.json

#### Language & Runtime

**Language**: JavaScript
**Version**: Node.js
**Build System**: Docusaurus 3.7.0
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:

- Docusaurus 3.7.0
- React 18.2.0
- Mermaid 11.6.0

#### Build & Installation

```bash
npm install
npm run start
npm run build
```

## Docker

**Configuration**: Docker is used for MySQL database:

```bash
docker run --name mysql-8.0.39 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0.39-debian
```

## Deployment

**AWS EC2**:

- Java 21 Amazon Corretto required
- Upload JAR via SCP: `scp -i pemFiles/spingboot369.pem study-0.0.1-SNAPSHOT.jar ec2-user@ec2-instance:/home/ec2-user`

**AWS S3 (Frontend)**:

- Static website hosting enabled
- Public read access configured via bucket policy

**Google Cloud**:

- SSH access: `ssh bhm352@softala.haaga-helia.fi`
- Service configuration: `/etc/systemd/system/tuphungbookstore.service`
