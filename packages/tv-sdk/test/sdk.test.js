var assert = require('assert');

// Setup mock DOM globals for running in Node.js environment
var windowListeners = {};
var xhrRequests = [];

global.window = {
  addEventListener: function(event, cb) {
    windowListeners[event] = cb;
  },
  removeEventListener: function(event, cb) {
    if (windowListeners[event] === cb) {
      delete windowListeners[event];
    }
  },
  screen: { width: 1920, height: 1080 },
  getComputedStyle: function() {
    return { display: 'block' };
  }
};

global.document = {
  querySelectorAll: function() {
    return [];
  },
  createElement: function(tag) {
    if (tag === 'video') {
      var videoListeners = {};
      return {
        addEventListener: function(event, cb) {
          videoListeners[event] = cb;
        },
        removeEventListener: function(event, cb) {
          delete videoListeners[event];
        },
        play: function() {
          if (videoListeners.play) videoListeners.play();
          return { catch: function() {} };
        },
        pause: function() {
          if (videoListeners.pause) videoListeners.pause();
        },
        load: function() {},
        src: '',
        currentTime: 0,
        duration: 100,
        _triggerEvent: function(event, data) {
          if (videoListeners[event]) videoListeners[event](data);
        }
      };
    }
    return {};
  }
};

try {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (SmartTV; SAMSUNG SmartTV; Tizen 5.0) AppleWebKit/537.36 Chrome/47.0.2526.110 Safari/537.36'
    },
    writable: true,
    configurable: true
  });
} catch (e) {
  global.navigator = {
    userAgent: 'Mozilla/5.0 (SmartTV; SAMSUNG SmartTV; Tizen 5.0) AppleWebKit/537.36 Chrome/47.0.2526.110 Safari/537.36'
  };
}

global.MouseEvent = function(name) {
  this.name = name;
};

global.XMLHttpRequest = function() {
  var req = {
    open: function(method, url) {
      this.method = method;
      this.url = url;
      this.headers = {};
    },
    setRequestHeader: function(key, val) {
      this.headers[key] = val;
    },
    send: function(body) {
      this.body = body;
      xhrRequests.push(this);
      
      // Simulate successful request
      var self = this;
      setTimeout(function() {
        self.readyState = 4;
        self.status = 200;
        if (self.onreadystatechange) {
          self.onreadystatechange();
        }
      }, 5);
    }
  };
  return req;
};

// Now import our modules
var EventBus = require('../src/EventBus');
var RemoteControl = require('../src/RemoteControl');
var FocusManager = require('../src/FocusManager');
var VideoAdapter = require('../src/VideoAdapter');
var AdBreakManager = require('../src/AdBreakManager');
var TelemetryClient = require('../src/TelemetryClient');
var DeviceProfile = require('../src/DeviceProfile');
var NetworkRetry = require('../src/NetworkRetry');
var createTVSDK = require('../src/createTVSDK');

