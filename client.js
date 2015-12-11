(function () {
  // Util: run `fn` on `el` and all of its parent elements.
  function bubbleUp (el, fn) {
    fn(el);
    if (el !== body) bubbleUp(el.parentElement, fn);
  }
  // Util: blocks an event while extension is active, and optionally runs `fn`.
  function boomListener (el, event, fn) {
    el.addEventListener(event, function (e) {
      if (!isActive) return; // Early exit, don't block the event.
      // If the passed `fn` returns `true`, don't block the event.
      if (typeof fn === 'function' && fn(e)) return;

      e.preventDefault();
      e.stopPropagation();
      return false;
    }, false);
  }
  // Add HOVER_CLASS to the most recently hovered element.
  function handleMouseMove (e) {
    var hoveredEl = document.elementFromPoint(e.clientX, e.clientY);

    if (lastHoveredEl.classList) lastHoveredEl.classList.remove(HOVER_CLASS);
    if (hoveredEl !== body) {
      hoveredEl.classList.add(HOVER_CLASS);
      lastHoveredEl = hoveredEl;
    } else lastHoveredEl = {};
    return true;
  }
  // Expand the clicked element for readability if "shift" is held, otherwise
  // destroy it.
  function handleMouseDown (e) {
    var target = e.target;
    if (e.shiftKey) {
      var fontSize  = parseInt(window.getComputedStyle(target).fontSize);
      var bodyWidth =   fontSize * 32 + 'px';

      bubbleUp(target, function (el) {
        el.classList.add(EXPANDED_CLASS);

        if (el === body) {
          el.style.setProperty('width', bodyWidth, 'important');
          el.style.setProperty('min-width', 'initial', 'important');
          el.style.setProperty('max-width', 'initial', 'important');
        }
      });
    } else target !== body && target.parentElement.removeChild(target);
  }
  // Deactivate the extension if "esc" is pressed.
  function handleKeyDown (e) {
    if (e.keyCode === 27) toggleActive(true);
    else return true;
  }

  // Constants.
  var body           = document.body;
  var ACTIVE_CLASS   = 'boom-extension-active';
  var ACTIVE_STYLE   = 'cursor: crosshair !important';
  var HOVER_CLASS    = 'boom-extension-hovered-element';
  var HOVER_STYLE    = 'outline: 2px solid #9ab !important';
  var EXPANDED_CLASS = 'boom-extension-expanded-element';
  var EXPANDED_STYLE = [
    'background:    transparent',
    'border:        0',
    'float:         none',
    'margin-left:   auto',
    'margin-right:  auto',
    'padding-left:  0',
    'padding-right: 0',
    'position:      relative',
    'max-width:     initial',
    'min-width:     initial',
    'width:         100%',
    '',
  ].join(' !important;');

  // Statefully yours…
  var isActive = false;
  var lastHoveredEl = {}; // Cache the most recently hovered element.

  function toggleActive (forceFalse) {
    isActive = !forceFalse && !isActive;
    chrome.runtime.sendMessage(isActive);
    body.classList[isActive ? 'add' : 'remove'](ACTIVE_CLASS);
  }

  // Add styles to the bottom of the page.
  var styleEl = document.createElement('style');
  var cssContent =
      '.' + ACTIVE_CLASS   + ' *{'       + ACTIVE_STYLE   + '}\n' +
      '.' + ACTIVE_CLASS   + ' *:hover{' + ACTIVE_STYLE   + '}\n' +
      '.' + HOVER_CLASS    + '{'         + HOVER_STYLE    + '}\n' +
      '.' + EXPANDED_CLASS + '{'         + EXPANDED_STYLE + '}\n' ;

  styleEl.appendChild(document.createTextNode(cssContent));
  body.appendChild(styleEl);

  // Attach local event listeners.
  boomListener(window, 'keydown', handleKeyDown);
  boomListener(window, 'mousedown', handleMouseDown);
  boomListener(document, 'mousemove', handleMouseMove);
  boomListener(window, 'mouseup');
  boomListener(window, 'click');

  // Attach background script listeners.
  chrome.runtime.onMessage.addListener(function (forceFalse, sender, _b) {
    if (!sender.tab) toggleActive(forceFalse);
  });

  // Let the background script know that we've loaded new content.
  toggleActive(true);
})();
