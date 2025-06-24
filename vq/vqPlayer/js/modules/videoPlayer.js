/**
 * videoPlayer.js
 * Handles video player functionality for the Quiz application
 */

import config from './config.js';
import state from './state.js';
import { formatTime, throttle } from './utils.js';

// Private variables for module
let seekingInterval = null;
let progressUpdateInterval = null;

/**
 * Initialize the video player
 * @param {HTMLVideoElement} videoElement - The video element
 */
export function initVideoPlayer(videoElement) {
  if (!videoElement) {
    console.error('Video element not found');
    return;
  }

  state.video = videoElement;

  if (state.video) {
    state.video.addEventListener('pause', () => {
      const timeDisplay = document.getElementById('timeDisplayText');
      if (timeDisplay && window.announce) {
        window.announce(`Paused at ${timeDisplay.textContent}`);
      }
    });
  }

  // Set up event listeners
  videoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
  videoElement.addEventListener('ended', handleVideoEnded);
  videoElement.addEventListener('timeupdate', handleTimeUpdate);

  // Set up controls
  initPlayPauseButton();
  initSeekSlider();
  initVolumeControls();
  initPlaybackSpeedControl();

  // Start progress tracking
  startProgressTracking();

  // Handle autoplay if enabled
  if (videoElement.autoplay) {
    handleAutoplay();
  }

  console.log('Video player initialized');
}

/**
 * Initialize play/pause button functionality
 */
function initPlayPauseButton() {
  const playPauseBtn = document.getElementById('videoPlayPause');
  console.log('Init PlayPause button');

  const bigPlayBtn = document.getElementById('bigPlay');
  if (bigPlayBtn) {
    console.log('bigPlayBtn found:', bigPlayBtn);
  } else {
    console.log('bigPlay element not found in DOM');
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
    console.log('Init PlayPause button');
  }

  if (bigPlayBtn) {
    bigPlayBtn.addEventListener('click', () => {
      console.log('Big play button clicked!');
      togglePlayPause();
    });
  }
}

/**
 * Initialize seek slider functionality
 */
function initSeekSlider() {
  const seekSlider = document.getElementById('seekSlider');

  if (seekSlider) {
    seekSlider.addEventListener('input', handleSeekBarChange);
    seekSlider.addEventListener('change', handleSeekBarRelease);
    seekSlider.addEventListener('mousedown', () => { state.scrubbing = true; });
    seekSlider.addEventListener('touchstart', () => { state.scrubbing = true; });

    // Set up interval for updating seek bar during scrubbing
    seekingInterval = setInterval(() => {
      if (!state.scrubbing) updateSeekBar();
    }, 200);
  }

  // Add handlers for clicking anywhere on the body to end scrubbing
  document.body.addEventListener('mouseup', () => {
    if (state.scrubbing) state.scrubbing = false;
  });

  document.body.addEventListener('touchend', () => {
    if (state.scrubbing) state.scrubbing = false;
  });
}

/**
 * Initialize volume controls
 */
function initVolumeControls() {
  const volumeSlider = document.getElementById('volumeSlider');
  const muteButton = document.getElementById('muteButton');

  // Set initial volume based on stored preference or default
  setInitialVolume();

  if (volumeSlider) {
    volumeSlider.addEventListener('input', handleVolumeChange);
  }

  if (muteButton) {
    muteButton.addEventListener('click', toggleMute);
  }
}

/**
 * Initialize playback speed control
 */
function initPlaybackSpeedControl() {
  const playbackSpeed = document.getElementById('playbackSpeed');

  if (playbackSpeed) {
    // Set video playback speed on change
    playbackSpeed.addEventListener('change', () => {
      if (state.video) {
        state.video.playbackRate = parseFloat(playbackSpeed.value);
      }
    });

    // Remove unnecessary role if set
    if (playbackSpeed.getAttribute('role') === 'listbox') {
      playbackSpeed.removeAttribute('role');
    }
  }
}

/**
 * Set initial volume based on stored preference
 */
function setInitialVolume() {
  try {
    const volumeSlider = document.getElementById('volumeSlider');
    const savedVolume = localStorage.getItem('videoVolume');

    if (volumeSlider && savedVolume !== null) {
      volumeSlider.value = savedVolume;
      handleVolumeChange();
    }
  } catch (e) {
    console.warn('Could not set initial volume:', e.message);
  }
}

/**
 * Toggle play/pause state of the video
 */
