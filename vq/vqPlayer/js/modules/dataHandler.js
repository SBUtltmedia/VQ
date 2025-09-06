/**
 * dataHandler.js
 * Manages data loading, saving, and synchronization for the Video Quiz application
 */

import config from "./config.js";
import state from "./state.js";
import { getUrlVars, canAccessLocalStorage } from "./utils.js";
import { updateScore } from "./videoPlayer.js";

/**
 * Initialize the data handler
 */
export function initDataHandler() {
  // Parse URL parameters
  state.urlVars = getUrlVars();

  // Load permissions data
  loadPermissions()
    .then(() => {
      // Only proceed if the user has permission to view the quiz
      if (state.canView) {
        // Load quiz data first, then user data
        return loadQuizData().then(() => {
          return loadUserData().then(userData => {
            resumeVideoFromServer(userData);
            return userData;
          });
        });
      }
      return Promise.reject("No view permission");
    })
    .then(() => {
      // Dispatch event to signal data is loaded
      document.dispatchEvent(new CustomEvent("dataLoaded"));
    })
    .catch((error) => {
      console.error("Error initializing data:", error);
      showErrorMessage(error);
    });

  // Set up event listeners for data saving
  setupEventListeners();
  //setupVideoAutoSave();
}

/**
 * Setup event listeners for data saving
 */
function setupEventListeners() {
  // Listen for watch data save requests
  document.addEventListener("saveWatchData", () => {
    saveWatchData();
  });

  // Listen for user data save requests
  document.addEventListener("saveUserData", () => {
    saveUserData();
  });

  // Listen for quiz completion
  document.addEventListener("quizCompleted", (event) => {
    // Save completion data with final score
    saveUserData(true, event.detail.score);
  });

  // Set up auto-save timer
  setInterval(() => {
    if (Date.now() - state.lastSaved > config.timing.autoSaveInterval) {
      saveUserData();
      state.lastSaved = Date.now();
    }
  }, config.timing.autoSaveInterval);
}
/**
 * Set up auto-saving watch data based on video playback
 */
// function setupVideoAutoSave() {
//   const video = document.getElementById("videoBox");

//   if (!video) {
//     console.warn("Video element not found for autosave.");
//     return;
//   }

//   video.addEventListener("timeupdate", () => {
//     const now = Date.now();
//     const currentTime = Math.floor(video.currentTime);

//     // Ensure userData and watchData are initialized
//     if (!state.userData) return;
//     if (!Array.isArray(state.userData.watchData)) {
//       state.userData.watchData = [];
//     }

//     // Mark this second as watched
//     state.userData.watchData[currentTime] = 1;

//     // Update last watched timestamp
//     state.lastWatched = now;

//     // Save every 60 seconds
//     if (!state.lastSaved || now - state.lastSaved > 60000) {
//       saveWatchData();
//       state.lastSaved = now;
//     }
//   });

//   // Optional: Save on pause or end
//   video.addEventListener("pause", saveWatchData);
//   video.addEventListener("ended", saveWatchData);
// }

function resumeVideoFromServer(userData) {
  const video = document.getElementById("videoBox");
  if (!video) return;

  // Check for lastPosition in userData
  const lastPosition = userData?.lastPosition || state.userData?.lastPosition;
  
  if (lastPosition && typeof lastPosition === 'number') {
    // Wait for video metadata to load to get duration
    if (video.duration && !isNaN(video.duration)) {
      // Video already loaded
      if (lastPosition < video.duration) {
        video.currentTime = lastPosition;
        console.log("Resumed video at:", lastPosition, "seconds");
      }
    } else {
      // Wait for metadata to load
      video.addEventListener("loadedmetadata", () => {
        if (lastPosition < video.duration) {
          video.currentTime = lastPosition;
          console.log("Resumed video at:", lastPosition, "seconds");
        }
      }, { once: true });
    }
  }
}



