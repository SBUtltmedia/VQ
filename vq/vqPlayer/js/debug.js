// debug.js
// Provides enhanced debugging for the Video Quiz application

// Setup console logging with timestamps and more detailed info
(function() {
    "use strict";
    
    // Store original console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };
    
    // Override console methods
    function enhanceConsole() {
        // Add timestamp and category to console outputs
        function enhanceLog(originalFn, category) {
            return function() {
                const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.sss
                const args = Array.from(arguments);
                const prefix = `[${timestamp}][${category}]`;
                
                // Use the original function with our enhanced arguments
                originalFn.apply(console, [prefix, ...args]);
                
                // Also log to UI if dev tools aren't open
                logToUI(category, args);
            };
        }
        
        // Replace console methods with enhanced versions
        console.log = enhanceLog(originalConsole.log, 'LOG');
        console.warn = enhanceLog(originalConsole.warn, 'WARN');
        console.error = enhanceLog(originalConsole.error, 'ERROR');
        console.info = enhanceLog(originalConsole.info, 'INFO');
    }
    
    // Create UI logger panel for when dev console isn't available
    function createLoggerUI() {
        // Only create if it doesn't exist
        if (document.getElementById('debug-panel')) return;
        
        // Create UI container
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.position = 'fixed';
        debugPanel.style.bottom = '10px';
        debugPanel.style.right = '10px';
        debugPanel.style.width = '400px';
        debugPanel.style.maxHeight = '300px';
        debugPanel.style.overflowY = 'auto';
        debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        debugPanel.style.color = '#fff';
        debugPanel.style.padding = '10px';
        debugPanel.style.fontFamily = 'monospace';
        debugPanel.style.fontSize = '12px';
        debugPanel.style.zIndex = '9999999';
        debugPanel.style.border = '1px solid #333';
        debugPanel.style.display = 'none'; // Hidden by default
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Debug';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '10000000';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#007bff';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '4px';
        toggleButton.onclick = function() {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        };
        
        // Add log container
        const logContainer = document.createElement('div');
        logContainer.id = 'debug-log';
        debugPanel.appendChild(logContainer);
        
        // Add to document
        document.body.appendChild(debugPanel);
        document.body.appendChild(toggleButton);
    }
    
    // Function to log to UI
    function logToUI(category, args) {
        const debugLog = document.getElementById('debug-log');
        if (!debugLog) return;
        
        // Create log entry
        const entry = document.createElement('div');
        entry.className = `log-entry ${category.toLowerCase()}`;
        
        // Style based on category
        switch(category) {
            case 'ERROR':
                entry.style.color = '#ff5252';
                break;
            case 'WARN':
                entry.style.color = '#ffbd2e';
                break;
            case 'INFO':
                entry.style.color = '#64b5f6';
                break;
            default:
                entry.style.color = '#ffffff';
        }
        
        // Format the message
        const timestamp = new Date().toISOString().substring(11, 23);
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch(e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        entry.textContent = `[${timestamp}][${category}] ${message}`;
        
        // Add to log and scroll to bottom
        debugLog.appendChild(entry);
        debugLog.scrollTop = debugLog.scrollHeight;
        
        // Limit entries
        while (debugLog.children.length > 100) {
            debugLog.removeChild(debugLog.firstChild);
        }
    }
    
    // Track module loading and errors
    function monitorModuleLoading() {
        // Watch for script errors
        window.addEventListener('error', function(e) {
            console.error('Script Error:', e.message, 'at', e.filename, 'line', e.lineno, 'column', e.colno);
            return false;
        });
        
        // Watch for unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled Promise Rejection:', e.reason);
            return false;
        });
        
        // Track ES module loading
        if (document.querySelectorAll('script[type="module"]').length > 0) {
            console.info('ES Modules detected in page');
        }
    }
    
    // Monitor DOM state and elements
    function monitorDOMState() {
        // Check if specific elements exist
        const checkElements = [
            'quiz', 'buttonBank', 'quizBank', 'videoBox', 
            'questionMarkers', 'toggleQuestionButton'
        ];
        
        console.info('Checking critical DOM elements:');
        checkElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                const display = window.getComputedStyle(elem).display;
                const visibility = window.getComputedStyle(elem).visibility;
                console.info(`- #${id}: exists, display=${display}, visibility=${visibility}`);
            } else {
                console.warn(`- #${id}: NOT FOUND`);
            }
        });
        
        // Check for questions
        if (window.questions) {
            console.info(`Questions loaded: ${window.questions.questions.length} questions found`);
        } else {
            console.warn('Questions not loaded');
        }
    }
    
    // Initialize debug tools when DOM is ready
    function init() {
        enhanceConsole();
        createLoggerUI();
        monitorModuleLoading();
        
        console.info('Debug module initialized');
        
        // Wait a bit for page to fully load before checking DOM
        setTimeout(monitorDOMState, 1000);
        
        // Add global debug commands
        window.debugApp = {
            checkDOM: monitorDOMState,
            showState: function() {
                console.info('App State:', window.state || 'No state object found');
            },
            forceShowButtons: function() {
                const buttonBank = document.getElementById('buttonBank');
                if (buttonBank) {
                    buttonBank.style.visibility = 'visible';
                    buttonBank.style.display = 'block';
                    buttonBank.style.opacity = '1';
                    console.info('Forced buttonBank to be visible');
                    return true;
                }
                return false;
            },
            fixQuiz: function() {
                const quiz = document.getElementById('quiz');
                if (quiz) {
                    quiz.style.visibility = 'visible';
                    console.info('Forced quiz to be visible');
                }
                this.forceShowButtons();
                return 'Quiz visibility fixed';
            }
        };
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();