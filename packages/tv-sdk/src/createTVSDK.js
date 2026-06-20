var EventBus = require('./EventBus');
var RemoteControl = require('./RemoteControl');
var FocusManager = require('./FocusManager');
var VideoAdapter = require('./VideoAdapter');
var AdBreakManager = require('./AdBreakManager');
var TelemetryClient = require('./TelemetryClient');
var ErrorReporter = require('./ErrorReporter');
var DeviceProfile = require('./DeviceProfile');
var NetworkRetry = require('./NetworkRetry');

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createTVSDK;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return createTVSDK; });
}
