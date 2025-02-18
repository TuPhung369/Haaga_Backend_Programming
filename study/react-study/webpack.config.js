module.exports = {
  // Other webpack configuration...
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: [/node_modules\/@antv\/util/],  // Ignore this package
      },
    ],
  },
};
