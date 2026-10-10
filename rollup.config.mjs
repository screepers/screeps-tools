import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

export default {
    input: 'src/app.tsx',
    output: {
        file: 'static/bundle.js',
        format: 'iife',
        sourcemap: true
    },
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        typescript({
            tsconfig: 'tsconfig.json',
            compilerOptions: {
                outDir: 'static',
                declaration: false,
                declarationMap: false
            }
        }),
        resolve({browser: true}),
        commonjs(),
        terser(),
        postcss({
            extract: 'style.css',
            use: ['less']
        })
    ]
};
