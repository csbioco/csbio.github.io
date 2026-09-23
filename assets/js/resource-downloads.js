(function ($) {
  'use strict';

  $('.resource-download-modal').each(function () {
    var modal = this;
    var status = modal.querySelector('.resource-form-status');
    var fallback = modal.querySelector('.resource-form-fallback');
    var template = modal.querySelector('template');
    var formId = template.content.querySelector('.hs-form-frame').getAttribute('data-form-id');
    var loadingTimeout;

    window.addEventListener('hs-form-event:on-ready', function (event) {
      if (event.detail && event.detail.formId === formId) {
        clearTimeout(loadingTimeout);
        status.hidden = true;
        fallback.hidden = true;
      }
    });

    // Initialize at the visible popup width; preserve the form when reopening.
    $(modal).one('shown.bs.modal', function () {
      template.parentNode.insertBefore(template.content.cloneNode(true), fallback);
      loadingTimeout = setTimeout(function () {
        if (!status.hidden) {
          status.textContent = 'The form is taking longer than expected to load.';
          fallback.hidden = false;
        }
      }, 15000);
    });
  });
})(jQuery);
