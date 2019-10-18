CREATE DATABASE theo;
CREATE USER 'theouser'@'%' IDENTIFIED WITH caching_sha2_password BY 'theopwd';
GRANT ALL PRIVILEGES ON theo.* TO 'theouser'@'%';
