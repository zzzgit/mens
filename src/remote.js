import { Octokit } from '@octokit/rest'
import { graphql } from '@octokit/graphql'
import logger from './logger.js'
import { getTinyID } from './utils.js'
import yaml from 'js-yaml'
import { setConfig } from './configer.js'
import { green } from 'ansis'

const metaFileName = '#mens.yaml'

let octokit,
	octokitGraphql

/**
 * Fetch files from the gist
 * @returns the file content as an array
 */
const fetchFilesRest = async(token, id)=> {
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
	setConfig('gist.node', response.data.node_id)
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
		if(!config.gist.node){
			remoteFiles = await fetchFilesRest(config.token, config.gist.id)
		}else{
			remoteFiles = await fetchFilesGql(config)
		}
	}catch(e){
		logger.error(`[remote][sync] Failed to fetch files from the gist with status ${e.status}.`, e)
		if(!config.gist.node && e.status === 404){
			console.error(green('Gist with ID not found. Creating a new one...'))
			const { id, node } = await createGist(config.token)
			config.gist.id = id
			config.gist.node = node
			await setConfig('gist.id', id)
			await setConfig('gist.node', node)
		}
		if(config.gist.node){
			//
		}
		return 11
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
	found.forEach((remoteEntity)=> {
		const localEntity = local.find(item=> item.id === remoteEntity.id)
		merge(localEntity, remoteEntity)
	})
	notFound.forEach((remoteEntity)=> {
		local.push(remoteEntity)
	})
	mens.unsafeSave(local)
	updateRemote(config, local)
	return 0
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
	if(!octokit){
		octokit = new Octokit({
			auth: config.token,
		})
	}
	const response = await octokit.rest.gists.update({
		gist_id: config.gist.id,
		files,
	})
	if(response.status !== 200){
		throw new Error(`[remote][updateRemote] Failed to update the gist with response status: ${response.status}!`)
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
		throw new Error(`[remote][createGist] Failed to create with response status: ${response.status}!`)
	}
	const id = response.data.id
	const node = response.data.node_id
	logger.info('[remote][createGist] Created gist with ID:', id)
	return { id, node }
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

async function fetchFilesGql(config){
	if(!octokitGraphql){
		octokitGraphql = graphql.defaults({
			headers: {
				authorization: `token ${config.token}`,
			},
		})
	}
	const { node } = await octokitGraphql({
		query: `
        query ($nodeID: ID!) {
          node(id: $nodeID) {
            ... on Gist {
              id
              description
              createdAt
              files {
                name
                text
              }
            }
          }
        }
      `,
		nodeID: config.gist.node,
	})

	if (node){
		const files = node.files.filter(item=> item.name !== metaFileName)
		const result = files.map(item=> item.text)
		return result
	}
	return []
}
