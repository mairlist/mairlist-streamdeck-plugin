// Base class for all actions
class Action {

  // Constructor
  constructor(connection, context, settings) {
    this.connection = connection;
    this.context = context;
    this.didReceiveSettings(settings);
  }
  
  // The update function, called when settings change etc.
  update() {
  }

  // Called when new settings are received from SD
  didReceiveSettings(settings) {
    this.settings = settings
    this.update();
  }
  
  // Called when key goes down
  keyDown() {
  }
  
  // Called when key goes up
  keyUp() {
  }
  
}