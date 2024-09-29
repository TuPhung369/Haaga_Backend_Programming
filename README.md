# Haaga_Backend_Programming

BackEnd Programming
Important `Enable the` `Spring Boot DashBoard` Extension.
using this command for clean `mvn clean install -DskipTests`

## Using XAMPP

start -> click on `Shell` Tab and tab the command `# mysql -u root -p`
enter password

## Docker

run mySQL with Docker
`docker run --name mysql-8.0.39 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0.39-debian`

## Start the project

Step 1: Run Docker
Step 2: Run Dbeaver
Step 3: Run application

## kill the port 8080

`netstat -ano | findstr :8080` -> cmd

Use netstat to Look for Conflicts
If you suspect that a third-party tool or service is reserving the port but can’t identify it, you can try using netstat with elevated privileges again:

Run this command to get a complete overview of all listening ports and the associated processes:

`netstat -ab`
This will list all active connections and the process names, which can help you see if something is using port 8080.
