import Persisted from './Persisted.js'
import { getDataDir, readFromFile, writeToFile } from 'samael'
import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import logger from './logger.js'
import Entity from './Entity.js'
import { verifyUUID } from './utils.js'

class Local extends Persisted{

	#config = {}

	meta = {
		cTime: undefined,
		mTime: undefined,
	}

	constructor(config = {}){
		super()
		this.#config = config
	}

	/**
	 * Ensure that the local file exists. Only be invoked by higher level.
	 */
	async ensureLocalFile(){
		if(!fs.existsSync(this.#getDataFilePath())){
			this.meta = {
				cTime: new Date().valueOf(),
				mTime: new Date().valueOf(),
			}
			const document = {
				...this.meta,
				entities: [],
			}
			await writeToFile(this.#getDataFilePath(), yaml.dump(document))
			logger.info(`[Local][ensureLocalFile] Local file created:, ${this.#getDataFilePath()}`)
		}
	}

	#getDataFilePath(){
		let p
		if(this.#config.isTest){
			p = path.join(import.meta.dirname, '../temp/', 'local.yml')
		}else{
			p = path.join(getDataDir('mens'), 'local.yml')
		}
		logger.info(`[Local][#getDataFilePath] Data file path: ${p}`)
		return p
	}

	/**
	 * Load all entities from the local file
	 * @returns the entities 
	 */
	async loadEntities(){
		const document = await this.#loadDocument()
		return document.entities.map(entity=> Entity.fromRaw(entity))
	}

	/**
	 * Load the data from the local file
	 * @returns a promise that resolves to the object 
	 */
	async #loadDocument(){
		const content = await readFromFile(this.#getDataFilePath())
		const document = yaml.load(content)
		this.meta = {
			cTime: document.cTime,
			mTime: document.mTime,
		}
		return document
	}

	/**
	 * Add an entity to the local file
	 * @param {*} entity the entity to be added, {id, content}
	 * @returns a promise that resolves to the entity added
	 */
	async add(entity){
		this.#verifyEntity(entity)
		const document = await this.#loadDocument()
		if(document.entities.find(e=> e.id === entity.id)){
			throw new Error(`[Local][add] Entity id ${entity.id} already exists!`)
		}
		document.entities.push(Entity.toRaw(entity))
		const yamlStr = yaml.dump(document)
		await writeToFile(this.#getDataFilePath(), yamlStr)
		logger.info('[Local][add] entity added:', { id: entity.id })
		return entity
	}

	/**
	 * Verify the entity by check it's id and content
	 * @param {*} entity the entity to be verified
	 */
	#verifyEntity(entity){
		if (!entity.id){
			throw new Error('Entity must have an id!')
		}
		if (!verifyUUID(entity.id)){
			throw new Error('Entity id is not a valid UUID!')
		}
		if (!entity.content){
			throw new Error('Entity must have content!')
		}
	}

	/**
	 * Remove an entity(s) from the local file
	 * @param {*} ids the id(s) of the entity
	 * @returns a promise that resolves to the id(s) of the removed entity
	 */
	async remove(ids){
		if(!ids){
			throw new Error('[Local][remove] ids is required!')
		}
		if (!Array.isArray(ids)){
			ids = [ids]
		}
		const document = await this.#loadDocument()
		const removed = []
		ids.forEach((id)=> {
			const index = document.entities.findIndex(e=> e.id === id)
			document.entities.splice(index, 1)
			removed.push(id)
		})
		document.mTime = new Date().valueOf()
		const yamlStr = yaml.dump(document)
		await writeToFile(this.#getDataFilePath(), yamlStr)
		logger.info('[Local][remove] Entity removed:', { ids: removed })
		return removed
	}

	/**
	 * Modify an entity in the local file with the new content
	 * @param {*} entity the entity to be modified
	 * @returns a promise that resolves to the entity of entity modified
	 */
	async modify(entity){
		this.#verifyEntity(entity)
		const document = await this.#loadDocument()
		const found = document.entities.find(e=> e.id === entity.id)
		if(!found){
			throw new Error('[Local][modify] Entity id not found!')
		}
		if(found.content === entity.content){
			logger.warn('[Local][modify] Entity content is the same, no need to modify:', { id: entity.id, content: entity.content })
			return found
		}
		Object.assign(found, Entity.toRaw(entity))
		document.mTime = new Date().valueOf()
		const yamlStr = yaml.dump(document)
		await writeToFile(this.#getDataFilePath(), yamlStr)
		logger.info('[Local][modify] Entity modified:', { id: entity.id, content: entity.content })
		return found
	}

	/**
	 * Clear all entities from the local file
	 * @returns a promise that resolves when the entities are cleared
	 */
	async clearEntities(){
		const document = await this.#loadDocument()
		document.entities = []
		document.mTime = new Date().valueOf()
		const yamlStr = yaml.dump(document)
		await writeToFile(this.#getDataFilePath(), yamlStr)
		logger.info('[Local][clearEntities] All entities have been cleared.')
	}

}

export default Local
