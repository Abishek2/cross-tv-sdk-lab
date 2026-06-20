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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FocusManager;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return FocusManager; });
}
