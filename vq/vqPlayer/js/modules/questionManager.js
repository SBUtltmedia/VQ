/**
 * questionManager.js
 * Manages question display, interaction, and scoring for the Video Quiz application
 */

import config from './config.js';
import state from './state.js';
import { urlify } from './utils.js';
import videoPlayer from './videoPlayer.js';
import { updateScore } from './videoPlayer.js';

// Private module variables
let currentQuestionType = null;
let letterFlipTimeout = null;

/**
 * Initialize the question manager
 */
export function initQuestionManager() {
  // Create event listeners for question interactions
  setupEventListeners();

  // Setup question buttons once questions are loaded
  document.addEventListener('questionsLoaded', function () {
    console.log('Questions loaded event received');
    prepareQuestionScreen();
    makeQuestionButtons();
  });

  // Also handle direct calls from app.js compatibility layer
  if (state.questions && state.questions.questions) {
    console.log('Questions already available, setting up immediately');
    prepareQuestionScreen();
    makeQuestionButtons();
  }

  console.log('Question manager initialized');
}

/**
 * Setup event listeners for question interactions
 */
function setupEventListeners() {
  // Listen for trigger question events from video player
  document.addEventListener('triggerQuestion', (event) => {
    if (event.detail && typeof event.detail.questionIndex === 'number') {
      setQuestion(event.detail.questionIndex);
    }
  });

  // Handle Enter key for fill-in questions
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const fillInAnswer = document.getElementById('fillInAnswer');
      if (fillInAnswer && fillInAnswer.value.length !== 0 && document.activeElement === fillInAnswer) {
        submitTextAnswer(fillInAnswer.value);
      }
    }
  });

  // Set up toggle button for showing/hiding questions
  const toggleButton = document.getElementById('toggleQuestionButton');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleQuestions);
  }

  // Set up review, retry, and continue buttons
  setupExplanationButtons();
}

/**
 * Prepare the question screen by creating answer boxes and fill-in panels
 */
export function prepareQuestionScreen() {
  const questionBoxContents = document.getElementById('questionBoxContents');
  if (!questionBoxContents) return;

  // Create answer boxes for multiple choice questions
  for (let i = 0; i < 6; i++) {
    const answerBox = document.createElement('div');
    answerBox.id = `answerBox${i}`;
    answerBox.className = 'answerBox text fs-20';
    answerBox.setAttribute('role', 'button');
    answerBox.setAttribute('tabindex', '0');
    answerBox.setAttribute('aria-label', `${i + 1}`);

    const answerIcon = document.createElement('div');
    answerIcon.id = `answerIcon${i}`;
    answerIcon.className = 'answerIcon btn';
    answerIcon.setAttribute('role', 'img');
    answerIcon.setAttribute('tabindex', '-1')
    answerIcon.setAttribute('aria-hidden', 'true');

    const answerText = document.createElement('div');
    answerText.id = `answerText${i}`;
    answerText.className = 'answerText';

    answerBox.appendChild(answerIcon);
    answerBox.appendChild(answerText);
    answerBox.style.top = `${37.5 + 10 * i}%`;

    // Add click event listener
    answerBox.addEventListener('click', () => {
      selectAnswer(i);
    });

    // Add keyboard support
    answerBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectAnswer(i);
      }
    });

    questionBoxContents.appendChild(answerBox);
  }

  // Create fill-in panels for fill-in-the-blank questions
  const fillInPanels = document.getElementById('fillInPanels');
  if (fillInPanels) {
    for (let i = 0; i < 100; i++) {
      const panel = document.createElement('div');
      panel.id = `fillInPanel${i}`;
      panel.className = 'fillInPanel';
      panel.setAttribute('role', 'presentation');

      const panelText = document.createElement('div');
      panelText.id = `fillInPanelText${i}`;
      panelText.className = 'fillInPanelText text fs-36';
      panelText.setAttribute('role', 'presentation');

      panel.appendChild(panelText);
      fillInPanels.appendChild(panel);
    }
  }

  // Create question buttons once questions are loaded
  if (state.questions && state.questions.questions) {
    makeQuestionButtons();
    checkForCompletedQuestions();
  }
}

/**
 * Create question buttons based on available questions
 */
