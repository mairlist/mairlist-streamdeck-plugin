var websocket = null;
var upstream = null;
var upstreamConnected = false;
var pluginUUID = null;
var shuttingDown = false;
var globalSettings = {};

var actions = {
  ACTION_CART: {}
};
var cartPlayerStates = {};

// Helper function: Send message to mAirList
function sendUpstream(obj) {
  if (upstreamConnected) {
    upstream.send(JSON.stringify(obj));
  }
}

// Helper function: Send message to SD
function sendDownstream(obj) {
  websocket.send(JSON.stringify(obj));
}


// The big connection loop
function connectUpstream() {
  console.log("connectUpstream");

  if (shuttingDown) {
    return;
  }

  try { 
    var host = globalSettings.host || DEFAULT_HOST;
    var port = globalSettings.port || DEFAULT_PORT;
    var url = "ws://" + host + ":" + port + "/ws";
    console.log("Connecting to " + url);
    upstream = new WebSocket(url);
  }
  catch (e) {
    if (! shuttingDown) {
      setTimeout(connectUpstream, CONNECT_INTERVAL);
    }
  }
  
  upstream.onopen = function() {
    console.log('Upstream connected');
    upstreamConnected = true;
    updateAllActions();
  }
  
  upstream.onerror = function (evt) {
    console.log("Connection error");
    upstreamConnected = false;
    updateAllActions();
    if (! shuttingDown) {
      setTimeout(connectUpstream, CONNECT_INTERVAL);
    }
  }

  upstream.onclose = function() {
    upstreamConnected = false;
    if (! shuttingDown) {
      // Update actions to reflect disconnected state
      updateAllActions();
      // Try to reconnect
      setTimeout(connectUpstream, CONNECT_INTERVAL);
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

function executeCommand(command) {
  sendUpstream({
    "msg": "set",
    "p": "Execute",
    "v": command
  });
}

function updateCartAction(context) {
  var settings = actions[ACTION_CART][context];
  
  // Check is the cart number is configured
  var cartIndex = settings.cartNumber;
  if (cartIndex == undefined) {
    return;
  }
  
  // Determine color
  var color;
  
  if (! upstreamConnected)
    color = "black"
  else 
    switch (cartPlayerStates[cartIndex]) {
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
  
  // Generate SVG
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

  // Send to SD  
  sendDownstream({
    "event": "setImage",
    "context": context,
    "payload": {
      "image": svg
    }
  });
}

// Update all actions 
function updateAllActions() {
  // Carts
  for (context in actions[ACTION_CART]) {
    updateCartAction(context);
  }

}

// Main function, connection handling to SD
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {

  pluginUUID = inPluginUUID

  // Open the web socket
  websocket = new WebSocket("ws://127.0.0.1:" + inPort);

  websocket.onopen = function() {
    // Register
    sendDownstream({
      "event": inRegisterEvent,
      "uuid": inPluginUUID
    });
    
    // Request global settings
    sendDownstream({
      "event": "getGlobalSettings",
      "context": inPluginUUID
    });
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
    else if (data.event == "didReceiveGlobalSettings") {

      // Check if we have to reconnect because host/port changed      
      var mustReconnect = 
        (data.payload.settings.host != globalSettings.host) ||
        (data.payload.settings.port != globalSettings.port);
        
      // Store new global settings
      globalSettings = data.payload.settings;

      // Reconnect if necessary     
      if (mustReconnect) {
        // Disconnect
        if (upstreamConnected) {
          upstream.close();
          upstreamConnected = false;
        }
        // Start connection loop
        connectUpstream();
      }
    }
  };

  websocket.onclose = function()  { 
    if (upstreamConnected) {
      shuttingDown = true;
      upstream.close();
    }
  };
}

