// import { v6 as uuidv6 } from 'uuid'
import { random } from 'samael'
import base62 from 'base62/lib/ascii.js'
import { parse } from 'node-html-parser'
import markdownIt from 'markdown-it'
import { nanoid } from 'nanoid'

const md = markdownIt()

export const getRoot = ()=> {
	return global || window
}

export const getUUID = ()=> {
	// return uuidv6()
	// return getRoot().crypto.randomUUID()
	return getNanoID()
}

export const verifyUUID = (uuid)=> {
	if(uuid.length === 36 || uuid.length === 21){
		return true
	}
}

export const getTinyID = (isTest = false)=> {
	// 13 bits
	const time = new Date().valueOf()
	if(!isTest){
		const x = random(62)
		return base62.encode(time) + base62.encode(x)
	}
	// 10 bits
	const short = Math.floor(time / 1000)
	// 6 characters
	return base62.encode(short)
}

export const getNanoID = ()=> {
	return nanoid()
}

export const md2plain = (mdText)=> {
	const html = md.render(mdText)
	const root = parse(html)
	return root.innerText
}