export function makeQuestionButtons() {
  if (!state.questions || !state.questions.questions) return;

  const questionCount = state.questions.questions.length;
  const buttonBank = document.getElementById('buttonBank');

  if (!buttonBank) {
    console.error('ButtonBank element not found');
    return;
  }

  // Ensure buttonBank is visible
  buttonBank.style.display = 'block';
  buttonBank.style.opacity = '1';
  buttonBank.style.visibility = 'visible';

  // Clear existing buttons
  buttonBank.innerHTML = '';

  // Initialize answer data array
  state.answerData = [];

  console.log('Creating buttons for', questionCount, 'questions');

  for (let i = 0; i < questionCount; i++) {
    const q = state.questions.questions[i];

    // Create answer data for this question
    const questionAnswerData = [];
    for (let j = 0; j < 6; j++) {
      if (q.answerText[j] !== "") {
        questionAnswerData.push(false);
      }
    }
    state.answerData.push(questionAnswerData);

    // Create the question button
    const button = document.createElement('div');
    button.id = `questionButton${i}`;
    button.className = 'questionButton';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-controls', 'questionBox');
    button.setAttribute('aria-label', `Question ${i + 1}`);

    // Create button text
    const buttonText = document.createElement('div');
    buttonText.id = `questionButtonText${i}`;
    buttonText.className = 'questionButtonText text fs-30';
    buttonText.textContent = i + 1;
    // After creating buttonText
    const stage = document.getElementById('stage');
    if (stage) {
      const stageHeight = stage.offsetHeight;
      buttonText.style.fontSize = `${stageHeight * 0.03}px`;
    }
    // buttonText.style.fontSize = '10px';

    // Create button icon
    const buttonIcon = document.createElement('div');
    buttonIcon.id = `questionButtonIcon${i}`;
    buttonIcon.className = 'questionButtonIcon';
    buttonIcon.setAttribute('role', 'img');
    buttonIcon.setAttribute('aria-hidden', 'true');

    // Position the button
    button.style.left = `${50.9375 - 2.5 * questionCount + 5 * i}%`;

    // Add click event
    button.addEventListener('click', () => {
      setQuestion(i);
    });

    // Add keyboard support
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setQuestion(i);
      }
    });

    // Assemble and add to DOM
    button.appendChild(buttonText);
    button.appendChild(buttonIcon);
    buttonBank.appendChild(button);
  }

  // Show/hide no questions message
  const noQuestionText = document.getElementById('noQuestionText');
  if (noQuestionText) {
    noQuestionText.style.opacity = questionCount > 0 ? 0 : 1;
  }

  const markers = document.querySelectorAll('.questionMarker');
  markers.forEach((btn, idx) => {
    btn.setAttribute('aria-label', `Question marker ${idx + 1}`);
    btn.setAttribute('tabindex', '0');
  });


  // Force question buttons to be visible
  document.querySelectorAll('.questionButton').forEach(button => {
    button.style.visibility = 'visible';
    button.style.display = 'block';
    button.style.opacity = '1';
  });

  // Debug the button creation
  console.log('Created', document.querySelectorAll('.questionButton').length, 'buttons in buttonBank');



  // Optimize tab order for better accessibility
  optimizeQuestionButtonsTabOrder();
}

/**
 * Optimize tab order for question buttons
 */
function optimizeQuestionButtonsTabOrder() {
  // Ensure question buttons are in a logical tab order
  const questionButtons = document.querySelectorAll('.questionButton');

  questionButtons.forEach((button, index) => {
    button.setAttribute('tabindex', '0');
  });
}

/**
 * Set active question
 * @param {number} questionIndex - Index of the question to set
 */
export function setQuestion(questionIndex) {
  // if (!state.questions || !state.questions.questions) return;
  // if (questionIndex < 0 || questionIndex >= state.questions.questions.length) return;

  // // Don't set question if it's already been answered correctly
  // // if (state.userData.answerData[questionIndex]?.correct && state.showingQuestions) return;
  //  if (state.userData.answerData[questionIndex]?.correct) return;


  // // Show question panel if it's not already showing
  // if (!state.showingQuestion) {
  //   showQuestionPanel();
  // }
  // // Always show/reset the question panel when setting a question
  // // showQuestionPanel();

  // // Pause video when showing a question
  // videoPlayer.pauseVideo();

  // // Reset UI elements
  // resetQuestionDisplay();
  if (!state.questions || !state.questions.questions) return;
  if (questionIndex < 0 || questionIndex >= state.questions.questions.length) return;

  // Don't set question if it's already been answered correctly
  if (state.userData.answerData[questionIndex]?.correct) return;

  // Always show/reset the question panel when setting a question
  showQuestionPanel();

  // Pause video when showing a question
  videoPlayer.pauseVideo();

  // Reset UI elements
  resetQuestionDisplay();

  // Set current question index
  state.currentQuestion = questionIndex;

  // Set current question index
  // state.currentQuestion = questionIndex;

  // Get question data
  const question = state.questions.questions[questionIndex];
  const questionNumber = questionIndex + 1;

  // Set question text
  const questionText = document.getElementById('questionText');
  const smallQuestionText = document.getElementById('smallQuestionText');

  if (questionText) {
    questionText.innerHTML = urlify(`${questionNumber}. ${question.questionText}`);
    questionText.setAttribute('aria-label', `Question ${questionNumber}: ${question.questionText}`);
  }

  if (smallQuestionText) {
    smallQuestionText.textContent = question.questionText;
  }

  // Set up question based on type
  currentQuestionType = question.type;

  switch (question.type) {
    case 'mc':
      setupMultipleChoiceQuestion(question);
      break;
    case 'fitb':
      setupFillInQuestion(question);
      break;
    case 'sr':
      setupShortResponseQuestion(question);
      break;
  }

  // Check for previously selected answers
  checkForCompletedQuestions();
}

/**
 * Reset question display
 */
