class CartAction extends Action {

  constructor(connection, context, settings) {
    super(connection, context, settings);
  }

  update() {
    super.update();
  
    // Check is the cart number is configured
    var cartIndex = this.settings.cartNumber;
    if (cartIndex == undefined) {
      return;
    }
  
    // Determine color
    var color;
  
    if (! this.connection.connected)
      color = "black"
    else 
      switch (this.connection.cartPlayerStates[cartIndex]) {
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
    if ((this.connection.cartPlayerStates.length >= 10) || (cartIndex >= 10)) {
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
    this.connection.sendToSD({
      "event": "setImage",
      "context": this.context,
      "payload": {
        "image": svg
      }
    });
  }

  // Called when key goes down
  keyDown() {
    super.keyDown();
    
    if (this.settings.cartNumber)
      this.connection.executeCommand("CARTWALL " + this.settings.cartNumber + " CLICK");
  }
  
}