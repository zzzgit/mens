import { getTinyID, getUUID, md2plain } from './utils.js'
import Local from './Local.js'
import Entity from './Entity.js'
import logger from './logger.js'

/**
 * The Mens class handles the management of entities both in memory and in persistent storage.
 * 
 * - In-memory operations (get and search) are synchronous.
 * - Persistent storage operations (adding, removing, and modifying) are asynchronous.
 * 
 * @class Mens
 * @property {Array<Entity>} #memory - An array of Entity objects stored in memory.
 * @property {Promise} #initialize - A promise that fulfills when the app finishes its initialization.
 */
class Mens{

	/**
	 * Entity arrow in memory, it's an array of Entity
	 */
	#memory = []

	/**
	 * A resolver to resolve the initialize promise
	 */
	#resolver

	/**
	 * A promise which will fullfill when the app finishinng its initialization
	 */
	initialize = new Promise((resolve)=> {
		this.#resolver = resolve
	})

	/**
	 * A Local instance to handle local dataSource
	 */
	#local = new Local()

	#config = {}

	get memory(){
		return this.#memory
	}

	set memory(value){
		this.#memory = value
	}

	get local(){
		return this.#local
	}

	set local(value){
		this.#local = value
	}

	get isTest(){
		return this.#config.isTest
	}

	constructor(config = {}){
		this.memory = []
		this.#config = config
		this.local = new Local(config)
		if(config.isTest){
			logger.warn('[Mens][constructor] Mens is in test mode!')
		}
		const ensure = this.local.ensureLocalFile()
		const reload = ensure.then(()=> this.#reload())
		reload.then(()=> {
			return this.#resolver()
		}).catch((err)=> {
			logger.error('[Mens][constructor] Failed to initialize:', err)
		})
	}

	async #reload(){
		const data = await this.local.loadEntities()
		this.memory = data
		logger.info('[Mens][#reload] Entities loaded:', { total: this.memory.length })
	}

	/**
		 * Generate a new version, and update the history array
		 * @param {*} entity the entity will be updated
		 */
	#updateVersion(entity){
		const oldVersion = entity.version
		entity.version = getTinyID(this.#config.isTest)
		entity.mTime = new Date().valueOf()
		logger.info(`[Mens][#updateVersion] Entity updated, ${oldVersion}-->${entity.version}`, { id: entity.id })
		if(oldVersion){
			entity.history.push(oldVersion)
		}
	}

	/**
	 * Add entity to the dataSource.
	 * @param {*} content text in markdown format
	 * @returns a promise that resolves to the entity added
	 */
	async add(content){
		await this.initialize
		const id = this.generateId()
		const entity = new Entity(id, content)
		entity.cTime = new Date().valueOf()
		this.#updateVersion(entity)
		const returnedEntity = await this.local.add(entity)
		this.memory.push(returnedEntity)
		logger.info('[Mens][add] Entity added:', { id })
		return returnedEntity
	}

	/**
	 * Remove entity from the dataSource.
	 * @param {*} ids the id(s) of the entity, if the ID not exist, it will success as well
	 * @returns a promise that resolves to the id(s) of the removed entity
	 */
	async remove(ids){
		await this.initialize
		if (!Array.isArray(ids)){
			ids = [ids]
		}
		const removed = await this.local.remove(ids)
		if(!removed || !removed.length){
			throw new Error('[Mens][remove] Failed to remove!')
		}
		removed.forEach(id=> this.#removeOne(id))
		logger.info('[Mens][remove] Entity removed:', { ids: removed })
		return removed
	}

	#removeOne(id){
		const index = this.memory.findIndex(item=> item.id === id)
		if (index === -1){
			logger.error('[Mens][removeOne] Entity not found:', { id })
			return false
		}
		this.memory.splice(index, 1)
		return id
	}

	/**
	 * Modify entity in the dataSource.
	 * @param {*} entity the entity with new content. { id, content: "new content" }
	 * @returns a promise that resolves to the entity modified, reject if no any entities are modified
	 */
	async modify(entity){
		await this.initialize
		if(!entity.id){
			throw new Error('[Mens][modify] Entity must have an id!')
		}
		this.#updateVersion(entity)
		const modified = await this.local.modify(entity)
		if (!modified){
			throw new Error('[Mens][modify] Faild to modify!')
		}
		logger.info('[Mens][modify Entity modified:', { id: entity.id })
		return entity
	}

	/**
	 * Search for entities, in memory, by a keyword 
	 * @param {*} keyword  the keyword to search
	 * @returns an array of entities, in raw
	 */
	async search(value){
		await this.initialize
		const result = this.memory.filter(item=> md2plain(item.content).includes(value))
		logger.info('[Mens][search] Entities found from memory:', { keyword: value, total: result.length })
		return result.map(item=> Entity.toRaw(item))
	}

	/**
	 * Get entity from the memory. 
	 * @param {*} id the id of the entity
	 * @returns the matched entity in raw, or undefined if not found
	 */
	async getEntity(id){
		await this.initialize
		const result = this.memory.find(item=> item.id === id)
		if(!result){
			return undefined
		}
		logger.info('[Mens][getEntity] Entity found from memory,', { id })
		return Entity.toRaw(result)
	}

	/**
	 * Save the merged data into locale
	 * @param {*} entities 
	 */
	unsafeSave(entities){
		this.#local.unsafeSave(entities)
	}

	/**
	 * Get all the entities from the memory.
	 * @returns all entities, in raw
	 */
	async getAllEntities(){
		await this.initialize
		logger.info('[Mens][getAllEntities] All entities retrieved from memory.')
		return this.memory.map(item=> Entity.toRaw(item))
	}

	/**
	 * Generate a unique id for the entity.
	 * @returns the generated id
	 */
	generateId(){
		return getUUID()
	}

	/**
	 * Clear all entities from the dataSource.
	 * @returns a promise that resolves when the entities are cleared
	 */
	async clear(){
		await this.initialize
		await this.local.clearEntities()
		this.memory = []
		logger.info('[Mens][clear] All entities cleared.')
	}

}

export default Mens
