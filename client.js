(function () {
  // Util: run `fn` on `el` and all of its parent elements.
  function bubbleUp (el, fn) {
    fn(el);
    if (el !== body) bubbleUp(el.parentElement, fn);
  }
  // Util: aggressively stops an event from firing or bubbling.
  function stopEvent (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  // Record when the "d" or "b" key is held.
  function handleKeyDown (e) {
    if (!isActive || dDown || bDown) return; // Early exit.

    if      (e.keyCode === 68) dDown = true;               // "d"
    else if (e.keyCode === 66) bDown = true;               // "b"
    else if (e.keyCode === 27 && isActive) toggleActive(); // esc
    else return;

    return stopEvent(e);
  }
  // Record when the "d" or "b" key is released.
  function handleKeyUp (e) {
    if (!isActive) return; // Early exit.

    if      (e.keyCode === 68) dDown = false; // "d"
    else if (e.keyCode === 66) bDown = false; // "b"
    else return;

    if (lastHoveredEl.classList) lastHoveredEl.classList.remove(HOVER_CLASS);
  }
  // Add HOVER_CLASS to the most recently hovered element.
  function handleMouseMove (e) {
    if (!isActive || (!dDown && !bDown)) return; // Early exit.
    var hoveredEl = document.elementFromPoint(e.clientX, e.clientY);

    if (lastHoveredEl.classList) lastHoveredEl.classList.remove(HOVER_CLASS);
    hoveredEl.classList.add(HOVER_CLASS);
    lastHoveredEl = hoveredEl;
  }
  // Destroy or expand the clicked element if "d" or "b" are currently held.
  function handleClick (e) {
    if (!isActive || (!dDown && !bDown)) return; // Early exit.
    var target = e.target;

    if      (dDown) target.parentElement.removeChild(target);
    else if (bDown) {
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
    }

    return stopEvent(e);
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

  // Statefully yours...
  var isActive = false;
  var dDown = false; // Destroys the clicked element.
  var bDown = false; // Expands the clicked element to 80% of the screen width.
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
  window.addEventListener('keydown', handleKeyDown, false);
  window.addEventListener('keyup', handleKeyUp, false);
  window.addEventListener('mousedown', handleClick, false);
  document.addEventListener('mousemove', handleMouseMove, false);

  // Attach background script listeners.
  chrome.runtime.onMessage.addListener(function (forceFalse, sender, _b) {
    if (!sender.tab) toggleActive(forceFalse);
  });

  // Let the background script know that we've loaded new content.
  toggleActive(true);
})();
