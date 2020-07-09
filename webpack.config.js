const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { Remarkable } = require('remarkable');

const md = new Remarkable();

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
      'CNAME'
    ]),
  ],
};

const strips_index = require('./src/strips/index.json');
_.each(strips_index, (slug, index) => {
  const issue = index + 1;
  const manifest = require(`./src/strips/${slug}/manifest.json`);

  const title = manifest.title;
  const description = md.render(
    fs.readFileSync(`./src/strips/${slug}/${manifest.description}`, 'utf8'));

  config.plugins.push(new CopyPlugin([
    `./src/strips/${slug}/${manifest.image}`
  ]));

  const context = {
    title: manifest.title,
    image: manifest.image,
    description,
    next_issue: index + 1 < strips_index.length ? issue + 1 : 0,
    prev_issue: index > 0 ? issue - 1 : 0,
  }

  config.plugins.push(new HtmlWebpackPlugin({
    template: './src/html/index.html',
    filename: `${issue}/index.html`,
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

// read add-ons from addons folder
/*
const addons = getDirectories('./src/addons');
const addons_directory = [];
_.each(addons, slug => {
  const manifest = require(`./src/addons/${slug}/manifest.json`);

  const summary = md.render(
    fs.readFileSync(`./src/addons/${slug}/summary.md`, 'utf8'));
  const description = md.render(
    fs.readFileSync(`./src/addons/${slug}/description.md`, 'utf8'));

  const last_updated = moment(manifest.last_updated).format('LL');

  config.plugins.push(new HtmlWebpackPlugin({
    template: './src/html/addon_template.html',
    filename: `addons/${slug}/index.html`,
    title: manifest.title,
    author: manifest.author.name,
    avatar: manifest.author.avatar,
    last_updated,
    summary,
    description,
  }));

  addons_directory.push({
    title: manifest.title,
    author: manifest.author.name,
    summary,
    last_updated,
    link: `/addons/${slug}`,
  });
});

// add generic addons page
config.plugins.push(new HtmlWebpackPlugin({
  template: './src/html/addons.html',
  filename: `addons/index.html`,
  addons: addons_directory,
}));
*/
module.exports = config;
