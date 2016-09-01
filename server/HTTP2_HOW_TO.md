# How to make the HTTP2 server working

- `cd` to the directory where the certificate and private key will be generated
- `openssl req -new -newkey rsa:2048 -nodes -keyout localhost.key -out localhost.csr`
  - answer with the default value to all questions *except* `Common Name`
  - for the `Common Name`, enter `localhost`
- `openssl x509 -req -days 90 -in localhost.csr -signkey localhost.key -out localhost.crt`
  - `-days` sets the number of days the certificate is valid for
- install the certificate into the trusted root authority store
  - in Chrome, go to settings, advanced settings, manage certificates, trusted root authority store, import, browse for the certificate, and confirm
  - restart Chrome
- edit `server.js` to point to the certificate and the key under the http2 server options
- restart the server

## Errors when accessing the page in Chrome

### `ERR_CERT_AUTHORITY_INVALID`

The certificate is not installed in the trusted root authority store.

### `ERR_CERT_COMMON_NAME_INVALID`

The domain name in the certificate does not match the domain name used to access the web site. Generate a new certificate with a `Common Name` that matches the domain name.

## Sources

- https://bjartes.wordpress.com/2015/02/19/creating-a-http2-server-with-node-js/
- http://stackoverflow.com/questions/7580508/getting-Chrome-to-accept-self-signed-localhost-certificate
- http://stackoverflow.com/questions/27294589/creating-self-signed-certificate-for-domain-and-subdomains-neterr-cert-commo
