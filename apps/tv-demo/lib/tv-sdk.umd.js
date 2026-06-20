(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.CrossTVSDK = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var EventBus$1 = {exports: {}};

	(function (module) {
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

		if (module.exports) {
		  module.exports = EventBus;
		} 
	} (EventBus$1));

	var EventBusExports = EventBus$1.exports;

	var RemoteControl$1 = {exports: {}};

	(function (module) {
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

		if (module.exports) {
		  module.exports = RemoteControl;
		} 
	} (RemoteControl$1));

	var RemoteControlExports = RemoteControl$1.exports;

	var FocusManager$1 = {exports: {}};

	(function (module) {
		function FocusManager(eventBus) {
		  this.eventBus = eventBus;
		  this.focusedElement = null;
		  this.selector = '[focusable], .focusable, [data-focusable="true"]';
		  var self = this;

		  if (this.eventBus) {
		    this.eventBus.on('keydown', function(data) {
		      if (data.key === 'UP' || data.key === 'DOWN' || data.key === 'LEFT' || data.key === 'RIGHT') {
		        self.move(data.key);
		      } else if (data.key === 'ENTER') {
		        self.triggerSelection();
		      }
		    });
		  }
		}

		FocusManager.prototype.initialize = function() {
		  this.scanAndFocusFirst();
		};

		FocusManager.prototype.scan = function() {
		  var elements = document.querySelectorAll(this.selector);
		  var list = [];
		  for (var i = 0; i < elements.length; i++) {
		    var el = elements[i];
		    // Only include visible elements
		    var rect = el.getBoundingClientRect();
		    if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none') {
		      list.push(el);
		    }
		  }
		  return list;
		};

		FocusManager.prototype.scanAndFocusFirst = function() {
		  var list = this.scan();
		  if (list.length > 0) {
		    // If there is already an element with the 'focused' class, use it
		    for (var i = 0; i < list.length; i++) {
		      if (list[i].classList.contains('focused')) {
		        this.focus(list[i]);
		        return;
		      }
		    }
		    this.focus(list[0]);
		  }
		};

		FocusManager.prototype.focus = function(element) {
		  if (this.focusedElement === element) return;

		  if (this.focusedElement) {
		    this.focusedElement.classList.remove('focused');
		    this.focusedElement.blur();
		    if (this.eventBus) {
		      this.eventBus.emit('focusLost', { element: this.focusedElement });
		    }
		  }

		  this.focusedElement = element;
		  if (element) {
		    element.classList.add('focused');
		    element.focus();
		    if (this.eventBus) {
		      this.eventBus.emit('focusGained', { element: element });
		    }
		  }
		};

		FocusManager.prototype.getActiveElement = function() {
		  return this.focusedElement;
		};

		FocusManager.prototype.triggerSelection = function() {
		  if (this.focusedElement) {
		    // Dispatch a click event to the focused element
		    var clickEvent = new MouseEvent('click', {
		      bubbles: true,
		      cancelable: true,
		      view: window
		    });
		    this.focusedElement.dispatchEvent(clickEvent);
		    if (this.eventBus) {
		      this.eventBus.emit('select', { element: this.focusedElement });
		    }
		  }
		};

		FocusManager.prototype.move = function(direction) {
		  if (!this.focusedElement) {
		    this.scanAndFocusFirst();
		    return;
		  }

		  var candidates = this.scan();
		  var currentRect = this.focusedElement.getBoundingClientRect();
		  var currentCenter = {
		    x: currentRect.left + currentRect.width / 2,
		    y: currentRect.top + currentRect.height / 2
		  };

		  var bestCandidate = null;
		  var bestDistance = Infinity;

		  for (var i = 0; i < candidates.length; i++) {
		    var candidate = candidates[i];
		    if (candidate === this.focusedElement) continue;

		    var candidateRect = candidate.getBoundingClientRect();
		    var candidateCenter = {
		      x: candidateRect.left + candidateRect.width / 2,
		      y: candidateRect.top + candidateRect.height / 2
		    };

		    var dx = candidateCenter.x - currentCenter.x;
		    var dy = candidateCenter.y - currentCenter.y;

		    // Check if the candidate is in the correct spatial direction
		    var isValidDirection = false;
		    var distance = Infinity;

		    if (direction === 'UP') {
		      if (candidateCenter.y < currentCenter.y) {
		        isValidDirection = true;
		        // Primary movement is Y; penalize X deviation
		        distance = Math.abs(dy) + Math.abs(dx) * 2.5;
		      }
		    } else if (direction === 'DOWN') {
		      if (candidateCenter.y > currentCenter.y) {
		        isValidDirection = true;
		        distance = Math.abs(dy) + Math.abs(dx) * 2.5;
		      }
		    } else if (direction === 'LEFT') {
		      if (candidateCenter.x < currentCenter.x) {
		        isValidDirection = true;
		        // Primary movement is X; penalize Y deviation
		        distance = Math.abs(dx) + Math.abs(dy) * 2.5;
		      }
		    } else if (direction === 'RIGHT') {
		      if (candidateCenter.x > currentCenter.x) {
		        isValidDirection = true;
		        distance = Math.abs(dx) + Math.abs(dy) * 2.5;
		      }
		    }

		    if (isValidDirection && distance < bestDistance) {
		      bestDistance = distance;
		      bestCandidate = candidate;
		    }
		  }

		  if (bestCandidate) {
		    this.focus(bestCandidate);
		  }
		};

		if (module.exports) {
		  module.exports = FocusManager;
		} 
	} (FocusManager$1));

	var FocusManagerExports = FocusManager$1.exports;

	var VideoAdapter$1 = {exports: {}};

	(function (module) {
		function VideoAdapter(eventBus, videoElement) {
		  this.eventBus = eventBus;
		  this.video = videoElement || document.createElement('video');
		  this.listeners = {};
		  this.setupListeners();
		}

		VideoAdapter.prototype.setupListeners = function() {
		  var self = this;

		  var eventsMap = {
		    play: 'videoPlay',
		    pause: 'videoPause',
		    timeupdate: 'videoTimeUpdate',
		    ended: 'videoEnded',
		    error: 'videoError',
		    durationchange: 'videoDurationChange',
		    waiting: 'videoWaiting',
		    playing: 'videoPlaying',
		    loadedmetadata: 'videoLoaded'
		  };

		  Object.keys(eventsMap).forEach(function(nativeEvent) {
		    var sdkEvent = eventsMap[nativeEvent];
		    var handler = function(e) {
		      if (self.eventBus) {
		        var data = {
		          currentTime: self.video.currentTime,
		          duration: self.video.duration
		        };
		        if (nativeEvent === 'error') {
		          data.error = self.video.error;
		        }
		        self.eventBus.emit(sdkEvent, data);
		      }
		    };
		    self.listeners[nativeEvent] = handler;
		    self.video.addEventListener(nativeEvent, handler);
		  });
		};

		VideoAdapter.prototype.load = function(url) {
		  this.video.src = url;
		  this.video.load();
		};

		VideoAdapter.prototype.play = function() {
		  var self = this;
		  var promise = this.video.play();
		  if (promise && promise.catch) {
		    promise.catch(function(e) {
		      if (self.eventBus) {
		        self.eventBus.emit('videoError', { error: e });
		      }
		    });
		  }
		};

		VideoAdapter.prototype.pause = function() {
		  this.video.pause();
		};

		VideoAdapter.prototype.seek = function(seconds) {
		  var targetTime = Math.max(0, Math.min(seconds, this.video.duration || Infinity));
		  this.video.currentTime = targetTime;
		};

		VideoAdapter.prototype.getCurrentTime = function() {
		  return this.video.currentTime;
		};

		VideoAdapter.prototype.getDuration = function() {
		  return this.video.duration || 0;
		};

		VideoAdapter.prototype.setMute = function(isMuted) {
		  this.video.muted = isMuted;
		};

		VideoAdapter.prototype.setVolume = function(volume) {
		  this.video.volume = Math.max(0, Math.min(volume, 1));
		};

		VideoAdapter.prototype.destroy = function() {
		  var self = this;
		  Object.keys(this.listeners).forEach(function(nativeEvent) {
		    self.video.removeEventListener(nativeEvent, self.listeners[nativeEvent]);
		  });
		  this.listeners = {};
		  this.video.src = '';
		};

		if (module.exports) {
		  module.exports = VideoAdapter;
		} 
	} (VideoAdapter$1));

	var VideoAdapterExports = VideoAdapter$1.exports;

	var AdBreakManager$1 = {exports: {}};

	(function (module) {
		function AdBreakManager(eventBus, videoAdapter) {
		  this.eventBus = eventBus;
		  this.videoAdapter = videoAdapter;
		  this.adBreaks = [];
		  this.inAdBreak = false;
		  this.currentAdBreak = null;
		  this.adPlaybackTime = 0;
		  this.adTimer = null;
		  this.contentResumeTime = 0;
		  this.contentSrc = '';

		  var self = this;
		  if (this.eventBus) {
		    this.eventBus.on('videoTimeUpdate', function(data) {
		      self.checkAdBreaks(data.currentTime);
		    });
		  }
		}

		AdBreakManager.prototype.setAdBreaks = function(breaks) {
		  this.adBreaks = breaks.map(function(b) {
		    return {
		      id: b.id,
		      time: b.time, // in seconds
		      duration: b.duration || 15, // in seconds
		      url: b.url || '',
		      played: false
		    };
		  });
		};

		AdBreakManager.prototype.checkAdBreaks = function(currentTime) {
		  if (this.inAdBreak) return;

		  for (var i = 0; i < this.adBreaks.length; i++) {
		    var ad = this.adBreaks[i];
		    // Check if the current time has passed the ad break threshold and it hasn't been played
		    if (!ad.played && currentTime >= ad.time && currentTime <= ad.time + 1.5) {
		      this.triggerAdBreak(ad);
		      break;
		    }
		  }
		};

		AdBreakManager.prototype.triggerAdBreak = function(ad) {
		  var self = this;
		  this.inAdBreak = true;
		  this.currentAdBreak = ad;
		  ad.played = true;

		  if (this.eventBus) {
		    this.eventBus.emit('adBreakStart', { adBreak: ad });
		  }

		  // Store original video state
		  this.contentResumeTime = this.videoAdapter.getCurrentTime();
		  this.contentSrc = this.videoAdapter.video.src;

		  this.videoAdapter.pause();

		  if (ad.url) {
		    // Play the ad URL in the main video adapter
		    this.videoAdapter.load(ad.url);
		    this.videoAdapter.play();

		    // Listen for the ad to finish
		    var onAdEnded = function() {
		      self.eventBus.off('videoEnded', onAdEnded);
		      self.endAdBreak();
		    };
		    var onAdError = function() {
		      self.eventBus.off('videoError', onAdError);
		      self.eventBus.off('videoEnded', onAdEnded);
		      self.endAdBreak();
		    };

		    this.eventBus.on('videoEnded', onAdEnded);
		    this.eventBus.on('videoError', onAdError);
		  } else {
		    // Fallback: timer-based ad simulation
		    this.adPlaybackTime = 0;
		    this.adTimer = setInterval(function() {
		      self.adPlaybackTime += 1;
		      if (self.eventBus) {
		        self.eventBus.emit('adProgress', {
		          time: self.adPlaybackTime,
		          duration: ad.duration
		        });
		      }
		      if (self.adPlaybackTime >= ad.duration) {
		        self.endAdBreak();
		      }
		    }, 1000);
		  }
		};

		AdBreakManager.prototype.endAdBreak = function() {
		  if (this.adTimer) {
		    clearInterval(this.adTimer);
		    this.adTimer = null;
		  }

		  this.inAdBreak = false;
		  var completedAd = this.currentAdBreak;
		  this.currentAdBreak = null;

		  if (completedAd && completedAd.url) {
		    // Restore the main video source and seek back to the saved time
		    this.videoAdapter.load(this.contentSrc);
		    this.videoAdapter.seek(this.contentResumeTime);
		    this.videoAdapter.play();
		  } else {
		    // Just resume play
		    this.videoAdapter.play();
		  }

		  if (this.eventBus) {
		    this.eventBus.emit('adBreakEnd', { adBreak: completedAd });
		  }
		};

		AdBreakManager.prototype.reset = function() {
		  if (this.adTimer) {
		    clearInterval(this.adTimer);
		    this.adTimer = null;
		  }
		  this.inAdBreak = false;
		  this.currentAdBreak = null;
		  for (var i = 0; i < this.adBreaks.length; i++) {
		    this.adBreaks[i].played = false;
		  }
		};

		if (module.exports) {
		  module.exports = AdBreakManager;
		} 
	} (AdBreakManager$1));

	var AdBreakManagerExports = AdBreakManager$1.exports;

	var TelemetryClient$1 = {exports: {}};

	(function (module) {
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

		if (module.exports) {
		  module.exports = TelemetryClient;
		} 
	} (TelemetryClient$1));

	var TelemetryClientExports = TelemetryClient$1.exports;

	var ErrorReporter$1 = {exports: {}};

	(function (module) {
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
		      if (xhr.status >= 200 && xhr.status < 300) ; else {
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

		if (module.exports) {
		  module.exports = ErrorReporter;
		} 
	} (ErrorReporter$1));

	var ErrorReporterExports = ErrorReporter$1.exports;

	var DeviceProfile$1 = {exports: {}};

	(function (module) {
		function DeviceProfile() {
		  this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
		  this.platform = 'PC';
		  this.version = 'unknown';
		  this.model = 'unknown';
		  this.vendor = 'unknown';
		  this.resolution = typeof window !== 'undefined' ? (window.screen.width + 'x' + window.screen.height) : '1920x1080';
		  this.features = {
		    drm: false,
		    hbbtv: false,
		    tizen: false,
		    webos: false
		  };

		  this.detect();
		}

		DeviceProfile.prototype.detect = function() {
		  var ua = this.userAgent;

		  // 1. Detect LG webOS
		  if (/webOS/i.test(ua) || /web0S/i.test(ua)) {
		    this.platform = 'WebOS';
		    this.vendor = 'LG';
		    this.features.webos = true;
		    var webosVer = ua.match(/Web0S; Linux\/SmartTV/i) || ua.match(/webOS\.TV-(\d+\.\d+)/i) || ua.match(/webOS\/(\d+\.\d+)/i);
		    if (webosVer && webosVer[1]) {
		      this.version = webosVer[1];
		    }
		    var modelMatch = ua.match(/LG Browser\/[^;]+; ([^;]+);/);
		    if (modelMatch) {
		      this.model = modelMatch[1];
		    }
		  }
		  // 2. Detect Samsung Tizen
		  else if (/Tizen/i.test(ua)) {
		    this.platform = 'Tizen';
		    this.vendor = 'Samsung';
		    this.features.tizen = true;
		    var tizenVer = ua.match(/Tizen\s*(\d+\.\d+)/i);
		    if (tizenVer && tizenVer[1]) {
		      this.version = tizenVer[1];
		    }
		    // E.g., User agent might have "SAMSUNG SM-T530" or "Tizen 5.5; SmartTV"
		    var tvModel = ua.match(/HDMI\/[^;]+; ([^;]+);/) || ua.match(/TV-[\d\w]+/);
		    if (tvModel) {
		      this.model = tvModel[1] || tvModel[0];
		    }
		  }
		  // 3. Detect HbbTV
		  else if (/HbbTV/i.test(ua) || (typeof window !== 'undefined' && (window.oipfObjectFactory || window.applicationManager))) {
		    this.platform = 'HbbTV';
		    this.features.hbbtv = true;
		    var hbbtvVer = ua.match(/HbbTV\/(\d+\.\d+\.\d+)/i) || ua.match(/HbbTV\/(\d+\.\d+)/i);
		    if (hbbtvVer && hbbtvVer[1]) {
		      this.version = hbbtvVer[1];
		    }
		  }
		  // 4. Detect Android TV / Google TV
		  else if (/Android/i.test(ua) && (/GoogleTV/i.test(ua) || /ATV/i.test(ua) || /SmartTV/i.test(ua) || /AFTB/i.test(ua) || /AFTN/i.test(ua))) {
		    this.platform = 'AndroidTV';
		    this.vendor = 'Google';
		    if (/AFT/i.test(ua)) {
		      this.vendor = 'Amazon';
		      this.model = 'FireTV';
		    }
		    var androidVer = ua.match(/Android\s*([^;]+)/i);
		    if (androidVer) {
		      this.version = androidVer[1];
		    }
		  }
		  // 5. Detect Chromecast
		  else if (/CrKey/i.test(ua)) {
		    this.platform = 'Chromecast';
		    this.vendor = 'Google';
		  }

		  // Detect DRM compatibility capabilities
		  if (typeof window !== 'undefined') {
		    this.features.drm = !!(
		      window.MediaKeys ||
		      window.WebKitMediaKeys ||
		      window.MSMediaKeys
		    );
		  }
		};

		DeviceProfile.prototype.toJSON = function() {
		  return {
		    platform: this.platform,
		    version: this.version,
		    model: this.model,
		    vendor: this.vendor,
		    resolution: this.resolution,
		    features: this.features
		  };
		};

		if (module.exports) {
		  module.exports = DeviceProfile;
		} 
	} (DeviceProfile$1));

	var DeviceProfileExports = DeviceProfile$1.exports;

	var NetworkRetry$1 = {exports: {}};

	(function (module) {
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

		if (module.exports) {
		  module.exports = NetworkRetry;
		} 
	} (NetworkRetry$1));

	var NetworkRetryExports = NetworkRetry$1.exports;

	var createTVSDK$1 = {exports: {}};

	(function (module) {
		var EventBus = EventBusExports;
		var RemoteControl = RemoteControlExports;
		var FocusManager = FocusManagerExports;
		var VideoAdapter = VideoAdapterExports;
		var AdBreakManager = AdBreakManagerExports;
		var TelemetryClient = TelemetryClientExports;
		var ErrorReporter = ErrorReporterExports;
		var DeviceProfile = DeviceProfileExports;
		var NetworkRetry = NetworkRetryExports;

		function createTVSDK(config) {
		  config = config || {};

		  var eventBus = new EventBus();
		  var deviceProfile = new DeviceProfile();
		  var remoteControl = new RemoteControl(eventBus);
		  var focusManager = new FocusManager(eventBus);
		  var videoAdapter = new VideoAdapter(eventBus, config.videoElement);
		  
		  var adBreakManager = new AdBreakManager(eventBus, videoAdapter);
		  if (config.adBreaks) {
		    adBreakManager.setAdBreaks(config.adBreaks);
		  }

		  var telemetryClient = new TelemetryClient({
		    endpoint: config.telemetryEndpoint,
		    batchSize: config.telemetryBatchSize,
		    flushInterval: config.telemetryFlushInterval,
		    sessionId: config.sessionId
		  });

		  var errorReporter = new ErrorReporter({
		    endpoint: config.errorEndpoint,
		    sessionId: telemetryClient.sessionId
		  });

		  var networkRetry = new NetworkRetry(config.retryOptions);

		  // Auto-initialize components if requested (default to true in browser environment)
		  var shouldAutoInit = config.autoInitialize !== false;
		  if (shouldAutoInit && typeof window !== 'undefined') {
		    remoteControl.initialize();
		    focusManager.initialize();
		    telemetryClient.initialize();
		    errorReporter.initialize();
		  }

		  return {
		    eventBus: eventBus,
		    remoteControl: remoteControl,
		    focusManager: focusManager,
		    videoAdapter: videoAdapter,
		    adBreakManager: adBreakManager,
		    telemetryClient: telemetryClient,
		    errorReporter: errorReporter,
		    deviceProfile: deviceProfile,
		    networkRetry: networkRetry,
		    destroy: function() {
		      remoteControl.destroy();
		      videoAdapter.destroy();
		      adBreakManager.reset();
		      telemetryClient.destroy();
		      errorReporter.destroy();
		    }
		  };
		}

		if (module.exports) {
		  module.exports = createTVSDK;
		} 
	} (createTVSDK$1));

	var createTVSDKExports = createTVSDK$1.exports;

	var EventBus = EventBusExports;
	var RemoteControl = RemoteControlExports;
	var FocusManager = FocusManagerExports;
	var VideoAdapter = VideoAdapterExports;
	var AdBreakManager = AdBreakManagerExports;
	var TelemetryClient = TelemetryClientExports;
	var ErrorReporter = ErrorReporterExports;
	var DeviceProfile = DeviceProfileExports;
	var NetworkRetry = NetworkRetryExports;
	var createTVSDK = createTVSDKExports;

	var src = {
	  EventBus: EventBus,
	  RemoteControl: RemoteControl,
	  FocusManager: FocusManager,
	  VideoAdapter: VideoAdapter,
	  AdBreakManager: AdBreakManager,
	  TelemetryClient: TelemetryClient,
	  ErrorReporter: ErrorReporter,
	  DeviceProfile: DeviceProfile,
	  NetworkRetry: NetworkRetry,
	  createTVSDK: createTVSDK
	};

	var index = /*@__PURE__*/getDefaultExportFromCjs(src);

	return index;

}));
//# sourceMappingURL=tv-sdk.umd.js.map
