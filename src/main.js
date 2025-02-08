#!/usr/bin/env node

import meow from 'meow'
import Mens from './Mens.js'
import { createSpinner } from 'nanospinner'
import { confirm, editor, input, select } from '@inquirer/prompts'
import { green, red, yellow } from 'ansis'
import markdownit from 'markdown-it'
import terminal from 'markdown-it-terminal'
import honshinSelect from 'inquirer-honshin-select'
import Entity from './Entity.js'
import logger from './logger.js'
import { ensureFileExists as ensureConfigFileExists, getConfig, setConfig } from './configer.js'
import { createGist, sync } from './remote.js'

const spinner = createSpinner(' ')
let config,
	mens

const md = markdownit()
md.use(terminal)

const listActions = [
	{
		value: 'open', name: 'Open', key: 'o',
	},
	{
		value: 'edit', name: 'Edit', key: 'e',
	},
	{
		value: 'delete', name: 'Delete', key: 'd',
	},
	{
		value: 'quit', name: 'Quit', key: 'q',
	},
]

/**
 * Opens an entity and logs its details to the console.
 * @param {Object} entity - The entity to open.
 */
const doOpen = (entity)=> {
	console.log(Entity.toRaw(entity))
}

const cmdAdd = async()=> {
	let content
	if (args.length < 1){
		content = await editor({
			message: 'Add a new entity with the editor:',
			waitForUseInput: false,
		})
	}else{
		content = args[0]
	}
	content = content.trim()
	const addedEntity = await mens.add(content)
	console.log(Entity.toRaw(addedEntity))
	logger.info(`[main][cmdAdd] Added: ${Entity.toRaw(addedEntity)}`)
}

const cmdRemove = async()=> {
	if (args.length < 1){
		console.error(red('ID is required for removing an entity.'))
		logger.error('[main][cmdRemove] ID is required for removing an entity.')
		return null
	}
	const allEntities = await mens.getAllEntities()
	const entity = allEntities.find(item=> item.id === args[0])
	doDelete(entity)
}

/**
 * Edits an entity's content. Opens an editor if new content is not provided.
 * @param {string} id - The ID of the entity to edit.
 * @param {Object} entity - The entity object to edit.
 * @param {string} newContent - The new content for the entity.
 */
const doEdit = async(id, entity, newContent)=> {
	if (!(entity instanceof Entity)){
		entity = Entity.fromRaw(entity)
	}
	if(!id){
		console.error(red('ID is required for modifying an entity.'))
		logger.error('[main][doEdit] ID is required for modifying an entity.')
		return null
	}
	const originalContent = entity.content
	if(!newContent){
		newContent = await editor({
			message: 'Modify the entity with the editor:',
			default: originalContent,
			waitForUseInput: false,
		})
	}
	newContent = newContent.trim()
	if (newContent === originalContent){
		console.log(yellow('No changes, modification aborted.'))
		logger.info('[main][doEdit] No changes, modification aborted.')
		return null
	}
	entity.content = newContent
	const modifiedEntity = await mens.modify(entity)
	console.log(Entity.toRaw(modifiedEntity))
}

const cmdModify = async()=> {
	const id = args[0]
	const entityDuplicated = await mens.getEntity(id)
	doEdit(id, entityDuplicated, args[1])
}

const cmdGet = async()=> {
	if (args.length < 1){
		console.error(red('ID is required for getting an entity.'))
		logger.error('[main][cmdGet] ID is required for getting an entity.')
		return null
	}
	const entity = await mens.getEntity(args[0])
	console.log(entity)
	logger.info(`[main][cmdGet] Entity: ${entity}`)
}

const cmdList = async()=> {
	const allEntities = await mens.getAllEntities()
	showList(allEntities)
}

/**
 * Displays a list of entities and allows the user to perform actions on them.
 * @param {Array} entities - The list of entities to display.
 */
const showList = async(entities)=> {
	if (!entities.length){
		console.log(yellow('No entities found!'))
		logger.warn('[main][showList] No entities found!')
		return null
	}
	const contents = entities.map((entity)=> {
		return {
			name: md.render(entity.content).trim(),
			value: entity.id,
		}
	})

	const result = await honshinSelect({
		message: 'Choose an entity to perform an action:',
		actions: listActions,
		choices: contents,
	})
	const selectedRaw = entities.find(item=> item.id === result.answer)
	if(result.action === 'open'){
		doOpen(selectedRaw)
	}else if(result.action === 'edit'){
		doEdit(selectedRaw.id, selectedRaw, undefined)
	} else if(result.action === 'delete'){
		doDelete(selectedRaw)
	}else if (result.action === 'quit'){
		process.exit()
	}
}

/**
 * Deletes an entity after confirming with the user.
 * @param {Object} entity - The entity to delete.
 */
const doDelete = async(entity)=> {
	const answer = await confirm({
		message: `Delete entity '${entity.id}', continue?`,
		default: false,
	})
	if(answer){
		const removedIds = await mens.remove(entity.id)
		console.log(removedIds)
		logger.info(`[main][doDelete] Removed: ${removedIds}`)
	}
}

/**
 * Displays meta information about the entities and the application.
 */
