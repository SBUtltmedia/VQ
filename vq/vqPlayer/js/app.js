(function () {
	"use strict";

	// Configuration and state variables (no globals leaked)
	const quizfile = "json/quiz.json";
	const mediaDir = "media/";
	const ogfile = mediaDir + "video.ogv";
	const mp4file = mediaDir + "video.m4v";

	let questions;
	let times = [];
	let lastTime = 0;
	let checkCounter = 0;
	let pause = [];
	const countSet = 10;
	let currentQuestion = -1;
	let video;
	let scrubbing = false;
	let showingQuestion = false;
	let answerData = [];
	let disableClicks = false;
	let letterPanels = [];
	let letterFlipInterval = -1;
	let quizComplete = false;
	let questionToggleEnabled = false;
	let showingQuestions = true;
	let lastSaved = Date.now();
	let lastWatched = Date.now();
	let recordedCompletion = false;
	let permissionData = {};
	let canView = false;
	let userScore = 0;
	let idleCheck;
	let urlVars, progress;
	let keydownListenerAdded = false;
	try {
		urlVars = getUrlVars();
		progress = new Progress(urlVars["local"]);
	} catch (e) { }

	// Cookie clearing

	let watchStart = 0;
	let userData = {
		watchData: [],
		attempts: [],
		answerData: [],
		bestScore: 0,
		dataVersion: 1,
	};

	// Checks for proper LTI parameters (if coming from Blackboard)
	function refresh() {
		resizeWindow();
		ariaUpdate();
	}
	function ariaUpdate() {

		const tabs = document.querySelectorAll('[role="tab"]');
		const panels = document.querySelectorAll('[role="tabpanel"]');

		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				// Reset all tabs and panels
				tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
				panels.forEach(p => p.classList.remove('active'));

				// Set current tab and panel
				tab.setAttribute('aria-selected', 'true');
				document.getElementById(tab.getAttribute('aria-controls')).classList.add('active');
			});
		});

		// Only add keydown listener if it hasn't been added before
		if (!keydownListenerAdded) {
			addEventListener('keydown', function (e) {
				document.querySelectorAll('div[role="button"]').forEach(button => {
					console.log("keydown");
					const keyD = e.key !== undefined ? e.key : e.keyCode;
					// e.key && e.keycode have mixed support - keycode is deprecated but support is greater than e.key
					// I tested within IE11, Firefox, Chrome, Edge (latest) & all had good support for e.key

					if (document.activeElement == button && (keyD === 'Enter' || keyD === 13) || (['Spacebar', ' '].indexOf(keyD) >= 0 || keyD === 32)) {
						// In IE11 and lower, e.key will equal "Spacebar" instead of ' '

						// Default behavior is prevented to prevent the page to scroll when "space" is pressed
						e.preventDefault();
						button.click();
						console.log("clicked");
					}
				});
			});
			keydownListenerAdded = true; // Mark that listener has been added
		}
	}
	function checkForLTI() {
		if (document.referrer.match(/blackboard/i) && !inframe() && !ses) {
			alert(
				"You appear to be coming from a link in Blackboard but we did not get the proper informanion to submit a grade, if you are expecting a grade, please try revisiting the link from Blackboard again"
			);
		}
	}

	// Retrieve permissions JSON and adjust UI accordingly
	function getPermissions() {
		$.ajax({
			dataType: "json",
			url: "json/permissions.json",
			data: "",
			success: function (data) {
				permissionData = data;
				if (permissionData.cannotReset) {
					console.log(permissionData.cannotReset);
					$("div[id^='resetQuestion']").remove();
				}
				if (permissionData.isPublic) {
					// Quiz is public
					$("#userInfoButton").css("display", "none");
					$("#quiz").css("visibility", "visible");
					$("#blocker").css("visibility", "hidden");
					canView = true;
					loadButtons();
				} else {
					// Quiz is not public
					$("#userInfoButton").css("display", "auto");
					getUserData();
				}
			},
			error: function () {
				permissionData = { isPublic: false };
				$("#userInfoButton").css("display", "auto");
				getUserData();
			},
		});
	}

	// Retrieve user data from the server
	function getUserData() {
		$.ajax({
			dataType: "json",
			url: "loadUserData.php",
			error: function () {
				location.reload();
			},
			success: function (data) {
				console.log(data);
				if (Object.keys(data).length > 0) {
					userData = data;
				}
				if (userData.watchData == null) userData.watchData = [];
				if (userData.attempts == null) userData.attempts = [];
				if (userData.answerData == null) userData.answerData = [];
				if (userData.responses == null) userData.responses = {};
				if (userData.dataVersion != 1) userData.dataVersion = 1;
				loadUserData();
				loadButtons();
				updateScore();
				saveWatchData();
			},
		});
	}

	// Adjust UI based on user permissions
	function loadUserData() {
		canView = permissionData.isPrivate !== true;
		if (!canView) {
			for (let i = 0; i < (permissionData.canAccessData || []).length; i++) {
				if (permissionData.canAccessData[i] === userData.netID) canView = true;
			}
			for (let i = 0; i < (permissionData.canViewQuiz || []).length; i++) {
				if (permissionData.canViewQuiz[i] === userData.netID) canView = true;
			}
			if (window.location.href.indexOf(userData.netID) !== -1) canView = true;
		}
		if (canView) {
			$("#quiz").css("visibility", "visible");
			$("#blocker").css("visibility", "hidden");
			$("#userInfoLogin").text(
				"Signed in as " +
				userData.nickname +
				" " +
				userData.lastname +
				" (" +
				userData.netID +
				")."
			);
			if (userData.attempts.length > 0) {
				$("#userInfoComplete").text("You have already completed this quiz.");
				quizComplete = true;
				$("#userInfoButton").addClass("anim_hexSpin");
				questionToggleEnabled = true;
			} else if (quizComplete) {
				$("#userInfoComplete").text("You have just completed this quiz.");
				$("#userInfoButton").addClass("anim_hexSpin");
				questionToggleEnabled = false;
			} else {
				$("#userInfoComplete").text("You have not completed this quiz yet.");
				questionToggleEnabled = false;
			}
			// Disabled question hiding (currently no point to it)
			if (questionToggleEnabled && false) {
				$("#toggleQuestionButton").css("visibility", "visible");
			} else {
				$("#toggleQuestionButton").css("visibility", "hidden");
			}
			if (userData.netID === "japalmeri") {
				$("#playbackSpeed").append('<option value="5">5x</option>');
			}
		} else {
			$("#quiz").css("visibility", "hidden");
			$("#blocker").css("visibility", "visible");
		}
		updateScore();
	}

	// Load quiz JSON and initialize buttons and events
	function loadButtons() {
		$.ajax({
			dataType: "json",
			url: quizfile,
			data: "",
			success: function (data) {
				questions = data;
				if (
					userData.answerData.length < questions.questions.length ||
					userData.answerData.length > questions.questions.length
				) {
					updateUser();
					function updateUser() {
						userData.answerData = [];
						for (let i = 0; i < questions.questions.length; i++) {
							userData.answerData.push({ answers: [], correct: false, score: 0 });
						}
					}
				}
				prepQuestionScreen();
				$(window).keydown(function (e) {
					if (e.which === 13) {
						if ($("#fillInAnswer").val().length !== 0) {
							submitTextAnswer($("#fillInAnswer").val());
						}
					}
				});
				if (permissionData.isPublic) {
					loadLocalData();
				}
				video = $("#videoBox")[0];
				setInitialVolume();
				video.addEventListener("onchange", (evt) => console.log(evt));
				video.addEventListener("loadedmetadata", cconce);
				if (video.readyState >= 2) cconce();
				$("#cc").on("click", togglecc);
				if (localStorage.getItem("cc") === "show") {
					togglecc();
				}
				$("#bigPlay").click(playPause);
				$("#quizBank").hide();
				$("#videoPlayPause").click(() => {
					playPause();
				});
				$("#seekSlider").change(() => {
					vidSeek();
				});
				$("#seekSlider").on("mousedown touchstart", function (evt) {
					scrubbing = true;
				});
				$("#volumeSlider").change(() => {
					setVolume();
				});
				$("body").on("mouseup touchend", function () {
					if (scrubbing) {
						scrubbing = false;
					}
				});
				setInterval(function () {
					if (!scrubbing) {
						seekTimeUpdate();
					}
				}, 200);
				if (questions.questions.length > 0) {
					makeQuestionButtons();
					$("#noQuestionText").css("opacity", 0);
				} else {
					$("#noQuestionText").css("opacity", 1);
				}
				if (questions.questions.length > 0 && userData.answerData.length === 0) {
					for (let i = 0; i < questions.questions.length; i++) {
						userData.answerData.push({ answers: [], correct: false, score: 0 });
					}
				}
				for (let i = 0; i < userData.answerData.length; i++) {
					if (userData.answerData[i].correct) {
						animateAnswerCorrect(i);
					}
				}
				if (checkFinished()) {
					setTimeout(completeQuiz, 1000);
				}
				if (video.readyState === 1) {
					setTimeout(metadataLoaded, 20);
					metadataLoaded();
				} else {
					video.addEventListener("loadedmetadata", metadataLoaded);
				}
				if (canView) {
					if (video.readyState > 3) {
						metadataLoaded();
					} else {
						video.addEventListener("loadeddata", metadataLoaded);
					}
				}
				video.onended = videoEnded;
				$("#playbackSpeed").change(function () {
					video.playbackRate = $("#playbackSpeed").val();
				});
				$("title").text(questions.title);
				$("#quizTitle").text(questions.title);
				$("#userInfoButton").hover(
					function () {
						$("#userInfoBox").removeClass("anim_quickFadeOut").addClass("anim_quickFadeIn");
					},
					function () {
						$("#userInfoBox").removeClass("anim_quickFadeIn").addClass("anim_quickFadeOut");
					}
				);
				$("#toggleQuestionButton").click(function () {
					if (questionToggleEnabled) {
						showingQuestions ? hideQuestions() : showQuestions();
					}
				});
				$("#toggleQuestionButton").hover(
					function () {
						$("#toggleQuestionBox").removeClass("anim_quickFadeOut").addClass("anim_quickFadeIn");
					},
					function () {
						$("#toggleQuestionBox").removeClass("anim_quickFadeIn").addClass("anim_quickFadeOut");
					}
				);
				$("#resetQuestionButton").click(function () {
					if (
						confirm(
							"This will reset your quiz score and allow you to take it again, continue?"
						)
					) {
						resetQuestions();
					}
				});
				$("#resetQuestionButton").hover(
					function () {
						$("#resetQuestionBox").removeClass("anim_quickFadeOut").addClass("anim_quickFadeIn");
					},
					function () {
						$("#resetQuestionBox").removeClass("anim_quickFadeIn").addClass("anim_quickFadeOut");
					}
				);
				$("#videoSkip").hover(
					function () {
						$("#videoSkipBox").removeClass("anim_quickFadeOut").addClass("anim_quickFadeIn");
					},
					function () {
						$("#videoSkipBox").removeClass("anim_quickFadeIn").addClass("anim_quickFadeOut");
					}
				);
				if (questions.questions.length === 0) {
					$("#toggleQuestionButton, #toggleQuestionBox, #resetQuestionButton, #resetQuestionBox").css(
						"display",
						"none"
					);
				}
				$("#videoSkip").on("click", jumpToUnwatched).trigger("click");
				$("#expoButtonReview").click(questionReview);
				$("#expoButtonRetry").click(questionRetry);
				$("#expoButtonContinue").click(questionContinue);
			}
		});
	}

	/*===========================================
	  UTILITY FUNCTIONS
	  ===========================================*/
	const clearCookies = () => {
		document.cookie.split(";").forEach(c => {
			document.cookie = c.trim().replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
		});
	};

	const betterParseInt = s => {
		let str = s + "";
		while (isNaN(parseInt(str)) && str.length > 0) {
			str = str.substring(1);
		}
		return parseInt(str);
	};

	const formatTime = n => {
		let m = Math.floor(n);
		const hr = Math.floor(m / 3600);
		m -= 3600 * hr;
		const min = Math.floor(m / 60);
		m -= 60 * min;
		const sec = m;
		return (hr > 0 ? hr + ":" : "") + ((min < 10 && hr !== 0) ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
	};



	const inframe = () => {
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	};









	/*===========================================
	  CAPTIONS & CLOSED CAPTION FUNCTIONS
	  ===========================================*/
	function togglecc() {
		$("#cc").toggleClass("on");
		let mode = $("#cc").hasClass("on") ? "showing" : "hidden";
		localStorage.setItem("cc", mode);
		$("video")[0].textTracks[0].mode = mode;
		console.log(window.location.href, userData);
		if (window.location.href.includes(userData.netID)) {
			console.log("f");
			$("#repair,#repairBox").toggle();
		}
	}

	function cconce() {
		addTrack();
		togglecc();
		$("#repairBox form").on("submit", submitRepair);
		$("#repairBox form textarea").on("focus", pauseVideo);
	}

	// Dynamically add a track element for captions
	function addTrack() {
		$("video track").remove();
		const track = document.createElement("track");
		track.default = "default";
		track.kind = "captions";
		track.label = "English";
		track.srclang = "en";
		$("video")[0].appendChild(track);
		$("video track").attr("src", "getVTT.php");
		$($("video")[0].textTracks[0]).on("cuechange", populateRepair);
	}

	// Populate the repair textarea with the active cue text
	function populateRepair() {
		const activeCue = $("video")[0].textTracks[0].activeCues[0];
		if (activeCue) {
			$("#repairBox form textarea").val(activeCue.text);
			$("#repairBox form #startTime").val(activeCue.startTime);
		}
	}

	// Submit a repair form via POST and adjust video time accordingly
	function submitRepair() {
		const text = $("#repairBox form textarea").val();
		const startTime = $("#repairBox form #startTime").val();
		if (startTime) {
			console.log($("video")[0].textTracks[0].activeCues[0]);
			$.post("saveUserData.php", { data: { text, startTime } }, function (response) {
				video.currentTime = startTime - 1;
				addTrack();
				playVideo();
				console.log(response);
			});
		}
	}

	/*===========================================
	  LETTER REVEAL VARIABLES & FUNCTIONS
	  ===========================================*/


	function revealRandomLetter() {
		if (letterPanels.length > 0) {
			const r = Math.floor(letterPanels.length * Math.random());
			revealLetter(r);
		}
	}

	function revealAllLetters() {
		const l = letterPanels.length;
		for (let i = 0; i < l; i++) {
			revealLetter(0);
		}
	}

	function revealLetter(r) {
		const l = letterPanels[r];
		$("#fillInPanel" + l.pos).addClass("anim_letterPanelSpin");
		$("#fillInPanelText" + l.pos).text(l.letter).css("color", "#ffffff");
		letterPanels.splice(r, 1);
	}

	/*===========================================
	  QUESTION PANEL FUNCTIONS
	  ===========================================*/
	function prepQuestionScreen() {
		// Add ARIA roles to interactive elements
		for (let i = 0; i < 6; i++) {
			$("#questionBoxContents").append("<div id='answerBox" + i + "' class='answerBox text fs-20' role='button' tabindex='0' aria-label='Answer option " + (i + 1) + "'></div>");
			$("#answerBox" + i).append("<div id='answerIcon" + i + "' class='answerIcon btn' role='img' aria-hidden='true'></div>");
			$("#answerBox" + i).append("<div id='answerText" + i + "' class='answerText'></div>");
			$("#answerBox" + i).css("top", (37.5 + 10 * i) + "%");
			initAnswerClickEvent(i);
		}
		for (let i = 0; i < 100; i++) {
			$("#fillInPanels").append('<div id="fillInPanel' + i + '" class="fillInPanel" role="presentation"></div>');
			$("#fillInPanel" + i).append('<div id="fillInPanelText' + i + '" class="fillInPanelText text fs-36" role="presentation"></div>');
		}
		refresh();
	}

	// Initialize click events on answer boxes
	function initAnswerClickEvent(i) {
		$("#answerBox" + i).click(() => {
			selectAnswer(i);
		});
	}

	// Handle answer selection
	function selectAnswer(n) {
		if (showingQuestion && userData.answerData[currentQuestion].answers.indexOf(n) === -1) {
			const q = questions.questions[currentQuestion];
			answerData[currentQuestion][n] = true;
			userData.answerData[currentQuestion].answers.push(n);
			let isCorrect = false;
			if (q.correctAnswer == n + 1) {
				answerCorrect(n);
				isCorrect = true;
			} else {
				answerIncorrect(n);
			}
			// Fade out non-selected answers
			for (let i = 0; i < 6; i++) {
				if (i !== n) {
					$("#answerBox" + i).addClass("anim_answerFadeOut");
				}
			}
			// Animate selected answer
			$("#answerBox" + n).addClass("anim_answerToTop");
			// Show expository text
			if (questions.questions[currentQuestion].expoText === undefined) {
				$("#expoText").text(isCorrect ? "Good job!" : "Not quite...");
			} else {
				$("#expoText").text(
					questions.questions[currentQuestion].expoText[n] === ""
						? (isCorrect ? "Good job!" : "Not quite...")
						: questions.questions[currentQuestion].expoText[n]
				);
			}
			setTimeout(() => {
				$("#expoBox").addClass("anim_expoFadeIn");
			}, 600);
			saveWatchData();
		}
	}

	// Handle correct answer behavior
	function answerCorrect(n) {
		const t = questions.questions[currentQuestion].type;
		if (t === "mc") {
			$("#answerIcon" + n).removeClass("anim_spinButton iconCorrect iconWrong");
			setTimeout(() => {
				$("#answerIcon" + n).addClass("anim_spinButton iconCorrect");
			}, 25);
		} else if (t === "fitb") {
			revealAllLetters();
			$("#fillInAnswer").blur();
		}
		animateAnswerCorrect(currentQuestion);
		const numTries = userData.answerData[currentQuestion].answers.length;
		userData.answerData[currentQuestion].correct = true;
		userData.answerData[currentQuestion].score = Math.pow(0.75, numTries - 1);
		if (checkFinished()) {
			setTimeout(completeQuiz, 1200);
		}
		$("#expoTitle").text("Correct").css("color", "#2cb674");
		$("#expoText").css("color", "#2cb674");
		$("#expoButtonReview, #expoButtonRetry").css("visibility", "hidden");
		$("#expoButtonContinue").css("visibility", "visible");
		const oldScore = userScore;
		updateScore();
		const pointsEarned = userScore - oldScore;
		$("#scoreBubbleText").text("+" + pointsEarned);
		$("#scoreBubble").removeClass("anim_scoreBubbleIn");
		setTimeout(() => {
			$("#scoreBubble").addClass("anim_scoreBubbleIn");
		}, 25);
	}

	// Animate the correct answer button/icon
	function animateAnswerCorrect(n) {
		$("#questionButton" + n).removeClass("anim_spinButton");
		setTimeout(() => {
			$("#questionButton" + n).addClass("anim_spinButton");
			setTimeout(() => {
				$("#questionButtonText" + n).text("");
				$("#questionButtonIcon" + n).removeClass("iconWrong").addClass("iconCorrect");
			}, 62.5);
		}, 25);
		$("#questionMarker" + n).addClass("anim_foldQuestionMarker");
	}

	// Handle incorrect answer behavior
	function answerIncorrect(n) {
		const t = questions.questions[currentQuestion].type;
		$("#questionButtonText" + currentQuestion).text("");
		$("#questionButton" + currentQuestion).removeClass("anim_spinButton");
		setTimeout(() => {
			$("#questionButton" + currentQuestion).addClass("anim_spinButton");
			setTimeout(() => {
				$("#questionButtonIcon" + currentQuestion).removeClass("iconCorrect").addClass("iconWrong");
			}, 62.5);
		}, 25);
		if (t === "mc") {
			$("#answerIcon" + n).removeClass("anim_spinButton iconCorrect iconWrong");
			setTimeout(() => {
				$("#answerIcon" + n).addClass("anim_spinButton iconWrong");
			}, 25);
		} else if (t === "fitb") {
			$("#fillInAnswer").blur();
		}
		$("#expoTitle").text("Incorrect").css("color", "#eb2529");
		$("#expoText").css("color", "#eb2529");
		$("#expoButtonReview, #expoButtonRetry, #expoButtonContinue").css("visibility", "visible");
	}

	// Review, retry, and continue actions
	function questionReview() {
		hideQuestionPanel();
		if (questions.questions[currentQuestion].wrongTimeSet) {
			video.currentTime = questions.questions[currentQuestion].wrongTime;
			currentQuestion = -1;
		}
		setTimeout(playVideo, 250);
	}

	function questionRetry() {
		setQuestion(currentQuestion);
	}

	function questionContinue() {
		hideQuestionPanel();
		setTimeout(playVideo, 250);
	}

	// Check if all questions have been answered correctly or video sufficiently watched
	function checkFinished() {
		if (userData.answerData.length > 0) {
			for (let i = 0; i < userData.answerData.length; i++) {
				if (!userData.answerData[i].correct) return false;
			}
			return true;
		} else {
			let seconds = 0;
			for (let i = 0; i < video.duration; i++) {
				if (userData.watchData[i] > 0) seconds++;
			}
			return seconds > 0.8 * video.duration;
		}
	}

	// Complete the quiz (display exit buttons, update text, etc.)
	function completeQuiz() {
		const n = questions.questions.length;
		if (n === 1) {
			exitButton(0, 500);
		} else {
			for (let i = 0; i < n; i++) {
				exitButton(i, i * (500 / (n - 1)));
			}
		}
		let mistakes = 0;
		for (let i = 0; i < n; i++) {
			mistakes += userData.answerData[i].answers.length - 1;
		}
		if (mistakes === 0 && permissionData.isPublic !== true) {
			$("#gameCompleteText").text("You answered all the questions without any mistakes! Perfect!");
		} else {
			$("#gameCompleteText").text("You answered all the questions.");
		}
		$("#gameCompleteText")
			.html($("#gameCompleteText").text() + "<br> Keep watching for full credit!");
		if (n > 0) {
			setTimeout(function () {
				$("#gameCompleteText").addClass("anim_gameCompleteTextShow");
			}, 1250);
		}
		if (permissionData.isPublic === true) {
			setTimeout(function () {
				$("#resetQuestionButton")
					.css("visibility", "visible")
					.removeClass("anim_resetQuestionHide")
					.addClass("anim_resetQuestionShow");
			}, 2000);
		}
		if (!userData.completeDate) {
			userData.completeDate = new Date();
		}
		if (!userData.firstQuizScore && userData.quizScore) {
			userData.firstQuizScore = userData.quizScore;
		}
		quizComplete = true;
		$("#noQuestionText").css("opacity", 1);
		if (permissionData.isPublic !== true) {
			loadUserData();
		}
		saveUserData();
		saveLocalData();
	}

	// Reset all questions and UI elements
	function resetQuestions() {
		$("#gameCompleteText").removeClass("anim_gameCompleteTextShow");
		for (let i = 0; i < userData.answerData.length; i++) {
			userData.answerData[i].answers = [];
			userData.answerData[i].correct = false;
			userData.answerData[i].score = 0;
			$("#questionButtonText" + i).text("" + (i + 1));
		}
		$(".questionButton").removeClass("anim_buttonExit anim_spinButton");
		$(".questionButtonIcon").removeClass("iconCorrect iconWrong");
		$(".questionMarker").removeClass("anim_foldQuestionMarker");
	}

	// Animate exit of a question button
	function exitButton(i, delay) {
		setTimeout(function () {
			$("#questionButton" + i).addClass("anim_buttonExit");
		}, delay);
	}

	// Convert URLs in text to clickable links
	function urlify(text) {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(urlRegex, function (url) {
			return '<a href="' + url + '">' + url + "</a>";
		});
	}

	// Set up a question for the user (including fill-in panels, etc.)
	function setQuestion(n) {
		if (!userData.answerData[n].correct && showingQuestions) {
			$("#expoBox").removeClass("anim_expoFadeIn");
			$("#expoButtonReview, #expoButtonRetry, #expoButtonContinue").css("visibility", "hidden");
			$(".answerBox").removeClass("anim_answerFadeOut anim_answerToTop");
			if (!showingQuestion) showQuestionPanel();
			pauseVideo();
			currentQuestion = n;
			$("#questionText").html(urlify((n + 1) + ". " + questions.questions[n].questionText));
			$("#smallQuestionText").text(questions.questions[n].questionText);
			$(".answerIcon").removeClass("anim_spinButton iconCorrect iconWrong");
			$("#fillInAnswer").val("");
			clearInterval(letterFlipInterval);
			$(".anim_letterPanelSpin").removeClass("anim_letterPanelSpin");
			const t = questions.questions[n].type;
			$("#questionText").removeClass("srFix");
			if (t === "mc") {
				$(".fillInPanel, #fillInAnswer").css({ opacity: 0, "pointer-events": "none" });
				for (let i = 0; i < 6; i++) {
					if (questions.questions[n].answerText[i]) {
						$("#answerText" + i).text(questions.questions[n].answerText[i]);
						$("#answerBox" + i).css({ opacity: 1, "pointer-events": "all" });
					} else {
						$("#answerText" + i).text("");
						$("#answerBox" + i).css({ opacity: 0, "pointer-events": "none" });
					}
					const answerChosen = userData.answerData[currentQuestion].answers.indexOf(i) !== -1;
					if (answerChosen) {
						if (questions.questions[currentQuestion].correctAnswer == i + 1) {
							$("#answerIcon" + i).addClass("iconCorrect");
						} else {
							$("#answerIcon" + i).addClass("iconWrong");
						}
					}
				}
			} else if (t === "fitb") {
				$(".answerBox").css({ opacity: 0, "pointer-events": "none" });
				$(".fillInPanel, #fillInAnswer").css({ opacity: 1, "pointer-events": "auto" });
				$("#fillInAnswer").removeClass("anim_quickFadeOut");
				const words = questions.questions[n].answerText[0].split(" ");
				const lines = [""];
				let currentLine = 0;
				for (let i = 0; i < words.length; i++) {
					if (lines[currentLine].length + words[i].length + 1 > 20) {
						currentLine++;
						lines[currentLine] = "";
					}
					lines[currentLine] += (lines[currentLine] === "" ? "" : " ") + words[i];
				}
				letterPanels = [];
				for (let i = 0; i < 5; i++) {
					if (i < lines.length) {
						const cols = lines[i].length;
						for (let j = 0; j < 20; j++) {
							const panel = $("#fillInPanel" + (20 * i + j));
							const panelText = $("#fillInPanelText" + (20 * i + j));
							if (j < cols && lines[i].charAt(j) !== " ") {
								const letter = lines[i].charAt(j).toUpperCase();
								letterPanels.push({ pos: 20 * i + j, letter });
								panelText.text("?");
								panelText.css("color", "#808080");
								panel.css({ left: (5 * j + 2.5 * (20 - cols)) + "%", top: (20 * i) + "%" });
							} else {
								panel.css("opacity", 0);
							}
						}
					} else {
						for (let j = 0; j < 20; j++) {
							$("#fillInPanel" + (20 * i + j)).css("opacity", 0);
						}
					}
				}
				$("#fillInAnswer").focus();
				letterFlipInterval = setInterval(revealRandomLetter, 2000);
			} else if (t === "sr") {
				$(".answerBox, .fillInPanel").css({ opacity: 0, "pointer-events": "none" });
				$("#fillInAnswer").css({ opacity: 1, "pointer-events": "auto" }).removeClass("anim_quickFadeOut");
				$("#questionText").addClass("srFix");
			}
		}
	}

	// Submit a text answer based on question type
	function submitTextAnswer(answer) {
		const qtype = questions.questions[currentQuestion].type;
		if (qtype === "fitb") {
			submitFillAnswer(answer);
		} else {
			submitShortResponse(answer);
		}
	}

	// Process a fill-in-the-blank answer
	function submitFillAnswer(answer) {
		clearInterval(letterFlipInterval);
		let isCorrect = false;
		userData.answerData[currentQuestion].answers.push(0);
		if (answer.toLowerCase() === questions.questions[currentQuestion].answerText[0].toLowerCase()) {
			answerCorrect(0);
			isCorrect = true;
		} else {
			answerIncorrect(0);
		}
		$("#fillInAnswer").addClass("anim_quickFadeOut");
		if (questions.questions[currentQuestion].expoText === undefined) {
			$("#expoText").text(isCorrect ? "Good job!" : "Not quite...");
		} else {
			$("#expoText").text(
				questions.questions[currentQuestion].expoText[0] === ""
					? (isCorrect ? "Good job!" : "Not quite...")
					: questions.questions[currentQuestion].expoText[0]
			);
		}
		$("#expoBox").addClass("anim_expoFadeIn");
		saveLocalData();
	}

	// Process a short response answer
	function submitShortResponse(answer) {
		userData.answerData[currentQuestion].answers.push(0);
		userData.responses[currentQuestion] = answer;
		answerCorrect(0);
		$("#fillInAnswer").addClass("anim_quickFadeOut");
		$("#expoText").text("Your answer has been recorded.");
		$("#expoBox").addClass("anim_expoFadeIn");
		saveLocalData();
	}

	// Reveal one random letter from fill-in panels
	function revealRandomLetter() {
		if (letterPanels.length > 0) {
			const r = Math.floor(letterPanels.length * Math.random());
			revealLetter(r);
		}
	}

	// Reveal all letters (by repeatedly revealing one at index 0)
	function revealAllLetters() {
		const l = letterPanels.length;
		for (let i = 0; i < l; i++) {
			revealLetter(0);
		}
	}

	// Reveal a specific letter and remove its panel from the pool
	function revealLetter(r) {
		const l = letterPanels[r];
		$("#fillInPanel" + l.pos).addClass("anim_letterPanelSpin");
		$("#fillInPanelText" + l.pos).text(l.letter).css("color", "#ffffff");
		letterPanels.splice(r, 1);
	}

	// Show the question panel and adjust video blur/focus
	function showQuestionPanel() {
		$(".answerBox div").css({ "pointer-events": "all" });
		$("#quizBank").parent().children().attr("aria-hidden", "true");
		$("#quizBank").attr("aria-modal", "true");
		$("#quizBank").attr("aria-hidden", "false");
		$("#quizBank").show();

		// Add modal trapping
		const modal = $("#quizBank")[0];
		const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), .expoButton';
		const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
		const focusableContent = modal.querySelectorAll(focusableElements);
		const lastFocusableElement = focusableContent[focusableContent.length - 1];

		// Set initial focus to first question
		if (firstFocusableElement) {
			firstFocusableElement.focus();
		}

		// Trap focus within modal
		modal.addEventListener('keydown', function (e) {
			if (e.key === 'Tab') {
				// Check if we're on the continue button
				if (document.activeElement.id === 'expoButtonContinue') {
					hideQuestionPanel();
					return;
				}

				if (e.shiftKey) {
					if (document.activeElement === firstFocusableElement) {
						lastFocusableElement.focus();
						e.preventDefault();
					}
				} else {
					if (document.activeElement === lastFocusableElement) {
						firstFocusableElement.focus();
						e.preventDefault();
					}
				}
			}
		});

		disableClicks = false;
		showingQuestion = true;
		$("#questionBox").removeClass("anim_questionBoxHide").addClass("anim_questionBoxShow");
		$("#videoBox").removeClass("anim_unblurVideo").addClass("anim_blurVideo");
	}

	// Hide the question panel and restore video clarity
	function hideQuestionPanel() {
		$(".answerBox div").css({ "pointer-events": "none" });
		$("#quizBank").hide();
		$("#quizBank").parent().children().attr("aria-hidden", "false");
		$("#quizBank").attr("aria-modal", "false");
		$("#quizBank").attr("aria-hidden", "true");
		maximizeQuestionPanel();
		disableClicks = true;
		showingQuestion = false;
		$("#questionBox").removeClass("anim_questionBoxShow").addClass("anim_questionBoxHide");
		$("#fillInAnswer").val("");
		clearInterval(letterFlipInterval);
		$(".anim_letterPanelSpin").removeClass("anim_letterPanelSpin");
		setTimeout(function () {
			disableClicks = false;
		}, 250);
		$("#videoBox").removeClass("anim_blurVideo").addClass("anim_unblurVideo");
	}

	// Minimize the question panel (show a smaller version)
	function minimizeQuestionPanel() {
		$("#questionBoxContents").removeClass("anim_maximizeQuestionBox").addClass("anim_minimizeQuestionBox");
		$("#videoBox").removeClass("anim_blurVideo").addClass("anim_unblurVideo");
		$("#smallQuestionBox").removeClass("anim_hideSmallQuestionBox").addClass("anim_showSmallQuestionBox");
	}

	// Maximize the question panel (return to full size)
	function maximizeQuestionPanel() {
		$("#questionBoxContents").removeClass("anim_minimizeQuestionBox").addClass("anim_maximizeQuestionBox");
		$("#videoBox").removeClass("anim_unblurVideo").addClass("anim_blurVideo");
		$("#smallQuestionBox").removeClass("anim_showSmallQuestionBox").addClass("anim_hideSmallQuestionBox");
	}

	// Create question buttons and timeline markers (with ARIA roles)
	function makeQuestionButtons() {
		const qCount = questions.questions.length;
		for (let i = 0; i < qCount; i++) {
			const q = questions.questions[i];
			const questionAnswerData = [];
			for (let j = 0; j < 6; j++) {
				if (q.answerText[j] !== "") {
					questionAnswerData.push(false);
				}
			}
			answerData.push(questionAnswerData);
			$("#buttonBank").append("<div id='questionButton" + i + "' class='questionButton' role='button' tabindex='0' aria-label='Question " + (i + 1) + "'></div>");
			$("#questionButton" + i).append("<div id='questionButtonText" + i + "' class='questionButtonText text fs-30'>" + (i + 1) + "</div>");
			$("#questionButton" + i).append("<div id='questionButtonIcon" + i + "' class='questionButtonIcon' role='img' aria-hidden='true'></div>");
			$("#questionButton" + i).css("left", (50.9375 - 2.5 * qCount + 5 * i) + "%");
			initQuestionClickEvent(i);
			$("#questionMarkers").append("<div id='questionMarker" + i + "' class='questionMarker' role='presentation'></div>");
			$("#questionMarker" + i).append("<div id='questionMarkerText" + i + "' class='questionMarkerText text fs-18'>" + (i + 1) + "</div>");
		}
		refresh();
	}

	// Initialize click events on question buttons
	function initQuestionClickEvent(i) {
		$("#questionButton" + i).click(function () {
			if (!userData.answerData[i].correct && !disableClicks) {
				setQuestion(i);
				recordTimeWatched();
				video.currentTime = questions.questions[i].startTime;
				watchStart = Math.round(video.currentTime);
				pauseVideo();
			}
		});
	}

	// Toggle play/pause state of the video
	function playPause() {
		if (video.paused) {
			video.currentTime = Math.max(0, video.currentTime - 0.5);
			playVideo();
		} else {
			if (Date.now() - lastTime > 700) pauseVideo();
		}
		lastTime = Date.now();
	}

	// Play the video and adjust UI
	function playVideo() {
		if (video) video.play();
		$("#bigPlay").removeClass("playState");
		$("#videoPlayPause").removeClass("playState");
		if (showingQuestion) {
			hideQuestionPanel();
		}
	}

	// Pause the video and record watch time
	function pauseVideo() {
		video.pause();
		$("#bigPlay").addClass("playState");
		$("#videoPlayPause").addClass("playState");
		recordTimeWatched();
	}

	// Seek to a new time in the video
	function vidSeek() {
		const seekto = video.duration * ($("#seekSlider").val() / 100);
		if (answeredBeforeSeek(seekto)) {
			recordTimeWatched();
			video.currentTime = seekto;
			watchStart = Math.round(video.currentTime);
			if (showingQuestion) {
				hideQuestionPanel();
			}
			currentQuestion = -1;
		}
	}

	// Check if all questions before a certain time have been answered
	function answeredBeforeSeek(seekto) {
		for (let i in questions.questions) {
			if (questions.questions[i].startTime < seekto && !userData.answerData[i].correct) {
				return false;
			}
		}
		return true;
	}

	// Calculate percentage of video watched
	function getWatchPercentage() {
		let total = 0;
		for (let i = 0; i < userData.watchData.length; i++) {
			if (userData.watchData[i] > 0) total++;
		}
		let percentage = Math.floor(100 * total / userData.watchData.length);
		if (percentage >= 99) percentage = 100;
		return percentage;
	}

	// Jump to the first unwatched second of video
	function jumpToUnwatched() {
		const unwatchedStart = userData.watchData.indexOf(0);
		if (unwatchedStart !== -1) {
			console.log(unwatchedStart);
			video.currentTime = unwatchedStart;
			seekTimeUpdate();
		}
	}

	// Record the time that has been watched so far
	function recordTimeWatched() {
		const now = Math.min(Math.floor(video.duration), Math.floor(video.currentTime));
		let changed = false;
		for (let i = watchStart; i < now; i++) {
			if (!userData.watchData[i]) userData.watchData[i] = 0;
			userData.watchData[i]++;
			changed = true;
		}
		watchStart = now;
		if (changed) {
			updateScore();
		}
		const watchPct = getWatchPercentage();
		if (watchPct >= 80) {
			$("#noQuestionText").addClass("anim_turnGreen");
		}
		let hasQuestionText = "";
		if (questions.questions.length === 0) {
			hasQuestionText = "This quiz has no questions. ";
			if (watchPct >= 80 && !recordedCompletion) {
				recordedCompletion = true;
				completeQuiz();
			}
		}
		const newHTML = hasQuestionText + "You've watched " + watchPct + "% of the video.";
		if (newHTML !== $("#noQuestionText").html()) {
			$("#noQuestionText").html(newHTML);
		}
	}

	// Update the seek slider and time display as the video plays
	function seekTimeUpdate() {
		const currentTime = video.currentTime;
		const currentPct = currentTime * (100 / video.duration);
		if (!video.paused) {
			$("#bigPlay, #videoPlayPause").removeClass("playState");
		}
		$("#seekSlider").val(currentPct);
		$("#seekSliderThumb").css("left", (currentPct - 1) + "%");
		$("#timeDisplayText").text(formatTime(currentTime));
		for (let i = 0; i < questions.questions.length; i++) {
			if (
				currentTime > questions.questions[i].startTime &&
				currentTime - questions.questions[i].startTime < 1 &&
				currentQuestion < i
			) {
				setQuestion(i);
			}
		}
		recordTimeWatched();
		const currentDate = Date.now();
		userData.lastAccessDate = new Date();
		if (currentDate - lastSaved > 30000) {
			const currentDataCheck = JSON.stringify({ watch: userData.watchData, quiz: userData.answerData });
			if (currentDataCheck != idleCheck) {
				idleCheck = currentDataCheck;
				saveWatchData();
			}
			lastSaved = currentDate;
		}
	}

	// Handle video end event
	function videoEnded() {
		pauseVideo();
		userData.watchData[userData.watchData.length - 1]++;
		recordTimeWatched();
		saveWatchData();
	}

	// Set the initial volume based on localStorage
	function setInitialVolume() {
		const volume = localStorage.getItem("volume");
		if (volume) {
			$("#volumeSlider").val(volume * 100);
			setVolume();
		}
	}

	// Set video volume and update slider UI
	function setVolume() {
		video.volume = $("#volumeSlider").val() / 100;
		$("#volumeSliderThumb").css("left", ($("#volumeSlider").val() * 0.855) + "%");
		localStorage.setItem("volume", video.volume);
	}


	// Save watch data (and indirectly other userData) to the server
	function saveWatchData() {
		if (userData) {
			saveLocalData();
			if (typeof ses !== "undefined" && userData.bestScore) {
				ses.grade = userData.bestScore / 2000;
				postLTI(ses, userData.netID).then((result) => {
					let text = `Score:${userData.bestScore}<br>User:${userData.netID}`;
					if (!result.match(/success/g)) {
						text = `<div style="color:red">Error submitting to Grade!</div>`;
						setTimeout(() => {
							location.reload();
							window.parent.location.reload();
						}, 2000);
					}
					$("#bblink").html(text);
				});
			}
			for (let i = 0; i < userData.watchData.length; i++) {
				if (!userData.watchData[i]) userData.watchData[i] = 0;
			}
			const str = JSON.stringify(userData);
			return saveData(str);
		}
	}

	// Save user data (quiz answers and attempts)
	function saveUserData() {
		if (userData.attempts.length === 0) {
			const wrongAnswers = [];
			for (let i = 0; i < userData.answerData.length; i++) {
				const q = userData.answerData[i].answers;
				wrongAnswers.push(q.length - 1);
			}
			userData.attempts.push(wrongAnswers);
		}
		const str = JSON.stringify(userData);
		saveData(str);
	}

	// Compute and return the quiz grade
	function getGrade() {
		const ans = userData.answerData;
		const total = ans.length;
		const right = ans.filter((x) => x.correct).length;
		return right / total;
	}

	// Save data via a POST request
	function saveData(str) {
		if (Date.now() - lastWatched > 300000) {
			location.reload();
		} else {
			lastWatched = Date.now();
		}
		return $.ajax({
			type: "POST",
			url: "saveUserData.php",
			data: { userData: str },
			success: function (data) {
				console.log({ data });
				if (data.includes("error_")) {
					location.reload();
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log(jqXHR, textStatus, errorThrown);
			},
		});
	}
	function metadataLoaded() {
		if (!userData.watchData[0]) {
			userData.watchData = [];
			for (let i = 0; i <= video.duration; i++) {
				userData.watchData.push(0);
			}
		}
		for (let i = 0; i < questions.questions.length; i++) {
			let markerWidth =
				parseFloat($("#questionMarker" + i).css("width")) /
				parseFloat($("#questionMarkers").width()) *
				100;
			console.log(markerWidth);
			$("#questionMarker" + i).css("left", (questions.questions[i].startTime / video.duration * 100) - markerWidth / 2 + "%");
		}
	}


	// Show question markers and buttons
	function showQuestions() {
		showingQuestions = true;
		$("#toggleQuestionButton").removeClass("anim_toggleQuestionsOff").addClass("anim_toggleQuestionsOn");
		$("#questionMarkers").removeClass("anim_hideQuestionMarkers").addClass("anim_showQuestionMarkers");
		$("#buttonBank").removeClass("anim_hideQuestionMarkers").addClass("anim_showQuestionMarkers");
	}

	// Hide question markers and buttons
	function hideQuestions() {
		showingQuestions = false;
		$("#toggleQuestionButton").removeClass("anim_toggleQuestionsOn").addClass("anim_toggleQuestionsOff");
		$("#questionMarkers").removeClass("anim_showQuestionMarkers").addClass("anim_hideQuestionMarkers");
		$("#buttonBank").removeClass("anim_showQuestionMarkers").addClass("anim_hideQuestionMarkers");
		if (showingQuestion) {
			hideQuestionPanel();
			if (video.paused) {
				playPause();
			}
		}
	}

	// Placeholder for loading local data
	function loadLocalData() {
		// Code to load local data can be added here if needed.
	}

	// Save local data (and if applicable, update a parent frame)
	function saveLocalData() {
		const status = userData.completeDate ? "done" : "incomplete";
		if (canAccessParent() && window.parent.updateCompletion && !isNaN(userData.bestScore)) {
			window.parent.updateCompletion(urlVars["key"], userData.bestScore, status);
		}
	}

	// Check if we can access the parent frame's location
	function canAccessParent() {
		try {
			return Boolean(window.parent.location.href);
		} catch (e) {
			return false;
		}
	}

	// Clear local data (currently not in use)
	function clearLocalData() {
		// Previously used to clear local storage data.
	}

	// Update the score display based on video watch time and question answers
	// Ensure userData.watchData is initialized
if (!userData.watchData) {
	userData.watchData = [];
  }
  
  const videoElement = document.getElementById('videoBox');
  
  videoElement.addEventListener('timeupdate', function() {
	const currentSecond = Math.floor(videoElement.currentTime);
	userData.watchData[currentSecond] = (userData.watchData[currentSecond] || 0) + 1;
	updateScore();
  });
  
//   function updateScore() {
// 	video = $("#videoBox")[0];
// 	let score = 0;
// 	let watchedSeconds = 0;
// 	const floorDuration = Math.floor(video.duration);
// 	if (video) {
// 	  for (let i = 0; i < floorDuration; i++) {
// 		if (userData.watchData[i] > 0) watchedSeconds++;
// 	  }
// 	  score += Math.round((watchedSeconds / floorDuration) * 1000);
// 	  if (questions !== undefined && questions.questions.length > 0) {
// 		let questionScore = 0;
// 		for (let i = 0; i < userData.answerData.length; i++) {
// 		  questionScore += userData.answerData[i].score;
// 		}
// 		const quizScore = Math.round((questionScore / questions.questions.length) * 1000);
// 		score += quizScore;
// 		userData.quizScore = quizScore / 10;
// 	  } else {
// 		score *= 2;
// 	  }
// 	  const maxScore = 2000;
// 	  const stars = [0.5, 0.65, 0.8];
// 	  for (let i = 0; i < stars.length; i++) {
// 		if (score >= stars[i] * maxScore) {
// 		  $("#medal" + i).removeClass("medalGray").addClass("medalGold");
// 		} else {
// 		  $("#medal" + i).removeClass("medalGold").addClass("medalGray");
// 		}
// 		$("#medal" + i).css("left", (stars[i] * 100 - 2.5) + "%");
// 	  }
// 	  if (score >= userData.bestScore || !userData.bestScore) {
// 		userData.bestScore = score;
// 	  }
// 	  if (isNaN(score)) score = 0;
// 	  userScore = Math.min(maxScore, score);
// 	  $("#scoreNum").text(score);
// 	  $("#scoreBar").css("width", (score / maxScore * 100) + "%");
// 	}
//   }
	
	// When the document is ready, start the app
	$(document).ready(function () {
		getPermissions();
		refresh();
		checkForLTI();
		$("#fullScreenButton").click(function () {
			setTimeout(refresh, 800);
		});
	});
})();
