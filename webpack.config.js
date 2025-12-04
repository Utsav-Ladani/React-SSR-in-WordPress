import defaultConfig from '@wordpress/scripts/config/webpack.config.js';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

/**
 * RtlCssPlugin added by Webpack to convert left, margin-left, etc. physical
 * properties to rtl like right, margin-right, etc.
 *
 * But we can use inset-inline-start, margin-inline-start, etc. logical
 * properties to achieve the same result.
 *
 * Hence, removing it from the plugins array.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values
 */
const plugins = defaultConfig.plugins
	.filter( plugin => plugin.constructor.name !== 'RtlCssPlugin' );

export default {
	...defaultConfig,
	devServer: {
		...defaultConfig.devServer,
		// allows to access the dev server from any host.
		allowedHosts: 'all'
	},
	// Ignore build directory to avoid infinite webpack compilation loop.
	watchOptions: {
		ignored: [ '**/build' ]
	},
	plugins: [
		...plugins,
		/**
		 * CleanWebpackPlugin configuration to remove build artifacts
		 *
		 * Cleans up generated chunk files (e.g. *.js, *.json, *.map) after each build.
		 * This prevents accumulation of stale chunks and temporary files which can:
		 * 1. Increase build times
		 * 2. Consume unnecessary disk space
		 * 3. Potentially cause conflicts between builds
		 *
		 * This mostly happens in hot reload mode.
		 */
		new CleanWebpackPlugin()
	]
};
