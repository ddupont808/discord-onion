const { ipfs, tor, logger, db } = require('../index.js');
const utils = require('../utils.js');

var subs = {};

function tryParseJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
};

module.exports = {
	getTopic: (id) => `objects['user']['${id}']`,
	addSub: function(id, cb) {
		var topic = getTopic(id);
		if(subs[topic] != null) return cb();
		
		var handler = (msg) => {
			logger.log(topic, msg.data.toString());
			
			var packet = tryParseJSON(msg.data.toString());
			if(packet) {
				switch(packet.type) {
					case 'request_data':
						var post = db.get('posts')
									.find({ id: id })
									.value();
						if(post) {
							var topic = getTopic(id);
							var buf = new Buffer(JSON.stringify({
								type: 'data',
								data: post
							}));
							
							ipfs.pubsub.publish(topic, buf, (err) => {
								if(err)
									logger.log('error', err);
							});
						}
						break;
					case 'data':
						var data = packet.data;
						var cbs = subs[topic].callbacks.slice(0);
						subs[topic].callbacks = [];
						
						var rsa = new NodeRSA();
						rsa.importKey(new Buffer(data.key, 'base64'), 'pkcs1-public-der');
						
						var onion = utils.get_onion(data.key);
						var key_id = utils.b32toid(onion);
						
						var timestamp = data.timestamp;
						var data_hash = data.data;
						
						console.log(onion + " // " + key_id + " // " + data_hash);
						
						if(key_id == id) {
							if(rsa.verify(new Buffer(timestamp + ":" + data_hash), data.signature)) {
								var post = db.get('users')
									.find({ id: id })
									.value();
								console.log(post);
								if(post) {
									if(post.timestamp < data.timestamp) {
										db.get('users')
											.find({ id: id })
											.assign({
												timestamp: data.timestamp,
												data: data_hash,
												signature: data.signature
											}).write();
										console.log('updated ' + id);
									} else {
										console.log('outdated post oof');
									}
								} else {
									db.get('users')
										.push({ id: id, 
												key: data.key,
												timestamp: data.timestamp,
												data: data_hash,
												signature: data.signature
										}).write();
									console.log('pushed ' + id);
									
									node.files.get(data_hash, (err, files) => {
										var json;
										if(!err)
											json = tryParseJSON(files[0].content.toString());
										
										if(err || !json)
											for(var i = 0; i < cbs.length; i++)
												subs[topic].callbacks.push(cbs[i]);
										else {
											for(var i = 0; i < cbs.length; i++)
												subs[topic].callbacks.push(json);
										}
									});
								}
							}
						}
						
						break;
				}
			}
		};
		
		subs[topic] = {
			handler: handler,
			callbacks: []
		};
		
		logger.log('IPFS', `Subscribed to topic "${topic}"`);
		ipfs.pubsub.subscribe(getTopic(id), handler).then(cb);
	},
	getUser: function(id, cb) {
		addSub(id, () => {
			var post = db.get('users')
				.find({ id: id })
				.value();
			console.log(post);
			
			//TODO: check hidden service before checking local db!
			
			if(post) {
				cb(post);
			} else {
				var topic = getTopic(id);
				var buf = new Buffer(JSON.stringify({
					type: 'request_data'
				}));
				
				ipfs.pubsub.publish(topic, buf, (err) => {
					if(err)
						throw err;
					subs[topic].callbacks.push(cb);
				});
			}
		});
	};
};