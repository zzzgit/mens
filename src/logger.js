import * as winston from 'winston'
import 'winston-daily-rotate-file'
import { createLogger, format, transports } from 'winston'
import { getDataDir } from 'samael'
import path from 'path'

const getLogFilePath = ()=> {
	let p
	const isTemporary = false
	if(isTemporary){
		p = path.join(import.meta.dirname, '../log/')
	}else{
		p = path.join(getDataDir('mens'), 'log/')
	}
	// console.log(`[logger][getDataFilePath] log file path: ${p}`)
	return p
}
const baseConfig = {
	filename: 'mens-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d',
	dirname: getLogFilePath(),
}
const combined = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, { filename: 'combined.%DATE%.log', auditFile: `${getLogFilePath()}audit.combined.json` }))
const info = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, {
	filename: 'info.%DATE%.log', level: 'info', auditFile: `${getLogFilePath()}audit.info.json`,
}))
const warn = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, {
	filename: 'warn.%DATE%.log', level: 'warn', auditFile: `${getLogFilePath()}audit.warn.json`,
}))
const error = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, {
	filename: 'error.%DATE%.log', level: 'error', auditFile: `${getLogFilePath()}audit.error.json`,
}))
const csl = new transports.Console({ level: 'warn', format: format.colorize({ all: true }) })

const timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
const myFormat = format.printf(({
	timestamp, message, level, ...rest
})=> {
	let restString = ''
	if (Object.keys(rest).length){
		restString = '' + JSON.stringify(rest)
	}
	return `${timestamp} ${message} ${restString}(${level})`
})

const logFormat = format.combine(timestampFormat, myFormat)

const logger = createLogger({
	level: 'info',
	format: format.combine(logFormat),
	transports: [
		csl,
		combined,
		info,
		warn,
		error,
	],
	exceptionHandlers: [
		new transports.File({ filename: `${getLogFilePath()}exceptions.log` }),
	],
	rejectionHandlers: [
		new transports.File({ filename: `${getLogFilePath()}rejections.log` }),
	],
	exitOnError: true,
})

logger.on('error', function(err){
	console.error('logger error', err)
})

process.on('unhandledRejection', (reason, promise)=> {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
	// process.exit(1);
})

process.on('uncaughtException', (err)=> {
	logger.error('Uncaught Exception:', err)
})

export default logger
