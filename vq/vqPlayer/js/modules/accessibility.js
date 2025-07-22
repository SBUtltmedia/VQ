/**
 * accessibility.js
 * Enhances accessibility for the Video Quiz application
 */

import state from './state.js';

/**
 * Initialize accessibility features
 */
export function initAccessibility() {
  // Add ARIA attributes to elements
  enhanceAriaAttributes();

  // Set up keyboard navigation
  setupKeyboardNavigation();

  // Add focus indicators
  addFocusIndicators();

  // Add screen reader announcements
  setupScreenReaderAnnouncements();

  console.log('Accessibility features initialized');
}

/**
 * Enhance ARIA attributes for better screen reader support
 */
function enhanceAriaAttributes() {
  // Add role and aria-label to main elements
  document.querySelectorAll('[id]').forEach(element => {
    // Only modify elements that don't already have roles
    if (!element.hasAttribute('role')) {
      // Set appropriate roles based on element type and ID
      if (element.id.includes('Button')) {
        element.setAttribute('role', 'button');
      } else if (element.id.includes('panel') || element.id.includes('Panel')) {
        element.setAttribute('role', 'form');
      }
    }
  });

  // Handle specific components that need special treatment
  enhanceVideoPlayerAccessibility();
  enhanceQuestionAccessibility();
}

/**
 * Enhance video player accessibility
 */
function enhanceVideoPlayerAccessibility() {
  // Video element
  const videoElement = document.getElementById('videoBox');
  if (videoElement) {
    videoElement.setAttribute('aria-label', 'Video Player');

    //big play button
    // const bigPlayBtn = document.getElementById('bigPlay');
    // if (bigPlayBtn) {
    //   bigPlayBtn.setAttribute('role', 'button');
    //   bigPlayBtn.setAttribute('tabindex', '0');
    //   bigPlayBtn.setAttribute('aria-label', 'Play Video');
    // }

    // Ensure captions are properly labeled
    const tracks = videoElement.querySelectorAll('track');
    tracks.forEach(track => {
      if (track.kind === 'captions' || track.kind === 'subtitles') {
        track.setAttribute('aria-label', `${track.label || 'English'} captions`);
      }
    });
  }

  // Video controls
  const controls = document.getElementById('videoControls');
  if (controls) {
    controls.setAttribute('role', 'navigation');
    controls.setAttribute('aria-label', 'Video Controls');
  }

  // Play/Pause button
  const playPauseBtn = document.getElementById('videoPlayPause');
  if (playPauseBtn) {
    playPauseBtn.setAttribute('role', 'button');
    playPauseBtn.setAttribute('tabindex', '0');
    playPauseBtn.setAttribute('aria-label', 'Play or Pause Video');
  }

  //videoSkip
  const videoSkip = document.getElementById('videoSkip');
  if (videoSkip){
    videoSkip.setAttribute('role', 'button');
    videoSkip.setAttribute('aria-label', 'Skip');
  }

  // Seek slider
  const seekSlider = document.getElementById('seekSlider');
  if (seekSlider) {
    seekSlider.setAttribute('aria-label', 'Video Position');
    seekSlider.setAttribute('aria-valuemin', '0');
    seekSlider.setAttribute('aria-valuemax', '100');
    seekSlider.setAttribute('aria-valuenow', seekSlider.value || '0');

    // Update aria-valuenow when value changes
    seekSlider.addEventListener('input', () => {
      seekSlider.setAttribute('aria-valuenow', seekSlider.value);
    });
  }

  // Volume slider
  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider) {
    volumeSlider.setAttribute('aria-label', 'Volume');
    volumeSlider.setAttribute('aria-valuemin', '0');
    volumeSlider.setAttribute('aria-valuemax', '100');
    volumeSlider.setAttribute('aria-valuenow', volumeSlider.value || '100');

    // Update aria-valuenow when value changes
    volumeSlider.addEventListener('input', () => {
      volumeSlider.setAttribute('aria-valuenow', volumeSlider.value);
    });
  }

  // Mute button
  const muteButton = document.getElementById('muteButton');
  if (muteButton) {
    muteButton.setAttribute('role', 'button');
    muteButton.setAttribute('tabindex', '0');
    muteButton.setAttribute('aria-label', 'Mute or Unmute Audio');

    // Add pressed state
    muteButton.addEventListener('click', () => {
      const isMuted = muteButton.classList.contains('muted');
      muteButton.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
    });
  }

  // CC button
  const ccButton = document.getElementById('cc');
  if (ccButton) {
    ccButton.setAttribute('role', 'button');
    ccButton.setAttribute('tabindex', '0');
    ccButton.setAttribute('aria-label', 'Toggle Closed Captions');

    // Add pressed state
    ccButton.addEventListener('click', () => {
      const isCCOn = ccButton.classList.contains('on');
      ccButton.setAttribute('aria-pressed', isCCOn ? 'true' : 'false');
    });
  }
}

