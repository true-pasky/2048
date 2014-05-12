function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // Vim up
    76: 1, // Vim right
    74: 2, // Vim down
    72: 3, // Vim left
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    // Ignore the event if it's happening in a text field
    if (self.targetIsInput(event)) return;

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);

  // Respond to swipe events
  var touchStartClientX, touchStartClientY;
  var touchStart = null;
  var moved = false;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  var getTouchPos;
  if (window.navigator.msPointerEnabled) {
    getTouchPos = function(event, end){
      return [event.pageX, event.pageY];
    };
  } else {
    getTouchPos = function(event, end) {
      var attr = end ? 'changedTouches' : 'touches';
      return [event[attr][0].clientX, event[attr][0].clientY];
    };
  };

  var getMove = function(delta, deltaAbs){
    return deltaAbs[0] > deltaAbs[1] ? (delta[0] > 0 ? 1 : 3) : (delta[1] > 0 ? 2 : 0)
  };

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    event.preventDefault();
    touchStart = getTouchPos(event);
    moved = false;
  });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
    if (!touchStart || moved){
      return;
    }

    var touchEnd = getTouchPos(event);
    var delta = [touchEnd[0] - touchStart[0], touchEnd[1] - touchStart[1]];
    var deltaAbs = [Math.abs(delta[0]), Math.abs(delta[1])];

    if (Math.max(deltaAbs[0], deltaAbs[1]) > 100) {
      moved = true;
      self.emit("move", getMove(delta, deltaAbs));
    }
  });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if (moved){
      return;
    }

    var touchEnd = getTouchPos(event, true);
    var delta = [touchEnd[0] - touchStart[0], touchEnd[1] - touchStart[1]];
    var deltaAbs = [Math.abs(delta[0]), Math.abs(delta[1])];

    if (Math.max(deltaAbs[0], deltaAbs[1]) > 10) {
      moved = true;
      self.emit("move", getMove(delta, deltaAbs));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

KeyboardInputManager.prototype.targetIsInput = function (event) {
  return event.target.tagName.toLowerCase() === "input";
};