function resetQuestionDisplay() {
  // Hide explanation box
  const expoBox = document.getElementById('expoBox');
  if (expoBox) {
    expoBox.classList.remove('anim_expoFadeIn');
  }

  // Hide explanation buttons
  const expoButtons = document.querySelectorAll('#expoButtonReview, #expoButtonRetry, #expoButtonContinue');
  expoButtons.forEach(button => {
    button.style.visibility = 'hidden';
  });

  // Reset answer boxes
  const answerBoxes = document.querySelectorAll('.answerBox');
  answerBoxes.forEach(box => {
    box.classList.remove('anim_answerFadeOut', 'anim_answerToTop');
  });

  // Reset answer icons
  const answerIcons = document.querySelectorAll('.answerIcon');
  answerIcons.forEach(icon => {
    icon.classList.remove('anim_spinButton', 'iconCorrect', 'iconWrong');
  });

  // Clear fill-in answer
  const fillInAnswer = document.getElementById('fillInAnswer');
  if (fillInAnswer) {
    fillInAnswer.value = '';
  }

  // Clear any ongoing letter flip
  if (letterFlipTimeout) {
    clearTimeout(letterFlipTimeout);
    letterFlipTimeout = null;
  }

  // Reset any spinning letter panels
  const spinningPanels = document.querySelectorAll('.anim_letterPanelSpin');
  spinningPanels.forEach(panel => {
    panel.classList.remove('anim_letterPanelSpin');
  });
}

/**
 * Setup multiple choice question
 * @param {Object} question - Question data
 */
function setupMultipleChoiceQuestion(question) {
  // Hide fill-in elements
  const fillInPanels = document.querySelectorAll('.fillInPanel');
  const fillInAnswer = document.getElementById('fillInAnswer');

  fillInPanels.forEach(panel => {
    panel.style.opacity = 0;
    panel.style.pointerEvents = 'none';
  });

  if (fillInAnswer) {
    fillInAnswer.style.opacity = 0;
    fillInAnswer.style.pointerEvents = 'none';
  }

  // Show answer boxes for this question
  for (let i = 0; i < 6; i++) {
    const answerBox = document.getElementById(`answerBox${i}`);
    const answerText = document.getElementById(`answerText${i}`);
    const quizBank = document.getElementById('quizBank');

    if (quizBank.classList.contains('question-active')) {
      if (answerBox && answerText) {
        if (question.answerText[i]) {
          // This answer option exists, so show it
          answerText.textContent = question.answerText[i];
          answerBox.style.opacity = 1;
          answerBox.style.pointerEvents = 'all';
          answerBox.setAttribute('tabindex', '0');
          answerBox.setAttribute('role', 'button');
          answerBox.setAttribute('aria-label', `${i + 1}: ${question.answerText[i]}`);
        } else {
          // This answer option doesn't exist, so hide it
          answerText.textContent = '';
          answerBox.style.opacity = 0;
          answerBox.style.pointerEvents = 'none';
          answerBox.setAttribute('tabindex', '-1');
          answerBox.setAttribute('aria-hidden', 'true');
        }
      }
    }
  }
}

/**
 * Setup fill-in-the-blank question
 * @param {Object} question - Question data
 */
function setupFillInQuestion(question) {
  // Hide answer boxes
  const answerBoxes = document.querySelectorAll('.answerBox');
  answerBoxes.forEach(box => {
    box.style.opacity = 0;
    box.style.pointerEvents = 'none';
  });

  // Show fill-in elements
  const fillInPanels = document.querySelectorAll('.fillInPanel');
  const fillInAnswer = document.getElementById('fillInAnswer');

  fillInPanels.forEach(panel => {
    panel.style.opacity = 1;
    panel.style.pointerEvents = 'auto';
    panel.style.zIndex = '2000';
  });

  if (fillInAnswer) {
    fillInAnswer.style.opacity = 1;
    fillInAnswer.style.pointerEvents = 'auto';
    fillInAnswer.classList.remove('anim_quickFadeOut');
  }

  // Setup letter panels
  const words = question.answerText[0].split(' ');
  const lines = [''];
  let currentLine = 0;

  // Break text into lines that fit on screen
  for (let i = 0; i < words.length; i++) {
    if (lines[currentLine].length + words[i].length + 1 > 20) {
      currentLine++;
      lines[currentLine] = '';
    }
    lines[currentLine] += (lines[currentLine] === '' ? '' : ' ') + words[i];
  }

  // Reset letter panels
  state.letterPanels = [];

  // Create letter panels for each line
  for (let i = 0; i < 5; i++) {
    if (i < lines.length) {
      const cols = lines[i].length;

      for (let j = 0; j < 20; j++) {
        const panel = document.getElementById(`fillInPanel${20 * i + j}`);
        const panelText = document.getElementById(`fillInPanelText${20 * i + j}`);

        if (panel && panelText) {
          if (j < cols && lines[i].charAt(j) !== ' ') {
            const letter = lines[i].charAt(j).toUpperCase();

            // Save this panel for later reveal
            state.letterPanels.push({
              pos: 20 * i + j,
              letter
            });

            // Show question mark instead of letter
            panelText.textContent = '?';
            panelText.style.color = '#808080';

            // Add click event listener to reveal letter
            panel.addEventListener('click', () => {
              revealLetter(20 * i + j);
            });

            // Position panel
            panel.style.left = `${5 * j + 2.5 * (20 - cols)}%`;
            panel.style.top = `${20 * i}%`;
            panel.style.opacity = 1;
          } else {
            // Hide panel for spaces or beyond text length
            panel.style.opacity = 0;
          }
        }
      }
    } else {
      // Hide remaining lines
      for (let j = 0; j < 20; j++) {
        const panel = document.getElementById(`fillInPanel${20 * i + j}`);
        if (panel) {
          panel.style.opacity = 0;
        }
      }
    }
  }

  // Focus the answer input
  if (fillInAnswer) {
    fillInAnswer.focus();
  }
}

