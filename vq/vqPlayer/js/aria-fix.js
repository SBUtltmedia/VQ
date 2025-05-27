/**
 * ARIA Accessibility Fix for Video Quiz
 * This script enhances the application with proper ARIA attributes and roles
 * without interfering with the existing functionality.
 */
(function() {
  "use strict";
  
  document.addEventListener('DOMContentLoaded', function() {
    // Ensure the quiz container is visible
    setTimeout(function() {
      const quiz = document.getElementById('quiz');
      if (quiz && getComputedStyle(quiz).visibility === 'hidden') {
        quiz.style.visibility = 'visible';
      }
    }, 300);
    
    // Fix ARIA roles and make question toggles visible
    setTimeout(function() {
      if (typeof jQuery !== 'undefined') {
        const $ = jQuery;
        
        // Make toggle button visible
        $("#toggleQuestionButton").css('visibility', 'visible');
        
        // Ensure question buttons are accessible
        $(".questionButton").each(function(index) {
          $(this).attr({
            'role': 'button',
            'tabindex': '0',
            'aria-label': 'Question ' + (index + 1)
          });
          
          // Add keyboard support
          if (!$(this).data('keyboardEnabled')) {
            $(this).data('keyboardEnabled', true);
            $(this).on('keydown', function(e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).trigger('click');
              }
            });
          }
        });
        
        // Make answer options accessible
        $(".answerBox").each(function(index) {
          const text = $(this).find('.answerText').text().trim();
          $(this).attr({
            'role': 'button',
            'tabindex': '0',
            'aria-label': 'Answer option ' + (index + 1) + (text ? ': ' + text : '')
          });
          
          // Add keyboard support
          if (!$(this).data('keyboardEnabled')) {
            $(this).data('keyboardEnabled', true);
            $(this).on('keydown', function(e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).trigger('click');
              }
            });
          }
        });
        
        // Improve video controls accessibility
        $("#videoPlayPause, #bigPlay").attr({
          'role': 'button',
          'tabindex': '0',
          'aria-label': 'Play or Pause Video'
        });
        
        // Improve slider accessibility
        $("#seekSlider").attr({
          'aria-label': 'Video Timeline',
          'aria-valuemin': '0',
          'aria-valuemax': '100'
        });
        
        $("#volumeSlider").attr({
          'aria-label': 'Volume Control',
          'aria-valuemin': '0',
          'aria-valuemax': '100'
        });
        
        // Update the aria-valuenow when sliders change
        $("#seekSlider, #volumeSlider").on('input', function() {
          $(this).attr('aria-valuenow', $(this).val());
        });
        
        // Ensure user info button is visible
        $("#userInfoButton").css('visibility', 'visible');
      }
    }, 1000);
  });
})();