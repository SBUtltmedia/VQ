/**
 * config.js
 * Contains configuration constants and settings for the Video Quiz application
 */

// Export as a module
export default {
    /**
     * Path to the quiz JSON file
     */
    quizFile: "./json/quiz.json",
    
    /**
     * Media directory and file paths
     */
    mediaDir: "media/",
    get ogFile() { return this.mediaDir + "video.ogv"; },
    get mp4File() { return this.mediaDir + "video.m4v"; },
    
    /**
     * Animation durations (in milliseconds)
     */
    animationDurations: {
        questionFade: 250,
        letterFlip: 500,
        buttonSpin: 500,
        scoreBubble: 1000
    },
    
    /**
     * Scoring configuration
     */
    scoring: {
        maxVideoScore: 1000,      // Maximum points for watching the video
        maxQuestionScore: 1000,   // Maximum points for answering questions
        incorrectPenalty: 0.5, 
        letterRevealPenalty: 0.2, // Penalty multiplier for incorrect answers
        maxLetterPenalty: 0.5
    },
    
    /**
     * Time configuration
     */
    timing: {
        autoSaveInterval: 10000,  // Auto-save interval in milliseconds
        letterRevealInterval: 2000,  // Interval for revealing letters in fill-in questions
        countSet: 10              // Count frequency for processing
    },
    
    /**
     * API endpoints
     */
    api: {
        saveUserData: "saveUserData.php",
        saveWatchData: "saveWatchData.php"
    },
    
    /**
     * Debug mode flag
     */
    debugMode: false
};