/**
 * Setup short response question
 * @param {Object} question - Question data
 */
function setupShortResponseQuestion(question) {
  // Hide answer boxes and fill-in panels
  const answerBoxes = document.querySelectorAll('.answerBox');
  const fillInPanels = document.querySelectorAll('.fillInPanel');

  answerBoxes.forEach(box => {
    box.style.opacity = 0;
    box.style.pointerEvents = 'none';
  });

  fillInPanels.forEach(panel => {
    panel.style.opacity = 0;
    panel.style.pointerEvents = 'none';
    panel.style.zIndex = '0';
  });

  // Show fill-in answer textarea
  const fillInAnswer = document.getElementById('fillInAnswer');

  if (fillInAnswer) {
    fillInAnswer.style.opacity = 1;
    fillInAnswer.style.pointerEvents = 'auto';
    fillInAnswer.classList.remove('anim_quickFadeOut');

    // Apply special styling for short response
    const questionText = document.getElementById('questionText');
    if (questionText) {
      questionText.classList.add('srFix');
    }

    // Focus the answer input
    fillInAnswer.focus();
  }
}



/**
 * Reveal a specific letter
 * @param {number} pos - Position of the letter to reveal
 */
function revealLetter(pos) {
  const panel = document.getElementById(`fillInPanel${pos}`);
  const panelText = document.getElementById(`fillInPanelText${pos}`);

  if (panel && panelText) {
    // Find this letter in the panels array
    const letterInfo = state.letterPanels.find(p => p.pos === pos);
    state.letterPanels.forEach(panel => {
      const panelElement = document.getElementById(`fillInPanel${panel.pos}`);

      if (panelElement) {
        panelElement.style.cursor = 'pointer'; // Optional: change cursor

        panelElement.addEventListener('click', () => {
          const panelText = document.getElementById(`fillInPanelText${panel.pos}`);

          // Only reveal if it's still hidden
          if (panelText && panelText.textContent === '?') {
            revealLetter(panel.pos);

            // Optional: disable further clicks
            panelElement.style.pointerEvents = 'none';
          }
        });
      }
    });


    if (letterInfo) {
      // Apply spin animation
      panel.classList.add('anim_letterPanelSpin');

      // Wait for animation midpoint to change the text
      setTimeout(() => {
        panelText.textContent = letterInfo.letter;
        panelText.style.color = 'white';
      }, 250); // Half of animation duration
    }
  }
}

/**
 * Reveal all letters
 */
// function revealAllLetters() {
//   clearTimeout(letterFlipTimeout);

//   state.letterPanels.forEach(panel => {
//     revealLetter(panel.pos);
//   });
// }

/**
 * Select answer for multiple choice question
 * @param {number} answerIndex - Index of selected answer
 */
export function selectAnswer(answerIndex) {
  if (state.currentQuestion < 0 || state.disableClicks) return;

  const question = state.questions.questions[state.currentQuestion];

  // Prevent further clicks during animation
  state.disableClicks = true;

  // Record this answer
  state.userData.answerData[state.currentQuestion].answers.push(answerIndex);

  // Hide other answer boxes
  for (let i = 0; i < 6; i++) {
    if (i !== answerIndex) {
      const answerBox = document.getElementById(`answerBox${i}`);
      const answerIcon = document.getElementById(`answerIcon${i}`);

      if (answerBox) {
        answerBox.classList.add('anim_answerFadeOut');
        answerBox.setAttribute('tabindex', '-1');
      }

      if (answerIcon) {
        answerIcon.setAttribute('tabindex', '-1');
        answerIcon.setAttribute('aria-hidden', 'true');
      }
    }
  }

  // Move selected answer to top
  const selectedBox = document.getElementById(`answerBox${answerIndex}`);
  if (selectedBox) {
    selectedBox.classList.add('anim_answerToTop');
  }

  // Check if answer is correct
  const correct = (answerIndex + 1) === parseInt(question.correctAnswer);

  if (correct) {
    answerCorrect(answerIndex);
  } else {
    answerIncorrect(answerIndex);
  }
}

/**
 * Handle correct answer
 * @param {number} answerIndex - Index of selected answer
 */
function answerCorrect(answerIndex) {
  // Mark question as correctly answered
  state.userData.answerData[state.currentQuestion].correct = true;

  // Calculate score for this question
  const questionCount = state.questions.questions.length;
  const baseScore = Math.floor(config.scoring.maxQuestionScore / questionCount);
  const attempts = state.userData.answerData[state.currentQuestion].answers.length;
  const score = Math.floor(baseScore * Math.pow(config.scoring.incorrectPenalty, attempts - 1));

  // Save score
  state.userData.answerData[state.currentQuestion].score = score;

  // Animate the correct answer
  const answerIcon = document.getElementById(`answerIcon${answerIndex}`);

  if (answerIcon) {
    answerIcon.classList.add('anim_spinButton', 'iconCorrect');
  }

  // Animate question button
  animateAnswerCorrect(state.currentQuestion);

  // Show explanation
  const expoBox = document.getElementById('expoBox');
  const expoTitle = document.getElementById('expoTitle');
  const expoText = document.getElementById('expoText');

  if (expoBox && expoTitle && expoText) {
    expoTitle.textContent = 'Correct';

    // Use explanation text if available
    const question = state.questions.questions[state.currentQuestion];
    const explanation = question.expoText[answerIndex] || 'Correct answer!';

    expoText.innerHTML = urlify(explanation);
    expoBox.classList.add('anim_expoFadeIn');
  }

  // Show explanation buttons
  showExplanationButtons(true);

  // Update score
  updateScore(score);
}

