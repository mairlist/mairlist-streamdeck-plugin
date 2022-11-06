class CommandAction extends Action {

  constructor(connection, context, settings) {
    super(connection, context, settings);
  }

  // Called when key goes down
  keyDown() {
    super.keyDown();
    
    if (this.settings.command)
      this.connection.executeCommand(this.settings.command);
  }
  
}