const cmdInfo = async()=> {
	const info = {
		entity: {
			total: (await mens.getAllEntities()).length,
		},
		meta: { ...mens.meta },
		version: 3,
		time: {
			created: new Date(mens.local.meta.cTime).toString(),
			modified: new Date(mens.local.meta.mTime).toString(),
		},

	}
	console.log('Version:\t', green(info.version))
	console.log('Total entities:\t', green(info.entity.total))
	if(config.isTest){
		console.warn(yellow('Test mode is enabled.'))
	}
	console.log(`Create time:\t${info.time.created}`)
	console.log(`Last modified:\t${info.time.modified}`)
}

/**
 * Searches for entities by a keyword and displays the results.
 */
const cmdSearch = async()=> {
	if (args.length < 1){
		logger.error('[main][cmdSearch] Keyword is required for searching entities!')
		return null
	}
	const results = await mens.search(args[0])
	if(!results.length){
		console.log('No results found.')
		logger.warn('[main][cmdSearch] No results found.')
		return null
	}
	showList(results)
}

const todo = {
	NOTHING: 0,
	TOKEN: 1,
	GISTID: 2,
}

const cmdConfig = async()=> {
	if (args.length < 2){
		console.error(red('Key and value are required for setting a configuration value.'))
		logger.error('[main][cmdConfig] Key and value are required for setting a configuration value.')
		return null
	}
	const keyString = args[0].trim()
	let value = args[1]
	if(cli.flags.smart){
		if(value === 'true'){
			value = true
		}else if(value === 'false'){
			value = false
		}else if(!isNaN(value)){
			value = Number(value)
		}
	}
	await setConfig(keyString, value)
}

const cmdSync = async()=> {
	spinner.start('Syncing...')
	const result = await sync(config, mens)
	if(result === 0){
		spinner.success('Synced successfully.')
	}else{
		spinner.error('Failed to sync.')
	}
}

const cmdClear = async()=> {
	const answer = await confirm({
		message: 'Clear all entities? This action cannot be undone.',
		default: false,
	})
	if(answer){
		await mens.clear()
		console.log('All entities have been cleared.')
		logger.info('[main][cmdClear] All entities have been cleared.')
	}
}

const defination = `
  Usage
    $ mens <command> [options]

  Commands
    add <content>       Add a new entity with the given content
    remove <id>         Remove an entity by its ID
    modify <id> <content> Modify an entity by its ID with new content
    get <id>            Get an entity by its ID
	info				Show meta info
    search <keyword>    Search entities by a keyword
    list                List all entities
	config <key> <value> Set a configuration value
    clear               Clear all entities
	sync				Sync with remote

  Options
    --help -s			Show help
	--version v			Show version
	--smart, -s			Parsing values as smart
`
const mconfig = {
	importMeta: import.meta,
	flags: {
		help: {
			type: 'boolean',
			shortFlag: 'h',
		},
		version: {
			type: 'boolean',
			shortFlag: 'v',
		},
		smart: {
			type: 'boolean',
			shortFlag: 's',
			description: 'Parsing values as smart',
			default: false,
		},
	},
}

// shortcuts
const commandAliases = {
	rm: 'remove',
	r: 'remove',
	d: 'remove',
	delete: 'remove',
	mod: 'modify',
	m: 'modify',
	a: 'add',
	s: 'search',
	l: 'list',
}

const cli = meow(defination, mconfig)

const [command, ...args] = cli.input
const cmd = commandAliases[command] || command

/**
 * Parses and executes the command provided by the user.
 */
const parseCommand = ()=> {
	switch (cmd){
	case 'add':
		cmdAdd()
		break

	case 'remove':
		cmdRemove()
		break

	case 'modify':
		cmdModify()
		break

	case 'get':
		cmdGet()
		break

	case 'search':
		cmdSearch()
		break

	case 'list':
		cmdList()
		break

	case 'info':
		cmdInfo()
		break

	case 'clear':
		cmdClear()
		break

	case 'config':
		cmdConfig()
		break

	case 'sync':
		cmdSync()
		break

	default:
		cli.showHelp()
		break
	}
}

const init = async()=> {
	await ensureConfigFileExists()
	config = await getConfig()
	mens = await new Mens(config)
	if(!config.token){
		return todo.TOKEN
	}
	if(!config.gist?.id){
		return todo.GISTID
	}
	return todo.NOTHING
}

const chore = await init()
if(chore === todo.TOKEN){
	console.warn(yellow('Token has not been set!'))
	logger.warn('[main] Set token first time.')
	const answer = await input({ message: 'Enter your token' })
	setConfig('token', answer)
}else if (chore === todo.GISTID){
	console.warn(yellow('Gist ID has not been set!'))
	logger.warn('[main] Set gist ID the first time.')
	const choice = await select({
		message: 'You can do the following:',
		choices: [
			{
				name: 'Use an existing gist',
				value: 'exsiting',
				description: 'Input the Gits ID.',
			},
			{
				name: 'Create a new gist',
				value: 'creating',
				description: 'Create a new gist for mens automatically.',
			},
		],
	})
	if(choice === 'creating'){
		spinner.start('Creating a new Gist...')
		const { id, node } = await createGist(config.token)
		spinner.success('Created a new Gist.')
		await setConfig('gist.id', id)
		await setConfig('gist.node', node)
	}else{
		const answer = await input({ message: 'Enter your Gist ID' })
		setConfig('gist.id', answer)
	}
}else if(chore === todo.NOTHING){
	parseCommand()
		.catch((err)=> {
			logger.error(`[main][parseCommand] Got error: ${err}`)
		})
}

