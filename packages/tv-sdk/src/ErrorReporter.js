function ErrorReporter(options) {
  options = options || {};
  this.endpoint = options.endpoint || 'http://localhost:4000/errors';
  this.sessionId = options.sessionId || 'sess_unknown';
  this.listeners = {};
}

ErrorReporter.prototype.initialize = function() {
  var self = this;

  // Window error handler
  this.listeners.onerror = function(message, source, lineno, colno, error) {
    self.reportError({
      message: message,
      source: source || 'unknown',
      lineno: lineno || 0,
      colno: colno || 0,
      stack: error ? error.stack : ''
    }, 'uncaughtException');
  };

  // Promise rejection handler
  this.listeners.onunhandledrejection = function(event) {
    var reason = event.reason || {};
    self.reportError({
      message: reason.message || 'Unhandled promise rejection',
      source: 'promise',
      stack: reason.stack || ''
    }, 'unhandledRejection');
  };

  window.addEventListener('error', this.listeners.onerror);
  window.addEventListener('unhandledrejection', this.listeners.onunhandledrejection);
};

ErrorReporter.prototype.reportError = function(errorDetails, type) {
  var payload = {
    sessionId: this.sessionId,
    type: type || 'custom',
    timestamp: new Date().toISOString(),
    error: errorDetails
  };

  this.sendError(payload);
};

ErrorReporter.prototype.sendError = function(payload) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', this.endpoint, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Successfully reported
      } else {
        console.error('ErrorReporter failed to submit error log to endpoint');
      }
    }
  };

  try {
    xhr.send(JSON.stringify(payload));
  } catch (e) {
    console.error('ErrorReporter send failure: ', e);
  }
};

ErrorReporter.prototype.destroy = function() {
  if (this.listeners.onerror) {
    window.removeEventListener('error', this.listeners.onerror);
  }
  if (this.listeners.onunhandledrejection) {
    window.removeEventListener('unhandledrejection', this.listeners.onunhandledrejection);
  }
  this.listeners = {};
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorReporter;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return ErrorReporter; });
}
