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

`ssh -L 3306:localhost:3306 bhm352@softala.haaga-helia.fi` => run this command at local machine for remote port `http://softala.haaga-helia.fi:9095` as `http://localhost:9095`
link check the front end `http://softala.haaga-helia.fi:9095/login`
Command Breakdown
ssh: This is the command to initiate an SSH (Secure Shell) connection, which allows secure remote access to a server.
-L 3306:localhost:3306: This option specifies local port forwarding. It forwards traffic from your local machine's port 3306 to port 3306 on the remote server (localhost refers to the remote server in this context). Here's how it breaks down:
3306: The first 3306 is the port on your local machine that you want to use.
localhost: This refers to the remote server's localhost, meaning it will connect to the MySQL server running on that machine.
3306: The second 3306 is the port on the remote machine that you want to connect to (in this case, the default MySQL port).
`bhm352@softala.haaga-helia.fi:` This is the username (bhm352) and hostname (softala.haaga-helia.fi) of the remote server you are connecting to.

Purpose of the Command
The primary purpose of this command is to securely connect to a MySQL server running on the remote server (softala.haaga-helia.fi) from your local machine. Here’s what happens when you run this command:

Secure Connection: It establishes a secure SSH connection to the remote server.
Port Forwarding: It forwards all traffic that comes to your local machine on port 3306 to port 3306 on the remote server. This allows you to connect to the MySQL server running on the remote server as if it were running locally on your machine.
Accessing Remote Services: You can then connect to the MySQL server using a client (like mysql or a database management tool) by connecting to localhost:3306 on your local machine.