/**
 * Load permissions data
 * @returns {Promise} Promise that resolves when permissions are loaded
 */
async function loadPermissions() {
  const permissionsPath = "./json/permissions.json"; // Path based on config.quizFile pattern

  const defaultPermissions = {
    locked: "false", // string "false" as per old defaults
    sharedWith: [],
    canEdit: [],
    isPublicFromDefault: true, // Flag to indicate these are our fallback defaults
  };

  try {
    const response = await fetch(permissionsPath);

    if (response.status === 404) {
      // Specifically handle Not Found
      console.log(
        `permissions.json not found at ${permissionsPath}, using defaults.`,
      );
      state.permissionData = { ...defaultPermissions };
    } else if (!response.ok) {
      // Handle other network/server errors
      // Make sure to await response.text() or .json() to consume the body before throwing for some error types
      const errorBody = await response.text();
      throw new Error(
        `Failed to load permissions from ${permissionsPath}: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    } else {
      // File found and response is OK
      state.permissionData = await response.json();
      // Ensure isPublicFromDefault is not present if file is loaded
      if (state.permissionData.hasOwnProperty("isPublicFromDefault")) {
        delete state.permissionData.isPublicFromDefault;
      }
    }

    // Determine state.canView based on the final state.permissionData
    if (
      state.permissionData.isPublic === true ||
      state.permissionData.isPublicFromDefault === true
    ) {
      state.canView = true;
    } else if (state.permissionData.locked === "false") {
      state.canView = true;
    } else {
      // If not explicitly public or unlocked by "locked":"false", use authentication logic.
    state.canView = checkUserAuthentication();
    }
  } catch (error) {
    console.error("Error in loadPermissions:", error);
    // Fallback in case of any unexpected error
    state.permissionData = { ...defaultPermissions };
    state.canView = true; // Default to viewable on error
  }

  // updateBlockerVisibility should be called after state.canView is definitively set.
  // It was originally inside the try block, but makes sense here too.
  // Ensure it's defined and accessible in this scope.
  if (typeof updateBlockerVisibility === "function") {
    updateBlockerVisibility();
  } else {
    // console.warn('updateBlockerVisibility function not found, UI may not update correctly.');
    // Depending on your structure, it might be part of an imported module or a global.
    // If it's in the same file, it should be fine.
  }

  return state.permissionData;
}

/**
 * Recompute view permission using legacy logic (like app.js)
 */
function recomputeCanView() {
  try {
    let canView = false;
    const perm = state.permissionData || {};
    const user = state.userData || {};

    // Legacy logic: if not explicitly private, allow view
    if (perm.isPrivate !== true) {
      canView = true;
    } else {
      const netId = user.netID;
      const canAccessList = Array.isArray(perm.canAccessData) ? perm.canAccessData : [];
      const canViewQuizList = Array.isArray(perm.canViewQuiz) ? perm.canViewQuiz : [];

      if (netId && (canAccessList.includes(netId) || canViewQuizList.includes(netId))) {
        canView = true;
      }

      if (!canView && netId && window.location && typeof window.location.href === 'string') {
        if (window.location.href.indexOf(netId) !== -1) {
          canView = true;
        }
      }
    }

    state.canView = canView;
    // Update blocker visibility immediately when this changes
    updateBlockerVisibility();
  } catch (e) {
    console.warn('recomputeCanView failed:', e);
  }
}

/**
 * Check if current user is authenticated and has access
 * @returns {boolean} True if user has access
 */
function checkUserAuthentication() {
  // Get user info from session if available
  const userEmail = document.querySelector('meta[name="user-email"]')?.content;

  if (!userEmail) {
    return false;
  }

  // Check if user is in authorized list
  if (state.permissionData.authorizedUsers) {
    return state.permissionData.authorizedUsers.some(
      (user) => user.email === userEmail || user.email === "*",
    );
  }

  return false;
}

/**
 * Update visibility of the blocker element based on permissions
 */
function updateBlockerVisibility() {
  const blocker = document.getElementById("blocker");
  if (blocker) {
    blocker.style.display = state.canView ? "none" : "flex";
  }
}

/**
 * Load quiz data
 * @returns {Promise} Promise that resolves when quiz data is loaded
 */
async function loadQuizData() {
  try {
    const response = await fetch(config.quizFile);
    if (!response.ok) {
      throw new Error("Failed to load quiz data");
    }

    state.questions = await response.json();

    // Set document title
    if (state.questions.title) {
      document.title = state.questions.title;

      // Update quiz title display
      const quizTitle = document.getElementById("quizTitle");
      if (quizTitle) {
        quizTitle.textContent = state.questions.title;
      }
    }

    // Dispatch event to notify that questions are loaded
    document.dispatchEvent(new CustomEvent("questionsLoaded"));

    return state.questions;
  } catch (error) {
    console.error("Error loading quiz data:", error);
    showErrorMessage("Failed to load quiz. Please try refreshing the page.");
    return null;
  }
}

/**
 * Load user data
 * @returns {Promise} Promise that resolves when user data is loaded
 */
async function loadUserData() {
  console.log("loadUserData called");
  try {
    const serverResponse = await fetch("loadUserData.php", {
      credentials: "same-origin",
    });

    if (serverResponse.ok) {
      const serverData = await serverResponse.json();
      if (serverData && Object.keys(serverData).length > 0) {
        updateUserDataFromServer(serverData);
        return state.userData;
      }
    }

    console.warn("Server returned no data, initializing new userData.");
    return initializeNewUserData();
  } catch (error) {
    console.warn("Error loading user data:", error);
    return initializeNewUserData();
  }
}



/**
 * Load data from local storage
 * @returns {Object} User data
 */
function loadLocalData() {
  if (!canAccessLocalStorage()) {
    return initializeNewUserData();
  }

  try {
    const data = localStorage.getItem("quizUserData");
    if (data) {
      updateUserDataFromServer(JSON.parse(data));
      return state.userData;
    }
  } catch (error) {
    console.warn("Error loading from local storage:", error);
  }

  return initializeNewUserData();
}

/**
 * Initialize new user data
 * @returns {Object} Default user data
 */
function initializeNewUserData() {
  // Create empty user data
  state.userData = {
    watchData: [],
    attempts: [],
    answerData: [],
    bestScore: 0,
    dataVersion: 1,
  };

  // Initialize answer data based on question count
  if (state.questions && state.questions.questions) {
    for (let i = 0; i < state.questions.questions.length; i++) {
      state.userData.answerData.push({ answers: [], correct: false, score: 0 });
    }
  }

  return state.userData;
}

/**
 * Update user data from server response
 * @param {Object} data - Data from server
 */
function updateUserDataFromServer(data) {
  if (!data) return;
  
  // Shallow merge: data overwrites client, but keep any client-only fields
  state.userData = {
    ...state.userData,
    ...data,
  };

  console.log("User data synced from server:", state.userData);

  // Carry over identity fields if provided by server
  if (data.nickname) state.userData.nickname = data.nickname;
  if (data.lastname) state.userData.lastname = data.lastname;
  if (data.netID) state.userData.netID = data.netID;

  // Update answer data, ensuring we have the right number of entries
  if (state.questions && state.questions.questions) {
    // Start with server data
    state.userData.answerData = data.answerData || [];

    // Ensure we have the right number of entries
    if (state.userData.answerData.length !== state.questions.questions.length) {
      const newAnswerData = [];

      for (let i = 0; i < state.questions.questions.length; i++) {
        if (i < state.userData.answerData.length) {
          newAnswerData.push(state.userData.answerData[i]);
        } else {
          newAnswerData.push({ answers: [], correct: false, score: 0 });
        }
      }

      state.userData.answerData = newAnswerData;
    }
  }

  // Ensure version number is set
  state.userData.dataVersion = data.dataVersion || 1;

  // Recompute canView with newly available user identity and update UI
  recomputeCanView();
  updateUIFromUserData();
}

/**
 * Update UI based on loaded user data
 */
function updateUIFromUserData() {
  // Update score display
  updateScore();

  // Update user info display
  const userInfoLogin = document.getElementById("userInfoLogin");
  if (userInfoLogin) {
    const email = document.querySelector('meta[name="user-email"]')?.content;
    const { nickname, lastname, netID } = state.userData || {};
    if (nickname || lastname || netID) {
      const namePart = [nickname, lastname].filter(Boolean).join(' ');
      const idPart = netID ? ` (${netID})` : '';
      userInfoLogin.textContent = `Signed in as ${namePart}${idPart}`;
    } else {
      userInfoLogin.textContent = `Signed in as ${email || 'Guest'}`;
    }
  }

  // Update completion status
  const userInfoComplete = document.getElementById("userInfoComplete");
  if (userInfoComplete) {
    const allCorrect = state.userData.answerData.every((data) => data.correct);

    if (allCorrect && state.userData.answerData.length > 0) {
      userInfoComplete.textContent = `You have completed this quiz with a score of ${state.userScore}.`;
      state.quizComplete = true;

      // Show completion message
      const gameCompleteText = document.getElementById("gameCompleteText");
      if (gameCompleteText) {
        gameCompleteText.textContent = `Quiz Complete! Final Score: ${state.userScore}`;
        gameCompleteText.style.opacity = 1;
      }
    } else {
      userInfoComplete.textContent = "You have not completed this quiz yet.";
    }
  }

  // Mirror legacy toggle/visibility behavior
  const toggleButton = document.getElementById('toggleQuestionButton');
  if (Array.isArray(state.userData.attempts) && state.userData.attempts.length > 0) {
    state.questionToggleEnabled = true;
  } else if (state.quizComplete) {
    state.questionToggleEnabled = false;
  } else {
    state.questionToggleEnabled = false;
  }

  if (toggleButton) {
    toggleButton.style.visibility = state.questionToggleEnabled ? 'visible' : 'hidden';
  }
}

/**
 * Save watch data to server
 * @returns {Promise} Promise that resolves when data is saved
 */
async function saveWatchData() {
  console.log("saveWatchData called", state.userData?.watchData, state.lastWatched);

  const watchData = state.userData?.watchData;
  const lastWatched = state.lastWatched;
  const WATCH_DATA_TIMEOUT = 60000;

  if (!Array.isArray(watchData) || watchData.length === 0) return;
  if (!lastWatched || Date.now() - lastWatched > WATCH_DATA_TIMEOUT) return;

  const video = document.getElementById("videoBox");
  if (video) {
    state.userData.lastPosition = Math.floor(video.currentTime);
  }

  try {
    const userEmail = document.querySelector('meta[name="user-email"]')?.content;

    if (userEmail) {
      const formData = new URLSearchParams();
      formData.append("user", userEmail);
      formData.append("userData", JSON.stringify(state.userData));

      const response = await fetch("./saveUserData.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to save watch data to server");
      }
    } else {
      console.info("User email not found; skipping server save.");
    }

    state.lastWatched = Date.now();
  } catch (error) {
    console.warn("Error saving watch data:", error);
  }
}



/**
 * Save user data to server
 * @param {boolean} [isComplete=false] - Whether the quiz is complete
 * @param {number} [finalScore=0] - Final score if complete
 * @returns {Promise} Promise that resolves when data is saved
 */
async function saveUserData(isComplete = false, finalScore = 0) {
  if (!state.userData) {
    console.warn("No user data available to save.");
    return;
  }

  const video = document.getElementById("videoBox");
  if (video) {
    state.userData.lastPosition = Math.floor(video.currentTime);
  }

  console.log("saveUserData called", { isComplete, finalScore, state });

  try {
    state.lastSaved = Date.now();

    const userEmail = document.querySelector('meta[name="user-email"]')?.content;

    if (userEmail) {
      const formData = new URLSearchParams();
      formData.append("user", userEmail);
      formData.append("userData", JSON.stringify(state.userData));
      formData.append("isComplete", isComplete);
      formData.append("finalScore", finalScore);

      const response = await fetch("saveUserData.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to save user data to server");
      }
    }
  } catch (error) {
    console.warn("Error saving user data:", error);
  }
}


/**
 * Clear user data
 */
export function clearUserData() {
  // Reset user data to defaults
  initializeNewUserData();

  // Clear local storage
  if (canAccessLocalStorage()) {
    localStorage.removeItem("quizUserData");
  }

  // Try to clear server data
  const userEmail = document.querySelector('meta[name="user-email"]')?.content;

  if (userEmail) {
    fetch("clearUserData.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: userEmail,
      }),
    }).catch((error) => {
      console.warn("Error clearing server data:", error);
    });
  }

  // Dispatch event to notify that user data was reset
  document.dispatchEvent(new CustomEvent("userDataReset"));
}

// /**
//  * Reset user progress (fresh start with 0 score)
//  */
// export async function resetUserProgress() {
//   const userEmail = document.querySelector('meta[name="user-email"]')?.content;
  
//   if (!userEmail) {
//     console.warn("No user email found for reset");
//     return false;
//   }

//   try {
//     // Call the reset endpoint
//     const response = await fetch(`saveUserData.php?reset=1&user=${encodeURIComponent(userEmail)}`);
//     const result = await response.json();
    
//     if (result.status === "success") {
//       console.log("User progress reset successfully");
      
//       // Reset local state
//       initializeNewUserData();
      
//       // Clear local storage
//       if (canAccessLocalStorage()) {
//         localStorage.removeItem("quizUserData");
//       }
      
//       // Reset video position
//       const video = document.getElementById("videoBox");
//       if (video) {
//         video.currentTime = 0;
//       }
      
//       // Update UI
//       updateUIFromUserData();
      
//       // Dispatch reset event
//       document.dispatchEvent(new CustomEvent("userDataReset"));
      
//       return true;
//     } else {
//       console.error("Reset failed:", result.message);
//       return false;
//     }
//   } catch (error) {
//     console.error("Error resetting user progress:", error);
//     return false;
//   }
// }

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  console.error(message);

  // Create error element if it doesn't exist
  let errorElement = document.getElementById("errorMessage");

  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = "errorMessage";
    errorElement.style.position = "fixed";
    errorElement.style.top = "10px";
    errorElement.style.left = "50%";
    errorElement.style.transform = "translateX(-50%)";
    errorElement.style.backgroundColor = "rgba(220, 53, 69, 0.9)";
    errorElement.style.color = "white";
    errorElement.style.padding = "10px 20px";
    errorElement.style.borderRadius = "5px";
    errorElement.style.zIndex = "10000";
    errorElement.style.textAlign = "center";
    errorElement.style.maxWidth = "80%";
    document.body.appendChild(errorElement);
  }

  errorElement.textContent = message;

  // Remove after 5 seconds
  setTimeout(() => {
    if (errorElement.parentNode) {
      errorElement.parentNode.removeChild(errorElement);
    }
  }, 5000);
}

/**
 * Get current grade for LMS integration
 * @returns {number} Grade as percentage
 */
export function getGrade() {
  const maxScore =
    config.scoring.maxVideoScore + config.scoring.maxQuestionScore;
  return Math.min(100, Math.floor((state.userScore / maxScore) * 100));
}

// Export a clear API for use in other modules
export default {
  initDataHandler,
  saveUserData,
  saveWatchData,
  clearUserData,
  //resetUserProgress,
  getGrade,
};
