/**
 * A interface for the persistent layer. It only contains operations of adding, removing and modifying entities. Searching and getting entities are not included in this interface.
 */
class Persisted{

	constructor(){}

	/**
	 * Add an entity passed from the memory layer to the persistent layer
	 * @param {*} entity the entity to be added
	 * @returns {Promise} a promise that resolves to the entity added
	 */
	add(entity){
		throw new Error('Method not implemented', entity)
	}

	/**
	 * Remove entity from the dataSource.
	 * @param {*} ids the id(s) of the entity
	 * @returns a promise that resolves to the ids of the removed ids  
	 */
	remove(ids){
		throw new Error('Method not implemented.', ids)
	}

	/**
	 * Modify entity in the dataSource.
	 * @param {*} entities 
	 * @returns a promise that resolves to the modified entities
	 */
	modify(entities){
		throw new Error('Method not implemented.', entities)
	}

}

export default Persisted