export function togglePlayPause() {
  console.log('Play/Pause button clicked');
  if (!state.video) return;

  if (state.video.paused) {
    playVideo();
  } else {
    pauseVideo();
  }

  updatePlayPauseButton();
}

/**
 * Play the video
 */
export function playVideo() {
  if (!state.video) return;

  // Record current time as watch start time
  if (state.video.paused) {
    state.watchStart = Date.now();
  }

  // Ensure video is not muted when explicitly played
  state.video.muted = false;

  const playPromise = state.video.play();

  // Handle play promise (for browsers that return a promise)
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error('Play was prevented:', error);
      // Handle autoplay restrictions
      if (error.name === 'NotAllowedError') {
        showAutoplayBlockedMessage();
      }
    });
  }

  updatePlayPauseButton();
}

/**
 * Pause the video
 */
export function pauseVideo() {
  if (!state.video) return;

  state.video.pause();

  // Record watched time
  if (state.watchStart > 0) {
    recordTimeWatched();
  }

  updatePlayPauseButton();
}

/**
 * Update the play/pause button appearance based on video state
 */
function updatePlayPauseButton() {
  const playPauseBtn = document.getElementById('videoPlayPause');
  const bigPlayBtn = document.getElementById('bigPlay');

  if (!state.video) return;

  if (state.video.paused) {
    playPauseBtn?.classList.remove('playing');
    bigPlayBtn?.classList.remove('playing');
    bigPlayBtn?.classList.add('playState'); // Show play icon
    playPauseBtn.classList.add('playState');
  } else {
    playPauseBtn?.classList.add('playing');
    bigPlayBtn?.classList.add('playing');
    bigPlayBtn?.classList.remove('playState'); // Hide play icon
    playPauseBtn.classList.remove('playState');
  }
}

/**
 * Handle metadata loaded event
 */
function handleMetadataLoaded() {
  if (!state.video) return;

  // Update seek bar max value
  const seekSlider = document.getElementById('seekSlider');
  if (seekSlider) {
    seekSlider.max = state.video.duration;
  }

  // Create question markers at their appropriate times
  createQuestionMarkers();

  // Update duration display
  updateTimeDisplay();

  // Enable question toggle
  state.questionToggleEnabled = true;
}

/**
 * Handle video ended event
 */
function handleVideoEnded() {
  pauseVideo();
  recordTimeWatched();

  // Update UI to show replay option
  const bigPlayBtn = document.getElementById('bigPlay');
  if (bigPlayBtn) {
    bigPlayBtn.classList.add('replay');
  }
}

/**
 * Handle video time update event
 */
let watchedSeconds = new Set();

function handleTimeUpdate() {
  if (!state.video || state.scrubbing) return;

  updateSeekBar();
  updateTimeDisplay();
  checkQuestionTriggers();

  // Periodic tracking
  state.checkCounter++;
  if (state.checkCounter >= config.timing.countSet) {
    recordTimeWatched();
    state.checkCounter = 0;
  }

  // Always update score
  updateScore();
}

export function updateScore() {
  const video = document.getElementById('videoBox');
  if (!video || isNaN(video.duration)) return;

  const floorDuration = Math.floor(video.duration || 1);
  const maxVideoScore = config.scoring.maxVideoScore || 1000;
  const maxQuestionScore = config.scoring.maxQuestionScore || 1000;
  const maxScore = maxVideoScore + maxQuestionScore;

  // --- Initialize watchedSecondsArray ---
  if (!userData.watchedSecondsArray || userData.watchedSecondsArray.length !== floorDuration) {
    userData.watchedSecondsArray = new Array(floorDuration).fill(0);
  }

  // --- Calculate video score ---
  let watchedSeconds = 0;
  for (let i = 0; i < floorDuration; i++) {
    if (userData.watchedSecondsArray[i] > 0) watchedSeconds++;
  }
  const videoScore = Math.round((watchedSeconds / floorDuration) * maxVideoScore);

  // --- Calculate quiz score ---
  let quizScore = 0;
  if (questions && Array.isArray(questions.questions) && questions.questions.length > 0) {
    const questionCount = questions.questions.length;
    let totalRawScore = 0;

    if (Array.isArray(userData.answerData)) {
      for (let i = 0; i < userData.answerData.length; i++) {
        let rawScore = userData.answerData[i]?.score || 0;

        // Normalize score if raw scale is over 1 (e.g., 0–10)
        if (rawScore > 1) rawScore = rawScore / 10;

        // Clamp to 0–1 to avoid overcounting
        rawScore = Math.max(0, Math.min(1, rawScore));

        totalRawScore += rawScore;
      }
    }

    const normalizedScore = totalRawScore / questionCount;
    quizScore = Math.round(normalizedScore * maxQuestionScore);
    userData.quizScore = Math.round(quizScore / 10);
  }

  // --- Calculate total score (clamped to max) ---
  const combinedScore = Math.min(videoScore + quizScore, maxScore);
  state.userScore = combinedScore;

  // --- Update score display ---
  const scoreNum = document.getElementById('scoreNum');
  if (scoreNum) {
    scoreNum.textContent = state.userScore;
  }

  const scoreBar = document.getElementById('scoreBar');
  if (scoreBar) {
    const percent = Math.floor((state.userScore / maxScore) * 100);
    scoreBar.style.width = `${Math.min(percent, 100)}%`;
  }

  // --- Best score tracking ---
  if (!userData.bestScore || state.userScore > userData.bestScore) {
    userData.bestScore = state.userScore;
  }

  // --- Trigger any follow-up medal updates ---
  if (typeof updateMedals === 'function') {
    updateMedals();
  }
}

