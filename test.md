---
title: Testing layout and design
appbar:
  title: Markdown test page
---
This is intended as a quick reference and showcase. For more complete info, see
[John Gruber's original spec](http://daringfireball.net/projects/markdown/) and the
[Github-flavored Markdown info page](http://github.github.com/github-flavored-markdown/).

## Table of Contents
[Headers](#headers)
[Emphasis](#emphasis)
[Lists](#lists)
[Links](#links)
[Images](#images)
[Code and Syntax Highlighting](#code-and-syntax-highlighting)
[Tables](#tables)
[Blockquotes](#blockquotes)
[Inline HTML](#inline-html)
[Horizontal Rule](#horizontal-rule)
[Line Breaks](#line-breaks)

# Headers

```
# Header Level 1
## Header Level 2
### Header Level 3
#### Header Level 4
```

# Header Level 1
## Header Level 2
### Header Level 3
#### Header Level 4

----
# Emphasis

```
Emphasis, aka italics, with *asterisks* or _underscores_.

Strong emphasis, aka bold, with **asterisks** or __underscores__.

Combined emphasis with **asterisks and _underscores_**.

Strikethrough uses two tildes. ~~Scratch this.~~
```

Emphasis, aka italics, with *asterisks* or _underscores_.

Strong emphasis, aka bold, with **asterisks** or __underscores__.

Combined emphasis with **asterisks and _underscores_**.

Strikethrough uses two tildes. ~~Scratch this.~~

# Lists

(In this example, leading and trailing spaces are shown with with dots: ⋅)

```
1. First ordered list item
2. Another item
⋅⋅* Unordered sub-list.
1. Actual numbers don't matter, just that it's a number
⋅⋅1. Ordered sub-list
4. And another item.

* Unordered list can use asterisks
- Or minuses
+ Or pluses
```

1. First ordered list item
2. Another item
  * Unordered sub-list.
1. Actual numbers don't matter, just that it's a number
  1. Ordered sub-list
4. And another item.

* Unordered list can use asterisks
- Or minuses
+ Or pluses

# Links

There are two ways to create links.

```
[I'm an inline-style link](https://www.google.com)

[I'm an inline-style link with title](https://www.google.com "Google's Homepage")

[I'm a reference-style link][Arbitrary case-insensitive reference text]

[I'm a relative reference to a repository file](../blob/master/LICENSE)

[You can use numbers for reference-style link definitions][1]

Or leave it empty and use the [link text itself]

Some text to show that the reference links can follow later.

[arbitrary case-insensitive reference text]: https://www.mozilla.org
[1]: http://slashdot.org
[link text itself]: http://www.reddit.com
```

[I'm an inline-style link](https://www.google.com)

[I'm an inline-style link with title](https://www.google.com "Google's Homepage")

[I'm a reference-style link][Arbitrary case-insensitive reference text]

[I'm a relative reference to a repository file](../blob/master/LICENSE)

[You can use numbers for reference-style link definitions][1]

Or leave it empty and use the [link text itself]

Some text to show that the reference links can follow later.

[arbitrary case-insensitive reference text]: https://www.mozilla.org
[1]: http://slashdot.org
[link text itself]: http://www.reddit.com

# Images

```
Here's my photo (hover to see the title text):

Inline-style:

![alt text](/images/reunion.jpg "Logo Title Text 1")

Reference-style:

![alt text][logo]

Without padding:

<div><img src="/images/reunion.jpg" alt="Reunion by Romain Guy" title="Reunion by Romain Guy"></div>

[logo]: /images/reunion.jpg "Logo Title Text 1"
```

Here's my photo (hover to see the title text):

Inline-style:

![alt text](/images/reunion.jpg "Logo Title Text 1")

Reference-style:

![alt text][logo]

Without padding:

<div><img src="/images/reunion.jpg" alt="Reunion by Romain Guy" title="Reunion by Romain Guy"></div>

[logo]: /images/reunion.jpg "Logo Title Text 1"

# Code and Syntax Highlighting

Code blocks are part of the Markdown spec, but syntax highlighting isn't. However, many renderers -- like Github's -- support syntax highlighting. Which languages are supported and how those language names should be written will vary from renderer to renderer.

```
Inline `code` has `back-ticks around` it.
```

Inline `code` has `back-ticks around` it.

Blocks of code are either fenced by lines with three back-ticks <code>```</code>, or are indented with four spaces. I recommend only using the fenced code blocks -- they're easier and only they support syntax highlighting.

<div class="highlight"><pre><code>

```javascript
var s = "JavaScript syntax highlighting";
alert(s);
```

```python
s = "Python syntax highlighting"
print s
```

```
No language indicated, so no syntax highlighting.
But let's throw in a &lt;b&gt;tag&lt;/b&gt;.
```
</code></pre></div>



```javascript
var s = "JavaScript syntax highlighting";
alert(s);
```

```python
s = "Python syntax highlighting"
print s
```

```
No language indicated, so no syntax highlighting.
But let's throw in a <b>tag</b>.
```

# Tables

Tables aren't part of the core Markdown spec, but they are part of GFM. They are an easy way of adding tables to your email -- a task that would otherwise require copy-pasting from another application.
On small viewport, tables will be represented as a list of cell with the associated header before it.

```
Colons can be used to align columns.

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

The outer pipes (|) are optional, and you don't need to make the raw Markdown line up prettily. You can also use inline Markdown.

Markdown | Less | Pretty
--- | --- | ---
*Still* | `renders` | **nicely**
1 | 2 | 3

A very long table that could have caused some problems.

| Header 1  | Header 2  | Header 3  | Header 4  | Header 5  | Header 6  | Header 7  | Header 8  | Header 9  |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| Content 1 | Content 2 | Content 3 | Content 4 | Content 5 | Content 6 | Content 7 | Content 8 | Content 9 |
```

Colons can be used to align columns.

| Tables        | Are           | Cool |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

The outer pipes (|) are optional, and you don't need to make the raw Markdown line up prettily. You can also use inline Markdown.

Markdown | Less | Pretty
--- | --- | ---
*Still* | `renders` | **nicely**
1 | 2 | 3

A very long table that could have caused some problems.

| Header 1  | Header 2  | Header 3  | Header 4  | Header 5  | Header 6  | Header 7  | Header 8  | Header 9  |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| Content 1 | Content 2 | Content 3 | Content 4 | Content 5 | Content 6 | Content 7 | Content 8 | Content 9 |

# Blockquotes

```
> Blockquotes are very handy in email to emulate reply text.
> This line and the next are part of the same quote.

> — <cite>by someone</cite>

Quote break.

> This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.
```

> Blockquotes are very handy in email to emulate reply text.
> This line and the next are part of the same quote.

> — <cite>by someone</cite>

Quote break.

> This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.

# Inline HTML

You can also use raw HTML in your Markdown, and it'll mostly work pretty well.

```
<dl>
  <dt>Definition list</dt>
  <dd>Is something people use sometimes.</dd>

  <dt>Markdown in HTML</dt>
  <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
</dl>
```

<dl>
  <dt>Definition list</dt>
  <dd>Is something people use sometimes.</dd>

  <dt>Markdown in HTML</dt>
  <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
</dl>

# Horizontal Rule

```
Three or more...

---

Hyphens

***

Asterisks

___

Underscores
```

Three or more...

---

Hyphens

***

Asterisks

___

Underscores

# Line Breaks

My basic recommendation for learning how line breaks work is to experiment and discover -- hit &lt;Enter&gt; once (i.e., insert one newline), then hit it twice (i.e., insert two newlines), see what happens. You'll soon learn to get what you want. "Markdown Toggle" is your friend.

Here are some things to try out:

```
Here's a line for us to start with.

This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

This line is also a separate paragraph, but...
This line is only separated by a single newline, so it's a separate line in the *same paragraph*.
```

Here's a line for us to start with.

This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

This line is also begins a separate paragraph, but...
This line is only separated by a single newline, so it's a separate line in the *same paragraph*.
