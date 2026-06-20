function RemoteControl(eventBus) {
  this.eventBus = eventBus;
  var self = this;

  // TV Key Code constants
  this.KEYS = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ENTER: 13,
    BACK: 27, // Escape
    BACKSPACE: 8, // Backspace fallback
    RED: 403, // HbbTV Red
    GREEN: 404,
    YELLOW: 405,
    BLUE: 406,
    PLAY: 415,
    PAUSE: 19,
    STOP: 413,
    FAST_FORWARD: 417,
    REWIND: 412,
    
    // PC Keyboard Fallbacks
    PC_RED: 82, // 'R' key
    PC_GREEN: 71, // 'G' key
    PC_YELLOW: 89, // 'Y' key
    PC_BLUE: 66 // 'B' key
  };

  // Specific platform mappings (e.g. Samsung Tizen / LG webOS / HbbTV standard)
  this.PLATFORM_KEYS = {
    // Tizen / Samsung
    TIZEN: {
      BACK: 10009,
      PLAY: 415,
      PAUSE: 19,
      PLAY_PAUSE: 10252
    },
    // LG webOS
    WEBOS: {
      BACK: 461,
      PLAY: 415,
      PAUSE: 19
    },
    // Standard HbbTV
    HBBTV: {
      BACK: 461,
      RED: 403,
      GREEN: 404,
      YELLOW: 405,
      BLUE: 406
    }
  };

  this.listener = function(event) {
    self.handleKeyEvent(event);
  };
}

RemoteControl.prototype.initialize = function() {
  window.addEventListener('keydown', this.listener);
};

RemoteControl.prototype.destroy = function() {
  window.removeEventListener('keydown', this.listener);
};

RemoteControl.prototype.handleKeyEvent = function(event) {
  var keyCode = event.keyCode || event.which;
  var action = null;

  // Normalize key codes
  if (keyCode === this.KEYS.UP) {
    action = 'UP';
  } else if (keyCode === this.KEYS.DOWN) {
    action = 'DOWN';
  } else if (keyCode === this.KEYS.LEFT) {
    action = 'LEFT';
  } else if (keyCode === this.KEYS.RIGHT) {
    action = 'RIGHT';
  } else if (keyCode === this.KEYS.ENTER) {
    action = 'ENTER';
  } else if (keyCode === this.KEYS.BACK || keyCode === this.KEYS.BACKSPACE || keyCode === this.PLATFORM_KEYS.TIZEN.BACK || keyCode === this.PLATFORM_KEYS.WEBOS.BACK) {
    action = 'BACK';
    // Prevent default browser behavior (like navigating back in history)
    event.preventDefault();
  } else if (keyCode === this.KEYS.RED || keyCode === this.KEYS.PC_RED) {
    action = 'RED';
  } else if (keyCode === this.KEYS.GREEN || keyCode === this.KEYS.PC_GREEN) {
    action = 'GREEN';
  } else if (keyCode === this.KEYS.YELLOW || keyCode === this.KEYS.PC_YELLOW) {
    action = 'YELLOW';
  } else if (keyCode === this.KEYS.BLUE || keyCode === this.KEYS.PC_BLUE) {
    action = 'BLUE';
  } else if (keyCode === this.KEYS.PLAY || keyCode === this.PLATFORM_KEYS.TIZEN.PLAY) {
    action = 'PLAY';
  } else if (keyCode === this.KEYS.PAUSE || keyCode === this.PLATFORM_KEYS.TIZEN.PAUSE) {
    action = 'PAUSE';
  } else if (keyCode === this.KEYS.STOP) {
    action = 'STOP';
  } else if (keyCode === this.KEYS.FAST_FORWARD) {
    action = 'FAST_FORWARD';
  } else if (keyCode === this.KEYS.REWIND) {
    action = 'REWIND';
  }

  if (action) {
    this.eventBus.emit('keydown', { key: action, rawCode: keyCode, originalEvent: event });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RemoteControl;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return RemoteControl; });
}
