import commonjs from 'rollup-plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript3';
import {terser} from 'rollup-plugin-terser';

export default {
    input: 'src/app.tsx',
    output: {
        file: 'static/bundle.js',
        format: 'iife',
        globals: {
            fs: false,
            path: false,
            crypto: false
        }
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        typescript({tsconfig: 'tsconfig.json'}),
        resolve(),
        commonjs({
            include: 'node_modules/**',
            namedExports: {
                'node_modules/react-dom/index.js': [
                    'createPortal',
                    'render',
                ],
                'node_modules/react/index.js': [
                    'Children',
                    'createContext',
                    'createElement',
                    'Component',
                    'forwardRef',
                    'Fragment',
                    'PropTypes',
                    'useCallback',
                    'useContext',
                    'useEffect',
                    'useLayoutEffect',
                    'useMemo',
                    'useRef',
                ],
                'node_modules/react-form/dist/index.js': [
                    'Form',
                    'Text',
                    'Select',
                    'StyledSelect',
                    'StyledText'
                ],
                'node_modules/react-if/lib/ReactIf.js': [
                    'If',
                    'Then',
                    'Else'
                ],
                'node_modules/prop-types/index.js': [
                    'object'
                ],
                'node_modules/lodash/lodash.js': [
                    'filter'
                ],
                'node_modules/lz-string/libs/lz-string.js': [
                    'compressToEncodedURIComponent',
                    'decompressFromEncodedURIComponent'
                ],
                'node_modules/react-is/index.js': [
                    'isValidElementType'
                ]
            }
        }),
        terser(),
        postcss({extract: 'style.css'})
    ]
};