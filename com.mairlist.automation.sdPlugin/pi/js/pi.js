// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software
var websocket = null,
uuid = null,
actionInfo = {};
settings = {};

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
  uuid = inUUID;
  // please note: the incoming arguments are of type STRING, so
  // in case of the inActionInfo, we must parse it into JSON first
  actionInfo = JSON.parse(inActionInfo); // cache the info
  settings = actionInfo.payload.settings;
  websocket = new WebSocket('ws://127.0.0.1:' + inPort);
  
  switch (actionInfo.action) {
    case ACTION_CART:
      document.getElementById("settings-cart").style.display = "block";
      document.getElementById("cart-number").value = settings.number || "";
      document.getElementById("cart-alwaysOn").checked = settings.alwaysOn;
      document.getElementById("cart-show-text").checked = settings.showText;
      break;
    case ACTION_COMMAND:
      document.getElementById("settings-command").style.display = "block";
      document.getElementById("command-command").value = settings.command || "";
      break;
  }

  // if connection was established, the websocket sends
  // an 'onopen' event, where we need to register our PI
  websocket.onopen = function () {
    var json = {
      event:  inRegisterEvent,
      uuid:   inUUID
    };
    // register property inspector to Stream Deck
    websocket.send(JSON.stringify(json));
    
    var json = {
      "event": "getGlobalSettings",
      "context": inUUID
    };    
    websocket.send(JSON.stringify(json));
  }

	websocket.onmessage = function (evt) {
	
		var data = JSON.parse(evt.data);

		if (data.event == "didReceiveGlobalSettings") {
		  var settings = data.payload.settings;
		  
      document.getElementById('host').placeholder = DEFAULT_HOST;
      document.getElementById('host').value = settings.host || "";

      document.getElementById('port').placeholder = DEFAULT_PORT;
      document.getElementById('port').value = settings.port || "";
		}
		
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

function updateGlobalSettings() {
  var settings = {};
  settings.host = document.getElementById('host').value;
  settings.port = document.getElementById('port').value;

  const json = {
    'event': 'setGlobalSettings',
    'context': uuid,
    'payload': settings
  };
  websocket.send(JSON.stringify(json));
}

function updateSettings() {
  var settings = {};
  
  console.log(actionInfo);

  switch (actionInfo.action) {
    case ACTION_CART:
      settings.number = document.getElementById("cart-number").value;
      settings.alwaysOn = document.getElementById("cart-alwaysOn").checked;
      settings.showText= document.getElementById("cart-show-text").checked;
      break;
    case ACTION_COMMAND:
      settings.command = document.getElementById("command-command").value;
      break;
  }

  const json = {
    "event": "setSettings",
    "context": uuid,
    "payload": settings
  };
  websocket.send(JSON.stringify(json));
}