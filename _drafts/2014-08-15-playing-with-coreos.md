--- 
title: Playing with coreOS
published: true
---

intro

On Google Cloud Engine

Creating the discovery service
==============================

Config

<p class="code-title">discovery-cloud-config.yaml</p>
```yaml
#cloud-config

coreos:
  etcd:
    # multi-region and multi-cloud deployments need to use $public_ipv4
    addr: $private_ipv4:4001
    peer-addr: $private_ipv4:7001
  units:
    - name: etcd.service
      command: start
    - name: fleet.service
      command: start
```


Create instance 

```sh
gcutil addinstance \
  --image=projects/coreos-cloud/global/images/coreos-alpha-394-0-0-v20140801 \
  --persistent_boot_disk \
  --zone=europe-west1-b \
  --machine_type=n1-standard-1 \
  --metadata_from_file=user-data:discovery-cloud-config.yaml \
  discovery
```

And that's all !
Production mode: proxy on dns, real cluster for discovery.

Creating your coreOS cluster
============================

Generate a new cluster token (if all nodes are down, create a new cluster, ie. new token).
You can use any string as long as its unique, for example:

```sh
export TOKEN=$(uuidgen)
```

Config

<p class="code-title">default-cloud-config.yaml</p>
```yaml
#cloud-config

coreos:
  etcd:
    discovery: http://discovery:4001/v2/keys/<TOKEN>
    # multi-region and multi-cloud deployments need to use $public_ipv4
    addr: $private_ipv4:4001
    peer-addr: $private_ipv4:7001
  units:
    - name: etcd.service
      command: start
    - name: fleet.service
      command: start
```

Launch instance on gce

```sh
gcutil addinstance \
  --image=projects/coreos-cloud/global/images/coreos-alpha-423-0-0-v20140828 \
  --persistent_boot_disk \
  --zone=europe-west1-b \
  --machine_type=g1-small \
  --metadata_from_file=user-data:default-cloud-config.yaml \
  core1 core2 core3
```

Config firewall
===============

hypothesis that cluster not accessible from the internet.

on gce, you have to do:

  - restrict allow-ssh to machine with sshable tag
  - remove default-* firewalls from the internet
  - tag one machine with sshable: will be our entry point in the cluster

We suppose that you have a vpn to access gui (use pritunl if necessary)

Running our first service
=========================

Choose a service: Jenkins. Because I like testing !

How does it work

Create your systemd service file

<p class="code-title">elasticsearch@.service</p>
```ini
[Unit]
Description=The Jenkins Continuous Integration and Delivery server.
After=docker.service
Requires=docker.service

[Service]
TimeoutStartSec=0
ExecStartPre=-/usr/bin/docker kill jenkins
ExecStartPre=-/usr/bin/docker rm jenkins
ExecStartPre=/usr/bin/docker pull jenkins
ExecStart=/usr/bin/docker run --name jenkins -p 8080:8080 jenkins
ExecStop=/usr/bin/docker stop jenkins

[X-Fleet]
X-Conflicts=jenkins.service
```
sent it with

```sh
gcloud compute copy-files jenkins.service <user>@playground:<home_path>/jenkins.service
```
  
connect to a server (```gcutil ssh core1```)

```fleetctl submit jenkins.service```

```fleetctl start jenkins.service```

wait for it to be ready

That's it !

Elasticsearch
=============

  - Systemd unit file
  - send it
  - ```fleetctl submit elasticsearch@.service```
  - ```fleetctl start elasticsearch@{1,2,3}.service``` (3 nodes)

Yeeeh we have three nodes !

But query es ```GET /_cluster/health``` and hooooo, they dont see each other…

Okay, what's the problem ? 

fleetctl journal elasticsearch@1.service

```
...
...[INFO ][node     ] [Iron Man] initializing ...
...[INFO ][plugins  ] [Iron Man] loaded [], sites []
...[INFO ][node     ] [Iron Man] initialized
...[INFO ][node     ] [Iron Man] starting ...
...[INFO ][transport] [Iron Man] bound_address {inet[/0:0:0:0:0:0:0:0:9300]}, publish_address {inet[/172.17.0.3:9300]}
...
```


