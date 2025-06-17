/**
 * userInterface.js
 * Manages user interface elements and interactions for the Video Quiz application
 */
import config from './config.js';
import state from './state.js';
import videoPlayer from './videoPlayer.js';
import questionManager from './questionManager.js';
import { announceToScreenReader } from './accessibility.js';

// Import the optimized resize handler
// Note: Make sure optimizedResize.js is loaded before this module
// or include it as a script tag in your HTML

/**
 * Initialize the user interface
 */

export function initUserInterface() {
  // Set up UI elements
  setupUIElements();

  // Set up event handlers
  setupEventHandlers();

  // Add UI behavior
  addUIBehavior();

  console.log('User interface initialized');
}

/**
 * Set up UI elements
 */
function setupUIElements() {
  // Set stage dimensions based on window size
  window.addEventListener('resize', resizeWindow);

  // Create any dynamic UI elements
  createDynamicElements();

  // Initialize UI state
  refreshUI();
}

/**
 * Set up event handlers for UI elements
 */
function setupEventHandlers() {
  // Window resize handler
  window.addEventListener('resize', resizeWindow);

  // Set up hover effects for buttons
  setupHoverEffects();

  // Set up click handlers for UI buttons
  setupButtonHandlers();
}

/**
 * Add UI behavior
 */
function addUIBehavior() {
  // Show/hide controls on video hover
  addVideoControlsBehavior();

  // Set up score display animations
  addScoreAnimations();

  // Set up question toggle behavior
  addQuestionToggleBehavior();
}

/**
 * Resize stage to fit window
 */
function createDynamicElements() {
  // Create screen reader live region if needed
  createLiveRegion();
}

/**
 * Create a live region for screen reader announcements
 */
function createLiveRegion() {
  // Create a hidden element for screen reader announcements
  if (!document.getElementById('sr-announcer')) {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }
}

/**
 * Refresh the UI state
 */
export function refreshUI() {
  // Update button states
  updateButtonStates();

  // Update score display
  updateScoreDisplay();

  // Update question buttons
  updateQuestionButtons();
}

/**
 * Update button states based on current application state
 */
function updateButtonStates() {
  // Update toggle questions button
  const toggleButton = document.getElementById('toggleQuestionButton');
  if (toggleButton) {
    toggleButton.style.visibility = state.questionToggleEnabled ? 'visible' : 'hidden';
    toggleButton.setAttribute('aria-pressed', state.showingQuestions ? 'true' : 'false');
  }

  // Update user info button
  const userInfoButton = document.getElementById('userInfoButton');
  if (userInfoButton) {
    userInfoButton.style.visibility = 'visible';
  }

  // Update reset questions button
  const resetButton = document.getElementById('resetQuestionButton');
  if (resetButton) {
    resetButton.style.visibility = state.questions && state.questions.questions && state.questions.questions.length > 0 ? 'visible' : 'hidden';
  }
}

/**
 * Update score display
 */
function updateScoreDisplay() {
  const scoreNum = document.getElementById('scoreNum');
  const scoreBar = document.getElementById('scoreBar');

  if (scoreNum) {
    scoreNum.textContent = state.userScore;
  }

  if (scoreBar) {
    const maxScore = config.scoring.maxVideoScore + config.scoring.maxQuestionScore;
    const percent = Math.min(100, Math.floor((state.userScore / maxScore) * 100));
    scoreBar.style.width = `${percent}%`;
  }

  // Update medals
  updateMedals();
}

/**
 * Update medals based on score
 */
function updateMedals() {
  const maxScore = config.scoring.maxVideoScore + config.scoring.maxQuestionScore;
  const percentage = (state.userScore / maxScore) * 100;

  const medal0 = document.getElementById('medal0');
  const medal1 = document.getElementById('medal1');
  const medal2 = document.getElementById('medal2');

  if (medal0 && medal1 && medal2) {
    // Bronze (60%)
    if (percentage >= 60) {
      medal0.classList.add('medalEarned');
    } else {
      medal0.classList.remove('medalEarned');
    }

    // Silver (80%)
    if (percentage >= 80) {
      medal1.classList.add('medalEarned');
    } else {
      medal1.classList.remove('medalEarned');
    }

    // Gold (95%)
    if (percentage >= 95) {
      medal2.classList.add('medalEarned');
    } else {
      medal2.classList.remove('medalEarned');
    }
  }
}

/**
 * Update question buttons
 */
function updateQuestionButtons() {
  if (!state.questions || !state.questions.questions) return;

  for (let i = 0; i < state.questions.questions.length; i++) {
    const button = document.getElementById(`questionButton${i}`);
    const buttonIcon = document.getElementById(`questionButtonIcon${i}`);

    if (button && buttonIcon) {
      if (state.userData.answerData[i]?.correct) {
        button.classList.add('questionButtonCorrect');
        buttonIcon.classList.add('questionButtonIconCorrect');
      } else {
        button.classList.remove('questionButtonCorrect');
        buttonIcon.classList.remove('questionButtonIconCorrect');
      }
    }
  }
}

/**
 * Set up hover effects for buttons
 */