/**
 * Enhance question accessibility
 */
function enhanceQuestionAccessibility() {
  // Question Bank
  const quizBank = document.getElementById('quizBank');
  if (quizBank) {
    quizBank.setAttribute('role', 'main');
    quizBank.setAttribute('aria-modal', 'true');
    quizBank.setAttribute('aria-labelledby', 'questionText');
  }

  // Question text
  const questionText = document.getElementById('questionText');
  if (questionText) {
    questionText.setAttribute('role', 'heading');
    questionText.setAttribute('aria-level', '2');
  }

  // Question box
  const questionBox = document.getElementById('questionBox');
  if (questionBox) {
    questionBox.setAttribute('role', 'contentinfo');
  }
  //small question box
  const smallQuestionBox = document.getElementById('smallQuestionBox');
  if (smallQuestionBox) {
    smallQuestionBox.setAttribute('role', 'navigation');
  }

  // Question buttons
  document.querySelectorAll('[id^="questionButton"]').forEach((button, index) => {
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', `Question ${index + 1}`);
    button.setAttribute('aria-controls', 'quizBank');
  });

  // Score box
  const scoreBox = document.getElementById('scoreBox');
  if (scoreBox) {
    scoreBox.setAttribute('role', 'complementary');
  }

  // Answer boxes
  document.querySelectorAll('[id^="answerBox"]').forEach((box, index) => {
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');

    // Get the text content of this answer
    const textElement = box.querySelector('.answerText');
    const text = textElement ? textElement.textContent.trim() : '';
    box.setAttribute('aria-label', `${index + 1}${text ? ': ' + text : ''}`);
  });

  // Fill in answer
  const fillInAnswer = document.getElementById('fillInAnswer');
  if (fillInAnswer) {
    fillInAnswer.setAttribute('aria-label', 'Your Answer');
    fillInAnswer.setAttribute('aria-multiline', 'true');
  }

  // Explanation box
  const expoBox = document.getElementById('expoBox');
  if (expoBox) {
    expoBox.setAttribute('role', 'alert');
    expoBox.setAttribute('aria-live', 'polite');
  }

  // Explanation buttons
  const expoButtons = document.querySelectorAll('.expoButton');
  expoButtons.forEach(button => {
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
  });
  const scoreBubble = document.getElementById('scoreBubble');
  if (scoreBubble) {
    scoreBubble.setAttribute('aria-atomic', 'true');
  }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
  // Add keyboard support for buttons
  document.querySelectorAll('[role="button"]').forEach(button => {
    if (!button.hasAttribute('tabindex')) {
      button.setAttribute('tabindex', '0');
    }

    // Add keyboard handler if not already present
    if (!button.hasAttribute('data-keyboard-handler')) {
      button.setAttribute('data-keyboard-handler', 'true');
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    }
  });

  // Handle Escape key to close dialogs
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.showingQuestion) {
      const event = new CustomEvent('hideQuestionPanel');
      document.dispatchEvent(event);
    }
  });

  // Add arrow key navigation for question buttons
  const questionButtons = document.querySelectorAll('[id^="questionButton"]');
  questionButtons.forEach((button, index) => {
    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && index < questionButtons.length - 1) {
        e.preventDefault();
        questionButtons[index + 1].focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        questionButtons[index - 1].focus();
      }
    });
  });

  // Add arrow key navigation for answer options
  const answerBoxes = document.querySelectorAll('[id^="answerBox"]');
  answerBoxes.forEach((box, index) => {
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && index < answerBoxes.length - 1) {
        e.preventDefault();
        answerBoxes[index + 1].focus();
      } else if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault();
        answerBoxes[index - 1].focus();
      }
    });
  });
}

/**
 * Add focus indicators for keyboard navigation
 */
