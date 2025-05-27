/**
 * ORIGINAL PATH: VQ/vq/vqPlayer/js/new-app.js
 * 
 * new-app.js
 * Modular implementation of the Video Quiz application with backwards compatibility
 * This file initializes all modules and coordinates their interactions
 */

// Import modules
import config from './modules/config.js';
import state from './modules/state.js';
import videoPlayer from './modules/videoPlayer.js';
import questionManager from './modules/questionManager.js';
import dataHandler from './modules/dataHandler.js';
import accessibility from './modules/accessibility.js';
import userInterface from './modules/userInterface.js';
import { getUrlVars } from './modules/utils.js';

// Compatibility layer for old app.js globals
// This ensures existing code that may reference these globals still works
(function setupCompatibilityLayer() {
  // Map the old global variables to our new state management
  window.questions = null;
  window.times = state.times;
  window.lastTime = state.lastTime;
  window.checkCounter = state.checkCounter;
  window.pause = state.pause;
  window.countSet = config.timing.countSet;
  window.currentQuestion = state.currentQuestion;
  window.video = state.video;
  window.scrubbing = state.scrubbing;
  window.showingQuestion = state.showingQuestion;
  window.answerData = state.answerData;
  window.disableClicks = state.disableClicks;
  window.letterPanels = state.letterPanels;
  window.letterFlipInterval = state.letterFlipInterval;
  window.quizComplete = state.quizComplete;
  window.questionToggleEnabled = state.questionToggleEnabled;
  window.showingQuestions = state.showingQuestions;
  window.lastSaved = state.lastSaved;
  window.lastWatched = state.lastWatched;
  window.recordedCompletion = state.recordedCompletion;
  window.permissionData = state.permissionData;
  window.canView = state.canView;
  window.userScore = state.userScore;
  window.watchStart = state.watchStart;
  window.userData = state.userData;
  
  // Define compatibility functions that map to our modular implementation
  window.refresh = function() {
    userInterface.refreshUI();
  };
  
  window.togglePlayPause = function() {
    videoPlayer.togglePlayPause();
  };
  
  window.playVideo = function() {
    videoPlayer.playVideo();
  };
  
  window.pauseVideo = function() {
    videoPlayer.pauseVideo();
  };
  
  window.setQuestion = function(n) {
    questionManager.setQuestion(n);
  };
  
  window.selectAnswer = function(i) {
    questionManager.selectAnswer(i);
  };
  
  window.submitTextAnswer = function(answer) {
    questionManager.submitTextAnswer(answer);
  };
  
  window.showQuestionPanel = function() {
    questionManager.showQuestionPanel();
  };
  
  window.hideQuestionPanel = function() {
    questionManager.hideQuestionPanel();
  };
  
  window.makeQuestionButtons = function() {
    questionManager.makeQuestionButtons();
  };
  
  window.toggleQuestions = function() {
    questionManager.toggleQuestions();
  };
  
  window.checkFinished = function() {
    return questionManager.checkFinished();
  };
  
  // Create live proxies for state variables
  // This ensures any code that modifies these variables will update our state
  Object.keys(state).forEach(key => {
    if (typeof window[key] !== 'undefined') {
      Object.defineProperty(window, key, {
        get: function() { return state[key]; },
        set: function(value) { state[key] = value; }
      });
    }
  });
})();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Video Quiz application initializing...');
  
  // Parse URL parameters
  try {
    state.urlVars = getUrlVars();
  } catch (e) {
    console.warn('Error parsing URL parameters:', e);
  }
  
  // Display loading indicator
  userInterface.showLoading('Loading Video Quiz...');
  
  // Initialize modules in order
  initializeApp()
    .then(() => {
      userInterface.hideLoading();
      console.log('Video Quiz application initialized successfully');
    })
    .catch((error) => {
      userInterface.hideLoading();
      userInterface.showError(`Error initializing application: ${error.message}`);
      console.error('Error initializing application:', error);
    });
});

/**
 * Initialize the application
 * @returns {Promise} Promise that resolves when initialization is complete
 */
async function initializeApp() {
  try {
    // Initialize UI first for visual feedback
    userInterface.initUserInterface();
    
    // Initialize accessibility features
    accessibility.initAccessibility();
    
    // Initialize data handler and load data
    await initializeData();
    
    // Initialize video player
    initializeVideoPlayer();
    
    // Initialize question manager
    questionManager.initQuestionManager();
    
    // Set up event listeners for module communication
    setupEventListeners();
    
    // Refresh UI with loaded data
    userInterface.refreshUI();
    
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Initialize data loading
 */
async function initializeData() {
  return new Promise((resolve, reject) => {
    // Set up data loaded event
    document.addEventListener('dataLoaded', () => {
      // Update global questions variable for backward compatibility
      window.questions = state.questions;
      resolve();
    }, { once: true });
    
    // Initialize data handler (will trigger dataLoaded event when complete)
    dataHandler.initDataHandler();
    
    // Set a timeout for data loading
    setTimeout(() => {
      reject(new Error('Data loading timed out'));
    }, 30000);
  });
}

/**
 * Initialize video player
 */
function initializeVideoPlayer() {
  const videoElement = document.getElementById('videoBox');
  if (!videoElement) {
    throw new Error('Video element not found');
  }
  
  videoPlayer.initVideoPlayer(videoElement);
  
  // Set global video reference for backward compatibility
  window.video = state.video;
}

/**
 * Set up event listeners for module communication
 */
function setupEventListeners() {
  // Listen for quiz completion
  document.addEventListener('quizCompleted', (event) => {
    console.log('Quiz completed with score:', event.detail.score);
    
    // Save completion data
    dataHandler.saveUserData(true, event.detail.score);
  });
  
  // Listen for user data reset
  document.addEventListener('userDataReset', () => {
    userInterface.refreshUI();
  });
  
  // Listen for questions loaded
  document.addEventListener('questionsLoaded', () => {
    console.log('Questions loaded event received in new-app.js');
    
    // Update global questions variable for backward compatibility
    window.questions = state.questions;
    
    // Ensure buttonBank is refreshed after questions load
    setTimeout(() => {
      userInterface.refreshUI();
    }, 100);
  });
  
  // Listen for window beforeunload to save data
  window.addEventListener('beforeunload', () => {
    dataHandler.saveUserData();
  });
}

// Export the main modules for global access if needed
window.videoQuiz = {
  config,
  state,
  videoPlayer,
  questionManager,
  dataHandler,
  accessibility,
  userInterface
};

export default {
  state,
  videoPlayer,
  questionManager,
  dataHandler
};