function setupHoverEffects() {
  // User info button hover
  const userInfoButton = document.getElementById('userInfoButton');
  const userInfoBox = document.getElementById('userInfoBox');

  if (userInfoButton && userInfoBox) {
    userInfoButton.addEventListener('mouseenter', () => {
      userInfoBox.classList.remove('anim_quickFadeOut');
      userInfoBox.classList.add('anim_quickFadeIn');
    });

    userInfoButton.addEventListener('mouseleave', () => {
      userInfoBox.classList.remove('anim_quickFadeIn');
      userInfoBox.classList.add('anim_quickFadeOut');
    });
  }

  // Toggle question button hover
  const toggleQuestionButton = document.getElementById('toggleQuestionButton');
  const toggleQuestionBox = document.getElementById('toggleQuestionBox');

  if (toggleQuestionButton && toggleQuestionBox) {
    toggleQuestionButton.addEventListener('mouseenter', () => {
      toggleQuestionBox.classList.remove('anim_quickFadeOut');
      toggleQuestionBox.classList.add('anim_quickFadeIn');
    });

    toggleQuestionButton.addEventListener('mouseleave', () => {
      toggleQuestionBox.classList.remove('anim_quickFadeIn');
      toggleQuestionBox.classList.add('anim_quickFadeOut');
    });
  }

  // Reset question button hover
  const resetQuestionButton = document.getElementById('resetQuestionButton');
  const resetQuestionBox = document.getElementById('resetQuestionBox');

  if (resetQuestionButton && resetQuestionBox) {
    resetQuestionButton.addEventListener('mouseenter', () => {
      resetQuestionBox.classList.remove('anim_quickFadeOut');
      resetQuestionBox.classList.add('anim_quickFadeIn');
    });

    resetQuestionButton.addEventListener('mouseleave', () => {
      resetQuestionBox.classList.remove('anim_quickFadeIn');
      resetQuestionBox.classList.add('anim_quickFadeOut');
    });
  }

  // Video skip button hover
  const videoSkip = document.getElementById('videoSkip');
  const videoSkipBox = document.getElementById('videoSkipBox');

  if (videoSkip && videoSkipBox) {
    videoSkip.addEventListener('mouseenter', () => {
      videoSkipBox.classList.remove('anim_quickFadeOut');
      videoSkipBox.classList.add('anim_quickFadeIn');
    });

    videoSkip.addEventListener('mouseleave', () => {
      videoSkipBox.classList.remove('anim_quickFadeIn');
      videoSkipBox.classList.add('anim_quickFadeOut');
    });
  }
  //score information bar hover
//   const scoreInfo = document.getElementById('scoreInfo');
//   const scoreInfoTitle = document.getElementById('scoreInfoTitle');
//   const scoreInfoText = document.getElementById('scoreInfoText');

//   if (scoreInfo) {
//   scoreInfo.addEventListener('mouseenter', () => {
//     scoreInfo.classList.remove('anim_quickFadeOut');
//     scoreInfo.classList.add('anim_quickFadeIn');
//   });
//   scoreInfo.addEventListener('mouseleave', () => {
//     scoreInfo.classList.remove('anim_quickFadeIn');
//     scoreInfo.classList.add('anim_quickFadeOut');
//   });
// }
const scoreBox = document.getElementById('scoreBox');
const scoreInfo = document.getElementById('scoreInfo');
if (scoreBox && scoreInfo) {
  scoreBox.addEventListener('mouseenter', () => {
    scoreInfo.classList.remove('anim_quickFadeOut');
    scoreInfo.classList.add('anim_quickFadeIn');
  });
  scoreBox.addEventListener('mouseleave', () => {
    scoreInfo.classList.remove('anim_quickFadeIn');
    scoreInfo.classList.add('anim_quickFadeOut');
  });
}

  // if (scoreInfo && scoreInfoTitle && scoreInfoText) {
  //   scoreInfo.addEventListener('mouseenter', () => {
  //     scoreInfoTitle.classList.remove('anim_quickFadeOut');
  //     //void scoreInfoTitle.offsetWidth;
  //     scoreInfoTitle.classList.add('anim_quickFadeIn');
  //     scoreInfoText.classList.remove('anim_quickFadeOut');
  //     //void scoreInfoText.offsetWidth;
  //     scoreInfoText.classList.add('anim_quickFadeIn');
  //   });

  //   scoreInfo.addEventListener('mouseleave', () => {
  //     scoreInfoTitle.classList.remove('anim_quickFadeIn');
  //     //void scoreInfoTitle.offsetWidth;
  //     scoreInfoTitle.classList.add('anim_quickFadeOut');
  //     scoreInfoText.classList.remove('anim_quickFadeIn');
  //     //void scoreInfoText.offsetWidth;
  //     scoreInfoText.classList.add('anim_quickFadeOut');
  //   });
  // }
}

/**
 * Set up click handlers for UI buttons
 */
