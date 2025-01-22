class Entity{

	#id

	#content

	#cTime

	#mTime

	get id(){
		return this.#id
	}

	set id(value){
		this.#id = value
	}

	set content(value){
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

	constructor(id, content){
		this.id = id
		this.content = content
	}

}

export default Entity
