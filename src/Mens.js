import { getUUID } from './utils.js'
import Local from './Local.js'

// get and search will be performed in memory so that it is synchronous
// adding, removing, and modifying will be performed in persistent storage so that it is asynchronous
class Mens{

	// 在這裡聲明，好處是jsdoc 提示
	/**
	 * Entity arrow in memory
	 */
	#memory = []

	/**
	 * A Local instance to handle local dataSource
	 */
	#local = new Local()

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

	constructor(){
		this.memory = []
		this.local = new Local()
		// this.remote = samael('mens', 'https://mens.herokuapp.com')
	}

	/**
	 * Add entity to the dataSource.
	 * @param {*} content text in markdown format
	 * @returns a promise that resolves to the entity added
	 */
	add(content){
		const id = this.generateId()
		const raw = { id, content }
		// this.memory.push(entity)
		return this.local.add(raw).then((entity)=> {
			const copy = { ...entity }
			this.memory.push(copy)
			return copy
		})
	}

	/**
	 * Remove entity from the dataSource.
	 * @param {*} ids the id(s) of the entity
	 * @returns a promise that resolves to the id(s) of the removed entity
	 */
	remove(ids){
		if (!Array.isArray(ids)){
			ids = [ids]
		}
		// 刪除跟修改不一樣，如果ID不存在，修改報錯，刪除不報錯
		return this.local.remove(ids).then((ids)=> {
			if(ids && ids.length){
				ids.forEach(id=> this.#removeOne(id))
				return ids
			}
			throw new Error('failed to remove!')
		})
	}

	#removeOne(id){
		const index = this.memory.findIndex(item=> item.id === id)
		if (index === -1){
			return false
		}
		this.memory.splice(index, 1)
		return id
	}

	/**
	 * Modify entity in the dataSource.
	 * @param {*} id the id of the entity
	 * @param {*} content text in markdown format
	 * @returns a promise that resolves to the entity modified, reject if no any entities are modified
	 */
	modify(id, content){
		// check it's a single id
		const entity = this.getEntity(id)
		if (!entity || entity.length === 0){
			const e = new Error(`Entity not found for id: ${id}`)
			return Promise.reject(e)
		}
		return this.local.modify({ id, content }).then((entities)=> {
			if (entities && entities.length){
				this.#updateEntity(entity, entities[0])
				return entity
			}
			throw new Error('failed to modify!')
		})
	}

	/**
	 * Update the content of an entity with new data
	 * @param {*} oldEntity 
	 * @param {*} newEntity 
	 */
	#updateEntity(oldEntity, newEntity){
		if(oldEntity.id !== newEntity.id){
			console.log(9999, oldEntity, newEntity)
			throw new Error('The old entity id is not equal to the new one id!')
		}
		oldEntity.content = newEntity.content
		oldEntity.cTime = newEntity.cTime
		oldEntity.mTime = newEntity.mTime
	}

	/**
	 * Search for a entities by a keyword in the dataSource.
	 * @param {*} keyword  the keyword to search
	 * @returns an array of entities that match the keyword
	 */
	search(value){
		const result = this.memory.filter(item=> item.content.includes(value))
		return result
	}

	/**
	 * Get entity from the dataSource.
	 * @param {*} id the id of the entity
	 * @returns the matched entity, or undefined if not found
	 */
	getEntity(id){
		const result = this.memory.find(item=> item.id === id)
		return result
	}

	/**
	 * Get all the entities in the dataSource.
	 * @returns all entities in the dataSource
	 */
	getAllEntities(){
		return [...this.memory]
	}

	/**
	 * Generate a unique id for the entity.
	 * @returns the generated id
	 */
	generateId(){
		return getUUID()
	}

}

export default Mens
