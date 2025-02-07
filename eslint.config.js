import js from 'eslint-config-janus/js.js'
import mocha from 'eslint-config-janus/mocha.js'
import { jsify } from 'eslint-config-janus/utils.js'
import globals from 'globals'

const testGlob = 'test/**/*.js'
const testTsArr = jsify(mocha, { files: [testGlob] })

export default [
	...js,
	...testTsArr,
	{
		languageOptions: {
			parserOptions: {
				sourceType: 'module',
			},
			globals: {
				window: 'readonly',
				...globals.node,
			},
		},
		rules: {
			'require-atomic-updates': [2, { allowProperties: true }],
			// 'promise/prefer-await-to-callbacks': 0,
		},
	},
]
