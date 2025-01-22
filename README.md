# markdown-it-tempus

> `<time>` tag plugin for [markdown-it](https://github.com/markdown-it/markdown-it) markdown parser.

`@this year@(2025)` => `<time datetime="2025">this year</time>`

Markup uses the same conditions as CommonMark [link](http://spec.commonmark.org/0.15/).


## Install

```bash
npm install markdown-it-tempus --save
```

## Use

```js
var md = require('markdown-it')()
            .use(require('markdown-it-tempus'));

md.render('@this year@(2025)') // => '<p><time datetime="2025">this year</time></p>'
```

## License

[MIT](https://github.com/zzzgit/markdown-it-tempus/blob/master/LICENSE)