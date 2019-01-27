# Theo 

## CHANGELOG

### 0.12.0

* \+ Improved checks for REQUIRE_SIGNED_KEY
* \+ Add new event to log HTTP request

### 0.11.0

* \+ Add new env variable CLUSTER_MODE to support horizontal scaling of theo instances.  
NOTE: It requires mariadb/mysql database and redis
* \+ Add new setting to accept only signed keys (env REQUIRE_SIGNED_KEY=1 or settings.keys.sign = 1) 

### 0.10.0

* Rename groups table to tgroups to support mysql-server
* Container image now uses node:10-alpine 
* When using sqlite, Theo will try to create db parent directory (Since now it failed if such directory didn't exist)
* \+ Build now uses multi-stage build 
* \+ GET /authorized_keys now accepts only 1 parameter (user) host is detected from client IP (or x-forwarded-for http header).  
NOTE we detected some issues when running theo in docker/k8s environment using IPv6


### 0.9.0

* \+ Add cloud-init examples  
* \+ Documentation is now written in rtd and published to theoapp.readthedocs.io  
* \+ New feature to read/store admin and client tokens from db
 
### 0.8.0
* \+ Exp/Imp functions

### 0.7.0
* \+ Account expiration date   
* \+ New API to retrieve all accounts/groups with a specific permission

### 0.6.0
* \+ Public key signature  
* \+ New permissions architecture. Permissions are now linked only to groups. When created, an account is member of a personal group with a name equals to account's email.  
* \+ Initial support to plugin. Plugin will extends Theo functionalities through events listeners. See [EVENTS](EVENTS.md) to check which events are available.
