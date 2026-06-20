function TelemetryClient(options) {
  options = options || {};
  this.endpoint = options.endpoint || 'http://localhost:4000/telemetry/batch';
  this.batchSize = options.batchSize || 5;
  this.flushInterval = options.flushInterval || 10000; // 10 seconds
  this.sessionId = options.sessionId || 'sess_' + Math.random().toString(36).substr(2, 9);
  this.queue = [];
  this.isSending = false;
  this.timer = null;
  this.networkRetry = options.networkRetry || null; // Optional external retry utility
}

TelemetryClient.prototype.initialize = function() {
  var self = this;
  if (this.flushInterval > 0) {
    this.timer = setInterval(function() {
      self.flush();
    }, this.flushInterval);
  }
};

TelemetryClient.prototype.track = function(eventName, payload) {
  var event = {
    name: eventName,
    sessionId: this.sessionId,
    timestamp: new Date().toISOString(),
    payload: payload || {}
  };
  this.queue.push(event);

  if (this.queue.length >= this.batchSize) {
    this.flush();
  }
};

TelemetryClient.prototype.flush = function() {
  if (this.isSending || this.queue.length === 0) return;

  var batch = this.queue.splice(0, this.batchSize);
  this.isSending = true;
  this.sendBatch(batch, 1);
};

TelemetryClient.prototype.sendBatch = function(batch, attempt) {
  var self = this;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', this.endpoint, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        self.isSending = false;
        // Check if there are more events to flush
        if (self.queue.length > 0) {
          self.flush();
        }
      } else {
        // Handle error and retry
        self.handleFailure(batch, attempt);
      }
    }
  };

  xhr.onerror = function() {
    self.handleFailure(batch, attempt);
  };

  try {
    xhr.send(JSON.stringify({ sessionId: this.sessionId, events: batch }));
  } catch (e) {
    this.handleFailure(batch, attempt);
  }
};

TelemetryClient.prototype.handleFailure = function(batch, attempt) {
  var self = this;
  this.isSending = false;

  var maxAttempts = 3;
  if (attempt < maxAttempts) {
    var delay = 2000 * Math.pow(2, attempt); // Exponential backoff: 4s, 8s
    setTimeout(function() {
      self.isSending = true;
      self.sendBatch(batch, attempt + 1);
    }, delay);
  } else {
    // Put failed events back into the front of the queue to try later
    this.queue = batch.concat(this.queue);
    // Enforce a cap on queue size to avoid memory leaks
    if (this.queue.length > 100) {
      this.queue = this.queue.slice(0, 100);
    }
  }
};

TelemetryClient.prototype.destroy = function() {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelemetryClient;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return TelemetryClient; });
}
