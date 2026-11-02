// Code blocks: accessibility fixes on top of Material's copy button.
//
// - Material wraps each copy button in an unnamed <nav class="md-code__nav">,
//   so a lesson had one «navigation» landmark per code block. role="none"
//   leaves the button and drops the landmark (T15 U18).
// - Material writes «Скопировано» into .md-dialog__inner after a copy.
//   role="status" makes screen readers read it out (T15 U11).
//
// Material mounts the copy buttons when its document$ fires, once the page
// is parsed. This file loads after Material's bundle, so a subscriber added
// here runs after that mount; document$ replays, so it also runs when the
// page was already parsed (StatiCrypt writes the page after unlocking).
(function () {
  "use strict";

  function mark() {
    var message = document.querySelector(".md-dialog__inner");
    if (message) message.setAttribute("role", "status");
    Array.prototype.forEach.call(document.querySelectorAll("nav.md-code__nav"), function (nav) {
      nav.setAttribute("role", "none");
    });
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(mark);
  } else if (document.readyState !== "loading") {
    mark();
  } else {
    document.addEventListener("DOMContentLoaded", mark);
  }
})();
