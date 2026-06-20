import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/tv-sdk.umd.js',
    format: 'umd',
    name: 'CrossTVSDK',
    exports: 'default',
    sourcemap: true
  },
  plugins: [
    commonjs()
  ]
};
