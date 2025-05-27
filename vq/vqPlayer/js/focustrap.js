/**
 * Focus trap module for accessible modal dialogs
 */
(function() {
  "use strict";
  
  /**
   * Set up a focus trap for a modal dialog
   * @param {HTMLElement} modal - The modal element to trap focus within
   */
  function setupFocusTrap(modal) {
    if (!modal) return;
    
    // Define which elements can receive focus
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex="0"], .expoButton, .answerBox[tabindex="0"]';
    
    // Get all focusable elements that aren't hidden
    const getFocusableElements = () => {
      return Array.from(modal.querySelectorAll(focusableSelector))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && 
                 (!el.hasAttribute('aria-hidden') || el.getAttribute('aria-hidden') !== 'true');
        });
    };
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;
    
    // Set initial focus to first answer option or first focusable element
    const firstAnswerBox = modal.querySelector('.answerBox[tabindex="0"]');
    if (firstAnswerBox) {
      setTimeout(() => firstAnswerBox.focus(), 100);
    } else if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 100);
    }
    
    // Add keydown handler for focus trap
    const handleKeydown = function(e) {
      // Re-query focusable elements in case DOM has changed
      const currentFocusables = getFocusableElements();
      if (currentFocusables.length === 0) return;
      
      const firstFocusable = currentFocusables[0];
      const lastFocusable = currentFocusables[currentFocusables.length - 1];
      
      // Handle Tab key
      if (e.key === 'Tab' || e.keyCode === 9) {
        // Shift + Tab on first element goes to last element
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
        // Tab on last element goes to first element
        else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
      
      // Handle Escape key
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (typeof window.hideQuestionPanel === 'function') {
          window.hideQuestionPanel();
        }
      }
    };
    
    // Remove old listener if exists
    modal.removeEventListener('keydown', handleKeydown);
    
    // Add new listener
    modal.addEventListener('keydown', handleKeydown);
  }
  
  // Add to global scope
  window.setupFocusTrap = setupFocusTrap;
})();