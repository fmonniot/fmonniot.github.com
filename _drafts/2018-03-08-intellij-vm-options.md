---
layout: post
title: "IntelliJ VM Options"
date: 2018-03-08 14:55:00 -0900
---


More a memo than a post on which VM options I use for IntelliJ


```
# custom IntelliJ IDEA VM options

-server
-Xms2g
-Xmx3g
-XX:NewRatio=3
-Xss16m
-XX:+UseConcMarkSweepGC
-XX:+CMSParallelRemarkEnabled
-XX:ConcGCThreads=4
-XX:ReservedCodeCacheSize=240m
-XX:+AlwaysPreTouch
-XX:+TieredCompilation
-XX:+UseCompressedOops
-XX:SoftRefLRUPolicyMSPerMB=50
-Dsun.io.useCanonCaches=false
-Djava.net.preferIPv4Stack=true
-ea

# Original IJ config
-Djsse.enableSNIExtension=true
-XX:+HeapDumpOnOutOfMemoryError
-XX:-OmitStackTraceInFastThrow
-Xverify:none
-XX:ErrorFile=$USER_HOME/java_error_in_idea_%p.log
-XX:HeapDumpPath=$USER_HOME/java_error_in_idea.hprof
-Dfile.encoding=UTF-8
-Xbootclasspath/a:../lib/boot.jar
```
