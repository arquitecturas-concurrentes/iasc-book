const uslug = require('uslug')
const uslugify = s => uslug(s)

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
  ? '/iasc-book'
  : '/',
  chainWebpack(config){
    config.module.rule('md')
      .test(/\.md/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('vue-markdown-loader')
      .loader('vue-markdown-loader/lib/markdown-compiler')
      .options({
        raw: true,
        use: [
          /* markdown-it plugin */
          [require('markdown-it-anchor'), {
            level: 1,
            // slugify: string => string,
            permalink: true,
            // renderPermalink: (slug, opts, state, permalink) => {},
            permalinkClass: 'header-anchor',
            permalinkSymbol: '¶',
            permalinkBefore: true,
            slugify: uslugify
          }]
        ]
      })
  }
}