/**
 * Handle incorrect answer
 * @param {number} answerIndex - Index of selected answer
 */
function answerIncorrect(answerIndex) {
  // Animate the incorrect answer
  const answerIcon = document.getElementById(`answerIcon${answerIndex}`);

  if (answerIcon) {
    answerIcon.classList.add('anim_spinButton', 'iconWrong');
  }

  // Show explanation
  const expoBox = document.getElementById('expoBox');
  const expoTitle = document.getElementById('expoTitle');
  const expoText = document.getElementById('expoText');

  if (expoBox && expoTitle && expoText) {
    expoTitle.textContent = 'Incorrect';

    // Use explanation text if available
    const question = state.questions.questions[state.currentQuestion];
    const explanation = question.expoText[answerIndex] || 'That is not the correct answer.';

    expoText.innerHTML = urlify(explanation);
    expoBox.classList.add('anim_expoFadeIn');
  }

  // Show explanation buttons
  showExplanationButtons(false);
}

/**
 * Show explanation buttons based on answer correctness
 * @param {boolean} correct - Whether the answer was correct
 */
function showExplanationButtons(correct) {
  const reviewButton = document.getElementById('expoButtonReview');
  const retryButton = document.getElementById('expoButtonRetry');
  const continueButton = document.getElementById('expoButtonContinue');

  if (reviewButton && retryButton && continueButton) {
    // For correct answers, show review and continue
    if (correct) {
      reviewButton.style.visibility = 'visible';
      continueButton.style.visibility = 'visible';
      retryButton.style.visibility = 'hidden';

      // Focus the continue button for keyboard users
      setTimeout(() => {
        continueButton.focus();
      }, 100);
    } else {
      // For incorrect answers, show review and retry
      reviewButton.style.visibility = 'visible';
      retryButton.style.visibility = 'visible';
      continueButton.style.visibility = 'hidden';

      // Focus the retry button for keyboard users
      setTimeout(() => {
        retryButton.focus();
      }, 100);
    }
  }
}

/**
 * Setup explanation button handlers
 */
function setupExplanationButtons() {
  // Review button - jump to relevant video section
  const reviewButton = document.getElementById('expoButtonReview');
  if (reviewButton) {
    reviewButton.addEventListener('click', questionReview);
  }

  // Retry button - try the question again
  const retryButton = document.getElementById('expoButtonRetry');
  if (retryButton) {
    retryButton.addEventListener('click', questionRetry);
  }

  // Continue button - close the question panel
  const continueButton = document.getElementById('expoButtonContinue');
  if (continueButton) {
    continueButton.addEventListener('click', questionContinue);
  }
}

/**
 * Handle review button click
 */
function questionReview() {
  if (state.currentQuestion < 0 || !state.video) return;

  // Get the timestamp for this question
  const question = state.questions.questions[state.currentQuestion];

  if (question && question.startTime) {
    // Jump to the question point in the video
    state.video.currentTime = question.startTime;

    // Hide the question panel
    hideQuestionPanel();
  }
}

/**
 * Handle retry button click
 */
function questionRetry() {
  console.log('Retrying question:', state.currentQuestion);

  // Reset answer data for this question to allow retry
  const answerData = state.userData.answerData[state.currentQuestion];
  if (answerData) {
    answerData.correct = false;
    answerData.answered = false;
    answerData.userAnswer = null;
    answerData.score = 0;
    if (Array.isArray(answerData.answers)) {
      answerData.answers.length = 0;
    } else {
      answerData.answers = [];
    }
  }
  state.disableClicks = false;

  setQuestion(state.currentQuestion);
}

/**
 * Handle continue button click
 */
function questionContinue() {
  // Hide the question panel
  hideQuestionPanel();

  // Check if quiz is complete
  if (checkFinished()) {
    completeQuiz();
  }
}

/**
 * Submit text answer for fill-in-the-blank question
 * @param {string} answer - The submitted answer
 */
export function submitTextAnswer(answer) {
  if (state.currentQuestion < 0 || !answer) return;

  const question = state.questions.questions[state.currentQuestion];
  if (!question) return;

  switch (question.type) {
    case 'fitb':
      submitFillAnswer(answer);
      break;
    case 'sr':
      submitShortResponse(answer);
      break;
  }
}

/**
 * Submit answer for fill-in-the-blank question
 * @param {string} answer - The submitted answer
 */
