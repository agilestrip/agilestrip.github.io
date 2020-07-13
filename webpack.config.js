const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { Remarkable } = require('remarkable');

const md = new Remarkable();

const escapeMap = {
  '\\': '\\u005C',
  '\'': '\\u0027',
  '"': '\\u0022',
  '>': '\\u003E',
  '<': '\\u003C',
  '&': '\\u0026',
  '=': '\\u003D',
  '-': '\\u002D',
  ';': '\\u003B',
};
function escapeJS(str) {
  return str.replace(/["'><&=\-;\\]/g, (ch) => {
    return escapeMap[ch];
  });
};

const config = {
  mode: 'production',
  entry: {
    index: './src/js/index.js',
  },
  output: {
    filename: 'js/[name].min.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ],
      }
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(),
    new CopyPlugin([
      'CNAME', 'src/agile-strip.jpg'
    ]),
  ],
};

const strips_index = require('./src/strips/index.json');

// prepare search
const search = [];
_.each(strips_index, (slug, index) => {
  const manifest = require(`./src/strips/${slug}/manifest.json`);
  const descr = fs.readFileSync(`./src/strips/${slug}/${manifest.description}`, 'utf8');
  search.push({
    slug,
    image: manifest.image,
    index: index + 1,
    title: manifest.title,
    text: (manifest.title + ' ' + descr).toLowerCase(),
  });
});

const search_json = escapeJS(JSON.stringify(search));

_.each(strips_index, (slug, index) => {
  const manifest = require(`./src/strips/${slug}/manifest.json`);

  const title = manifest.title;
  const description = md.render(
    fs.readFileSync(`./src/strips/${slug}/${manifest.description}`, 'utf8'));
  const og_description = fs.readFileSync(`./src/strips/${slug}/${manifest.description}`, 'utf8').split('\n')[0];

  config.plugins.push(new CopyPlugin([
    `./src/strips/${slug}/${manifest.image}`
  ]));

  const context = {
    title: manifest.title,
    image: manifest.image,
    description,
    slug,
    search_json,
    og_description: og_description,
    prev_index: index > 0 ? index : undefined,
    next_index: index + 1 < strips_index.length ? index + 2 : undefined,
    current_index: index + 1,
    next_issue: index + 1 < strips_index.length ? strips_index[index + 1] : undefined,
    prev_issue: index > 0 ? strips_index[index - 1] : undefined,
    escapeJS,
  }

  // do some validation
  if (context.title.indexOf('"') != -1) throw new Error('Title contains "');
  if (context.slug.indexOf('"') != -1) throw new Error('Slug contains "');
  if (context.image.indexOf('"') != -1) throw new Error('Image contains "');

  config.plugins.push(new HtmlWebpackPlugin({
    template: './src/html/index.html',
    filename: `${slug}/index.html`,
    ...context,
  }));

  // duplicate last one as default
  if (index + 1 == strips_index.length) {
    config.plugins.push(new HtmlWebpackPlugin({
      template: './src/html/index.html',
      filename: `index.html`,
      ...context,
    }));
  }
});

module.exports = config;
