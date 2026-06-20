function EventBus() {
  this.listeners = {};
}

EventBus.prototype.on = function(event, callback) {
  if (!this.listeners[event]) {
    this.listeners[event] = [];
  }
  this.listeners[event].push(callback);
};

EventBus.prototype.off = function(event, callback) {
  if (!this.listeners[event]) return;
  this.listeners[event] = this.listeners[event].filter(function(cb) {
    return cb !== callback;
  });
};

EventBus.prototype.emit = function(event, data) {
  if (!this.listeners[event]) return;
  // Slice to prevent issues if listeners change during iteration
  var callbacks = this.listeners[event].slice();
  for (var i = 0; i < callbacks.length; i++) {
    try {
      callbacks[i](data);
    } catch (e) {
      console.error('Error in EventBus listener for ' + event + ':', e);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventBus;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return EventBus; });
}
