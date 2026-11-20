# Theo 

## CHANGELOG

### 3.0.1

* Theo now refuses to start when a `.env` file exists but cannot be read (e.g. a file mounted with a mode that the
  image's unprivileged user has no access to). Before, the file was skipped silently and theo started with its
  defaults (sqlite on `./data/theo.db`). A missing `.env` is still fine
* `npm_package_name` / `npm_package_version` are now set at startup when missing (as it happens when theo is not
  started through npm), so logs are named after theo instead of `@fluidware-it/saddlebag`
* Calls to `/healthz` are no longer logged
* Fix duplicated `Content-Type` header in outgoing HTTP requests when the caller sets it with a different case

### 3.0.0

* Container image now runs as an unprivileged user (`nodeapp`, uid 12345, member of group `nodedevs`, gid 12321)
  instead of root.  
NOTE: files and directories mounted into the container must be accessible to that user:
  * a mounted `.env` (or `SETTINGS_FILE`, `DB_PASSWORD_FILE`, `DB_SSL_CA`) must be readable by uid 12345 or gid 12321.
    If the `.env` is not loaded, theo falls back to its defaults (sqlite on `./data/theo.db`)
  * when using sqlite, `DB_STORAGE` must point to a directory writable by uid 12345

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
