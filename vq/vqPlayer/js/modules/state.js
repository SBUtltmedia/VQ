/**
 * state.js
 * Manages global state for the Video Quiz application
 */

// Create a state management object with getters/setters for reactive properties
class State {
  constructor() {
    // Video state
    this._video = null;
    this._scrubbing = false;
    this._watchStart = 0;
    this._lastTime = 0;
    this._times = [];
    this._pause = [];
    this._checkCounter = 0;
    
    // Questions state
    this._questions = null;
    this._currentQuestion = -1;
    this._answerData = [];
    this._showingQuestion = false;
    this._letterPanels = [];
    this._letterFlipInterval = -1;
    this._disableClicks = false;
    
    // UI state
    this._questionToggleEnabled = false;
    this._showingQuestions = true;
    this._quizComplete = false;
    
    // User data
    this._userData = {
      watchData: [],
      attempts: [],
      answerData: [],
      bestScore: 0,
      dataVersion: 1,
    };
    
    // Permissions and status
    this._permissionData = {};
    this._canView = false;
    this._userScore = 0;
    this._recordedCompletion = false;
    
    // Timing and tracking
    this._lastSaved = Date.now();
    this._lastWatched = Date.now();
    
    // Utility
    this._urlVars = null;
    this._progress = null;
    this._idleCheck = null;
    this._keydownListenerAdded = false;
  }
  
  // Getters and setters for video state
  get video() { return this._video; }
  set video(value) { this._video = value; }
  
  get scrubbing() { return this._scrubbing; }
  set scrubbing(value) { this._scrubbing = value; }
  
  get watchStart() { return this._watchStart; }
  set watchStart(value) { this._watchStart = value; }
  
  get lastTime() { return this._lastTime; }
  set lastTime(value) { this._lastTime = value; }
  
  get times() { return this._times; }
  set times(value) { this._times = value; }
  
  get pause() { return this._pause; }
  set pause(value) { this._pause = value; }
  
  get checkCounter() { return this._checkCounter; }
  set checkCounter(value) { this._checkCounter = value; }

  // Getters and setters for questions state
  get questions() { return this._questions; }
  set questions(value) { this._questions = value; }
  
  get currentQuestion() { return this._currentQuestion; }
  set currentQuestion(value) { this._currentQuestion = value; }
  
  get answerData() { return this._answerData; }
  set answerData(value) { this._answerData = value; }
  
  get showingQuestion() { return this._showingQuestion; }
  set showingQuestion(value) { this._showingQuestion = value; }
  
  get letterPanels() { return this._letterPanels; }
  set letterPanels(value) { this._letterPanels = value; }
  
  get letterFlipInterval() { return this._letterFlipInterval; }
  set letterFlipInterval(value) { this._letterFlipInterval = value; }
  
  get disableClicks() { return this._disableClicks; }
  set disableClicks(value) { this._disableClicks = value; }

  // Getters and setters for UI state
  get questionToggleEnabled() { return this._questionToggleEnabled; }
  set questionToggleEnabled(value) { this._questionToggleEnabled = value; }
  
  get showingQuestions() { return this._showingQuestions; }
  set showingQuestions(value) { this._showingQuestions = value; }
  
  get quizComplete() { return this._quizComplete; }
  set quizComplete(value) { this._quizComplete = value; }

  // Getters and setters for user data
  get userData() { return this._userData; }
  set userData(value) { this._userData = value; }
  
  get permissionData() { return this._permissionData; }
  set permissionData(value) { this._permissionData = value; }
  
  get canView() { return this._canView; }
  set canView(value) { this._canView = value; }
  
  get userScore() { return this._userScore; }
  set userScore(value) { this._userScore = value; }
  
  get recordedCompletion() { return this._recordedCompletion; }
  set recordedCompletion(value) { this._recordedCompletion = value; }

  // Getters and setters for timing and tracking
  get lastSaved() { return this._lastSaved; }
  set lastSaved(value) { this._lastSaved = value; }
  
  get lastWatched() { return this._lastWatched; }
  set lastWatched(value) { this._lastWatched = value; }

  // Getters and setters for utility
  get urlVars() { return this._urlVars; }
  set urlVars(value) { this._urlVars = value; }
  
  get progress() { return this._progress; }
  set progress(value) { this._progress = value; }
  
  get idleCheck() { return this._idleCheck; }
  set idleCheck(value) { this._idleCheck = value; }
  
  get keydownListenerAdded() { return this._keydownListenerAdded; }
  set keydownListenerAdded(value) { this._keydownListenerAdded = value; }

  // Helper method to reset state
  reset() {
    this._currentQuestion = -1;
    this._answerData = [];
    this._showingQuestion = false;
    this._quizComplete = false;
    this._userData = {
      watchData: [],
      attempts: [],
      answerData: [],
      bestScore: 0,
      dataVersion: 1,
    };
    this._userScore = 0;
    this._recordedCompletion = false;
  }
}

// Create and export a singleton instance
const state = new State();
export default state;