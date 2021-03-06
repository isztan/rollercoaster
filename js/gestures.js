document.addEventListener("DOMContentLoaded", function() {

  var swipePane = document.querySelector('#swipePane'),
      previousLink = document.querySelector('.previous a'),
      nextLink = document.querySelector('.next a'),
      screenshot = document.querySelector('.screenshot'),
      overlayNotes = document.querySelector('.overlayNotes'),
      previousOverlay = document.querySelector('.previousOverlay'),
      nextOverlay = document.querySelector('.nextOverlay');
      
  // Determine if touch events are supported
  // detection code from: https://github.com/Modernizr/Modernizr/blob/9dad6bb4f042e21730b0136d7407b9465bea16c6/feature-detects/touchevents.js
  var hasTouchSupport = false;
  if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    hasTouchSupport = true;
  }
  
  // Display swipe tooltip if touch support is available (on the home page only)
  if(hasTouchSupport && location.pathname === '/') {
    
    // Display on image load
    screenshot.addEventListener('load', function() {
      overlayNotes.style.display = 'block';
      
      // fade out after 1 second
      setTimeout(function() {
        overlayNotes.style.opacity = 0;
      }, 1500);
    });
    
  }

  var cssPropNamePrefixes = ['O', 'MS', 'Moz', 'Webkit'];

  function getCSSPropertyName(cssDefaultPropName) {
    var cssPropNameSuffix = '';
    var propNameParts = cssDefaultPropName.split('-');
    for(var i = 0, l = propNameParts.length; i< l; i++) {
      cssPropNameSuffix += propNameParts[i].charAt(0).toUpperCase() + propNameParts[i].slice(1);
    }
    
    var el = document.createElement('div');
    var style = el.style;
    for (var i = 0, l = cssPropNamePrefixes.length; i < l; i++) {
      var cssPrefixedPropName = cssPropNamePrefixes[i] + cssPropNameSuffix;
      if( style[ cssPrefixedPropName ] !== undefined ) {
        return cssPrefixedPropName;
      }
    }
    return cssDefaultPropName; // fallback to standard prop name
  }

  var transitionCSSPropName = getCSSPropertyName('transition');
  var transformCSSPropName = getCSSPropertyName('transform');

  var startX, startY;
  var hChange = 0, vChange = 0;
  var navState = 0; // pending state

  // Disable object dragging
  swipePane.addEventListener('dragstart', function(evt) {
    evt.preventDefault();
  });

  // Prevent element clicking in desktop user agents if
  // navigation actions have been invoked
  swipePane.addEventListener('click', function(evt) {
    if(navState === 3) { // clean-up state
      navState = 0; // reset to pending state
      evt.preventDefault();
    }
  });

  function startHandler(evt) {
    if(navState !== 0 && navState !== 3) {
      return;
    }
    
    navState = 1; // started state
    
    if(evt.type == 'touchstart') {
      startX = evt.touches[0].pageX;
      startY = evt.touches[0].pageY;
    } else { // mousedown
      startX = evt.clientX;
      startY = evt.clientY;
    }
    
    // Remove overlayNotes
    overlayNotes.style.display = 'none';

    // Start page navigation drag tracking
    swipePane.addEventListener(evt.type == 'touchstart' ? 'touchmove' : 'mousemove', moveHandler);
  }
  
  function moveHandler(evt) {
    if(navState === 1) { // started state
      navState = 2; // running state
      swipePane.addEventListener(evt.type == 'touchmove' ? 'touchend' : 'mouseup', endHandler);
    } else if(navState !== 2) { // running state
      return;
    }
    
    var moveX, moveY;

    if(evt.type == 'touchmove') {
      moveX = evt.changedTouches[0].pageX;
      moveY = evt.changedTouches[0].pageY;
    } else { // mousemove
      moveX = evt.clientX;
      moveY = evt.clientY;
    }

    hChange = moveX - startX;
    vChange = moveY - startY;

    // Only take action when movement is in a horizontal direction
    if(Math.abs(hChange) > Math.abs(vChange)) {
      // Animate previous overlay element
      if(previousLink && hChange > 9) {
        evt.preventDefault(); // Disable horizontal scroll
        if(hChange < 150) {
          var effectVal = hChange / 180 * 0.8;
          previousOverlay.style[transformCSSPropName] = 'translate3d(' + hChange + 'px,0,0)';
          previousOverlay.style.opacity = effectVal;
        } else {
          previousOverlay.style.opacity = 0.9;
          previousOverlay.style[transformCSSPropName] = 'translate3d(150px,0,0)';
        }
      } else if(nextLink && hChange < -9) { // Animate next overlay element
        evt.preventDefault(); // Disable horizontal scroll
        if(hChange > -150) {
          var effectVal = hChange / -180 * 0.8;
          nextOverlay.style[transformCSSPropName] = 'translate3d(' + hChange + 'px,0,0)';
          nextOverlay.style.opacity = effectVal;
        } else {
          nextOverlay.style[transformCSSPropName] = 'translate3d(-150px,0,0)';
          nextOverlay.style.opacity = 0.9;
        }
      }
      
    } else {
      previousOverlay.style[transformCSSPropName] = nextOverlay.style[transformCSSPropName] = 'translate3d(0,0,0)';
    }
    
  }

  function endHandler(evt) {
    if(navState !== 2) {
      return;
    }
    
    // Stop page navigation drag tracking
    swipePane.removeEventListener(evt.type == 'touchend' ? 'touchmove' : 'mousemove', moveHandler);
    // Remove self
    swipePane.removeEventListener(evt.type == 'touchend' ? 'touchend' : 'mouseup', endHandler);

    navState = 3; // cleanup state

    if(previousLink && hChange > 149) {
      previousOverlay.style[transitionCSSPropName] = 'width 0.3s ease';
      setTimeout(function() {
        window.location.href = previousLink.href; // navigate to previous url
      }, 400);
      previousOverlay.style.width = '100%';
      screenshot.style.visibility = 'hidden';
      
    } else if(nextLink && hChange < -149) {
      nextOverlay.style[transitionCSSPropName] = 'width 0.3s ease';
      setTimeout(function() {
        window.location.href = nextLink.href; // navigate to next url
      }, 400);
      nextOverlay.style.width = '100%';
      screenshot.style.visibility = 'hidden';
      
    } else {
      previousOverlay.style[transitionCSSPropName] = nextOverlay.style[transitionCSSPropName] = "all 0.5s ease";
      setTimeout(function() {
        previousOverlay.style[transitionCSSPropName] = nextOverlay.style[transitionCSSPropName] = null;
      }, 600);
      previousOverlay.style[transformCSSPropName] = nextOverlay.style[transformCSSPropName] = 'translate3d(0,0,0)';
    }
    
  }

  swipePane.addEventListener('touchstart', startHandler);
  swipePane.addEventListener('mousedown', startHandler);

});