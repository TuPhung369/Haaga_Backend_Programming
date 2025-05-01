---
sidebar_position: 6
---

# Deployment Guide

This guide provides instructions for deploying the TuPhung Project to various environments.

## Prerequisites

Before deploying the application, ensure you have the following:

- Node.js 16+ and npm 7+ for the frontend
- Java 17+ and Maven 3.8+ for the backend
- PostgreSQL 14+ database
- Docker and Docker Compose (optional, for containerized deployment)
- AWS CLI (optional, for AWS deployment)

## Local Development Environment

### Frontend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/TuPhung369/Haaga_Backend_Programming.git
   cd Haaga_Backend_Programming/study/typescript-react
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with the following content:

   ```
   VITE_API_URL=http://localhost:8080/api
   VITE_WS_URL=ws://localhost:8080/ws
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd Haaga_Backend_Programming/study/study
   ```

2. Create an `application-dev.yaml` file with the following content:

   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/tuphung
       username: postgres
       password: your_password

     jpa:
       hibernate:
         ddl-auto: update
       show-sql: true

   jwt:
     secret: your_jwt_secret_key
     expiration: 86400000
   ```

3. Build the application:

   ```bash
   mvn clean install -DskipTests
   ```

4. Run the application:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

## Docker Deployment

### Using Docker Compose

1. Create a `docker-compose.yml` file in the project root:

   ```yaml
   version: "3.8"

   services:
     postgres:
       image: postgres:14-alpine
       container_name: tuphung-postgres
       environment:
         POSTGRES_DB: tuphung
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       volumes:
         - postgres-data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
       networks:
         - tuphung-network

     backend:
       build:
         context: ./study/study
         dockerfile: Dockerfile
       container_name: tuphung-backend
       depends_on:
         - postgres
       environment:
         SPRING_PROFILES_ACTIVE: docker
         SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/tuphung
         SPRING_DATASOURCE_USERNAME: postgres
         SPRING_DATASOURCE_PASSWORD: postgres
         JWT_SECRET: your_jwt_secret_key
       ports:
         - "8080:8080"
       networks:
         - tuphung-network

     frontend:
       build:
         context: ./study/typescript-react
         dockerfile: Dockerfile
       container_name: tuphung-frontend
       depends_on:
         - backend
       environment:
         VITE_API_URL: http://localhost:8080/api
         VITE_WS_URL: ws://localhost:8080/ws
       ports:
         - "3000:80"
       networks:
         - tuphung-network

   networks:
     tuphung-network:

   volumes:
     postgres-data:
   ```

2. Create a Dockerfile for the backend in `study/study/Dockerfile`:

   ```dockerfile
   FROM maven:3.8.6-openjdk-17-slim AS build
   WORKDIR /app
   COPY pom.xml .
   RUN mvn dependency:go-offline
   COPY src ./src
   RUN mvn package -DskipTests

   FROM openjdk:17-slim
   WORKDIR /app
   COPY --from=build /app/target/*.jar app.jar
   EXPOSE 8080
   ENTRYPOINT ["java", "-jar", "app.jar"]
   ```

3. Create a Dockerfile for the frontend in `study/typescript-react/Dockerfile`:

   ```dockerfile
   FROM node:16-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

4. Create an nginx configuration file in `study/typescript-react/nginx.conf`:

   ```
   server {
     listen 80;
     server_name localhost;
     root /usr/share/nginx/html;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     location /api {
       proxy_pass http://backend:8080/api;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }

     location /ws {
       proxy_pass http://backend:8080/ws;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
     }
   }
   ```

5. Start the containers:
   ```bash
   docker-compose up -d
   ```

## AWS Deployment

### Backend Deployment to AWS Elastic Beanstalk

1. Create an Elastic Beanstalk application:

   ```bash
   aws elasticbeanstalk create-application --application-name tuphung-backend
   ```

2. Create an environment:

   ```bash
   aws elasticbeanstalk create-environment \
     --application-name tuphung-backend \
     --environment-name tuphung-backend-prod \
     --solution-stack-name "64bit Amazon Linux 2 v3.4.0 running Corretto 17" \
     --option-settings file://eb-options.json
   ```

3. Create an `eb-options.json` file:

   ```json
   [
     {
       "Namespace": "aws:autoscaling:launchconfiguration",
       "OptionName": "InstanceType",
       "Value": "t2.micro"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_PROFILES_ACTIVE",
       "Value": "prod"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_DATASOURCE_URL",
       "Value": "jdbc:postgresql://your-rds-endpoint:5432/tuphung"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_DATASOURCE_USERNAME",
       "Value": "postgres"
     },
     {
       "Namespace": "aws:elasticbeanstalk:application:environment",
       "OptionName": "SPRING_DATASOURCE_PASSWORD",
       "Value": "your_password"
     }
   ]
   ```

4. Package the application:

   ```bash
   cd study/study
   mvn clean package -DskipTests
   ```

5. Deploy the application:

   ```bash
   aws elasticbeanstalk create-application-version \
     --application-name tuphung-backend \
     --version-label v1 \
     --source-bundle S3Bucket="your-bucket",S3Key="tuphung-backend.jar"

   aws elasticbeanstalk update-environment \
     --application-name tuphung-backend \
     --environment-name tuphung-backend-prod \
     --version-label v1
   ```

### Frontend Deployment to AWS Amplify

1. Create a build specification file `amplify.yml` in the project root:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd study/typescript-react
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: study/typescript-react/dist
       files:
         - "**/*"
     cache:
       paths:
         - node_modules/**/*
   ```

2. Create an Amplify app:

   ```bash
   aws amplify create-app \
     --name tuphung-frontend \
     --repository https://github.com/TuPhung369/Haaga_Backend_Programming \
     --access-token your_github_access_token
   ```

3. Create a branch:

   ```bash
   aws amplify create-branch \
     --app-id your_amplify_app_id \
     --branch-name main
   ```

4. Start the deployment:
   ```bash
   aws amplify start-job \
     --app-id your_amplify_app_id \
     --branch-name main \
     --job-type RELEASE
   ```

## GitHub Pages Deployment

To deploy the documentation to GitHub Pages:

1. Add the following to your `package.json` in the `TuPhung_Docs` directory:

   ```json
   {
     "scripts": {
       "deploy": "docusaurus deploy"
     }
   }
   ```

2. Configure GitHub Actions by creating a `.github/workflows/documentation.yml` file:

   ```yaml
   name: Deploy Documentation

   on:
     push:
       branches:
         - main
       paths:
         - "TuPhung_Docs/**"

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
             cache: npm
             cache-dependency-path: TuPhung_Docs/package-lock.json
         - name: Install dependencies
           run: |
             cd TuPhung_Docs
             npm ci
         - name: Build website
           run: |
             cd TuPhung_Docs
             npm run build
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./TuPhung_Docs/build
   ```

3. Enable GitHub Pages in your repository settings:

   - Go to Settings > Pages
   - Set Source to "GitHub Actions"

4. Push your changes to the main branch:
   ```bash
   git add .
   git commit -m "Add documentation"
   git push origin main
   ```

## Continuous Integration/Continuous Deployment

### GitHub Actions Workflow

Create a `.github/workflows/ci-cd.yml` file:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"
          cache: maven
      - name: Build with Maven
        run: |
          cd study/study
          mvn clean verify
      - name: Run tests
        run: |
          cd study/study
          mvn test

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "16"
          cache: "npm"
          cache-dependency-path: study/typescript-react/package-lock.json
      - name: Install dependencies
        run: |
          cd study/typescript-react
          npm ci
      - name: Build
        run: |
          cd study/typescript-react
          npm run build
      - name: Run tests
        run: |
          cd study/typescript-react
          npm test

  deploy:
    needs: [backend-build, frontend-build]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Deploy backend
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"
          cache: maven
      - name: Build backend
        run: |
          cd study/study
          mvn clean package -DskipTests
      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: tuphung-backend
          environment_name: tuphung-backend-prod
          version_label: ${{ github.sha }}
          region: us-east-1
          deployment_package: study/study/target/study-0.0.1-SNAPSHOT.jar

      # Deploy frontend
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "16"
          cache: "npm"
          cache-dependency-path: study/typescript-react/package-lock.json
      - name: Install dependencies
        run: |
          cd study/typescript-react
          npm ci
      - name: Build
        run: |
          cd study/typescript-react
          npm run build
      - name: Deploy to Amplify
        uses: ambientlight/amplify-cli-action@0.3.0
        with:
          amplify_command: publish
          amplify_env: prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

## Monitoring and Logging

### AWS CloudWatch Setup

1. Add CloudWatch dependencies to the backend `pom.xml`:

   ```xml
   <dependency>
     <groupId>io.micrometer</groupId>
     <artifactId>micrometer-registry-cloudwatch2</artifactId>
   </dependency>
   <dependency>
     <groupId>org.springframework.cloud</groupId>
     <artifactId>spring-cloud-starter-aws</artifactId>
   </dependency>
   ```

2. Configure CloudWatch in `application-prod.yaml`:

   ```yaml
   management:
     metrics:
       export:
         cloudwatch:
           namespace: TuPhung/Backend
           batch-size: 20
     endpoints:
       web:
         exposure:
           include: health,info,metrics

   logging:
     level:
       root: INFO
       com.database.study: INFO
     pattern:
       console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
     file:
       name: /var/log/tuphung-backend.log
   ```

3. Create CloudWatch alarms:
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name tuphung-backend-high-cpu \
     --alarm-description "High CPU utilization" \
     --metric-name CPUUtilization \
     --namespace AWS/EC2 \
     --statistic Average \
     --period 300 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --dimensions Name=InstanceId,Value=i-12345678 \
     --evaluation-periods 2 \
     --alarm-actions arn:aws:sns:us-east-1:123456789012:tuphung-alerts
   ```

