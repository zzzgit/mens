import { verifyUUID } from './utils.js'

class Entity{

	#id

	#content

	#cTime

	#mTime

	#dropped = false

	#dTime

	#version

	#history = []

	get id(){
		return this.#id
	}

	set id(value){
		if (!verifyUUID(value)){
			throw new Error('entity id is not a valid UUID')
		}
		this.#id = value
	}

	set content(value){
		if (typeof value !== 'string'){
			throw new Error('content must have a string')
		}
		this.#content = value
	}

	get content(){
		return this.#content
	}

	get cTime(){
		return this.#cTime
	}

	set cTime(value){
		this.#cTime = value
	}

	get mTime(){
		return this.#mTime
	}

	set mTime(value){
		this.#mTime = value
	}

	set dropped(value){
		// must be a boolean value 
		if (typeof value !== 'boolean'){
			throw new Error('dropped must be a boolean value')
		}
		this.#dropped = value
	}

	get dropped(){
		return this.#dropped
	}

	get dTime(){
		return this.#dTime
	}

	set dTime(value){
		this.#dTime = value
	}

	get version(){
		return this.#version
	}

	set version(value){
		this.#version = value
	}

	get history(){
		return this.#history
	}

	constructor(id, content){
		this.id = id
		this.content = content
	}

	static fromRaw(obj){
		const entity = new Entity(obj.id, obj.content)
		entity.cTime = obj.cTime
		entity.mTime = obj.mTime
		if(obj.dropped !== undefined){
			entity.dropped = obj.dropped
		}
		entity.dTime = obj.dTime
		entity.version = obj.version
		if (obj.history){
			entity.history.length = 0
			obj.history.forEach(v=> entity.history.push(v))
		}
		return entity
	}

	static toRaw(entity){
		return {
			id: entity.id,
			content: entity.content,
			cTime: entity.cTime,
			mTime: entity.mTime,
			dropped: entity.dropped,
			dTime: entity.dTime,
			version: entity.version,
			history: entity.history ? [...entity.history] : [],
		}
	}

	// 	toString(){
	// 		return `{
	//   id: ${this.id},
	//   content: ${this.content},
	//   cTime: ${this.cTime},
	//   mTime: ${this.mTime},
	//   dropped: ${this.dropped},
	//   dTime: ${this.dTime},
	//   version: ${this.version},
	//   history: ${this.history},
	// }`
	// 	}

}

export default Entity