function addFocusIndicators() {
  // Add focus outline styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    [role="button"]:focus, .btn:focus, input:focus, select:focus, textarea:focus {
      outline: 3px solid #4D90FE !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 8px rgba(77, 144, 254, 0.8) !important;
    }
    
    [role="button"]:focus:not(:focus-visible), 
    .btn:focus:not(:focus-visible), 
    input:focus:not(:focus-visible), 
    select:focus:not(:focus-visible), 
    textarea:focus:not(:focus-visible) {
      outline: none !important;
      box-shadow: none !important;
    }
    
    [role="button"]:focus-visible, 
    .btn:focus-visible, 
    input:focus-visible, 
    select:focus-visible, 
    textarea:focus-visible {
      outline: 3px solid #4D90FE !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 8px rgba(77, 144, 254, 0.8) !important;
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * Setup screen reader announcements
 */
function setupScreenReaderAnnouncements() {
  // Create live regions for announcements
  const createLiveRegion = (id, ariaLive) => {
    const existing = document.getElementById(id);
    if (existing) return existing;

    const region = document.createElement('div');
    region.id = id;
    region.className = 'sr-only';
    region.setAttribute('aria-live', ariaLive);
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
    return region;
  };

  // Create polite and assertive announcement regions
  const politeAnnouncer = createLiveRegion('polite-announcer', 'polite');
  const assertiveAnnouncer = createLiveRegion('assertive-announcer', 'assertive');

  // Function to make announcements
  window.announce = (message, assertive = false) => {
    const announcer = assertive ? assertiveAnnouncer : politeAnnouncer;
    announcer.textContent = '';

    // Force browser to recognize the content change
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  };

  // Listen for events that should make announcements
  document.addEventListener('questionShown', (e) => {
    if (e.detail && e.detail.questionText) {
      window.announce(`Question: ${e.detail.questionText}`, true);
    }
  });

  document.addEventListener('answerCorrect', () => {
    window.announce('Correct answer!', true);
  });

  document.addEventListener('answerIncorrect', () => {
    window.announce('Incorrect answer. Try again.', true);
  });

  document.addEventListener('quizCompleted', (e) => {
    if (e.detail && e.detail.score !== undefined) {
      window.announce(`Quiz completed! Your final score is ${e.detail.score} points.`, true);
    } else {
      window.announce('Quiz completed!', true);
    }
  });
  document.addEventListener('blockerDialogVisibilityChanged', (e) => {
    if (window.announce) {
      window.announce(e.detail.visible ? 'Dialog opened' : 'Dialog closed');
    }
  });
  // Show dialog
  document.dispatchEvent(new CustomEvent('blockerDialogVisibilityChanged', { detail: { visible: true } }));

  // Hide dialog
  document.dispatchEvent(new CustomEvent('blockerDialogVisibilityChanged', { detail: { visible: false } }));
}

/**
 * Update accessibility for an element
 * @param {HTMLElement} element - Element to update
 * @param {Object} attributes - ARIA attributes to set
 */
export function updateElementAccessibility(element, attributes) {
  if (!element) return;

  Object.entries(attributes).forEach(([attr, value]) => {
    if (value === null) {
      element.removeAttribute(attr);
    } else {
      element.setAttribute(attr, value);
    }
  });
}

/**
 * Make an announcement for screen readers
 * @param {string} message - Message to announce
 * @param {boolean} [assertive=false] - Whether to use assertive announcement
 */
export function announceToScreenReader(message, assertive = false) {
  if (window.announce) {
    window.announce(message, assertive);
  }
}

// Create a focus trap for modal dialogs
export function createFocusTrap(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return { activate: () => { }, deactivate: () => { } };

  let focusableElements = [];
  let firstFocusableElement = null;
  let lastFocusableElement = null;
  let previousActiveElement = null;

  const updateFocusableElements = () => {
    focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled;
    });

    firstFocusableElement = focusableElements[0] || null;
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null;
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    // Update in case DOM has changed
    updateFocusableElements();

    if (focusableElements.length === 0) return;

    if (e.shiftKey) {
      // Tab backwards
      if (document.activeElement === firstFocusableElement) {
        e.preventDefault();
        lastFocusableElement.focus();
      }
    } else {
      // Tab forwards
      if (document.activeElement === lastFocusableElement) {
        e.preventDefault();
        firstFocusableElement.focus();
      }
    }
  };

  return {
    activate: () => {
      previousActiveElement = document.activeElement;
      updateFocusableElements();

      document.addEventListener('keydown', handleKeyDown);

      // Set initial focus
      if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 10);
      }
    },
    deactivate: () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    }
  };
}

// Export module API
export default {
  initAccessibility,
  updateElementAccessibility,
  announceToScreenReader,
  createFocusTrap
};