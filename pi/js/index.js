// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software
var websocket = null,
uuid = null,
actionInfo = {};

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
	uuid = inUUID;
	// please note: the incoming arguments are of type STRING, so
	// in case of the inActionInfo, we must parse it into JSON first
	actionInfo = JSON.parse(inActionInfo); // cache the info
	websocket = new WebSocket('ws://127.0.0.1:' + inPort);

	// if connection was established, the websocket sends
	// an 'onopen' event, where we need to register our PI
	websocket.onopen = function () {
		var json = {
			event:  inRegisterEvent,
			uuid:   inUUID
		};
		// register property inspector to Stream Deck
		websocket.send(JSON.stringify(json));
	}
	
	info = JSON.parse(inActionInfo);
	
	switch (info.action) {
		case ACTION_CART:
			setupActionCart();
			break;
	} 
}

// our method to pass values to the plugin
function sendValueToPlugin(value, param) {
	if (websocket) {
		const json = {
				"action": actionInfo['action'],
				"event": "sendToPlugin",
				"context": uuid,
				"payload": {
					[param] : value
				}
		 };
		 websocket.send(JSON.stringify(json));
	}
}

function setupActionCart() {
	document.getElementById("placeholder").innerHTML = `
            <div class="sdpi-item" id="number">
                <div class="sdpi-item-label">Cart Number</div>
                <input class="sdpi-item-value" id="number" inputmode="numeric" pattern="[0-9]*" type="number">
            </div>
    `;
}