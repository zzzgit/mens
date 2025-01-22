import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Mens from '../src/Mens.js'

chai.use(chaiAsPromised)
const mens = new Mens()

// 數據分為三層，memory, localstorage, remote.不需要考慮第四層，cache
// const lengthOfId = 10
describe('Mens', function(){
	// add entity to the array
	describe('#add()', function(){
		it('should return the id of the array when the entity is added', function(){
			// here verify that the id is of length 10
			return chai.expect(mens.add('it is a sentence of md format')).to.eventually.has.property('id')
		})

		it('allow the same content to be added', async function(){
			const id1 = await mens.add('drown one`s sorrows')
			const id2 = await mens.add('drown one`s sorrows')
			return chai.expect(id1 === id2).to.be.false
		})
	})
	// remove entity from the array
	describe('#remove()', function(){
		it('should be works fine when the id doesn`t exist in local', function(){
			const id = mens.generateId()
			return chai.expect(mens.remove(id)).to.be.fulfilled
		})

		it('should return the id when the id is present', async function(){
			const obj = await mens.add('unang beses')
			const id = obj.id
			return chai.expect(mens.remove(id)).to.eventually.has.lengthOf(1)
		})
	})

	// modify entity in the array
	describe('#modify()', function(){
		it('should be rejected when the id is not present', function(){
			const id = mens.generateId()
			return chai.expect(mens.modify(id, 'new content')).to.be.rejected
		})

		it('should return the id when the id is present', async function(){
			const obj = await mens.add('unang beses')
			const id = obj.id
			return chai.expect(await mens.modify(id, 'bagong laman')).to.has.property('id')
		})
	})
	// search entity in the array
	describe('#search()', function(){
		it('should return undefined when there is no result', function(){
			// an empty array
			return chai.expect(mens.search('abc')).to.be.an('array').that.is.empty
		})

		it('should return the index array when the value is present', function(){
			return chai.expect(mens.search('word')).to.be.an('array')
		})
	})
	// get entity in the array
	describe('#getEntity()', function(){
		it('should return undefined when the id is not present', function(){
			const id = mens.generateId()
			return chai.expect(mens.getEntity(id)).to.be.undefined
		})

		it('should return the entity object when the id is present', async function(){
			const obj = await mens.add('pediatric clinic')
			const id = obj.id
			return chai.expect(await mens.getEntity(id).id).to.be.equal(id)
		})
	})
	// get all entity in the array
	describe('#getAllEntities()', function(){
		it('should return an array', function(){
			return chai.expect(mens.getAllEntities()).to.be.an('array')
		})
	})
	// batch delete entity in the array
	describe('#batchDelete()', function(){
		it('should return an array', async function(){
			const isa = await mens.add('isa')
			const dalawa = await mens.add('dalawa')
			return chai.expect(mens.remove([isa.id, dalawa.id])).to.eventually.be.an('array').that.has.lengthOf(2)
		})
	})
	// sync 
	describe('#sync()', function(){
		it('return true if success', function(){
			return chai.expect(mens.sync()).to.be.true
		})
	})
	// sort by creation time
	describe('#sortByCTime()', function(){
		it('should return true', function(){
			return chai.expect(mens.sortByCTime()).to.be.true
		})
	})
	// sort by modification time
	describe('#sortByMTime()', function(){
		it('should return true', function(){
			return chai.expect(mens.sortByMTime()).to.be.true
		})
	})
	// get the first ten entities in in curren order
	describe('#getFirstTen()', function(){
		it('should return an array of a length of 10', function(){
			return chai.expect(mens.getFirstTen()).to.has.lengthOf(10)
		})
	})
})
