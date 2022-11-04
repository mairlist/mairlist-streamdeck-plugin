var websocket = null;
var upstream = null;
var upstreamConnected = false;
var pluginUUID = null;
var shuttingDown = false;

var actions = {
	ACTION_CART: {}
};
var cartPlayerStates = {};



function connectUpstream() {
	if (shuttingDown) {
		return;
	}

  try {	
		upstream = new WebSocket(UPSTREAM_URL);
	}
	catch (e) {
		if (! shuttingDown) {
			setTimeout(1000, connectUpstream);
		}
	}
	
	upstream.onopen = function() {
	  console.log('Upstream connected');
		upstreamConnected = true;
	}

	upstream.onclose = function() {
		upstreamConnected = false;
		if (! shuttingDown) {
			setTimeout(1000, connectUpstream);
		}
	}
	
	upstream.onmessage = function(evt) {
		var msg = JSON.parse(evt.data);
		console.log(msg);
		
		if (msg.msg == 'state') {
			
			var m = msg.p.match(/^Cartwall\/Players\/Player (\d+)\/(.*)/);
			if (m) {
				var idx = m[1];
				var param = m[2];
				
				if (param == 'State') {
					cartPlayerStates[idx] = msg.v;
				}
				
				for (context in actions[ACTION_CART]) {
					updateCartAction(context);
				}
			}
		}
	}
}

function sendUpstream(obj) {
	if (upstreamConnected) {
		upstream.send(JSON.stringify(obj));
	}
}

function sendDownstream(obj) {
	websocket.send(JSON.stringify(obj));
}


function executeCommand(command) {
	sendUpstream({
		"msg": "set",
		"p": "Execute",
		"v": command
	});
}

function updateCartAction(context) {
	var settings = actions[ACTION_CART][context];
	var cartIndex = settings.cartNumber;
	if (cartIndex == undefined) {
		return;
	}
	
	var state = cartPlayerStates[cartIndex];
	var color;
	
	switch (state) {
		case "Playing":
			color = "red";
			break;
		case "Fading":
			color = "red";
			break;
		case "Stopped":
			color = "green";
			break;
		default:
			color = "black";
	}
	
	var fontSize = 64;
	var textY = 70;
	if ((cartPlayerStates.length >= 10) || (cartIndex >= 10)) {
		fontSize = 48;
		textY = 62;
	}
	
	var svg = 
	  "data:image/svg+xml;charset=utf8," +
	  "<svg height=\"100\" width=\"100\">" +
	  "<circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"black\" stroke-width=\"3\" fill=\"" + color + "\" />" +
	  "<text x=\"50\" y=\"" + textY + "\" text-anchor=\"middle\" font-size=\"" + fontSize + "px\" font-weight=\"bold\" fill=\"white\">" + cartIndex + "</text>" +
	  "</svg>";
	
	sendDownstream({
		"event": "setImage",
		"context": context,
		"payload": {
			"image": svg
		}
	});
}

function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {

	pluginUUID = inPluginUUID

	// Open the web socket
	websocket = new WebSocket("ws://127.0.0.1:" + inPort);

	websocket.onopen = function() {
		var json = {
			"event": inRegisterEvent,
			"uuid": inPluginUUID
		};
		
		connectUpstream();

		websocket.send(JSON.stringify(json));
	};

	websocket.onmessage = function (evt) {
	
		var data = JSON.parse(evt.data);
		
		if (data.event == "willAppear") {
			// Prepare dictionary object
			if (actions[data.action] == undefined) {
				actions[data.action] = {};
			}
			actions[data.action][data.context] = data.payload.settings;
			
			if (data.action == ACTION_CART) {
				updateCartAction(data.context);
			}
		}
		else if (data.event == "willDisappear") {
			// Prepare dictionary object
			if (actions[data.action] == undefined) {
				actions[data.action] = {};
			}
			delete actions[data.action][data.context];
		}
		else if (data.event == "keyDown") {
			if (data.action == ACTION_CART) {
				cartNumber = data.payload.settings.cartNumber;
				if (cartNumber != undefined) {
					executeCommand("CARTWALL " + cartNumber + " CLICK");
				}
			}
		}
		else if (data.event == "didReceiveSettings") {
			// Prepare dictionary object
			if (actions[data.action] == undefined) {
				actions[data.action] = {};
			}
			actions[data.action][data.context] = data.payload.settings;

			if (data.action == ACTION_CART) {
				updateCartAction(data.context);
			}
		}
	};

	websocket.onclose = function() 	{ 
		if (upstreamConnected) {
			shuttingDown = true;
			upstream.close();
		}
	};
}

