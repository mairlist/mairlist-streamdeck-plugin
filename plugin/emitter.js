// Base class for all actions
class Emitter {

  constructor() {
    this.listeners = {};
  }

  addEventListener(method, callback) {
    this.listeners[method] = callback;
  }
  
  emit(method, payload = null) {
    const callback = this.listeners[method];
    if (typeof callback === "function") {
      callback(payload);
    }
  }
}