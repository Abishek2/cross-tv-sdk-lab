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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdBreakManager;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return AdBreakManager; });
}
