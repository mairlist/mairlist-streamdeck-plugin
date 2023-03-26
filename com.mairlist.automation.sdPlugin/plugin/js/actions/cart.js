class CartAction extends Action {

  constructor(connection, context, settings) {
    super(connection, context, settings);
  }

  update() {
    super.update();
  
    // Check is the cart number is configured
    const cartIndex = this.settings.number;
    if (cartIndex === undefined) {
      return;
    }
  
    // Determine color
    let color;
    let cartText = cartIndex
    let fontSize = 64
  
    if (! this.connection.connected)
      color = "black"
    else if (! (this.settings.alwaysOn ||
               (this.connection.cartwallMode == "OnAir") ||
               (this.connection.cartwallMode == "PFL") ||
               (this.connection.cartwallMode == "VT"))
            )
      color = "black"
    else 
      switch (this.connection.cartPlayerStates[cartIndex].state) {
        case "Playing":
          color = "#E74C3C";
          break;
        case "Fading":
          color = "#E67E22";
          break;
        case "Stopped":
          color = "#27AE60";
          break;
        default:
          color = "#7F8C8D";
      }
      
      
    // Generate SVG
    if (this.connection.connected) {
      if (this.connection.cartPlayerStates[cartIndex].title !== "") {
        cartText = this.connection.cartPlayerStates[cartIndex].title;
        fontSize = 17;
      }
    }
    
    const svg = 
      `data:image/svg+xml;charset=utf8,
      <svg height="100" width="100">
      <rect x="5" y="5" width="90" height="90" rx="15" stroke="none" stroke-width="0" fill="${color}" />
      <textArea x="6" y="10" width="88" height="90" alignment-baseline="middle" text-anchor="middle" font-size="${fontSize}px" font-weight="bold" fill="white"> ${cartText} </textArea>
      </svg>`;

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
    
    if (this.settings.number)
      this.connection.executeCommand("CARTWALL " + this.settings.number + " CLICK");
  }
  
}