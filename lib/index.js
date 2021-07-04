'use strict';

const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const pluginBabel = (options = {}) => ({
	name: 'babel',
	setup(build, { transform } = {}) {
		const { filter = /.*/, namespace = '', config = {} } = options;

		const transformContents = ({ args, contents }) => {
			const babelOptions = babel.loadOptions({
				...config,
				filename: args.path,
				caller: {
					name: 'esbuild-plugin-babel',
					supportsStaticESM: true
				},
        presets: ['@babel/preset-react'],
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
        ],
			});
			if (!babelOptions) return { contents };

			if (babelOptions.sourceMaps) {
				const filename = path.relative(process.cwd(), args.path);

				babelOptions.sourceFileName = filename;
			}

			return new Promise((resolve, reject) => {
				babel.transform(contents, babelOptions, (error, result) => {
					error ? reject(error) : resolve({ contents: result.code });
				});
			});
		};

		if (transform) return transformContents(transform);

		build.onLoad({ filter, namespace }, async args => {
			const source = fs.readFileSync(args.path, 'utf8');

      if (args.path.includes('node_modules')) return { contents: source };

			return transformContents({ args, contents: source });
		});
	}
});

module.exports = pluginBabel;
