---
layout: post
title: Proxmox&#58; share directory between OpenVZ
date: 2014-10-08
---

No ui for that !

<p class="code-title">/etc/vz/conf/<CTID>.mount</p>
```bash
#!/bin/bash
. /etc/vz/vz.conf
. ${VE_CONFFILE}
SRC1=/mnt/binaries
DST1=/mnt/vz_binaries
SRC2=/mnt/homes
DST2=/homes
SRC3=/mnt/backups
DST3=/mnt/vz_backups
 
mount -n -t simfs ${SRC1} ${VE_ROOT}${DST1} -o ${SRC1}
mount -n -t simfs ${SRC2} ${VE_ROOT}${DST2} -o ${SRC2}
mount -n -t simfs ${SRC3} ${VE_ROOT}${DST3} -o ${SRC3}
```
