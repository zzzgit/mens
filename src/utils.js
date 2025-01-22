export const getRoot = ()=> {
	return global || window
}

export const getUUID = ()=> {
	return getRoot().crypto.randomUUID()
}

export const verifyUUID = ()=> {
	return true
}