function submitFillAnswer(answer) {
  if (state.currentQuestion < 0 || !answer) return;

  const question = state.questions.questions[state.currentQuestion];
  if (!question) return;

  // Normalize answers for comparison
  const correctAnswer = question.answerText[0].toLowerCase().trim();
  const userAnswer = answer.toLowerCase().trim();

  // Record this answer
  state.userData.answerData[state.currentQuestion].answers.push(userAnswer);

  // Check if answer is correct
  const correct = userAnswer === correctAnswer;

  // Update UI
  const fillInAnswer = document.getElementById('fillInAnswer');
  if (fillInAnswer) {
    fillInAnswer.classList.add(correct ? 'anim_fillInAnswerCorrect' : 'anim_fillInAnswerIncorrect');
  }

  // Reveal all letters
  revealAllLetters();

  // Handle correct/incorrect logic
  if (correct) {
    answerCorrect(-1); // -1 since there's no specific answer index
  } else {
    answerIncorrect(-1);
  }
}

/**
 * Submit short response answer
 * @param {string} answer - The submitted answer
 */
function submitShortResponse(answer) {
  if (state.currentQuestion < 0 || !answer) return;

  // For short response, we'll mark it as correct as long as something was entered
  // These are usually subjective questions without right/wrong answers

  // Record this answer
  state.userData.answerData[state.currentQuestion].answers.push(answer);
  state.userData.answerData[state.currentQuestion].correct = true;

  // Calculate score
  const questionCount = state.questions.questions.length;
  const score = Math.floor(config.scoring.maxQuestionScore / questionCount);
  state.userData.answerData[state.currentQuestion].score = score;

  // Update UI
  const fillInAnswer = document.getElementById('fillInAnswer');
  if (fillInAnswer) {
    fillInAnswer.classList.add('anim_fillInAnswerCorrect');
  }

  // Animate question button
  animateAnswerCorrect(state.currentQuestion);

  // Show correct feedback
  answerCorrect(-1);

  // Update score
  updateScore(score);
}

/**
 * Show question panel
 */
export function showQuestionPanel() {
  // Enable pointer events on answer elements
  const answerBoxDivs = document.querySelectorAll('.answerBox div');
  answerBoxDivs.forEach(div => {
    div.style.pointerEvents = 'all';
  });

  // Make question panel visible
  const quizBank = document.getElementById('quizBank');
  //const answerBox = document.getElementById('')
  const videoControls = document.getElementById('videoControls');
  const scoreBox = document.getElementById('scoreBox');
  const hideQuestionButton = document.getElementById('hideQuestionButton');
  if (quizBank) {
    quizBank.style.display = 'block';
    quizBank.classList.add('question-active');
    videoControls.setAttribute('inert', '');
    scoreBox.setAttribute('inert', '');
    hideQuestionButton.setAttribute('tabindex', '0');
  }

  // Set state
  state.showingQuestion = true;

  // Animate question box
  const questionBox = document.getElementById('questionBox');
  if (questionBox) {
    questionBox.classList.remove('anim_questionBoxHide');
    questionBox.classList.add('anim_questionBoxShow');
    questionBox.removeAttribute('inert', '');
  }

  // Set aria attributes for accessibility
  document.querySelectorAll('[role="button"], [role="tab"]').forEach(element => {
    if (element.id !== 'quizBank' && !element.closest('#quizBank')) {
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('tabindex', '-1');
    }
  });

  // Announce to screen readers
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'assertive');
  liveRegion.classList.add('sr-only');
  liveRegion.textContent = `Question ${state.currentQuestion + 1} displayed: ${state.questions.questions[state.currentQuestion]?.questionText || ''}`;
  document.body.appendChild(liveRegion);

  setTimeout(() => {
    liveRegion.remove();
  }, 1000);

  // Focus trap for modal dialog
  setupModalFocusTrap();
}

/**
 * Set up focus trap for the modal question panel
 */
function setupModalFocusTrap() {
  try {
    // Get the quiz modal
    const quizBank = document.getElementById('quizBank');
    if (!quizBank) return;

    // Get all focusable elements
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex="0"], .expoButton, .answerBox[tabindex="0"]';
    const focusableElements = Array.from(quizBank.querySelectorAll(focusableSelector))
      .filter(el => {
        try {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        } catch (e) {
          return true;
        }
      });

    if (focusableElements.length === 0) return;

    // Set initial focus to first answer button if available
    const firstAnswerBox = quizBank.querySelector('.answerBox[tabindex="0"]');
    if (firstAnswerBox) {
      setTimeout(() => firstAnswerBox.focus(), 100);
    } else if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 100);
    }

    // Handle tab key to trap focus
    if (!state.keydownListenerAdded) {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && state.showingQuestion) {
          // Updated for newer browser
          const focusedElement = document.activeElement;

          // If not focused within quiz bank, set focus to first element
          if (!quizBank.contains(focusedElement)) {
            e.preventDefault();
            focusableElements[0].focus();
            return;
          }

          // Handle tabbing
          if (e.shiftKey) {
            // Tab backwards
            if (focusedElement === focusableElements[0]) {
              e.preventDefault();
              focusableElements[focusableElements.length - 1].focus();
            }
          } else {
            // Tab forwards
            if (focusedElement === focusableElements[focusableElements.length - 1]) {
              e.preventDefault();
              focusableElements[0].focus();
            }
          }
        } else if (e.key === 'Escape' && state.showingQuestion) {
          // Allow Escape key to close question panel
          hideQuestionPanel();
        }
      });

      state.keydownListenerAdded = true;
    }
  } catch (e) {
    console.error('Error setting up focus trap:', e);
  }
}

/**
 * Hide question panel
 */