// export function updateScore() {
//   const video = document.getElementById('videoBox');
//   let score = 0;
//   let watchedSeconds = 0;
//   const floorDuration = Math.floor(video.duration || 1);

//   // Calculate watched seconds
//   for (let i = 0; i < floorDuration; i++) {
//     if (userData.watchData[i] > 0) watchedSeconds++;
//   }
//   score += Math.round((watchedSeconds / floorDuration) * 1000);

//   // Add quiz question score
//   if (questions && questions.questions.length > 0) {
//     let questionScore = 0;
//     for (let i = 0; i < userData.answerData.length; i++) {
//       questionScore += userData.answerData[i].score || 0;
//     }
//     const quizScore = Math.round((questionScore / questions.questions.length) * 1000);
//     score += quizScore;
//     userData.quizScore = quizScore / 10;
//   } else {
//     score *= 2;
//   }

//   const maxScore = 2000;
//   score = Math.min(score, maxScore); // <-- Cap the score

//   document.getElementById('scoreNum').textContent = score;
//   document.getElementById('scoreBar').style.width = (score / maxScore * 100) + "%";

//   if (score >= userData.bestScore || !userData.bestScore) {
//     userData.bestScore = score;
//   }
//   updateMedals
// }
function updateMedals() {
  const maxScore = config.scoring.maxVideoScore + config.scoring.maxQuestionScore;
  const percentage = (state.userScore / maxScore) * 100;

  // Bronze at 60%, Silver at 80%, Gold at 95%
  const medals = document.querySelectorAll('.medal');

  if (medals.length >= 3) {
    // Bronze
    medals[0].classList.toggle('medalEarned', percentage >= 60);

    // Silver
    medals[1].classList.toggle('medalEarned', percentage >= 80);

    // Gold
    medals[2].classList.toggle('medalEarned', percentage >= 95);
  }
}

/**
 * Update the seek bar position based on current video time
 */
function updateSeekBar() {
  if (!state.video) return;

  const seekSlider = document.getElementById('seekSlider');
  const seekThumb = document.getElementById('seekSliderThumb');
  const seekTrack = document.getElementById('seekSliderTrack');

  if (seekSlider) {
    seekSlider.value = state.video.currentTime;
  }

  if (seekThumb && seekTrack) {
    const percent = (state.video.currentTime / state.video.duration) * 100;
    seekTrack.style.width = `${percent}%`;
  }
}

/**
 * Update the time display showing current time and duration
 */