## Backup and Disaster Recovery

### Database Backup

1. Set up automated PostgreSQL backups:

   ```bash
   aws rds create-db-instance-read-replica \
     --db-instance-identifier tuphung-db-replica \
     --source-db-instance-identifier tuphung-db
   ```

2. Configure automated snapshots:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier tuphung-db \
     --backup-retention-period 7 \
     --preferred-backup-window "03:00-04:00" \
     --apply-immediately
   ```

### Application Backup

1. Create an S3 bucket for application backups:

   ```bash
   aws s3 mb s3://tuphung-backups
   ```

2. Set up a backup script:

   ```bash
   #!/bin/bash
   DATE=$(date +%Y-%m-%d)
   BACKUP_DIR="/tmp/tuphung-backup-$DATE"

   # Create backup directory
   mkdir -p $BACKUP_DIR

   # Backup database
   pg_dump -h your-db-host -U postgres -d tuphung > $BACKUP_DIR/tuphung-db-$DATE.sql

   # Backup application files
   cp -r /path/to/application/config $BACKUP_DIR/config

   # Create archive
   tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR

   # Upload to S3
   aws s3 cp $BACKUP_DIR.tar.gz s3://tuphung-backups/

   # Cleanup
   rm -rf $BACKUP_DIR
   rm $BACKUP_DIR.tar.gz
   ```

3. Schedule the backup script with cron:
   ```
   0 2 * * * /path/to/backup-script.sh
   ```