export function hideQuestionPanel() {
  // Disable pointer events on answer elements
  const answerBoxDivs = document.querySelectorAll('.answerBox div');
  answerBoxDivs.forEach(div => {
    div.style.pointerEvents = 'none';
  });

  // Hide quiz bank
  const quizBank = document.getElementById('quizBank');
  const videoControls = document.getElementById('videoControls')
  const scoreBox = document.getElementById('scoreBox');

  if (quizBank) {
    quizBank.style.display = 'none';
    quizBank.classList.remove('question-active');
    videoControls.removeAttribute('inert');
    scoreBox.removeAttribute('inert');



  }

  // Reset aria attributes
  document.querySelectorAll('[role="button"], [role="tab"]').forEach(element => {
    if (element.id !== 'quizBank' && !element.closest('#quizBank')) {
      element.removeAttribute('aria-hidden');
      element.setAttribute('tabindex', '0');
    }
  });

  // Reset state
  state.showingQuestion = false;
  state.disableClicks = false;
  state.currentQuestion = -1;

  // Clear any letter reveal timeout
  if (letterFlipTimeout) {
    clearTimeout(letterFlipTimeout);
    letterFlipTimeout = null;
  }

  // Reset fill-in answer
  const fillInAnswer = document.getElementById('fillInAnswer');
  if (fillInAnswer) {
    fillInAnswer.value = '';
  }

  // Play video if not at the end
  if (state.video && state.video.currentTime < state.video.duration) {
    videoPlayer.playVideo();
  }

  // Animate question box
  const questionBox = document.getElementById('questionBox');
  if (questionBox) {
    questionBox.classList.remove('anim_questionBoxShow');
    questionBox.classList.add('anim_questionBoxHide');
    questionBox.setAttribute('inert', '');
  }
}

/**
 * Toggle questions visibility
 */
export function toggleQuestions() {
  if (!state.questionToggleEnabled) return;

  state.showingQuestions = !state.showingQuestions;

  const toggleButton = document.getElementById('toggleQuestionButton');

  if (toggleButton) {
    toggleButton.classList.remove(state.showingQuestions ? 'anim_toggleQuestionsOff' : 'anim_toggleQuestionsOn');
    toggleButton.classList.add(state.showingQuestions ? 'anim_toggleQuestionsOn' : 'anim_toggleQuestionsOff');
  }

  // Update UI to show/hide questions
  state.showingQuestions ? showQuestions() : hideQuestions();
}

/**
 * Show questions UI
 */
function showQuestions() {
  // Show button bank
  const buttonBank = document.getElementById('buttonBank');
  if (buttonBank) {
    buttonBank.style.opacity = 1;
    buttonBank.style.pointerEvents = 'all';
  }

  // Update ARIA
  toggleQuestionsAria(true);
}

/**
 * Hide questions UI
 */
function hideQuestions() {
  // Hide quiz bank if showing
  if (state.showingQuestion) {
    hideQuestionPanel();
  }

  // Hide button bank
  const buttonBank = document.getElementById('buttonBank');
  if (buttonBank) {
    buttonBank.style.opacity = 0;
    buttonBank.style.pointerEvents = 'none';
  }

  // Update ARIA
  toggleQuestionsAria(false);
}

/**
 * Update ARIA attributes for questions toggle
 * @param {boolean} showing - Whether questions are showing
 */
function toggleQuestionsAria(showing) {
  const toggleButton = document.getElementById('toggleQuestionButton');
  if (toggleButton) {
    toggleButton.setAttribute('aria-expanded', showing.toString());
    toggleButton.setAttribute('aria-label', showing ? 'Hide Questions' : 'Show Questions');
  }
}

/**
 * Check if quiz is finished
 * @returns {boolean} True if all questions have been answered correctly
 */
export function checkFinished() {
  if (!state.questions || !state.questions.questions) return false;

  const totalQuestions = state.questions.questions.length;
  if (totalQuestions === 0) return true;

  let answeredCorrectly = 0;

  for (let i = 0; i < totalQuestions; i++) {
    if (state.userData.answerData[i]?.correct) {
      answeredCorrectly++;
    }
  }

  return answeredCorrectly === totalQuestions;
}

/**
 * Complete quiz
 */
export function completeQuiz() {
  if (state.quizComplete) return;

  state.quizComplete = true;

  // Calculate final score
  const videoScore = getWatchPercentage() * config.scoring.maxVideoScore / 100;
  let questionScore = 0;

  for (let i = 0; i < state.userData.answerData.length; i++) {
    questionScore += state.userData.answerData[i].score || 0;
  }

  const totalScore = Math.floor(videoScore + questionScore);

  // Update best score
  if (totalScore > state.userData.bestScore) {
    state.userData.bestScore = totalScore;
  }

  // Show completion message
  const gameCompleteText = document.getElementById('gameCompleteText');
  if (gameCompleteText) {
    gameCompleteText.textContent = `Quiz Complete! Final Score: ${totalScore}`;
    gameCompleteText.style.opacity = 1;
  }

  // Update user info
  const userInfoComplete = document.getElementById('userInfoComplete');
  if (userInfoComplete) {
    userInfoComplete.textContent = `You have completed this quiz with a score of ${totalScore}.`;
  }

  // Animate the score display
  updateScore(0, totalScore);

  // If not already recorded, record completion
  if (!state.recordedCompletion) {
    state.recordedCompletion = true;

    // Dispatch event to record completion
    const event = new CustomEvent('quizCompleted', {
      detail: {
        score: totalScore,
        videoScore,
        questionScore
      }
    });
    document.dispatchEvent(event);
  }
}

