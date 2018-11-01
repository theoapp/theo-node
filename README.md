## Theo

[![](https://images.microbadger.com/badges/image/theoapp/theo.svg)](https://microbadger.com/images/theoapp/theo) 
[![Build Status](https://travis-ci.org/theoapp/theo-node.svg?branch=master)](https://travis-ci.org/theoapp/theo-node)

Theo is a public key manager, you can use it as replacement for all of your `authorized_keys`   
It allows you to set fine permissions (specific user and host) or to use wildcard (ex, using host `%.test.sample.com`) 

### Summary

- [System Requirements](#system-requirements)
- [Prerequisites](#prerequisites)
- [Cookbook](#cookbook)
- [Caching](#caching)

### System Requirements

Please check if your system meets the following minimum requirements :

| Type |  Value  |
| ---- | ------- | 
| CPU  | 1 GHz   | 
| RAM  | 512 MiB |

### Prerequisites

OpenSSH server must be version >= 6.1 (since it has to support `AuthorizedKeysCommand` option)

### Cookbook

#### 1 - Theo server

You can easily run a Theo server using Theo's docker image:

__NOTE__ don't forget to replace `ADMIN_TOKEN` and `CLIENT_TOKENS` values!

`$ docker run --rm -v /tmp/theo:/data -e DATA_PATH=/data/theo.db -e ADMIN_TOKEN=12345 -e CLIENT_TOKENS=abcde,fghij -p 9100:9100 theoapp/theo`

Then install `theoapp-cli` using npm:

`$ npm i -g --production theoapp-cli`

Now you're ready to create your first user:

__NOTE__ don't forget to replace `ADMIN_TOKEN` with the same value you used before

```
$ THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    accounts add \
    --name john.doe \
    --email john.doe@sample.com
```

You should see this output

```
+---------------------------------+
{
   "id": 1,
   "name": "john.doe",
   "email": "john.doe@sample.com",
   "active": 1,
   "public_keys": [],
   "permissions": []
}
+---------------------------------+
```

Add john.doe's public key to the account:

```
$ THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    keys add 1 \
    -k "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC7J+fzmV6qlnI/9p0368mWxt/srLcNJ32ti3CyAYrSF/+XGoiZBTfOEus8ONfHKmpdUcB3WQqb8A9tCQlNIWdIVxVh/QXSd0fsgbtFxmjvptJDoyytUGGp592bXMWHpckyi77Nx2DasqhK12vYqthOt+QH68WGje5qjkg9Nsvj7YI8c2f6H4o7HUNVeeaJS+X63O9IeErt6VZI+sYOpgqCka0BmNTPNR/gARGDe788CBSynvfatUfmfLQVRhyJMMmYJsqetbxXTMPSZWjkaMQLkZ9jPcGSjBfzMEsYqqzKC5L+Op/3MwbSd5sHiCxmlD1DuY5agdf4W7/XQOvgyzJ2C347PRq7LplS03D7xUw== john.doe@localhost"
```

You should see this output

```    
  +--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
  {
     "account_id": "1",
     "keys": [
        {
           "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC7J+fzmV6qlnI/9p0368mWxt/srLcNJ32ti3CyAYrSF/+XGoiZBTfOEus8ONfHKmpdUcB3WQqb8A9tCQlNIWdIVxVh/QXSd0fsgbtFxmjvptJDoyytUGGp592bXMWHpckyi77Nx2DasqhK12vYqthOt+QH68WGje5qjkg9Nsvj7YI8c2f6H4o7HUNVeeaJS+X63O9IeErt6VZI+sYOpgqCka0BmNTPNR/gARGDe788CBSynvfatUfmfLQVRhyJMMmYJsqetbxXTMPSZWjkaMQLkZ9jPcGSjBfzMEsYqqzKC5L+Op/3MwbSd5sHiCxmlD1DuY5agdf4W7/XQOvgyzJ2C347PRq7LplS03D7xUw== john.doe@localhost"
        }
     ]
  }
  +--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Configure which users and hosts john.doe could access:

_Examples_


if john.doe must be able to login as user `ubuntu` on server `srv-sample-01`:

```
THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    permissions add 1 \
    --host srv-sample-01 \
    --user ubuntu
```

You should see this output

```
+--------------------+
{
   "account_id": "1"
}
+--------------------+
```

if john.doe must be able to login as user `ubuntu` on all the servers of your organization:
 
```
THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    permissions add 1 \
    --host "%" \
    --user ubuntu
```

You should see this output

```
+--------------------+
{
   "account_id": "1"
}
+--------------------+
```

#### 2 - Theo Agent

On every server you want to connect to, you need to configue a theo agent.  
You can use the `theo-agent` or do everything manually.
 
1. Install `theo-agent`

    See [theo-agent](https://github.com/theoapp/theo-agent)  repo

2. Manually

    Create a simple script and save it, ex: `/usr/local/bin/get_ssh_keys.sh`:
    
    __NOTE__ don't forget to replace the bearer value with one of the `CLIENT_TOKENS` you used before
    __NOTE 2__ check the output of `hostname` it must match the value you used when adding the permissions above
     
    ```
    #!/bin/sh
    AUTH_KEYS_FILE=/var/cache/theo/${1}
    curl -H "Authorization: Bearer ${CLIENT_TOKEN}" -s -f -o ${AUTH_KEYS_FILE} http://${THEOSERVER_IP_OR_FQDN}:9100/authorized_keys/$(hostname)/${1}
    cat ${AUTH_KEYS_FILE} 2>/dev/null
    ```
    
    __remember__ to protect it and make it executable! `chmod 755 /usr/local/bin/get_ssh_keys.sh` 
    
    Create and protect the theo dir:
    
    ```
    $ sudo mkdir -p /var/cache/theo
    $ sudo chmod 700 /var/cache/theo/
    $ sudo chown nobody /var/cache/theo/
    ``` 
    
    Then in your `/etc/sshd_config` you need to add:
    
    ```
    AuthorizedKeysFile /var/cache/theo/%u
    AuthorizedKeysCommand /usr/local/bin/get_ssh_keys.sh
    AuthorizedKeysCommandUser nobody
    ```
    
    Be sure password authentication is disabled
    
    ```
    PasswordAuthentication no
    ```
    
    reload sshd

**NOTE** do not logout until you're sure everything is working!

from another terminal try to connect to the server:

`$ ssh ubuntu@srv-sample-01`



### Caching

Optionally you can enable keys caching on theo using `memcached` or `redis`, just add to your env these variables:

For memcached:

```
CACHE_ENABLED=memcached
CACHE_URI=localhost:11211
```

For redis:
```
CACHE_ENABLED=redis
CACHE_URI=redis://localhost:6379
```

Cfg also [docker-compose-memcached](examples/docker-compose/docker-compose-memcached.yml) and [docker-compose-redis](examples/docker-compose/docker-compose-redis.yml) for examples
 
