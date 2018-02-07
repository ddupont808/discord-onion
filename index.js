const globals = require('./globals.js');
const utils = require('./utils.js');

const tor = require('granax')();
const express = require('express');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const loggerFormat = printf(info => {
  return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
});

const logger = createLogger({
  format: combine(
    timestamp(),
	loggerFormat
  ),
  transports: [new transports.Console()]
});

const app = express();

app.use(globals.api_url, require('./routers/api.js'));
app.use(globals.oauth_url, require('./routers/oauth2.js'));

app.get('/docs', (req, res) => res.redirect('https://discordapp.com/developers/docs/intro'));

globals.port = process.env.PORT || globals.port;
logger.log('info', 'Initializing Tor instance...');

tor.on('ready', function() {
	/*tor.createHiddenService('127.0.0.1:8080', (err, result) => {
		console.info(`Service URL: ${result.serviceId}.onion`);
		console.info(`Private Key: ${result.privateKey}`);
		console.info('User ID: <@' + utils.b32toid(result.serviceId) + `> = ${result.serviceId}.onion`);
		console.info(`${utils.b32toid(result.serviceId)} = ${utils.idtob32(utils.b32toid(result.serviceId))}`);
	});*/
	
	tor.getInfo('net/listeners/socks', (err, result) => {
		let port = parseInt(result.split('"').join('').split(':')[1]);
		logger.log('info', `TorSocks listening on ${port}!`);
		
		logger.log('info', 'Starting server...');
		app.listen(globals.port, () => {
			logger.log('info', `Server now listening on port ${globals.port}!`);
			logger.log('info', '==================');
			logger.log('info', `Access the API at 127.0.0.1:${globals.port}${globals.api_url}`);
			logger.log('info', `Access the docs at 127.0.0.1:${globals.port}/docs`);
			logger.log('info', '==================');
			logger.log('info', 'Ready!');
		});
	});
});
 
tor.on('error', function(err) {
  console.error(err);
});