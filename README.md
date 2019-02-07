![Theo](theo-logo-500.png)

[![](https://images.microbadger.com/badges/version/theoapp/theo.svg)](https://microbadger.com/images/theoapp/theo "theoapp/theo")
[![](https://images.microbadger.com/badges/image/theoapp/theo.svg)](https://microbadger.com/images/theoapp/theo) 
[![Build Status](https://travis-ci.org/theoapp/theo-node.svg?branch=master)](https://travis-ci.org/theoapp/theo-node)
[![Documentation Status](https://readthedocs.org/projects/theoapp/badge/?version=latest)](https://theoapp.readthedocs.io/en/latest/?badge=latest)

Theo is the authorized keys manager, you can use it as replacement for all of your `authorized_keys`   
It allows you to set fine permissions (specific user and host) or to use wildcard (ex, using host `%.test.sample.com`) 

### Summary

- [System Requirements](#system-requirements)
- [Prerequisites](#prerequisites)
- [Documentation](#documentation)

### System Requirements

Please check if your system meets the following minimum requirements :

| Type |  Value  |
| ---- | ------- | 
| CPU  | 1 GHz   | 
| RAM  | 512 MiB |

### Prerequisites

OpenSSH server must be version >= 6.2 (since it has to support `AuthorizedKeysCommand` option)

### Documentation

Available at [theoapp.readthedocs.io](https://theoapp.readthedocs.io/en/latest/)

### Public Test Instance 

A public test instance is available at [theo.test.authkeys.io](https://theo.test.authkeys.io) 

Database will be reset every 6 hours (0am 6am 12pm 18pm UTC) 

Configured tokens:

```bash
ADMIN_TOKEN=RMkqF4B8h6jtv3upvy3QubzNyTrMdgn8

CLIENT_TOKENS=h8LYYwGgTqKFYQ3mRN2hv8vK5CBGJvMs,gAWXaG9ZnhHAXsDbF6dv3NYEbPNuZKR7

```

Instance has the `REQUIRE_SIGNED_KEY` flag on, so you need to enable key sign/verify on your side:
  
* [Theo CLI](https://theoapp.readthedocs.io/en/latest/theo-cli/signed_keys.html)
* [Theo agent](https://theoapp.readthedocs.io/en/latest/theo-agent/verify_signed_keys.html) 

**Be aware that the instance is public, so everyone has access to the data, please use fake email**

### Artwork

Theo logo created by [Tomm](http://oyace.tumblr.com/)