describe('TV SDK Test Suite', function() {
  
  describe('EventBus', function() {
    it('should subscribe and publish events', function() {
      var bus = new EventBus();
      var received = null;
      
      bus.on('test-event', function(data) {
        received = data;
      });
      
      bus.emit('test-event', { value: 42 });
      assert.deepEqual(received, { value: 42 });
    });

    it('should unsubscribe from events', function() {
      var bus = new EventBus();
      var count = 0;
      var handler = function() { count++; };
      
      bus.on('test-event', handler);
      bus.emit('test-event');
      bus.off('test-event', handler);
      bus.emit('test-event');
      
      assert.equal(count, 1);
    });
  });

  describe('RemoteControl', function() {
    it('should map keyboard events and trigger EventBus keydown', function() {
      var bus = new EventBus();
      var remote = new RemoteControl(bus);
      var result = null;
      
      bus.on('keydown', function(data) {
        result = data;
      });
      
      remote.initialize();
      
      // Simulate standard arrow down key
      windowListeners['keydown']({ keyCode: 40, preventDefault: function() {} });
      assert.equal(result.key, 'DOWN');
      
      // Simulate fallback Red button key (R)
      windowListeners['keydown']({ keyCode: 82, preventDefault: function() {} });
      assert.equal(result.key, 'RED');

      remote.destroy();
    });
  });

  describe('FocusManager', function() {
    it('should scan and focus first element', function() {
      var bus = new EventBus();
      var focusManager = new FocusManager(bus);
      
      var mockEl = {
        className: '',
        classList: {
          contains: function() { return false; },
          add: function(name) { mockEl.className = name; },
          remove: function() { mockEl.className = ''; }
        },
        focus: function() {},
        blur: function() {},
        getBoundingClientRect: function() {
          return { left: 10, top: 10, width: 100, height: 50 };
        }
      };
      
      // Stub scan
      focusManager.scan = function() {
        return [mockEl];
      };
      
      focusManager.initialize();
      assert.equal(focusManager.getActiveElement(), mockEl);
      assert.equal(mockEl.className, 'focused');
    });
  });

  describe('VideoAdapter', function() {
    it('should load source and map video element events', function() {
      var bus = new EventBus();
      var mockVideo = document.createElement('video');
      var adapter = new VideoAdapter(bus, mockVideo);
      
      var playEventTriggered = false;
      bus.on('videoPlay', function() {
        playEventTriggered = true;
      });
      
      adapter.load('http://test.mp4');
      assert.equal(mockVideo.src, 'http://test.mp4');
      
      adapter.play();
      // Simulate play event firing from video element
      mockVideo._triggerEvent('play');
      assert.equal(playEventTriggered, true);
    });
  });

  describe('AdBreakManager', function() {
    it('should trigger ad breaks on scheduled timestamps', function() {
      var bus = new EventBus();
      var mockVideo = document.createElement('video');
      var adapter = new VideoAdapter(bus, mockVideo);
      var adManager = new AdBreakManager(bus, adapter);
      
      adManager.setAdBreaks([
        { id: 'ad-1', time: 5, duration: 10 }
      ]);
      
      var adStartCalled = false;
      bus.on('adBreakStart', function(data) {
        adStartCalled = true;
        assert.equal(data.adBreak.id, 'ad-1');
      });
      
      // Mock main time update event passing the 5 seconds threshold
      bus.emit('videoTimeUpdate', { currentTime: 5.0, duration: 100 });
      assert.equal(adStartCalled, true);
      assert.equal(adManager.inAdBreak, true);
    });
  });

  describe('TelemetryClient', function() {
    it('should queue and batch telemetry events', function(done) {
      xhrRequests = [];
      var client = new TelemetryClient({
        endpoint: 'http://localhost:4000/telemetry',
        batchSize: 2,
        flushInterval: 0
      });
      
      client.track('test_event_1');
      assert.equal(client.queue.length, 1);
      
      // Trigger second event to reach batchSize 2 and force immediate flush
      client.track('test_event_2');
      assert.equal(client.queue.length, 0);
      
      setTimeout(function() {
        assert.equal(xhrRequests.length, 1);
        var payload = JSON.parse(xhrRequests[0].body);
        assert.equal(payload.events[0].name, 'test_event_1');
        assert.equal(payload.events[1].name, 'test_event_2');
        done();
      }, 10);
    });
  });

  describe('DeviceProfile', function() {
    it('should parse Tizen smart TV user agent', function() {
      var dp = new DeviceProfile();
      assert.equal(dp.platform, 'Tizen');
      assert.equal(dp.vendor, 'Samsung');
      assert.equal(dp.features.tizen, true);
    });
  });

  describe('NetworkRetry', function() {
    it('should execute backoff and succeed eventually', function(done) {
      var retry = new NetworkRetry({ maxRetries: 3, initialDelay: 5, jitter: false });
      var attempts = 0;
      
      retry.execute(function(callback) {
        attempts++;
        if (attempts < 2) {
          callback(new Error('Fail first time'));
        } else {
          callback(null, 'Success');
        }
      }, function(err, result) {
        assert.equal(err, null);
        assert.equal(result, 'Success');
        assert.equal(attempts, 2);
        done();
      });
    });
  });

  describe('createTVSDK', function() {
    it('should instantiate and return integrated SDK object', function() {
      var instance = createTVSDK({ autoInitialize: false });
      assert.ok(instance.eventBus);
      assert.ok(instance.remoteControl);
      assert.ok(instance.focusManager);
      assert.ok(instance.videoAdapter);
      assert.ok(instance.adBreakManager);
      assert.ok(instance.telemetryClient);
      assert.ok(instance.errorReporter);
      assert.ok(instance.deviceProfile);
      assert.ok(instance.networkRetry);
    });
  });

});
