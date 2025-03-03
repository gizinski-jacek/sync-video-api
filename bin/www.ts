#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from '../app';
const debug = require('debug')('sync-video-api:server');
import { createServer } from 'http';
import { io } from '../socketio/socketio';

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '4000');
const host = process.env.HOST || undefined;
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = createServer(app);

/**
 * Attach socket.io to the server.
 */

const ioOptions = {
	cors: {
		origin: process.env.CLIENT_URI,
		methods: ['GET', 'POST'],
		credentials: true,
	},
};

io.attach(server, ioOptions);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(Number(port), host);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
	debug('Listening on ' + bind);
}
