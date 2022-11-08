// Class which handles the upstream connection to mAirList
class UpstreamConnection {

  // Constructor
  constructor(sendToSD) {
    this.sendToSD = sendToSD; // Callback function to send payload to SD
    
    this.connected = false;
    this.websocket = null;
    this.shuttingDown = false;
    this.settings = {};
    this.actions = {
      [ACTION_CART]: {},
      [ACTION_COMMAND]: {}
    };
    this.allActions = {};
    
    this.cartPlayerStates = {};
    this.cartwallMode = "";
  }
  
  // Helper functions
  sendUpstream(payload) {
    if (this.connected) {
      this.websocket.send(JSON.stringify(payload));
    }
  }
  
  executeCommand(command) {
    this.sendUpstream({
      "msg": "set",
      "p": "Execute",
      "v": command
    });
  }
  
  // The big connection loop
  connectionLoop() {
  
    const tryReconnect = function(self) {
      setTimeout(function() {
        self.connectionLoop();
      }, CONNECT_INTERVAL);
    }
  
    if (this.shuttingDown) {
      return;
    }

    var host = this.settings.host || DEFAULT_HOST;
    var port = this.settings.port || DEFAULT_PORT;
    var url = "ws://" + host + ":" + port + "/ws";

    console.log("Upstream connecting to " + url);

    this.websocket = new WebSocket(url);
  
    this.websocket.onopen = () => {
      console.log('Upstream connected');
      this.connected = true;
      this.updateAllActions();
    }
  
    this.websocket.onerror = (evt) => {
      console.log("Upstream connection error");
    }

    this.websocket.onclose = () => {
      console.log("Upstream connection lost");
      this.connected = false;
      if (! this.shuttingDown) {
        // Update actions to reflect disconnected state
        this.updateAllActions();
        // Try to reconnect
        tryReconnect(this);
      }
    }
  
    this.websocket.onmessage = (evt) => {
      var msg = JSON.parse(evt.data);
    
      if (msg.msg == 'state') {
        this.handleStateMessage(msg);
      }
    }
  }
  
  updateActions(actionClass) {
    for (const ctx in this.actions[actionClass]) 
      this.actions[actionClass][ctx].update();
  }

  updateAllActions() {
    for (const ctx in this.allActions) 
      this.allActions[ctx].update();
  }
  
  
  // Handler for all incoming "state" messages from upstream
  handleStateMessage(msg) {
  
    if (msg.p == "Cartwall/Mode") {
      this.cartwallMode = msg.v;
      this.updateActions(ACTION_CART);
      return;
    }
    
    var m = msg.p.match(/^Cartwall\/Players\/Player (\d+)\/(.*)/);

    if (m) {
      var idx = m[1];
      var param = m[2];
    
      if (param == 'State') {
        this.cartPlayerStates[idx] = msg.v;
        
        for (const ctx in this.actions[ACTION_CART]) {
          const action = this.actions[ACTION_CART][ctx];
          if (action.settings.number == idx)
            action.update();
        }
      }
      
      return;
    }
  }
  
  // Called when an action appears
  willAppear(data) {
    var action = null;
    
    // Create action object, based on type
    switch (data.action) {
      case ACTION_CART:
        action = new CartAction(this, data.context, data.payload.settings); 
        break;
      case ACTION_COMMAND:
        action = new CommandAction(this, data.context, data.payload.settings); 
        break;
      default:
        console.log("Unknown action type: " + data.action);
        return;
    }
    
    // Register in the list of actions
    this.actions[data.action][data.context] = action;
    this.allActions[data.context] = action;
  }


  // Called when an action disappears
  willDisappear(data) {
    // Remove from list of actions
    delete this.actions[data.action][data.context];
    delete this.allActions[data.context];
  }
  
  // Called when key goes down
  keyDown(data) {
    const action = this.allActions[data.context];
    if (action != undefined) 
      action.keyDown()
  }
  
  // Called when key goes up
  keyUp(data) {
    const action = this.allActions[data.context];
    if (action != undefined) 
      action.keyUp()
  }

  // Called when new settings are received for an action
  didReceiveSettings(data) {
    // Pass to correct action
    this.allActions[data.context].didReceiveSettings(data.payload.settings);
  }

  
  // Called when new global settings are received 
  didReceiveGlobalSettings(settings) {
  
    var mustReconnect = 
      (this.settings.host != settings.host) ||
      (this.settings.port != settings.port);
      
    this.settings = settings;
   
    // Reconnect if necessary     
    if (mustReconnect) {
      // Disconnect
      if (this.connected) {
        this.websocket.close();
        this.connected = false;
      }
      // Start connection loop
      this.connectionLoop();
    }
  }
  
  // Called before shutdown
  shutdown() {
    this.shuttingDown = true;
    this.websocket.close();
    this.updateAllActions(); // To reflect disconnected state
  }
}