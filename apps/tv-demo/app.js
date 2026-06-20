(function() {
  // Configs
  var BACKEND_URL = 'http://localhost:4000';
  var sdk = null;
  var currentActiveScreenId = 'screen-dashboard';
  var previousFocusedElement = null;

  // DOM Helpers
  function $(id) { return document.getElementById(id); }
  function logToConsole(message, type) {
    var consoleEl = $('logConsole');
    if (!consoleEl) return;
    
    var line = document.createElement('div');
    line.className = 'console-line ' + (type || 'system-line') + '-line';
    
    var timestamp = new Date().toLocaleTimeString();
    line.innerText = '[' + timestamp + '] ' + message;
    
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  // 1. Fetch backend config and load
  function initApp() {
    logToConsole('[SYSTEM] Initializing TV Application...', 'system');

    // Detect capabilities via DeviceProfile immediately
    var mockUA = navigator.userAgent;
    var profile = new CrossTVSDK.DeviceProfile();
    logToConsole('[SYSTEM] Detected platform: ' + profile.platform + ' (' + profile.vendor + ')', 'system');

    // Update Quick Device Badge in UI
    var badge = $('quick-device-badge');
    if (badge) {
      badge.innerText = 'Platform: ' + profile.platform + ' | Res: ' + profile.resolution;
    }

    // Attempt to connect to the backend config endpoint
    var configUrl = BACKEND_URL + '/config/' + profile.platform;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', configUrl, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var config = JSON.parse(xhr.responseText);
            logToConsole('[SYSTEM] Loaded remote configuration successfully.', 'system');
            updateBackendStatus(true);
            setupSDK(config);
          } catch(e) {
            logToConsole('[ERROR] Failed to parse remote config. Starting in offline fallback.', 'error');
            updateBackendStatus(false);
            setupSDK(null);
          }
        } else {
          logToConsole('[WARN] Backend config endpoint unavailable. Starting in offline fallback.', 'system');
          updateBackendStatus(false);
          setupSDK(null);
        }
      }
    };
    xhr.onerror = function() {
      logToConsole('[WARN] Connection error to backend. Starting in offline fallback.', 'system');
      updateBackendStatus(false);
      setupSDK(null);
    };
    xhr.send();
  }

  function updateBackendStatus(online) {
    var dot = $('apiStatusDot');
    var txt = $('apiStatusText');
    var diagHealth = $('diagHealthStatus');

    if (online) {
      if (dot) dot.className = 'status-indicator online';
      if (txt) txt.innerText = 'API ONLINE';
      if (diagHealth) {
        diagHealth.innerText = 'ONLINE';
        diagHealth.className = 'stat-value accent-green';
      }
    } else {
      if (dot) dot.className = 'status-indicator offline';
      if (txt) txt.innerText = 'OFFLINE MODE';
      if (diagHealth) {
        diagHealth.innerText = 'OFFLINE';
        diagHealth.className = 'stat-value error-line'; // uses the red color style class
      }
    }
  }

  // 2. Setup TV SDK
  function setupSDK(config) {
    var finalConfig = {
      videoElement: $('tvPlayer'),
      autoInitialize: false // We will manually handle init
    };

    if (config) {
      finalConfig.telemetryEndpoint = config.telemetryEndpoint;
      finalConfig.errorEndpoint = config.errorEndpoint;
      finalConfig.telemetryBatchSize = config.telemetryBatchSize;
      finalConfig.telemetryFlushInterval = config.telemetryFlushInterval;
      finalConfig.adBreaks = config.adBreaks;
      finalConfig.retryOptions = config.retryOptions;
    } else {
      // Fallback local defaults
      finalConfig.telemetryEndpoint = BACKEND_URL + '/telemetry/batch';
      finalConfig.errorEndpoint = BACKEND_URL + '/errors';
      finalConfig.telemetryBatchSize = 3;
      finalConfig.telemetryFlushInterval = 5000;
      finalConfig.adBreaks = [
        { id: 'pre-roll-local', time: 0, duration: 5 },
        { id: 'mid-roll-local', time: 15, duration: 8 }
      ];
    }

    // Instantiate TV SDK using the UMD factory
    sdk = CrossTVSDK.createTVSDK(finalConfig);
    
    // Register the session with the backend API
    registerSession(sdk.telemetryClient.sessionId, sdk.deviceProfile.toJSON());

    // Update Diagnostics Dashboard UI
    $('diagSessionId').innerText = sdk.telemetryClient.sessionId;

    // Listen to SDK events
    bindSDKEvents();

    // Now start SDK components
    sdk.remoteControl.initialize();
    sdk.focusManager.initialize();
    sdk.telemetryClient.initialize();
    sdk.errorReporter.initialize();

    populateProfileUI();
    setupNavigationHandlers();
    
    sdk.telemetryClient.track('app_initialized', { device: sdk.deviceProfile.platform });
    logToConsole('[SDK] Telemetry Client initialized. Session: ' + sdk.telemetryClient.sessionId, 'event');
  }

  function registerSession(sessionId, profileData) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', BACKEND_URL + '/sessions', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        logToConsole('[SYSTEM] Registered session ' + sessionId + ' on API backend.', 'system');
      }
    };
    xhr.send(JSON.stringify({ sessionId: sessionId, deviceProfile: profileData }));
  }

  // 3. Bind SDK Event listeners
  function bindSDKEvents() {
    // Spatial Focus Events
    sdk.eventBus.on('focusGained', function(data) {
      if (data.element) {
        logToConsole('[FOCUS] Focused: ' + (data.element.id || data.element.tagName), 'system');
      }
    });

    // Remote Control key presses
    sdk.eventBus.on('keydown', function(data) {
      logToConsole('[REMOTE] Key Pressed: ' + data.key + ' (Code: ' + data.rawCode + ')', 'system');
      
      // HbbTV red-button mapping (PC keyboard 'R' or native Red Button)
      if (data.key === 'RED') {
        toggleHbbTVOverlay();
      }

      // Back navigation mapping
      if (data.key === 'BACK') {
        handleBackNavigation();
      }
    });

    // Video Playback Events
    sdk.eventBus.on('videoPlay', function() {
      logToConsole('[PLAYER] Playback started', 'event');
      sdk.telemetryClient.track('video_play', { time: sdk.videoAdapter.getCurrentTime() });
    });

    sdk.eventBus.on('videoPause', function() {
      logToConsole('[PLAYER] Playback paused', 'event');
      sdk.telemetryClient.track('video_pause', { time: sdk.videoAdapter.getCurrentTime() });
    });

    sdk.eventBus.on('videoTimeUpdate', function(data) {
      updatePlayerProgress(data.currentTime, data.duration);
      // Track milestones: 25%, 50%, 75%
      trackMilestones(data.currentTime, data.duration);
    });

    sdk.eventBus.on('videoEnded', function() {
      logToConsole('[PLAYER] Main stream video completed', 'event');
      sdk.telemetryClient.track('video_complete', {});
    });

    // Ad Interruption Events
    sdk.eventBus.on('adBreakStart', function(data) {
      logToConsole('[AD] Ad break started: ' + data.adBreak.id, 'event');
      sdk.telemetryClient.track('ad_break_start', { adId: data.adBreak.id });
      showAdOverlay(true, data.adBreak);
    });

    sdk.eventBus.on('adProgress', function(data) {
      logToConsole('[AD] Progress: ' + data.time + 's / ' + data.duration + 's', 'system');
      updateAdProgress(data.time, data.duration);
    });

    sdk.eventBus.on('adBreakEnd', function(data) {
      logToConsole('[AD] Ad break ended: ' + data.adBreak.id + '. Resuming stream.', 'event');
      sdk.telemetryClient.track('ad_break_end', { adId: data.adBreak.id });
      showAdOverlay(false);
    });
  }

  // Telemetry Milestone tracking
  var milestones = { p25: false, p50: false, p75: false };
  function trackMilestones(currentTime, duration) {
    if (!duration || duration <= 0) return;
    var percentage = (currentTime / duration) * 100;
    
    if (percentage >= 25 && !milestones.p25) {
      milestones.p25 = true;
      sdk.telemetryClient.track('video_milestone_25', { time: currentTime });
      logToConsole('[MILESTONE] 25% completed', 'event');
    }
    if (percentage >= 50 && !milestones.p50) {
      milestones.p50 = true;
      sdk.telemetryClient.track('video_milestone_50', { time: currentTime });
      logToConsole('[MILESTONE] 50% completed', 'event');
    }
    if (percentage >= 75 && !milestones.p75) {
      milestones.p75 = true;
      sdk.telemetryClient.track('video_milestone_75', { time: currentTime });
      logToConsole('[MILESTONE] 75% completed', 'event');
    }
  }

  function resetMilestones() {
    milestones.p25 = false;
    milestones.p50 = false;
    milestones.p75 = false;
  }

  // 4. Interface Navigation & Screens
  function switchScreen(targetScreenId) {
    var currentScreen = $(currentActiveScreenId);
    var targetScreen = $(targetScreenId);

    if (currentScreen && targetScreen) {
      logToConsole('[NAVIGATION] Switching screen: ' + targetScreenId, 'system');
      
      // Save previously focused element before screen switch to restore on back
      if (sdk && sdk.focusManager.getActiveElement()) {
        previousFocusedElement = sdk.focusManager.getActiveElement();
      }

      currentScreen.classList.remove('active');
      targetScreen.classList.add('active');
      currentActiveScreenId = targetScreenId;

      // Handle screen entry behaviors
      if (targetScreenId === 'screen-player') {
        startPlayback();
      } else {
        stopPlayback();
      }

      // Re-scan and focus the first element in the new screen
      setTimeout(function() {
        if (sdk) {
          sdk.focusManager.scanAndFocusFirst();
        }
      }, 50);
    }
  }

  function handleBackNavigation() {
    // If HbbTV Overlay is open, close it
    if ($('hbbtvModal').classList.contains('active')) {
      toggleHbbTVOverlay();
      return;
    }

    // If we're not on the dashboard, navigate back to dashboard
    if (currentActiveScreenId !== 'screen-dashboard') {
      switchScreen('screen-dashboard');
      // Try to restore previous button focus
      if (previousFocusedElement && document.body.contains(previousFocusedElement)) {
        setTimeout(function() {
          if (sdk) sdk.focusManager.focus(previousFocusedElement);
        }, 100);
      }
    }
  }

  // Toggle HbbTV Overlay Popup
  function toggleHbbTVOverlay() {
    var modal = $('hbbtvModal');
    var isCurrentlyActive = modal.classList.contains('active');

    if (!isCurrentlyActive) {
      logToConsole('[HbbTV] Launching red button menu overlay.', 'event');
      if (sdk) {
        previousFocusedElement = sdk.focusManager.getActiveElement();
      }
      modal.classList.add('active');
      sdk.telemetryClient.track('hbbtv_overlay_open', {});
      
      // Focus EPG button inside modal
      setTimeout(function() {
        if (sdk) sdk.focusManager.focus($('hbbtv-btn-epg'));
      }, 100);
    } else {
      logToConsole('[HbbTV] Closing overlay.', 'system');
      modal.classList.remove('active');
      sdk.telemetryClient.track('hbbtv_overlay_close', {});
      
      // Restore previous focus
      if (previousFocusedElement) {
        setTimeout(function() {
          if (sdk) sdk.focusManager.focus(previousFocusedElement);
        }, 100);
      }
    }
  }

  // Setup DOM Event Listeners & Buttons
  function setupNavigationHandlers() {
    // Dashboard Menu Buttons
    $('menu-btn-play').addEventListener('click', function() {
      switchScreen('screen-player');
    });
    $('menu-btn-diagnostics').addEventListener('click', function() {
      switchScreen('screen-diagnostics');
    });
    $('menu-btn-profile').addEventListener('click', function() {
      switchScreen('screen-profile');
    });

    // Profile Back button
    $('prof-btn-back').addEventListener('click', function() {
      handleBackNavigation();
    });

    // Diagnostics Controls
    $('diag-btn-back').addEventListener('click', function() {
      handleBackNavigation();
    });

    $('diag-btn-crash').addEventListener('click', function() {
      logToConsole('[SIMULATOR] Triggering javascript uncaught error...', 'error');
      // Trigger a crash that window.onerror will catch
      setTimeout(function() {
        // Calling non-existent function to trigger ReferenceError
        triggerSimulatedCrash();
      }, 50);
    });

    $('diag-btn-reject').addEventListener('click', function() {
      logToConsole('[SIMULATOR] Triggering unhandled promise rejection...', 'error');
      setTimeout(function() {
        Promise.reject(new Error('Simulated Async Failure'));
      }, 50);
    });

    $('diag-btn-flush').addEventListener('click', function() {
      logToConsole('[SIMULATOR] Forcing telemetry buffer flush.', 'system');
      if (sdk) {
        sdk.telemetryClient.flush();
      }
    });

    // Video Player Controls
    $('player-btn-back').addEventListener('click', function() {
      handleBackNavigation();
    });

    var playPauseBtn = $('player-btn-play-pause');
    playPauseBtn.addEventListener('click', function() {
      if (sdk) {
        if (sdk.videoAdapter.video.paused) {
          sdk.videoAdapter.play();
          playPauseBtn.innerText = 'PAUSE';
        } else {
          sdk.videoAdapter.pause();
          playPauseBtn.innerText = 'PLAY';
        }
      }
    });

    // HbbTV Modal Grid Buttons
    $('hbbtv-btn-epg').addEventListener('click', function() {
      logToConsole('[HbbTV Action] EPG selected', 'event');
      sdk.telemetryClient.track('hbbtv_action', { action: 'epg' });
      toggleHbbTVOverlay();
    });
    $('hbbtv-btn-vod').addEventListener('click', function() {
      logToConsole('[HbbTV Action] VOD catalog clicked', 'event');
      sdk.telemetryClient.track('hbbtv_action', { action: 'vod' });
      toggleHbbTVOverlay();
    });
    $('hbbtv-btn-weather').addEventListener('click', function() {
      logToConsole('[HbbTV Action] Weather forecast selected', 'event');
      sdk.telemetryClient.track('hbbtv_action', { action: 'weather' });
      toggleHbbTVOverlay();
    });
    $('hbbtv-btn-close').addEventListener('click', function() {
      toggleHbbTVOverlay();
    });

    // Track Queue size changes periodically in diagnostics dashboard
    setInterval(function() {
      if (sdk) {
        $('diagEventsCount').innerText = sdk.telemetryClient.queue.length;
      }
    }, 1000);
  }

  // 5. Video Player Handlers
  function startPlayback() {
    if (!sdk) return;
    resetMilestones();
    
    // Choose appropriate stream from config or defaults
    var streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    if (sdk.deviceProfile.platform === 'Tizen') {
      streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
    } else if (sdk.deviceProfile.platform === 'WebOS') {
      streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';
    }
    
    logToConsole('[PLAYER] Loading content stream: ' + streamUrl, 'system');
    sdk.videoAdapter.load(streamUrl);
    sdk.videoAdapter.play();

    // Reset controls UI button
    $('player-btn-play-pause').innerText = 'PAUSE';
  }

  function stopPlayback() {
    if (sdk) {
      sdk.videoAdapter.pause();
      sdk.adBreakManager.reset();
      showAdOverlay(false);
    }
  }

  function updatePlayerProgress(currentTime, duration) {
    if (!duration || duration <= 0) return;
    
    var fill = $('playerProgressFill');
    var timeTxt = $('playerTimeText');

    if (fill) {
      var pct = (currentTime / duration) * 100;
      fill.style.width = pct + '%';
    }

    if (timeTxt) {
      timeTxt.innerText = formatTime(currentTime) + ' / ' + formatTime(duration);
    }
  }

  function formatTime(secs) {
    if (isNaN(secs)) return '00:00';
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  // Ad Overlay controls
  function showAdOverlay(show, adBreak) {
    var overlay = $('adOverlay');
    var fill = $('adProgressFill');
    var text = $('adTimerText');

    if (show) {
      overlay.style.display = 'block';
      if (text && adBreak) {
        text.innerText = adBreak.duration + 's remaining';
      }
      if (fill) fill.style.width = '0%';
    } else {
      overlay.style.display = 'none';
    }
  }

  function updateAdProgress(time, duration) {
    var fill = $('adProgressFill');
    var text = $('adTimerText');

    if (fill) {
      var pct = (time / duration) * 100;
      fill.style.width = pct + '%';
    }
    if (text) {
      var remaining = Math.max(0, duration - time);
      text.innerText = remaining + 's remaining';
    }
  }

  // 6. Device Profile UI population
  function populateProfileUI() {
    if (!sdk) return;

    var dp = sdk.deviceProfile;
    $('profPlatform').innerText = dp.platform;
    $('profVersion').innerText = dp.version;
    $('profVendor').innerText = dp.vendor;
    $('profResolution').innerText = dp.resolution;

    // Toggle active badges
    toggleFeatureBadge('featDrm', dp.features.drm);
    toggleFeatureBadge('featHbb', dp.features.hbbtv);
    toggleFeatureBadge('featTizen', dp.features.tizen);
    toggleFeatureBadge('featWebos', dp.features.webos);
  }

  function toggleFeatureBadge(id, active) {
    var el = $(id);
    if (!el) return;
    if (active) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  }

  // Window load setup
  window.addEventListener('load', initApp);

})();
