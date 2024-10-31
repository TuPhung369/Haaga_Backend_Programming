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

## Start the project by localhost

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

- Step package: `mvn package`
- Step 1: package the project by Maven(below Explorer in VSC) with lifeCycle -> Package
- Step 2: open the project with Git Bash
- Step 3: cd `target`
- Step 4: use command for upload to Cloud
  - `scp restdemo-0.0.1-SNAPSHOT.jar bhm352@softala.haaga-helia.fi:`
- Step 5: enter the password `tuphung`

### Access the my cloud (Google cloud -> need to add port 0.0.0.0/0 for allowing connection)

Open GitBash -> `ssh bhm352@softala.haaga-helia.fi` (enter password `tuphung`) (logout with `exit` command)

 check `java --version` version of java
 `java -jar restdemo-0.0.1-SNAPSHOT.jar`

### Access to database in Haaga-Helia

mysql -u bhm352 -p
enter the password `password`

`mvn package -DskipTests` => package without tests.

BACKEND `ssh -L 3306:localhost:3306 bhm352@softala.haaga-helia.fi` as `http://localhost:3306` => You can then connect to the MySQL server using a client (like mysql or a database management tool) by connecting to localhost:3306 on your local machine.

FRONTEND `ssh -L 9095:localhost:9095 bhm352@softala.haaga-helia.fi`=> run this command at local machine for remote port `http://softala.haaga-helia.fi:9095` as `http://localhost:9095`

link check the front end `http://softala.haaga-helia.fi:9095/login`

## start the service for running application (like virtual machine)

- java version support 17 only
- Initial step`admin with Allow the permissiong for user`
  - `ssh jusju@localhost`
  - `sudo su`
  - `visudo` => set permission
  - `exit`

- Step 1: cp the file to `home/matias` (matias as user with always be running)
  - `sudo cp bookstorerest-0.0.1-SNAPSHOT.jar /home/matias/`
- Step 2: `sudo su` - login like superUser `root@softala`
- Step 3: `cd /etc/systemd/system`
- Step 4: create the service file `tuphungbookstore.service` `cp sophiabookstore.service tuphungbookstore.service`
- Step 5: change the name of file into service file `nano tuphungbookstore.service`
- Step 6: start the service `service tuphungbookstore start` # `service tuphungbookstore stop`
- Step 7: check the status `service tuphungbookstore status`
`● tuphungbookstore.service - Manage Java service
   Loaded: loaded (/etc/systemd/system/tuphungbookstore.service; disabled; vendor preset: enabled)
   Active: active (running) since Thu 2024-10-31 11:16:38 UTC; 12min ago`
`history | grep reload` checking daemon-reload
