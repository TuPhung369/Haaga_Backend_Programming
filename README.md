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

`netstat -ab` or `netstat -ano | findstr :9090`
This will list all active connections and the process names, which can help you see if something is using port 8080.
C:\Windows\System32>netstat -ano | findstr :9090
  TCP    [::1]:9090             [::1]:17044            FIN_WAIT_2      28408
  TCP    [::1]:17044            [::1]:9090             CLOSE_WAIT      29388

taskkill /F /PID 28408
taskkill /F /PID 29388

### guide for upload the file from `Maven lifeCycle Package` to cloud

- Step 1: package the project by Maven(below Explorer in VSC) with lifeCycle -> Package
- Step 2: open the project with Git Bash
- Step 3: cd `target`
- Step 4: use command for upload to Cloud
  - `scp restdemo-0.0.1-SNAPSHOT.jar bhm352@softala.haaga-helia.fi:`
- Step 5: enter the password `t.p.....`

### Access the my cloud

Open GitBash -> `ssh bhm352@softala.haaga-helia.fi` (enter password) (logout with `exit` command)

 check `java --version` version of java
 `java -jar restdemo-0.0.1-SNAPSHOT.jar`
