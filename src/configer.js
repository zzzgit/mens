import { getConfigDir, writeToFile } from 'samael'
import defaultConfig from './defaultConfig.js'
import { parse, stringify } from 'smol-toml'
import logger from './logger.js'
import path from 'path'
import fs from 'fs'

const configVersion = '1.0'

const ensureFileExists = async()=> {
	if(!fs.existsSync(getConfigFilePath())){
		const obj = {
			version: configVersion,
		}
		await writeToFile(getConfigFilePath(), stringify(obj))
		logger.info(`[config][#ensureLocalFile]: config file created, ${getConfigFilePath()}`)
	}
}

/**
 * Get the configuration from the config file.
 * @returns the combined config
 */
const getConfig = async()=> {
	let result = Object.assign({}, defaultConfig)
	if(fs.existsSync(getConfigFilePath())){
		const obj = getRawConfig()
		result = Object.assign({}, result, obj)
	}
	logger.info(`[config][getConfig] ${JSON.stringify(result)}`)
	return result
}

const getRawConfig = ()=> {
	const content = fs.readFileSync(getConfigFilePath(), 'utf8')
	const obj = parse(content)
	logger.info(`[config][getRawConfig] ${JSON.stringify(obj)}`)
	return obj
}

/**
 * Get the configuration file path.
 * @returns {string} path
 */
const getConfigFilePath = ()=> {
	let p
	const isTemporary = true
	if(isTemporary){
		p = path.join(import.meta.dirname, '../temp/', 'config.toml')
	}else {
		p = path.join(getConfigDir('mens'), 'config.toml')
	}
	logger.info(`[config][getConfigFilePath] Path: ${p}`)
	console.log('config file pathe:', p)
	return p
}

/**
 * Set a configuration value.
 * @param {*} keyString strucutred key string, like foo.bar.
 * @param {*} value the value to set
 */
const setConfig = async(keyString, value)=> {
	await ensureFileExists()
	const obj = getRawConfig()
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

// console.log('config:', await getConfig())

export {
	getConfig,
	getConfigFilePath,
	setConfig,
}