/**
 * Reset quiz questions
 */
export function resetQuiz() {
  // Reset state
  state.quizComplete = false;
  state.userData.answerData = [];

  for (let i = 0; i < state.questions.questions.length; i++) {
    state.userData.answerData.push({ answers: [], correct: false, score: 0 });
  }

  // Reset UI
  const gameCompleteText = document.getElementById('gameCompleteText');
  if (gameCompleteText) {
    gameCompleteText.style.opacity = 0;
  }

  // Reset question buttons
  for (let i = 0; i < state.questions.questions.length; i++) {
    const button = document.getElementById(`questionButton${i}`);
    const buttonIcon = document.getElementById(`questionButtonIcon${i}`);

    if (button) {
      button.classList.remove('questionButtonCorrect');
    }

    if (buttonIcon) {
      buttonIcon.classList.remove('questionButtonIconCorrect');
    }
  }

  // Reset score
  updateScore(0, 0);

  // Update user info
  const userInfoComplete = document.getElementById('userInfoComplete');
  if (userInfoComplete) {
    userInfoComplete.textContent = 'You have not completed this quiz yet.';
  }
}

/**
 * Animate correct answer for a question button
 * @param {number} questionIndex - Index of the question
 */
export function animateAnswerCorrect(questionIndex) {
  const button = document.getElementById(`questionButton${questionIndex}`);
  const buttonIcon = document.getElementById(`questionButtonIcon${questionIndex}`);

  if (button && buttonIcon) {
    button.classList.add('questionButtonCorrect');
    buttonIcon.classList.add('questionButtonIconCorrect');
  }
}

/**
 * Update score display
 * @param {number} points - Points to add
 * @param {number} [targetScore] - Optional target score
 */
// export function updateScore(points, targetScore) {
//   // Update user score
//   if (targetScore !== undefined) {
//     state.userScore = targetScore;
//   } else {
//     state.userScore += points;
//   }

//   // Update score display
//   const scoreNum = document.getElementById('scoreNum');
//   if (scoreNum) {
//     scoreNum.textContent = state.userScore;
//   }

//   // Update score bar
//   const scoreBar = document.getElementById('scoreBar');
//   if (scoreBar) {
//     const maxScore = config.scoring.maxVideoScore + config.scoring.maxQuestionScore;
//     const percent = Math.min(100, Math.floor((state.userScore / maxScore) * 100));
//     scoreBar.style.width = `${percent}%`;
//   }

//   // Show points bubble if points were added
//   if (points > 0) {
//     const scoreBubble = document.getElementById('scoreBubble');
//     const scoreBubbleText = document.getElementById('scoreBubbleText');

//     if (scoreBubble && scoreBubbleText) {
//       scoreBubbleText.textContent = `+${points}`;
//       scoreBubble.classList.remove('anim_scoreBubble');

//       // Force reflow to restart animation
//       void scoreBubble.offsetWidth;

//       scoreBubble.classList.add('anim_scoreBubble');
//     }
//   }

//   // Update medals based on score percentage
//   updateMedals();
// }

/**
 * Update medals based on score
 */
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
 * Get watch percentage for video
 * @returns {number} Percentage of video watched
 */
function getWatchPercentage() {
  if (!state.video || !state.userData.watchData) return 0;

  const duration = state.video.duration;
  if (!duration) return 0;

  // Calculate watched segments
  let watchedTime = 0;
  let segmentsCounted = [];

  for (let i = 0; i < state.userData.watchData.length; i++) {
    const segment = state.userData.watchData[i];

    // Check if this segment overlaps with any already counted
    let overlapped = false;

    for (let j = 0; j < segmentsCounted.length; j++) {
      if (segment.start <= segmentsCounted[j].end && segment.end >= segmentsCounted[j].start) {
        // Merge overlapping segments
        segmentsCounted[j].start = Math.min(segment.start, segmentsCounted[j].start);
        segmentsCounted[j].end = Math.max(segment.end, segmentsCounted[j].end);
        overlapped = true;
        break;
      }
    }

    if (!overlapped) {
      segmentsCounted.push({ start: segment.start, end: segment.end });
    }
  }

  // Calculate total watched time
  for (let i = 0; i < segmentsCounted.length; i++) {
    watchedTime += segmentsCounted[i].end - segmentsCounted[i].start;
  }

  return Math.min(100, Math.floor((watchedTime / duration) * 100));
}

/**
 * Check for previously completed questions and update UI
 */
function checkForCompletedQuestions() {
  if (!state.userData.answerData || !state.questions || !state.questions.questions) return;

  for (let i = 0; i < state.userData.answerData.length; i++) {
    if (state.userData.answerData[i]?.correct) {
      animateAnswerCorrect(i);
    }
  }
}

// Export the module API
export default {
  initQuestionManager,
  prepareQuestionScreen,
  makeQuestionButtons,
  setQuestion,
  selectAnswer,
  submitTextAnswer,
  showQuestionPanel,
  hideQuestionPanel,
  toggleQuestions,
  checkFinished,
  completeQuiz,
  resetQuiz,
  updateScore
};