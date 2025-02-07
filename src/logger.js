import * as winston from 'winston'
import 'winston-daily-rotate-file'
import { createLogger, format, transports } from 'winston'
import { getLogFilePath } from './utils.js'
import { red } from 'ansis'

const logFilePath = getLogFilePath()
const baseConfig = {
	filename: 'mens-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d',
	dirname: logFilePath,
}
const combined = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, { filename: 'combined.%DATE%.log', auditFile: `${logFilePath}audit.combined.json` }))
const info = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, {
	filename: 'info.%DATE%.log', level: 'info', auditFile: `${logFilePath}audit.info.json`,
}))
const warn = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, {
	filename: 'warn.%DATE%.log', level: 'warn', auditFile: `${logFilePath}audit.warn.json`,
}))
const error = new winston.transports.DailyRotateFile(Object.assign({}, baseConfig, {
	filename: 'error.%DATE%.log', level: 'error', auditFile: `${logFilePath}audit.error.json`,
}))
const csl = new transports.Console({
	level: 'warn',
	format: format.colorize({ all: true }),
	silent: true,
})

const timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
const myFormat = format.printf(({
	timestamp, message, level, ...rest
})=> {
	let restString = 'undefined'
	if(rest !== undefined){
		restString = JSON.stringify(rest)
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
		new transports.File({ filename: `${logFilePath}exceptions.log` }),
	],
	rejectionHandlers: [
		new transports.File({ filename: `${logFilePath}rejections.log` }),
	],
	exitOnError: true,
})

logger.on('error', function(err){
	console.error(red('logger error'), err)
})

process.on('unhandledRejection', (reason, promise)=> {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
	// process.exit(1);
})

process.on('uncaughtException', (err)=> {
	logger.error('Uncaught Exception:', err)
})

export default logger