Bound address is localhost !

Configuration time !

Docker file maintener said :

>  Attach persistent/shared directories
>
>  1. Create a mountable data directory ```<data-dir>``` on the host.
>
>  2. Create ElasticSearch config file at ```<data-dir>/elasticsearch.yml```.
>
>    ```
>    path:
>      logs: /data/log
>      data: /data/data-dir
>    ```
>
>  3. Start a container by mounting data directory and specifying the custom configuration file:
>
>    ```
>    docker run -d -p 9200:9200 -p 9300:9300 -v <data-dir>:/data dockerfile/elasticsearch /elasticsearch/bin/elasticsearch -Des.config=/data/elasticsearch.yml
>    ```
>
> — <cite>[from dockerfile/elasticsearch](https://registry.hub.docker.com/u/dockerfile/elasticsearch/)</cite>

So we just need to create a path for our configuration file. We're going to use that folder to store ES data outside of its container, which will be realy usefull once we realize that data inside the container is simply discarded across container reboot…

Ok, so to do that we're going to modify the elasticsearch@.service file like the following (explanation after).

<p class="code-title">elasticsearch@.service</p>
```ini
[Unit]
Description=ElasticSearch
Documentation=http://www.elasticsearch.org
After=docker.service
Requires=docker.service

[Service]
TimeoutSec=180
ExecStartPre=-/usr/bin/docker kill elasticsearch-%i
ExecStartPre=-/usr/bin/docker rm elasticsearch-%i
ExecStartPre=/usr/bin/docker pull dockerfile/elasticsearch

# NEW Assure path exist on host
ExecStartPre=/usr/bin/mkdir -p /data/elasticsearch

# NEW Pull the general configuration from etcd
ExecStartPre=/bin/bash -c '/usr/bin/etcdctl get /configs/elasticsearch > /data/elasticsearch/elasticsearch.yml'

ExecStart=/bin/bash -c '\
  /usr/bin/docker run \
    --name elasticsearch-%i \
    --publish 9200:9200 \
    --publish 9300:9300 \
    --volume /data/elasticsearch:/data \
    dockerfile/elasticsearch \
    /elasticsearch/bin/elasticsearch \
    --node.name=%p-%i \
    --network.publish_host=${COREOS_PRIVATE_IPV4}'

ExecStop=/usr/bin/docker stop elasticsearch-%i

[X-Fleet]
X-Conflicts=elasticsearch@*.service
```

There is some new line insides this file, the most interessant are in the docker run command. 
First we mount the data volume in the container (--volume /data/elasticsearch:/data). Then we override the docker command, that way we
can pass some "runtime" information to elusticsearch like the node name or the ip to which es should be bound.

Before launching this new config, we have to store a default config inside etcd (note that the number of shards and replicas is not suitable
for production and is only that low to reduce the storage used by es for this test).

<p class="code-title">elasticsearch.yml</p>
```yaml
cluster.name: es-prod
index.number_of_shards: 2
index.number_of_replicas: 1
path:
  logs: /data/log
  data: /data/data
```

We push the file to our cluster (```gcutil push core1 elasticsearch.yml ~/```) and in etcd (```curl -L -XPUT --data-urlencode value@elasticsearch.yml http://127.0.0.1:4001/v2/keys/configs/elasticsearch```).

Now we can update the unit file.

Good, so now our cluster works, right ? Hem, not really. If you look at the publish_address of es it is correctly set to the host.
But there is a little problem: docker doesn't support multicast, and es magic is based on multicast. It means that we will have to tell each node
where it have to connect. But fear not, we will use the power of etcd to create a simple discovery service based on bash.

Discovery service
-----------------
All credit goes to [Matt Wright](http://mattupstate.com/coreos/devops/2014/06/26/running-an-elasticsearch-cluster-on-coreos.html).

What do we hade to do ? We will simply register each IP address that contains an es instance in etcd.
For instance, with 3 es nodes, we will have something like that:
    /services/elasticsearch/192.168.1.1
    /services/elasticsearch/192.168.1.2
    /services/elasticsearch/192.168.1.3

And to do that, we just need a unit file bound to the main es unit file. Fortunately, systemd give us the BindsTo directive which do exactly that.
So the unit file will be something like:

<p class="code-title">elasticsearch-discovery@.service</p>
```ini
[Unit]
Description=ElasticSearch discovery service
BindsTo=elasticsearch@%i.service

[Service]
EnvironmentFile=/etc/environment
ExecStart=/bin/bash -c '\
  while true; do \
    /usr/bin/curl -f ${COREOS_PRIVATE_IPV4}:9200; \
    if [ "$?" = "0" ]; then \
      /usr/bin/etcdctl set /services/elasticsearch/${COREOS_PRIVATE_IPV4} \'{"http_port": 9200, "transport_port": 9300}\' --ttl 60; \
    else \
      /usr/bin/etcdctl rm /services/elasticsearch/${COREOS_PRIVATE_IPV4}; \
    fi; \
    /usr/bin/sleep 45; \
  done'

ExecStop=/usr/bin/etcdctl rm /services/elasticsearch/${COREOS_PRIVATE_IPV4}

[X-Fleet]
X-ConditionMachineOf=elasticsearch@%i.service
```

We now have a discovery service as long as we launch the elasticsearch-discovery@{1,2,3}.service unit files.
We now have to update the the main es unit file to get the list of es nodes and provide them to this elasticsearch.

<p class="code-title">elasticsearch@.service</p>
```ini
[Unit]
Description=ElasticSearch
Documentation=http://www.elasticsearch.org
After=docker.service
Requires=docker.service

[Service]
TimeoutSec=360
ExecStartPre=-/usr/bin/docker kill elasticsearch-%i
ExecStartPre=-/usr/bin/docker rm elasticsearch-%i
ExecStartPre=/usr/bin/docker pull dockerfile/elasticsearch
ExecStartPre=/usr/bin/mkdir -p /data/elasticsearch
ExecStartPre=/bin/bash -c '/usr/bin/etcdctl get /configs/elasticsearch > /data/elasticsearch/elasticsearch.yml'

EnvironmentFile=/etc/environment
ExecStart=/bin/bash -c '\
  /usr/bin/curl -f ${COREOS_PRIVATE_IPV4}:4001/v2/keys/services/elasticsearch; \
  if [ "$?" = "0" ]; then \
      UNICAST_HOSTS=$(/usr/bin/etcdctl ls --recursive /services/elasticsearch \
                      | /usr/bin/sed "s/\/services\/elasticsearch\///g" \
                      | /usr/bin/sed "s/$/:9300/" \
                      | /usr/bin/paste -s -d","); \
  else \
      UNICAST_HOSTS=""; \
  fi; \
  /usr/bin/docker run \
    --name elasticsearch-%i \
    --publish 9200:9200 \
    --publish 9300:9300 \
    --volume /data/elasticsearch:/data \
    dockerfile/elasticsearch \
    /elasticsearch/bin/elasticsearch \
    --node.name=%p-%i \
    --network.publish_host=${COREOS_PRIVATE_IPV4} \
    --discovery.zen.ping.multicast.enabled=false \
    --discovery.zen.ping.unicast.hosts=$UNICAST_HOSTS'

ExecStop=/usr/bin/docker stop elasticsearch-%i

[X-Fleet]
X-Conflicts=elasticsearch@*.service
```

We're done !

Test with the command ```curl localhost:9200/_cluster/state?pretty=true```. There should be three node in the nodes block.

Want some tools ? Customize your docker image.
Question: how do I install my favorites plugins ?
Answer: you create your own docker image !
And because you don't the world to see all your try, we are going to use our own Docker repository !

Docker registry
===============

**TODO**

Why ?

customize… customize… customize…

push to our registry

adapt our unit file to use our registry