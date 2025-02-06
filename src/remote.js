import { Octokit } from '@octokit/rest'
import logger from './logger.js'
import { getTinyID } from './utils.js'
import yaml from 'js-yaml'
import { setConfig } from './configer.js'

const metaFileName = '#mens.yaml'

let octokit

/**
 * Fetch files from the gist
 * @returns the file content as an array
 */
const fetchFiles = async(token, id)=> {
	if(!octokit){
		octokit = new Octokit({
			auth: token,
		})
	}
	const response = await octokit.rest.gists.get({
		gist_id: id,
	})
	if(response.status === 404){
		throw new Error(`[remote][getGist] Gist ${id} not exist!`)
	}
	if(response.status !== 200){
		throw new Error(`[remote][getGist] Failed to get the gist by ID ${id}.`)
	}
	const result = []
	for (const key in response.data.files){
		if (key === metaFileName){ continue }
		result.push(response.data.files[key].content)
	}
	return result
}

export const sync = async(config, mens)=> {
	const local = await mens.getAllEntities()
	let remoteFiles
	try{
		remoteFiles = await fetchFiles(config.token, config.gistId)
	}catch(e){
		logger.error(`[remote][sync] Failed to fetch files from the gist with status ${e.status}.`, e)
		if(e.status === 404){
			console.error('找不到，重新創建.')
			const id = await createGist(config.token)
			config.gistId = id
			setConfig('gistId', id)
		}
		return false
	}

	const found = []
	const notFound = []
	remoteFiles.forEach((content)=> {
		const file = yaml.load(content)
		const index = local.findIndex(item=> item.id === file.id)
		if (index !== -1){
			found.push(file)
		}else{
			notFound.push(file)
		}
	})
	logger.info('[remote][sync] Found:', found)
	logger.info('[remote][sync] Not found:', notFound)
	logger.info('22222:', {})
	logger.info('33333:', { foo: 3 })
	logger.info('44444:', [])
	logger.info('55555:', [22, 33, 44, {}])
	found.forEach((remoteEntity)=> {
		const localEntity = local.find(item=> item.id === remoteEntity.id)
		merge(localEntity, remoteEntity)
	})
	notFound.forEach((remoteEntity)=> {
		local.push(remoteEntity)
	})
	mens.unsafeSave(local)
	updateRemote(config, local)
}

/**
 * Update the remote gist
 * @param {*} config the config object
 * @param {*} local the local entities
 */
const updateRemote = async(config, local)=> {
	const files = {}
	local.forEach((entity)=> {
		files[`${entity.id}.yaml`] = {
			content: yaml.dump(entity),
		}
	})
	const response = await octokit.rest.gists.update({
		gist_id: config.gistId,
		files,
	})
	if(response.status !== 200){
		throw new Error('[remote][updateRemote] Failed to update the gist!', response.status)
	}
	logger.info('[remote][updateRemote] Updated the gist.')
}

/**
 * Create a new Gist. In most of the cased, it will only run once.
 * @param {*} token access token for Gist
 * @returns the id of the gist
 */
export const createGist = async(token)=> {
	const octokit = new Octokit({
		auth: token,
	})
	const response = await octokit.rest.gists.create({
		files: {
			[metaFileName]: {
				content: yaml.dump({ foo: 'bar' }),
			},
		},
		description: 'Just for mens!',
		public: false,
	})
	if(response.status !== 201){
		throw new Error('[remote][createGist] Failed to create!', response.status)
	}
	const id = response.data.id
	logger.info('[remote][createGist] Created gist with ID:', id)
	return id
}

const COMPARISON = {
	IDENTICAL: 0,
	LOCAL_IS_NEW: -1,
	REMOTE_IS_NEW: 1,
	DIVERGED: 99,
}

const compareHistories = (localHistory, remoteHistory)=> {
	if (localHistory.length === remoteHistory.length){
		if (localHistory.every((val, index)=> val === remoteHistory[index])){
			return COMPARISON.IDENTICAL
		}
	}
	if (localHistory.length > remoteHistory.length){
		if (localHistory.slice(0, remoteHistory.length).every((val, index)=> val === remoteHistory[index])){
			return COMPARISON.LOCAL_IS_NEW
		}
	}
	if (remoteHistory.length > localHistory.length){
		if (remoteHistory.slice(0, localHistory.length).every((val, index)=> val === localHistory[index])){
			return COMPARISON.REMOTE_IS_NEW
		}
	}
	return COMPARISON.DIVERGED
}

/**
 * Merge the local entity with the remote entity
 * @param {Entity} local the local entity
 * @param {Entity} remote the remote entity
 * @returns local entity after merging
 */
const merge = (local, remote)=> {
	const localHistory = [...local.history, local.version]
	const remoteHistory = [...remote.history, remote.version]
	const comparison = compareHistories(localHistory, remoteHistory)
	if (comparison === COMPARISON.IDENTICAL){
		return local
	}
	if (comparison === COMPARISON.LOCAL_IS_NEW){
		return local
	}
	if (comparison === COMPARISON.REMOTE_IS_NEW){
		local.content = remote.content
		local.history = [...remote.history]
		local.version = remote.version
		local.mTime = new Date().valueOf()
		return local
	}
	const localContent = local.content
	const remoteContent = remote.content
	local.content = localContent + '\n↑local\n===============================\n↓remote\n' + remoteContent
	const divergedPart = remoteHistory.filter(item=> !localHistory.includes(item))
	local.history = [...localHistory, ...divergedPart]
	local.version = getTinyID()
	local.mTime = new Date().valueOf()
	return local
}
