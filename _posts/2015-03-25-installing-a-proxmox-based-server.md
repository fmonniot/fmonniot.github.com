---
layout: post
title: Installing a Proxmox-based server
date: 2015-03-25 10:44:00 +0100
---

# Table of Contents

1. [Prepare your hypervisor](#prepare-your-hypervisor)
    1. [Proxmox User](#proxmox-user)
    2. [VM dedicated network](#vm-dedicated-network)
    3. [Firewall](#firewall)
2. [Template](#template)
    1. [Preparation](#preparation)
    2. [Create the base image](#create-the-base-image)
3. [Generate SSL Certificate](#generate-ssl-certificate)
    1. [Root Authority](#root-authority)
    2. [Create a certificate](#create-a-certificate)
        1. [Certificate Signing Request (CSR)](#certificate-signing-request-(csr))
        2. [Sign the key](#sign-the-key)
    3. [Bonus: Automate the creation](#bonus:-automate-the-creation)
5. [Reverse Proxy](#reverse-proxy)
    1. [Hypervisor](#hypervisor)
    2. [Container](#container)
        1. [Default web page](#default-web-page)
        2. [Proxmox GUI](#proxmox-gui)
6. [Enter the LDAP directory](#enter-the-ldap-directory)
    1. [OpenLDAP Server](#openldap-server)
    2. [FusionDirectory](#fusiondirectory)
        1. [Repositories](#repositories)
        2. [Schema installation](#schema-installation)
        3. [Fusiondirectory installation](#fusiondirectory-installation)
    3. [Add LDAP admin to proxmox](#add-ldap-admin-to-proxmox)
7.  [Git](#git)
    1. [Nginx Configurations](#nginx-configurations)
    2. [LDAP Integration](#ldap-integration)
    3. [Host firewall](#host-firewall)
8.  [DNS](#dns)


# Prepare your hypervisor

In this article, which serve as a reminder for when I'll have to reinstall a proxmox based server, I'll describe how to configure a basic installation of a [proxmox](https://www.proxmox.com) based server (mine is hosting by [Online.net](https://www.online.net)).
As Online provide a server with proxmox already installed, this article doesn't describe how to install proxmox (you can find some instruction on [their wiki](https://pve.proxmox.com/wiki/Installation)) and start with a fresh proxmox installation.

Note: Some sections don't have explanation, if it's bothering you please [open an issue on GitHub](https://github.com/fmonniot/fmonniot.github.com/issues) and I'll try to explain it to you (and update this page accordingly).

## Proxmox user

Give a linux user administrator rights in proxmox

<p class="code-title">PAM-based Proxmox administrator</p>
```sh
#Create a new user (change user by your username)
pveum useradd user@pam

#Define the group:
pveum groupadd admin -comment "System Administrators"

#Then add the permission:
pveum aclmod / -group admin -role Administrator

#You can finally add users to the new 'admin' group:
pveum usermod user@pam -group admin
```

## VM dedicated network

On your proxmox host, open the `/etc/network/interfaces` file and add at the the end:

<p class="code-title">/etc/network/interfaces</p>
```
# Content by your provider

### SNAT & DNAT INTERNET
#########################

auto vmbr10
iface vmbr10 inet static
        address 192.168.10.1
        netmask 255.255.255.0
        bridge_ports none
        bridge_stp off
        bridge_fd 0
        post-up echo 1 > /proc/sys/net/ipv4/ip_forward
```

## Firewall

To manage the firewall of our server, I have created a simple script that can be placed as an init service (soon to be replaced by a systemd unit). This script create a NAT that limit the packet emited by your VM on the external network and it let you define some rules for your services (if you have only one public IP, if not this script is of little interest for you).

<p class="code-title">/etc/init.d/firewall</p>
```sh
##!/bin/sh

### BEGIN INIT INFO
# Provides: firewall
# Required-Start: mountkernfs ifupdown $local_fs
# X-Start-Before: networking
# Default-Start: 2 3 4 5
# Required-Stop:
# Default-Stop: 0 1 6
# Short-Description: Configure iptables.
# Description: Configure iptables.
### END INIT INFO

IPT=/sbin/iptables
SERVER_IP=195.154.200.123

case "$1" in
start) echo "Starting Aegis Firewall"

  # NAT
  ######

  $IPT -t nat -A POSTROUTING -o vmbr0 -s 192.168.10.0/24  ! -d 102.168.10.0/24 \
      -j SNAT --to $SERVER_IP -m comment --comment "snat vm to ext"

  # Routing vm services
  $IPT -t nat -A PREROUTING -i vmbr0 -p tcp --dport 80 \
      -j DNAT --to 192.168.10.10:80  -m comment --comment "revproxy tcp/80"
  $IPT -t nat -A PREROUTING -i vmbr0 -p tcp --dport 443 \
      -j DNAT --to 192.168.10.10:443 -m comment --comment "revproxy tcp/443"

  # FireWall
  ###########

  $IPT -A FORWARD -s 192.168.10.0/24 -j ACCEPT
  $IPT -A FORWARD -d 192.168.10.0/24 -j ACCEPT

  $IPT -A INPUT -i vmbr0 -p tcp --destination-port 8006 ! -s 192.168.10.0/24 \
      -j DROP -m comment --comment "block proxmox gui except revproxy"

  $IPT -A INPUT -m state --state NEW -m tcp -p tcp \
      -m multiport --dports 5901:5903,6001:6003,17523 -j ACCEPT

  ;;
stop) echo "Stopping Firewall"
  $IPT -t nat -F
  $IPT -F
  ;;
*) echo "Usage: /etc/init.d/firewall {start|stop}"
 exit 2
 ;;

esac
exit 0
```

When installing this script as a service don't forget to make it executable and to register it as a startup service:

<p class="code-title">firewall service on startup</p>
```sh
chmod +x /etc/init.d/firewall
update-rc.d firewall defaults
```

# Template

Before anything, download the Debian template: in the local disk section, tab content, click on Templates and select the Debian 7 base image.

Then create a container with that image and the following information:

<p class="code-title">Template container configuration</p>
```
General:   choose whatever you want, just remember it ;)
Template:  the debian that you just download
Resources: the default values are enough for a template
Network:   choose the bridged mode with the newly created vmbr10
DNS:       use host settings for now
```

Once the container is ready start it and log into:

<p class="code-title">Start and enter container 100</p>
```sh
vzctl start 100
vzctl enter 100
```

## Preparation

Edit the network configuration to let your CT access the internet.

<p class="code-title">/etc/network/interfaces</p>
```
auto eth0
iface eth0 inet static
    address 192.168.10.5
    netmask 255.255.255.0
    gateway 192.168.10.1
```

Install common packages (edit this list if you want more or less packages)

<p class="code-title">Install common packages</p>
```sh
apt-get update; apt-get upgrade -y
apt-get install -y htop iotop tree zsh ca-certificates sudo
```

Add default user and make it a sudoer

<p class="code-title">Default sudoer user</p>
```sh
adduser username
usermod -aG sudo username
```

This step is optionnal, if you don't want to use puppet (which will be configured later) you can safely skip it.

<p class="code-title">Prepare puppet agent</p>
```sh
wget https://apt.puppetlabs.com/puppetlabs-release-wheezy.deb
dpkg -i puppetlabs-release-wheezy.deb
apt-get update && apt-get install puppet
```

## Create the base image

Now that we have a container containing all of our base tools, we need to create the base image for our next container.
To do that, we will begin by stopping the container and removing the network attached (eth0). Then we will create a tar archive of the container file system and place that archive at the right place and we will be done.

<p class="code-title">Create an openVZ template</p>
```sh
# These commands need to be run as root on the hypervisor
vzctl stop 100
vzctl set 100 --save --netif_del eth0
cd /var/lib/vz/private/100
tar -cvzpf /var/lib/vz/template/cache/debian-7.0-improved_amd64.tar.gz .
```

That's it, you have a new template !

# Generate SSL Certificate

A great article on how to create your own SSl certificates is available online at https://help.ubuntu.com/14.04/serverguide/certificates-and-security.html. Consequently this article will only list all commands to run to have a self-signed certificate and WILL NOT explain some concept or tradeoff made.

## Root authority

<p class="code-title">Prepare root authority</p>
```sh
# Make directories where certificates will be stored
mkdir /etc/ssl/CA
mkdir /etc/ssl/newcerts

# Create certificates serial and index for the Certificate Authority
echo '01' > /etc/ssl/CA/serial
touch /etc/ssl/CA/index.txt
```

Edit the file `/etc/ssl/openssl.cnf` and in the `[ CA_default ]` section add/or modify

<p class="code-title">/etc/ssl/openssl.cnf</p>
```ini
dir             = /etc/ssl               # Where everything is kept
database        = $dir/CA/index.txt      # database index file.
certificate     = $dir/certs/cacert.pem  # The CA certificate
serial          = $dir/CA/serial         # The current serial number
private_key     = $dir/private/cakey.pem # The private key
```

<p class="code-title">Create the root certificate</p>
```sh
# Next we create the self-signed certificate:
openssl req -new -x509 -sha256 -extensions v3_ca -keyout cakey.pem -out cacert.pem -days 730

# Install root certificate and private key
mv cakey.pem /etc/ssl/private/
mv cacert.pem /etc/ssl/certs/
```

You can now sign your own certificates.

## Create a certificate

This procedure must be done for each new certificate you want to have.

The first time you can edit the `openssl.cnf` file and edit the default value that will be asked when creating a CSR. That can done in the section `[ req_distinguished_name ]`.

### Certificate Signing Request (CSR)

<p class="code-title">Generate a CSR</p>
```sh
# You should enter a passphrase (at least 4 characters), you can create
# a key without a passphrase later if your service need one.
openssl genrsa -des3 -out server.key 2048

# Generate the key without passphrase
openssl rsa -in server.key -out server.key.insecure
mv server.key server.key.secure
mv server.key.insecure server.key

# Generate the CSR
openssl req -new -key server.key -out server.csr
```

### Sign the key

<p class="code-title">Sign the CSR by our CA</p>
```sh
# The pass asked is the CA one
openssl ca -in server.csr -config /etc/ssl/openssl.cnf

# Set $NAME with the name of your cert (e.g. francois.monniot.eu.crt) and $NUM with the name of the created certificate
export NAME=tmp NUM=01
nawk 'v{v=v"\n"$0}!/^#/ && /----BEGIN/ {v=$0}/----END/&&v{  print v > "'$NAME'.crt"  close("'$NAME'.crt")}' /etc/ssl/newcerts/$NUM.pem
mv $NAME.crt-1 $NAME.crt
```

Congratulation, you have a self-signed SSL certificate that you can deploy wherever you want !

## Bonus: Automate the creation

And because it can be a bit tedious, I have made a simple script that do all these operation in one line: `sh create_insecure.sh $CRTNAME`

<p class="code-title">create_insecure.sh</p>
```sh
SSLDIR=/etc/ssl/
if [ -z "$1" ]; then
  KEYNAME=server
else
  KEYNAME=$1
fi;

echo Creating insecure certificate $KEYNAME
mkdir $SSLDIR$KEYNAME

cd $SSLDIR$KEYNAME

echo Please provide a passphrase of at least 4 characters
openssl genrsa -des3 -out $KEYNAME.key 2048

# Generate the key without passphrase
openssl rsa -in $KEYNAME.key -out $KEYNAME.key.insecure
mv $KEYNAME.key $KEYNAME.key.secure
mv $KEYNAME.key.insecure $KEYNAME.key

# Generate the CSR
openssl req -new -key $KEYNAME.key -out $KEYNAME.csr

# Sign the certificate
echo The pass asked is the CA one
openssl ca -in $KEYNAME.csr -config $SSLDIR"openssl.cnf"

LASTNEWCERTS=$(ls -t $SSLDIR"newcerts" | head -1)

echo Extract crt from $LASTNEWCERTS
nawk 'v{v=v"\n"$0}!/^#/ && /----BEGIN/ {v=$0}/----END/&&v{  print v > "'$KEYNAME'.crt"  close("'$KEYNAME'.crt")}' $SSLDIR"newcerts/"$LASTNEWCERTS
mv $KEYNAME.crt-1 $KEYNAME.crt
```

# Reverse Proxy

Our reverse proxy is in a container based on the custom debian 7 template in bridged mode (vmbr10).
This container is configured to have a static ip of 192.168.10.10 (on eth0).

## Hypervisor

As we have only one IP address for our server, we need to NAT our VMs/CTs. To do that you can use the following IPTables rules (if you have used the script of the section [Firewall](#firewall) you already have them).

<p class="code-title">Setting iptables rules</p>
```sh
# Already active from /etc/init.d/firewall
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 80  -j DNAT --to 192.168.10.10:80  -m comment --comment "revproxy tcp/80"
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 443 -j DNAT --to 192.168.10.10:443 -m comment --comment "revproxy tcp/443"
```

Also, we will configure nginx to use https so you need to generate a certificate `revproxy.crt` and `revproxy.key` without passphrase ([here's how](#create-a-certificate)) and copy them into the newly created container. Remember that the FQDN you enter will determine on which URL the certificate will be valide.

<p class="code-title">Copy certificate on revproxy</p>
```sh
scp revproxy.crt 192.168.10.10:/etc/ssl/revproxy.crt
scp revproxy.key 192.168.10.10:/etc/ssl/revproxy.key
```

## Container
/usr/share/doc/nginx-doc/examples/

<p class="code-title">Install nginx</p>
```sh
apt-get install nginx
```

We force all website to use HTTPS.

<p class="code-title">/etc/nginx/conf.d/force_https.conf</p>
```nginx
server {
    listen 80 default_server;
    rewrite ^(.*) https://$host$1 permanent;
}
```

### Default web page

Before anything, an edit of the default page to use HTTPS instead of plain HTTP. We will also use our own index rather than the one provided by nginx.

<p class="code-title">/etc/nginx/sites-available/default</p>
```nginx
server {
    listen 443;
    server_name ashelia.me;

    root /var/www
    index index.html index.htm;

    ssl on;
    ssl_certificate /etc/ssl/revproxy.crt;
    ssl_certificate_key /etc/ssl/revproxy.key;

    ssl_session_timeout 5m;

    ssl_protocols TLSv1.2;
    ssl_ciphers ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv3:+EXP;
    ssl_prefer_server_ciphers on;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

<p class="code-title">Copy index and reload nginx</p>
```sh
mkdir /var/www
cp /usr/share/nginx/www/index.html /var/www/index.html
service nginx reload
```

### Proxmox GUI

At the same time we can also redirect the Proxmox GUI via our proxy to have a beautiful URL (here proxmox.ashelia.me). Remember to generate a new certificate with the correct URL for this to work and store them as `/etc/ssl/proxmox.(crt|key)`

<p class="code-title">/etc/nginx/sites-available/proxmox-gui</p>
```nginx
upstream proxmox {
    server 192.168.10.1:8006;
}

server {
    listen 443;
    server_name proxmox.ashelia.me;

    ssl on;
    ssl_certificate /etc/ssl/proxmox.crt;
    ssl_certificate_key /etc/ssl/proxmox.key;

    ssl_session_timeout 5m;

    ssl_protocols TLSv1.2;
    ssl_ciphers ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv3:+EXP;
    ssl_prefer_server_ciphers on;

    proxy_redirect off;
    location / {
        # Also proxy websocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # Proxy HTTPS
        proxy_pass https://proxmox;
    }
}
```

<p class="code-title">Enable the proxmox integration</p>
```sh
ln -s /etc/nginx/sites-available/proxmox-gui /etc/nginx/sites-enabled/
service nginx reload
```

And that's it ! You know how to configure nginx to serve as a proxy.

# Enter the LDAP directory

*Adapted from http://documentation.fusiondirectory.org/en/documentation/admin_installation.*

The LDAP directory is in a container based on the custom debian 7 template in bridged mode (vmbr10).
This container is configured to have a static ip of 192.168.10.15 (on eth0).

All the work will be inside the container except for the reverse proxy that need to be configured to proxy the web interface, this part is supposed already done and can be easily be deduce from the [proxmox configuration](#proxmox-gui) as it's the same configuration (minus the upstream location and the `location` part where you need to insert `rewrite ^(.*)$  /fusiondirectory/$1 break;` before the `prox_pass` instruction).

## OpenLDAP server

### Structure

The LDAP structure can be representing by the following figure:

<p class="code-title">LDAP structure</p>
```
dc=monniot,dc=eu
  │
  │— ou=groups
  │    │— cn=admin
  │    │— cn=users
  │
  │— ou=config
  │    │— cn=mail
  │
  │— ou=people
       │— cn=francois
       │— cn=admin
```

Each entity have a different meaning:
- `groups` contains all groups of our LDAP.
- `config` contains configurations of services.
- `people` contains the user of the system.

### Installation

<p class="code-title">LDAP installation and configuration</p>
```sh
# You will be asked a LDAP password
apt-get install slapd ldap-utils
dpkg-reconfigure slapd
```

OpenLDAP reconfiguration (more specific options) will ask some questions:

1. Omit OpenLDAP server configuration? say No
2. Base DN in DNS format
3. Name of your organization
4. Administrator password
5. Database backend to use: HDB
6. drop your directory if you remove Openldap software ? No unless you have a good backup solution
7. Move old database? Yes
8. Allow LDAPv2 protocol? Unless you know what that mean, select No.

You can know check the LDAP server status, it should be running.

<p class="code-title">Check LDAP status</p>
```sh
/etc/init.d/slapd status
```

## FusionDirectory

And because managing a LDAP server manually (i.e. without GUI) is a bit tedious, we will install [fusiondirectory](https://www.fusiondirectory.org/) which is a web interface that provide many basic operation (e.g. managing user and mail) and is extensible via plugin if needed.

### Repositories

We install some debian repositories to simplify the install process.

<p class="code-title">/etc/apt/sources.list.d/fusiondirectory.list</p>
```
# fusiondirectory repository
deb http://repos.fusiondirectory.org/debian wheezy main

# fusiondirectory debian-extra repository
deb http://repos.fusiondirectory.org/debian-extra wheezy main
```

And we register the GPG key of these repositories

<p class="code-title">Install GPG key</p>
```sh
# Import key
gpg --recv-key E184859262B4981F --keyserver keyserver.ubuntu.com
gpg --export -a "Fusiondirectory Archive Manager <contact@fusiondirectory.org>" > FD-archive-key
apt-key add FD-archive-key

apt-get update

# Check packages
apt-cache search fusiondirectory | more
```

### Schema installation

First, we install some LDAP schema needed by fusiondirectory.

<p class="code-title">Install base LDAP schema</p>
```sh
apt-get install fusiondirectory-schema schema2ldif
# Install schema
fusiondirectory-insert-schema
```

Then we check if the schema are present in the LDAP: `fusiondirectory-insert-schema -l` must output

```
core
cosine
nis
inetorgperson
samba
core-fd
core-fd-conf
ldapns
recovery-fd
```

### FusionDirectory installation

<p class="code-title">Install fusiondirectory</p>
```sh
apt-get install fusiondirectory
```

Configure through the web interface by following the given instuction.

Some tips that can save you time:

- When the installer ask you the admin user its cn=admin,<your dc> and the password is the one given at installation.
- if you need to regenerate a password, use the `slappasswd` command and in the file `/etc/ldap/slapd.d/cn=config/olcDatabase={1}hdb.ldif` edit the line `olcRootPW: <result_of_slappasswd>` with the newly created password.
- Fix javascript error (prototype not found): in `/etc/apache2/conf.d/fusiondirectory.conf` add an alias for javascript, the beginning of the file should be something like:

<p class="code-title">Fix js links</p>
```aconf
# Include FusionDirectory to your web service
Alias /fusiondirectory/javascript /usr/share/javascript
Alias /fusiondirectory /usr/share/fusiondirectory/html
```

## Add LDAP admin to proxmox


In the Datacenter category, go to the authentication tab and add a LDAP server with the following configuration:

- Realm: name of the authentication, will only appear in proxmox.
- Base Domain Name: the base DN of your LDAP.
- User Attribute Name: the LDAP attribute used to identify your user (usually `uid` or `mail`).
- Server: the address of your LDAP server

Others options can be let on their default values

You need to create a user in proxmox (tab user) even with LDAP. So create your own user with realm LDAP (and group admin if you want to retain the admin rights).
Now you can log off and log in with your newly created user.

Voilà, proxmox use your LDAP !

# Git

We will use [Gitlab](https://gitlab.com) to manage our git server. [Instruction](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/install/installation.md) are available on their official website.

When you have installed Gitlab, create a revproxy entry for it ([like the proxmox one](#proxmox-gui)).

## Nginx configurations

In the gitlab.yml config file set the port to 443, https to true and the host as the one where Gitlab will be accessible (it will be the address that Gitlab will use to display the git URL).

Some modification need to be made to various nginx configs, for the revproxy add some proxy headers in the location section:

<p class="code-title">gitlab revproxy location headers</p>
```nginx
proxy_set_header    Host                $http_host;
proxy_set_header    X-Real-IP           $remote_addr;
proxy_set_header    X-Forwarded-Ssl     on;
proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
proxy_set_header    X-Forwarded-Proto   $scheme;
proxy_set_header    X-Frame-Options     SAMEORIGIN;
```

And on the Gitlab container, add the line ```proxy_set_header    X-Forwarded-Ssl     on;``` to the other proxy headers in the nginx configuration.

**Tips**: once connected as root, don't forget to disable user signup. To do that, go to administration section, settings panel and uncheck signup enabled.

## LDAP Integration

In `gitlab.yml`, verify that `ldap.enabled` is set to `true` and its parameters (`host`, `port`, `uid` and other `bind_dn`) are correct.

If you have used fusiondirectory, you have to manually add an email address to your LDAP profile. Use `ldapmodify` as described below.
The first line is the command typed in your shell (in the ldap container), you'll be then asked the password of your admin user (the one used in the LDAP debian installer). And after you have to type the four lines and validate with two carriage return (double press enter). All of these commands will not given you any indication and that's perfectly normal.

<p class="code-title">ldap add mail attribute</p>
```sh
ldapmodify -H ldap://localhost -D cn=admin,<your base DN> -x -W

  dn: uid=<your user uid>,ou=people,<your base DN>
  changetype: modify
  add: mail
  mail: <your user email>
```

You can verify if the mail attribute have been created with the command:

<p class="code-title">ldap search mail attribute</p>
```sh
ldapsearch -D cn=admin,<your base DN> -W -b "ou=people,<your base DN>" mail
```

## Host firewall

As we have a proxy between our host and gitlab instance, we also need to NAT a port from the host (here 2222) to the 22 port of the gitlab machine. A simple iptables could be the following:

```
iptables -t nat -I PREROUTING -i vmbr0 -p tcp --dport 2222 -j DNAT --to 192.168.10.25:22 -m comment --comment "gitlab ssh"
```

Don't forget to edit `gitlab.yml` and tell gitlab that the ssh port is 2222 (key `gitlab_shell.port`)

# DNS

In this section I'm not going to describe how to install a DNS system, instead I'll let you read two excellent articles written by Jack Brennan on his blog: _How To: DNS with BIND9 on Debian – [Part 1/2](http://jack-brennan.com/caching-dns-with-bind9-on-debian/) and [Part 2/2](http://jack-brennan.com/dns-with-bind9-on-debian-part-22/)_.

Once your DNS is in place, don't forget to change all your previous machine to use it (edit `/etc/resolv.conf` and add the IP of your DNS and comment all others). It can be a good idea to update your base template with the DNS already configured.

*Bonus*: Update your DNS on a Gitlab push.

If you have your DNS configuration under a versioning system (like git), it could be interesting to update automaticaly your zone DNS. That way you just have to push a modification and hop, you DNS are already updated!
To do that, we need to run three commands when a push occur: `git pull`, `named-checkconf`, `bind9 restart`. To that effect I have developped a small tool (written in Go and [available on Github](https://github.com/fmonniot/webhook-listener/blob/master/config.json)) that spin up a web server and execute some preconfigured action when its API is called.

To install it:

```sh
# Install the software (choose your software architecture)
wget https://github.com/fmonniot/webhook-listener/releases/download/v1.0/webhook-listener-linux64 -O /usr/local/bin/webhook-listener
chmod u+x /usr/local/bin/webhook-listener

# As a service
wget https://raw.githubusercontent.com/fmonniot/webhook-listener/master/support/webhook-listener -O /etc/init.d/webhook-listener
chmod u+x /etc/init.d/webhook-listener

# Configuration (more details at https://github.com/fmonniot/webhook-listener)
wget https://raw.githubusercontent.com/fmonniot/webhook-listener/master/config.json -O /etc/webhook-listener.json
```

Don't forget to edit the TLS section if you want a secure server and to change the API key for your endpoints.
In Gitlab, in your DNS project add the webhook URI: `https://<webhook-server>:8080/<your/endpoint>?apiKey=your_api_key`

And tada! Vos DNS sont maintenant automatiquement mis à jours.
