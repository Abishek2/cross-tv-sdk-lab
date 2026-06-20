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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceProfile;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return DeviceProfile; });
}