function setupButtonHandlers() {
  // Reset questions button
  const resetQuestionButton = document.getElementById('resetQuestionButton');
  if (resetQuestionButton) {
    resetQuestionButton.addEventListener('click', () => {
      if (confirm('This will reset your quiz score and allow you to take it again, continue?')) {
        questionManager.resetQuiz();
      }
    });
  }

  // Video skip button
  const videoSkip = document.getElementById('videoSkip');
  if (videoSkip) {
    videoSkip.addEventListener('click', () => {
      videoPlayer.jumpToUnwatched();
    });
  }

  // Show question button
  const showQuestionButton = document.getElementById('showQuestionButton');
  if (showQuestionButton) {
    showQuestionButton.addEventListener('click', () => {
      questionManager.showQuestionPanel();
    });
  }

  // Hide question button
  const hideQuestionButton = document.getElementById('hideQuestionButton');
  if (hideQuestionButton) {
    hideQuestionButton.addEventListener('click', () => {
      questionManager.hideQuestionPanel();
    });
  }

  //Score info box
  // const scoreBox = document.getElementById('scoreBox');
  // const scoreInfo = document.getElementById('scoreInfo');

  // if (scoreBox && scoreInfo) {
  //   scoreBox.addEventListener('mouseenter', () => {
  //     scoreInfo.style.display = 'block';
  //   });

  //   scoreBox.addEventListener('mouseleave', () => {
  //     scoreInfo.style.display = 'none';
  //   });
  // }
}

/**
 * Add video controls behavior
 */
function addVideoControlsBehavior() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoControls = document.getElementById('videoControls');

  if (videoPlayer && videoControls) {
    let controlsTimeout;

    // Show controls on hover
    videoPlayer.addEventListener('mouseenter', () => {
      videoControls.style.opacity = '1';
      clearTimeout(controlsTimeout);
    });

    // Hide controls when mouse leaves
    videoPlayer.addEventListener('mouseleave', () => {
      if (!state.video || !state.video.paused) {
        controlsTimeout = setTimeout(() => {
          videoControls.style.opacity = '0';
        }, 2000);
      }
    });

    // Show controls on mouse movement
    videoPlayer.addEventListener('mousemove', () => {
      videoControls.style.opacity = '1';
      clearTimeout(controlsTimeout);

      if (!state.video || !state.video.paused) {
        controlsTimeout = setTimeout(() => {
          videoControls.style.opacity = '0';
        }, 2000);
      }
    });
  }
}

/**
 * Add score animations
 */
function addScoreAnimations() {
  const scoreBubble = document.getElementById('scoreBubble');
  if (!scoreBubble) return;

  // Reset animation when it ends
  scoreBubble.addEventListener('animationend', () => {
    scoreBubble.classList.remove('anim_scoreBubble');
  });
}

/**
 * Add question toggle behavior
 */
function addQuestionToggleBehavior() {
  const toggleQuestionButton = document.getElementById('toggleQuestionButton');
  if (!toggleQuestionButton) return;

  toggleQuestionButton.addEventListener('click', () => {
    questionManager.toggleQuestions();

    // Update accessibility announcement
    const message = state.showingQuestions ? 'Questions shown' : 'Questions hidden';
    announceToScreenReader(message);
  });
}

/**
 * Show loading indicator
 * @param {string} message - Loading message to display
 */
export function showLoading(message = 'Loading...') {
  // Create or update loading indicator
  let loadingIndicator = document.getElementById('loading-indicator');

  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.borderRadius = '10px';
    loadingIndicator.style.zIndex = '1000000';
    loadingIndicator.style.textAlign = 'center';

    const spinner = document.createElement('div');
    spinner.style.border = '5px solid #f3f3f3';
    spinner.style.borderTop = '5px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '30px';
    spinner.style.height = '30px';
    spinner.style.margin = '0 auto 10px auto';
    spinner.style.animation = 'spin 2s linear infinite';

    const messageElement = document.createElement('div');

    loadingIndicator.appendChild(spinner);
    loadingIndicator.appendChild(messageElement);
    document.body.appendChild(loadingIndicator);

    // Add animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Update message
  const messageElement = loadingIndicator.querySelector('div:not([style*="border"])');
  if (messageElement) {
    messageElement.textContent = message;
  }

  // Make visible
  loadingIndicator.style.display = 'block';
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 * @param {number} [duration=5000] - Duration to show the message in milliseconds
 */
export function showError(message, duration = 5000) {
  // Create or update error message
  let errorElement = document.getElementById('error-message');

  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'error-message';
    errorElement.style.position = 'absolute';
    errorElement.style.top = '10px';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translateX(-50%)';
    errorElement.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
    errorElement.style.color = 'white';
    errorElement.style.padding = '10px 20px';
    errorElement.style.borderRadius = '5px';
    errorElement.style.zIndex = '1000000';
    errorElement.style.textAlign = 'center';
    errorElement.style.maxWidth = '80%';

    document.body.appendChild(errorElement);
  }

  // Update message
  errorElement.textContent = message;

  // Make visible
  errorElement.style.display = 'block';

  // Auto-hide after duration
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, duration);

  // Announce error to screen readers
  announceToScreenReader(message, true);
}

// Export module API
export default {
  initUserInterface,
  // resizeStage,
  refreshUI,
  showLoading,
  hideLoading,
  showError
};