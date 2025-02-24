import { readFromFile, writeToFile } from 'samael'
import defaultConfig from './defaultConfig.js'
import { parse, stringify } from 'smol-toml'
import logger from './logger.js'
import { getConfigFilePath } from './utils.js'
import fs from 'fs'

const configVersion = '1.0'

export const ensureFileExists = async()=> {
	if(!fs.existsSync(getConfigFilePath())){
		const obj = {
			version: configVersion,
		}
		await writeToFile(getConfigFilePath(), stringify(obj))
		logger.info(`[config][#ensureLocalFile]: config file created, ${getConfigFilePath()}`)
	}
}

/**
 * Get the configuration from the config file. It will create the config file at the first time asynchronously.
 * @returns the combined config
 */
const getConfig = async()=> {
	// await ensureFileExists()
	const result = Object.assign({}, defaultConfig, await getLocalConfig())
	logger.info(`[config][getConfig] ${JSON.stringify(result)}`)
	return result
}

const getLocalConfig = async()=> {
	const content = await readFromFile(getConfigFilePath(), 'utf8')
	const obj = parse(content)
	logger.info(`[config][getRawConfig] ${JSON.stringify(obj)}`)
	return obj
}

/**
 * Set a configuration value.
 * @param {*} keyString strucutred key string, like foo.bar.
 * @param {*} value the value to set
 */
const setConfig = async(keyString, value)=> {
	// await ensureFileExists()
	const obj = await getLocalConfig()
	if(keyString.includes('.')){
		const tokens = keyString.split('.')
		const key1 = tokens[0]
		const key2 = tokens[1]
		if(!obj[key1]){
			obj[key1] = {}
		}
		if(typeof obj[key1] !== 'object'){
			logger.error(`[config][setConfig] The key ${key1} is not an object!`)
		}
		obj[key1][key2] = value
	}else{
		obj[keyString] = value
	}
	await writeToFile(getConfigFilePath(), stringify(obj))
	logger.info(`[config][setConfig] Config updated: ${keyString}=${value}`)
}

export {
	getConfig,
	setConfig,
}
