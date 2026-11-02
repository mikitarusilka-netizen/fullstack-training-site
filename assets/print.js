/* Answers print open: before printing, every <details> is opened; after
   printing, each one gets back the state the learner left it in.

   That state is read once when this script runs, then kept up to date from
   `toggle` events while the page is not being printed. Printing never
   writes it, so the result depends neither on which print listener runs
   first nor on a repeated `beforeprint` (some browsers fire it again when
   the print preview is redrawn). Material's own print handler (ts() in its
   bundle, one per <details>) also opens them on `beforeprint`, may run
   before or after ours, and on a second `beforeprint` forgets which ones it
   opened, so we cannot read the learner's state from the page at that time.
   A browser may also fire `beforeprint` and never `afterprint`; then the
   learner's next press or key ends printing (below). print.css also forces
   the content visible, for browsers without these events. */
(function () {
  "use strict";

  var learnerOpen = new WeakMap();
  var printing = false;

  function remember(details) {
    learnerOpen.set(details, details.open);
  }

  var initial = document.querySelectorAll("details");
  for (var i = 0; i < initial.length; i++) {
    remember(initial[i]);
  }

  // `toggle` does not bubble, so listen in the capture phase. The events for
  // our own opening and closing come later, as tasks: during printing they
  // are ignored, after it they read the state just restored.
  document.addEventListener("toggle", function (event) {
    if (!printing && event.target.tagName === "DETAILS") {
      remember(event.target);
    }
  }, true);

  window.addEventListener("beforeprint", function () {
    printing = true;
    var all = document.querySelectorAll("details");
    for (var i = 0; i < all.length; i++) {
      if (!learnerOpen.has(all[i])) {
        remember(all[i]);
      }
      all[i].open = true;
    }
  });

  function endPrinting() {
    printing = false;
    var all = document.querySelectorAll("details");
    for (var i = 0; i < all.length; i++) {
      if (learnerOpen.has(all[i])) {
        all[i].open = learnerOpen.get(all[i]);
      }
    }
  }

  window.addEventListener("afterprint", endPrinting);

  // Nobody can press anything on a page while it is being printed, so a real
  // press or key (not one made by a script) means printing is over, even if
  // `afterprint` never came. The answers get the learner's state back before
  // the press acts on them, and `toggle` events are remembered again. These
  // listeners run first (window, capture phase), and the press comes before
  // the click or key that opens or closes an answer, so the order of the
  // print listeners does not matter here either.
  function inputEndsPrinting(event) {
    if (printing && event.isTrusted) {
      endPrinting();
    }
  }

  window.addEventListener("pointerdown", inputEndsPrinting, true);
  window.addEventListener("keydown", inputEndsPrinting, true);
})();