function updateTimeDisplay() {
  if (!state.video) return;

  const timeDisplay = document.getElementById('timeDisplayText');

  if (timeDisplay) {
    const currentTime = formatTime(state.video.currentTime);
    const duration = formatTime(state.video.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
  }
}

/**
 * Handle seek bar change (during drag)
 */
function handleSeekBarChange() {
  if (!state.video) return;

  const seekSlider = document.getElementById('seekSlider');

  if (seekSlider) {
    // Update the video time as user drags the slider
    state.video.currentTime = parseFloat(seekSlider.value);
    updateTimeDisplay();
  }
}

/**
 * Handle seek bar release
 */
function handleSeekBarRelease() {
  if (!state.video) return;

  const seekSlider = document.getElementById('seekSlider');

  if (seekSlider) {
    // Finalize seeking when user releases the slider
    state.video.currentTime = parseFloat(seekSlider.value);
    state.scrubbing = false;

    // Check if we're seeking to a question point
    checkQuestionTriggers();
  }
}

/**
 * Handle volume change
 */
function handleVolumeChange() {
  if (!state.video) return;

  const volumeSlider = document.getElementById('volumeSlider');
  const volumeTrack = document.getElementById('volumeSliderTrack');

  if (volumeSlider) {
    const volume = parseFloat(volumeSlider.value) / 100;
    state.video.volume = volume;

    // Store volume preference
    try {
      localStorage.setItem('videoVolume', volumeSlider.value);
    } catch (e) {
      console.warn('Could not save volume preference:', e.message);
    }

    // Update mute button state
    updateMuteButton(volume === 0);

    // Update volume slider appearance
    if (volumeTrack) {
      volumeTrack.style.width = `${volumeSlider.value}%`;
    }
  }
}

/**
 * Toggle mute state
 */
function toggleMute() {
  if (!state.video) return;

  const volumeSlider = document.getElementById('volumeSlider');
  const wasMuted = state.video.volume === 0 || state.video.muted;

  if (wasMuted) {
    // Unmute
    state.video.muted = false;
    if (volumeSlider && parseInt(volumeSlider.value) === 0) {
      // If slider is at 0, set to 50
      volumeSlider.value = 50;
    }
  } else {
    // Mute
    state.video.muted = true;
  }

  // Apply the volume from slider
  handleVolumeChange();
  updateMuteButton(!wasMuted);
}

/**
 * Update mute button appearance
 * @param {boolean} muted - Whether the video is muted
 */
function updateMuteButton(muted) {
  const muteButton = document.getElementById('muteButton');

  if (muteButton) {
    if (muted) {
      muteButton.classList.add('muted');
      muteButton.classList.remove('unmuted');
    } else {
      muteButton.classList.add('unmuted');
      muteButton.classList.remove('muted');
    }
  }
}

/**
 * Create markers for question points in the video
 */
function createQuestionMarkers() {
  if (!state.video || !state.questions || !state.questions.questions) return;

  const questionsArray = state.questions.questions;
  const questionMarkers = document.getElementById('questionMarkers');

  if (!questionMarkers) return;

  // Clear existing markers
  questionMarkers.innerHTML = '';

  // Create marker for each question
  questionsArray.forEach((question, index) => {
    if (question.startTime) {
      const marker = document.createElement('div');
      marker.id = `questionMarker${index}`;
      marker.className = 'questionMarker';
      marker.setAttribute('role', 'presentation');
      marker.setAttribute('aria-hidden', 'true');

      // Calculate position based on video duration
      const position = (question.startTime / state.video.duration) * 100;
      marker.style.left = `${position}%`;

      // Create marker text
      const markerText = document.createElement('div');
      markerText.id = `questionMarkerText${index}`;
      markerText.className = 'questionMarkerText text fs-18';
      markerText.textContent = index + 1;

      marker.appendChild(markerText);
      questionMarkers.appendChild(marker);

      // Add click event for direct navigation
      marker.addEventListener('click', () => {
        state.video.currentTime = question.startTime;
        updateSeekBar();
        updateTimeDisplay();
      });
    }
  });
}

/**
 * Check if current time triggers any questions
 */
function checkQuestionTriggers() {
  if (!state.video || !state.questions || !state.questions.questions) return;

  const questionsArray = state.questions.questions;
  const currentTime = state.video.currentTime;

  // Don't trigger if we're already showing a question
  if (state.showingQuestion) return;

  // Check each question to see if it should be triggered
  for (let i = 0; i < questionsArray.length; i++) {
    const question = questionsArray[i];

    // If the current time is within 0.5 seconds of the question time and question hasn't been answered
    if (question.startTime &&
      Math.abs(currentTime - question.startTime) < 0.5 &&
      !state.userData.answerData[i]?.correct) {

      // Trigger the question
      triggerQuestion(i);
      break;
    }
  }
}

/**
 * Trigger a question to be displayed
 * @param {number} questionIndex - Index of the question to trigger
 */
function triggerQuestion(questionIndex) {
  // This is just a stub - the actual implementation would be in questionManager.js
  console.log(`Triggering question ${questionIndex + 1}`);

  // Pause the video when showing a question
  pauseVideo();

  // Dispatch event for question manager to handle
  const event = new CustomEvent('triggerQuestion', { detail: { questionIndex } });
  document.dispatchEvent(event);
}

/**
 * Jump to first unwatched section of the video
 */
export function jumpToUnwatched() {
  if (!state.video || !state.userData.watchData) return;

  const duration = state.video.duration;
  const watchData = state.userData.watchData;
  let skipTo = 0;

  // Find first unwatched section
  for (let i = 0; i < duration; i += 5) {
    let watched = false;

    for (let j = 0; j < watchData.length; j++) {
      if (i >= watchData[j].start && i <= watchData[j].end) {
        watched = true;
        break;
      }
    }

    if (!watched) {
      skipTo = i;
      break;
    }
  }

  // If we found an unwatched section, jump to it
  if (skipTo > 0 || skipTo < duration) {
    state.video.currentTime = skipTo;
    playVideo();
  }
}

/**
 * Record time watched for analytics
 */
function recordTimeWatched() {
  if (!state.video || state.watchStart === 0) return;

  const currentTime = state.video.currentTime;

  // Skip if time hasn't changed
  if (currentTime === state.lastTime) return;

  const start = Math.min(currentTime, state.lastTime);
  const end = Math.max(currentTime, state.lastTime);

  // Only record short jumps (under 30s)
  if (end > start && end - start < 30) {
    // Push detailed watch log
    userData.watchData.push({
      start,
      end,
      timestamp: Date.now()
    });

    // Update watchedSecondsArray
    const floorStart = Math.floor(start);
    const floorEnd = Math.floor(end);
    const videoDuration = Math.floor(state.video.duration || 1);

    if (!userData.watchedSecondsArray || userData.watchedSecondsArray.length !== videoDuration) {
      userData.watchedSecondsArray = new Array(videoDuration).fill(0);
    }

    for (let i = floorStart; i <= floorEnd && i < userData.watchedSecondsArray.length; i++) {
      userData.watchedSecondsArray[i] = 1;
    }
  }

  // Update last watch state
  state.lastTime = currentTime;
  state.watchStart = Date.now();

  // Periodic save
  if (Date.now() - state.lastSaved > config.timing.autoSaveInterval) {
    saveWatchData();
    state.lastSaved = Date.now();
  }
}

/**
 * Save watch data to server
 */
function saveWatchData() {
  // This is a stub - actual implementation would be in dataHandler.js
  const event = new CustomEvent('saveWatchData');
  document.dispatchEvent(event);
}

/**
 * Start progress tracking for analytics
 */
function startProgressTracking() {
  if (progressUpdateInterval) {
    clearInterval(progressUpdateInterval);
  }

  // Update progress every 10 seconds
  progressUpdateInterval = setInterval(() => {
    if (state.video && !state.video.paused) {
      recordTimeWatched();
    }
  }, 10000);
}

/**
 * Show message when autoplay is blocked
 */
function showAutoplayBlockedMessage() {
  console.log('Autoplay was blocked by the browser. User interaction required to play video.');
  // Add visual indicator or message to the UI
}

/**
 * Clean up video player resources
 */
export function destroyVideoPlayer() {
  if (state.video) {
    state.video.pause();

    // Remove event listeners
    state.video.removeEventListener('loadedmetadata', handleMetadataLoaded);
    state.video.removeEventListener('ended', handleVideoEnded);
    state.video.removeEventListener('timeupdate', handleTimeUpdate);

    // Clear intervals
    if (seekingInterval) clearInterval(seekingInterval);
    if (progressUpdateInterval) clearInterval(progressUpdateInterval);

    // Save final watch data
    recordTimeWatched();
    saveWatchData();

    // Clear state
    state.video = null;
  }
}

/**
 * Handle autoplay functionality
 */
function handleAutoplay() {
  // Modern browsers require user interaction before autoplay with sound
  if (state.video) {
    // Try to play muted first (more likely to be allowed)
    state.video.muted = true;

    const playPromise = state.video.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Autoplay started (muted)');
        // Unmute if allowed by user settings
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider && parseInt(volumeSlider.value) > 0) {
          // Wait a moment before unmuting to avoid browser restrictions
          setTimeout(() => {
            state.video.muted = false;
            updateMuteButton(false);
          }, 1000);
        }
      }).catch(error => {
        console.warn('Autoplay prevented:', error);
        showAutoplayBlockedMessage();
      });
    }
  }
}

// Export a clear API for use in other modules
export default {
  initVideoPlayer,
  togglePlayPause,
  playVideo,
  pauseVideo,
  jumpToUnwatched,
  destroyVideoPlayer
};