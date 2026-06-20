function NetworkRetry(options) {
  options = options || {};
  this.maxRetries = options.maxRetries || 3;
  this.initialDelay = options.initialDelay || 1000; // in milliseconds
  this.backoffFactor = options.backoffFactor || 2;
  this.jitter = options.jitter !== undefined ? options.jitter : true;
}

/**
 * Execute an operation that uses a callback (err, result).
 */
NetworkRetry.prototype.execute = function(operation, callback) {
  var self = this;
  var attempt = 0;

  function run() {
    attempt++;
    operation(function(err, result) {
      if (!err) {
        if (callback) callback(null, result);
        return;
      }

      if (attempt >= self.maxRetries) {
        if (callback) {
          callback(new Error('Operation failed after ' + self.maxRetries + ' attempts. Last error: ' + (err.message || err)));
        }
        return;
      }

      var delay = self.initialDelay * Math.pow(self.backoffFactor, attempt - 1);
      if (self.jitter) {
        // Apply randomized jitter (e.g. ±20% of current delay)
        var jitterAmount = (Math.random() * 0.4 - 0.2) * delay;
        delay = Math.max(0, delay + jitterAmount);
      }

      setTimeout(run, delay);
    });
  }

  if (typeof Promise !== 'undefined' && !callback) {
    return new Promise(function(resolve, reject) {
      callback = function(err, result) {
        if (err) reject(err);
        else resolve(result);
      };
      run();
    });
  } else {
    run();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkRetry;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return NetworkRetry; });
}
