import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Mens from '../src/Mens.js'

chai.use(chaiAsPromised)
const mens = new Mens({
	isTest: true,
})

const uuidLength = 36

describe('Mens', function(){
	describe('#add()', function(){
		it('when successful, return the id of the array', function(){
			return chai.expect(mens.add('it is a sentence of md format')).to.eventually.has.property('id')
		})

		it('when same content to be added, it is allowe', async function(){
			const id1 = await mens.add('drown one`s sorrows')
			const id2 = await mens.add('drown one`s sorrows')
			return chai.expect(id1 === id2).to.be.false
		})
	})

	describe('#remove()', function(){
		it('when the id doesn`t exist in local, it works fine', function(){
			const id = mens.generateId()
			return chai.expect(mens.remove(id)).to.be.fulfilled
		})

		it('when the id is present, it returns the id', async function(){
			const obj = await mens.add('unang beses')
			const id = obj.id
			return chai.expect(mens.remove(id).then(ids=> ids[0])).to.eventually.has.lengthOf(uuidLength)
		})

		it('when pass multiple ids, it return an array', async function(){
			const isa = await mens.add('isa')
			const dalawa = await mens.add('dalawa')
			return chai.expect(mens.remove([isa.id, dalawa.id])).to.eventually.be.an('array').that.has.lengthOf(2)
		})
	})

	describe('#modify()', function(){
		it('when the id is not present, it will be rejected', function(){
			const id = mens.generateId()
			return chai.expect(mens.modify(id, 'new content')).to.be.rejected
		})

		it('when the id is present, it will return the entity', async function(){
			const obj = await mens.add('unang beses')
			const id = obj.id
			return chai.expect(await mens.modify({ id, content: 'bagong laman' })).to.has.property('id')
		})

		it('when modified twice, there will be a change history', async function(){
			const obj = await mens.add('unang beses')
			const id = obj.id
			obj.content = 'pangalawang beses'
			await mens.modify(obj)
			obj.content = 'pangatlong beses'
			await mens.modify(obj)
			const history = (await mens.getEntity(id)).history
			return chai.expect(history).to.be.an('array').that.has.lengthOf(2)
		})

		it('when the content not changed, it will will not be written to the file', async function(){
			const obj = await mens.add('will not change')
			const id = obj.id
			const version = obj.version
			const modified = await mens.modify({ id, content: 'will not change' })
			return chai.expect(modified.version).to.be.equal(version)
		})

		it('when the id is an array, it will be rejected', function(){
			return chai.expect(mens.modify([mens.generateId(), 'new content'])).to.be.rejected
		})
	})

	describe('#search()', function(){
		it('when there is no result, should return an empty array', async function(){
			return chai.expect(await mens.search('ab______c')).to.be.an('array').that.is.empty
		})

		it('when the value is present, it will return the index array', async function(){
			const obj = await mens.add('kissy face')
			const result = await mens.search('kissy')
			const searched = result[0]
			return chai.expect(obj.content).to.be.equal(searched.content)
		})
	})

	describe('#getEntity()', function(){
		it('when the id is not present, it will return undefined', async function(){
			const id = mens.generateId()
			return chai.expect(await mens.getEntity(id)).to.be.undefined
		})

		it('when the id is present, it will return the entity objec', async function(){
			const obj = await mens.add('pediatric clinic')
			const id = obj.id
			return chai.expect((await mens.getEntity(id)).id).to.be.equal(id)
		})
	})

	describe('#getAllEntities()', function(){
		it('should return an array', async function(){
			return chai.expect(await mens.getAllEntities()).to.be.an('array')
		})
	})

	// sync 
	describe('#sync()', function(){
		// it('return true if success', function(){
		// 	return chai.expect(mens.sync()).to.be.true
		// })
	})
	// sort by creation time
	describe('#sortByCTime()', function(){
		// it('should return true', function(){
		// 	return chai.expect(mens.sortByCTime()).to.be.true
		// })
	})
	// sort by modification time
	describe('#sortByMTime()', function(){
		// it('should return true', function(){
		// 	return chai.expect(mens.sortByMTime()).to.be.true
		// })
	})
	// get the first ten entities in in curren order
	describe('#getFirstTen()', function(){
		// it('should return an array of a length of 10', function(){
		// 	return chai.expect(mens.getFirstTen()).to.has.lengthOf(10)
		// })
	})
})
