---
layout: post
title: "configuring Puppet and VPN"
date: 2015-03-25 10:42:59 +0100
---


# Table of Contents

9.  [TODO Puppet](#puppet)
10. [TODO VPN](#vpn)

# Puppet

# Puppet Master

# pre-install

From https://docs.puppetlabs.com/guides/install_puppet/pre_install.html


interfaces
```
auto eth0
iface eth0 inet static
    address 192.168.10.30
    netmask 255.255.255.0
    gateway 192.168.10.1
```

```sh
apt-get update
apt-get upgrade -y
apt-get install -y ntp ca-certificates
```

# install

From https://docs.puppetlabs.com/guides/install_puppet/install_debian_ubuntu.html

```sh
# Install repo
wget https://apt.puppetlabs.com/puppetlabs-release-wheezy.deb
dpkg -i puppetlabs-release-wheezy.deb
apt-get update

# install master
apt-get install puppetmaster-passenger
nano /etc/puppet/puppet.conf
```

## Conf Directory Environment
Because <quote>They will become the only way to manage environments in Puppet 4.0.</quote>

put environmentpath = $confdir/environments in the [main] section of puppet.conf

```sh
cd /etc/puppet/environments && mkdir production && cd production
```

## Creating our environment
From https://docs.puppetlabs.com/puppet/latest/reference/environments_creating.html

```sh
cd /etc/puppet/environments/production
touch environment.conf
mkdir modules
touch modules/.keep
mkdir manifests
touch manifests/.keep
```

edit environment.conf
```aconf
# Let puppet handle that. It will be the following value by default
# modulepath = <MODULES DIRECTORY FROM ENVIRONMENT>:$basemodulepath

# Use our custom script to get a git commit for the current state of the code:
config_version = /usr/bin/git --git-dir /etc/puppet/environments/.git rev-parse master

# manifest isn’t set, Puppet will use the environment’s manifests directory as the main manifest

# environment_timeout isn’t set, Puppet will use the global environment_timeout from puppet.conf.
# The default cache timeout is three minutes.
``

## Use librarian-puppet for managing your modules

Link: https://github.com/rodjek/librarian-puppet

```sh
apt-get install -y ruby-dev # needed to build gem, your default interpreter will remain the same
gem install librarian-puppet --no-ri --no-rdoc
cd /etc/puppet/environments/production
librarian-puppet init
```

nano Puppetfile
```ruby
#!/usr/bin/env ruby
#^syntax detection

forge "https://forgeapi.puppetlabs.com"

# Manage the apt repository
mod 'puppetlabs-apt'
```

```sh
librarian-puppet install
```

If you want to know which package are outdated: ```librarian-puppet outdated```

## Default manifest

from git

# Puppet agent

## On master
easy: puppet agent --test to run one time in verbose mode, puppet agent to set a cron

## On other nodes

From https://docs.puppetlabs.com/learning/agent_master_basic.html#saying-hi

```sh
# Install repo
wget https://apt.puppetlabs.com/puppetlabs-release-wheezy.deb
dpkg -i puppetlabs-release-wheezy.deb
apt-get update && apt-get install puppet
```

in /etc/
```ini
#  Remove templatedir
# Add the following line with your puppet master domain
server = puppet.<my domain>
```

Have asked a CA

On master puppet:
```sh
puppet cert sign <your machine name>
```

Back to your node agent: ```puppet agent --test``` now work. Puppet is configured



## Testing module

gem install puppet rspec-puppet puppetlabs_spec_helper --no-rdoc --no-ri




# OpenVPN

TUN device in container: http://openvz.org/VPN_via_the_TUN/TAP_device#Configuring_VPN_inside_container

```sh
CTID=107
vzctl set $CTID --devnodes net/tun:rw --save
vzctl set $CTID --devices c:10:200:rw --save
vzctl set $CTID --capability net_admin:on --save
vzctl set $CTID --iptables iptable_filter,iptable_nat --save
vzctl start $CTID
vzctl exec $CTID mkdir -p /dev/net
vzctl exec $CTID mknod /dev/net/tun c 10 200
vzctl exec $CTID chmod 600 /dev/net/tun
```
