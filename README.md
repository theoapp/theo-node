# Theo

Theo is a public key manager, you can use it as replacement for all of your `authorized_keys` 

## Prerequisites

OpenSSH server must be  version >= 6.1 (since it has to support `AuthorizedKeysCommand` option)

## Quick install

### Theo server

You can easily run a Theo server using Theo's docker image:

__NB__ don't forget to replace ADMIN_TOKEN and CLIENT_TOKENS values!

`docker run --rm -v /tmp/theo:/data -e DATA_PATH=/data/theo.db -e ADMIN_TOKEN=12345 -e CLIENT_TOKENS=abcde,fghij -p 9100:9100 theoapp/theo`

Then install `theoapp-cli` using npm:

`$ npm i -g --production theoapp-cli`

Now you're ready to create your first user:

__NB__ don't forget to replace ADMIN_TOKEN with the same value you used before

```
$ THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    accounts add \
    --name michele \
    --email michele@sample.com
```

You should see this output

```
+---------------------------------+
{
   "id": 1,
   "name": "michele",
   "email": "michele@sample.com",
   "active": 1,
   "public_keys": [],
   "permissions": []
}
+---------------------------------+
```

Add michele's public key to the account:

```
$ THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    keys add 1 \
    -k "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC7J+fzmV6qlnI/9p0368mWxt/srLcNJ32ti3CyAYrSF/+XGoiZBTfOEus8ONfHKmpdUcB3WQqb8A9tCQlNIWdIVxVh/QXSd0fsgbtFxmjvptJDoyytUGGp592bXMWHpckyi77Nx2DasqhK12vYqthOt+QH68WGje5qjkg9Nsvj7YI8c2f6H4o7HUNVeeaJS+X63O9IeErt6VZI+sYOpgqCka0BmNTPNR/gARGDe788CBSynvfatUfmfLQVRhyJMMmYJsqetbxXTMPSZWjkaMQLkZ9jPcGSjBfzMEsYqqzKC5L+Op/3MwbSd5sHiCxmlD1DuY5agdf4W7/XQOvgyzJ2C347PRq7LplS03D7xUw== macno@habanero"
```

You should see this output

```    
  +--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
  {
     "account_id": "1",
     "keys": [
        {
           "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC7J+fzmV6qlnI/9p0368mWxt/srLcNJ32ti3CyAYrSF/+XGoiZBTfOEus8ONfHKmpdUcB3WQqb8A9tCQlNIWdIVxVh/QXSd0fsgbtFxmjvptJDoyytUGGp592bXMWHpckyi77Nx2DasqhK12vYqthOt+QH68WGje5qjkg9Nsvj7YI8c2f6H4o7HUNVeeaJS+X63O9IeErt6VZI+sYOpgqCka0BmNTPNR/gARGDe788CBSynvfatUfmfLQVRhyJMMmYJsqetbxXTMPSZWjkaMQLkZ9jPcGSjBfzMEsYqqzKC5L+Op/3MwbSd5sHiCxmlD1DuY5agdf4W7/XQOvgyzJ2C347PRq7LplS03D7xUw== macno@habanero"
        }
     ]
  }
  +--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Configure which users and hosts michele could access:

_Examples_


if michele must be able to login as user `macno` on server `daiquiri`:

```
THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    permissions add 1 \
    --host daiquiri \
    --user macno
```

You should see this output

```
+--------------------+
{
   "account_id": "1"
}
+--------------------+
```

if michele must be able to login as user `macno` on all the servers of your organization:
 
```
THEO_URL=http://localhost:9100 THEO_TOKEN=12345 theo \
    permissions add 1 \
    --host "*" \
    --user macno
```

You should see this output

```
+--------------------+
{
   "account_id": "1"
}
+--------------------+
```

### Theo clients

On servers you want to connect to, create a simple script and save it, ex: `/usr/local/bin/get_ssh_keys.sh`:

__NB__ don't forget to replace the bearer value with one of the CLIENT_TOKENS you used before

```
#!/bin/sh
curl -H "Authorization: Bearer abcde" http://THEOSERVER_IP_OR_FQDN:9100/authorized_keys/$(hostname)/${1}
```

__remember__ to make it executable! `chmod +x /usr/local/bin/get_ssh_keys.sh` 

Then in your /etc/sshd_config you need only add:

```
AuthorizedKeysCommand /usr/local/bin/get_ssh_keys.sh
AuthorizedKeysCommandUser nobody
```

reload sshd

`service sshd reload`

