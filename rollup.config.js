import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: `dist/index.js`,
    format: 'esm',
    name: 'fw-model'
  },
  plugins: [
    resolve({
      extensions: [ '.js', '.json', '.ts' ]
    }),
    typescript()
  ]
};
