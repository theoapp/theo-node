CREATE DATABASE theo;
CREATE USER 'theouser'@'%' IDENTIFIED WITH mysql_native_password BY 'theopwd';
GRANT ALL PRIVILEGES ON theo.* TO 'theouser'@'%';
