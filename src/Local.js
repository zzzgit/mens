import Persisted from './Persisted.js'

// overwritten all the methods in Persisted with an implementation that return a value as the operation is cuccesfull
class Local extends Persisted{

	constructor(){
		super()
	}

	add(entity){
		return Promise.resolve(entity)
	}

	remove(ids){
		return Promise.resolve(ids)
	}

	modify(entities){
		if(!Array.isArray(entities)){
			entities = [entities]
		}
		return Promise.resolve(entities)
	}

}

export default Local
