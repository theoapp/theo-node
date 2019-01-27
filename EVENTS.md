# THEO EVENTS

## Authentication

| event | arguments | callback |
| ------| --------- | ------ |
|theo:authorize | token, callback (err, auth) | `auth` : `false` if not authorized.   `{is_admin: true/false, is_core: true/false}` |
|theo:http-request | weblog, request, response | - | 
