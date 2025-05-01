const { src, dest } = require('gulp');

/**
 * Copy icons to the build directory
 */
function buildIcons() {
	return src('./nodes/**/*.svg').pipe(dest('./dist/nodes'));
}

exports.build = buildIcons;
exports['build:icons'] = buildIcons;
