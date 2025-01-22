import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
// import Local from '../src/Local.js'
import Mens from '../src/Mens.js'
import fs from 'fs'
import { getUUID } from '../src/utils.js'
import yaml from 'js-yaml'
import path from 'path'

chai.use(chaiAsPromised)
const m = new Mens({
	isTest: true,
})
await m.getAllEntities()
const local = m.local
const testFilePath = path.join(import.meta.dirname, '../temp/', 'local.yml')

describe('Local', function(){
	describe('add()', function(){
		beforeEach(function(){
			const str = yaml.dump({
				cTime: new Date().valueOf(),
				mTime: new Date().valueOf(),
				entities: [],
			})
			fs.writeFileSync(testFilePath, str)
		})

		afterEach(function(){
			// fs.rmSync(testFilePath, { force: true })
		})

		it('when two entity is identical, it will be added successfully', async function(){
			const str = 'identical item'
			let entity = { id: getUUID(), content: str }
			await local.add(entity)
			entity = { id: getUUID(), content: str }
			await local.add(entity)
			const content = fs.readFileSync(testFilePath, 'utf8')
			const obj = yaml.load(content)
			chai.expect(obj.entities).to.have.lengthOf(2)
		})

		it('when the entity doesn\'t have an id, it will fail', async function(){
			const entity = { content: 'walang id' }
			await chai.expect(local.add(entity)).to.be.rejected
		})

		it('when the entity id is not a valid UUID, it will fail', async function(){
			const entity = { id: getUUID(), content: 'valid UUID' }
			await local.add(entity)
			const newEntity = { id: entity.id, content: 'not a valid UUID' }
			await chai.expect(local.add(newEntity)).to.be.rejected
		})
	})

	describe('remove()', function(){
		it('when the file has one entity, it will remove it successfully', async function(){
			const entity = { id: getUUID(), content: 'it will be removed immediately' }
			await local.add(entity)
			const result = await local.remove(entity.id)
			chai.expect(result).to.have.lengthOf(1)
		})

		it('when the entity is not in the file, it will behave like success', async function(){
			const result = await local.remove(getUUID())
			chai.expect(result).to.have.lengthOf(1)
		})

		it('when the file has two entities, it will remove them successfully', async function(){
			const entity1 = { id: getUUID(), content: 'entity 1' }
			const entity2 = { id: getUUID(), content: 'entity 2' }
			await local.add(entity1)
			await local.add(entity2)
			const result = await local.remove([entity1.id, entity2.id])
			chai.expect(result).to.have.lengthOf(2)
		})

		it('when the file has two entities, it will remove one successfully', async function(){
			const entity1 = { id: getUUID(), content: 'entity 1' }
			const entity2 = { id: getUUID(), content: 'entity 2' }
			await local.add(entity1)
			await local.add(entity2)
			const result = await local.remove(entity1.id)
			chai.expect(result).to.have.lengthOf(1)
		})
	})

	describe('modify()', function(){
		beforeEach(function(){
			const str = yaml.dump({
				cTime: new Date().valueOf(),
				mTime: new Date().valueOf(),
				entities: [],
			})
			fs.writeFileSync(testFilePath, str)
		})

		afterEach(function(){
			// fs.rmSync(testFilePath, { force: true })
		})

		it('when the entity doesn\'t exist, it will fail', async function(){
			const entity = { id: getUUID(), content: 'baliw' }
			await chai.expect(local.modify(entity)).to.be.rejected
		})

		it('when the entity exists, it will modify it successfully', async function(){
			const entity = { id: getUUID(), content: 'just for test' }
			await local.add(entity)
			entity.content = 'modified content for test'
			const result = await local.modify(entity)
			chai.expect(result.id).to.be.equal(entity.id)
		})
		// in the upper level, it should invoke the remove method
		it('when the entity exists, but the content is empty, it will fail', async function(){
			const entity = { id: getUUID(), content: 'has content' }
			await local.add(entity)
			entity.content = ''
			await chai.expect(local.modify(entity)).to.be.rejected
		})

		it('when the entity is an array, it will fail', async function(){
			const entity = { id: getUUID(), content: 'hello world' }
			await local.add(entity)
			await chai.expect(local.modify([entity])).to.be.rejected
		})
	})
})

