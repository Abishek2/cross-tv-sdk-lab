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
    playing: 'videoPlaying'
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoAdapter;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return VideoAdapter; });
}
