---
layout: post
title: Scala's Future.sequence in Java
date: 2019-10-16 10:00:00 +0900
---

I have been using Scala and its `Future` for years now.
One of the nice things about them is how you can chain them using `Future#flatMap`. And how a `List` of `Future` can be brought into one `Future` containig a `List` with `Future.sequence[A](list: List[Future[A]]): Future[List[A]]` (simplified, as the real implementation can work with most
of the Scala's standard collection library).

The other day I had to implements something quite similar in Java using `CompletableFuture`, and because `sequence` is not part of the standard library in Java, I had to reimplement it as well. This post is basically a _remember how to do this in the future_.

And after this longer than intended intro, here is the code:

```java
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

public static <T> CompletableFuture<List<T>> sequence(List<CompletableFuture<T>> futuresList) {
    return CompletableFuture
            .allOf(futuresList.toArray(new CompletableFuture[0])) // (1)
            .thenApply(v ->
                    futuresList.stream()
                            .map(CompletableFuture::join)
                            .collect(Collectors.toList())
            );
}
```

This can be copy-pasted into an utility class in your project directly.
A couple of notes I had when writing the snippet:
1. `CompletableFuture.allOf` only take an array as argument, so unfortunately we have to allocate to transform from a `List` to an array.
2. `CompletableFuture::join` only blocks when the future is not resolved. Because we call it in the lambda passed to `thenApply`, the list of futures is guaranteed to not contained any non resolved futures.

That's all folks!
