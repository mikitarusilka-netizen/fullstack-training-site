// The menu for the keyboard and screen readers (T15 U1, U3, U20; review
// T15 TH-3, TH-4).
//
// Below 1220px the menu is Material's drawer, opened by the ☰ in the
// header. Material's toggles are <label>s for hidden checkboxes: the ☰, a
// stage («Этап 1. Основы Python»), a topic («Тема 2»), each level's title
// («← Тема 2», back up) and, below 960px, the current page's entry, which
// opens its outline. A <label> may not take a role (ARIA in HTML), so the
// label's content moves into a span that is the button: role="button", a
// name, aria-expanded as its checkbox is, and the Tab stop. A click inside
// a label still ticks its checkbox; Enter or Space on the span clicks the
// label (chrome.css makes the span fill the label: same ring, same target).
// This script:
// - makes the ☰ a button named «Меню» that opens the menu with Enter or
//   Space, focusing the current page's entry;
// - adds «Закрыть меню» at the top of the drawer; it and Esc close the
//   menu and give focus back to the ☰;
// - however the menu closes (also a tap on the dim strip, a link, or Tab
//   out of it to the page), keeps that state and leaves no focus in the
//   hidden drawer (chrome.css takes the closed drawer, and its levels out
//   of sight, out of the Tab order);
// - in the drawer, lets a stage open from the keyboard like a topic, and
//   each level's title go back up; focus follows into the new level and
//   back;
// - marks the current page's menu entry aria-current="page" (any width).
//
// The page is written by StatiCrypt after it is unlocked, so the script
// runs at once when the document is already parsed.
(function () {
  "use strict";

  var DRAWER = "(max-width: 76.234375em)";

  function shown(element) {
    return !!element && element.getClientRects().length > 0;
  }

  // The label's content, in a span that is the button. The label leaves
  // the Tab order; Material's own tabindex="" (not focusable) is what it
  // gives a label it does not want focused, and its sidebar code finds
  // its labels by [tabindex], so the attribute stays.
  function buttonIn(label, name) {
    var span = document.createElement("span");
    span.className = "menu-toggle";
    while (label.firstChild) span.appendChild(label.firstChild);
    label.appendChild(span);
    if (label.hasAttribute("tabindex")) label.setAttribute("tabindex", "");
    if (name) span.setAttribute("aria-label", name);
    return span;
  }

  function makeButton(span, on) {
    if (on) {
      span.setAttribute("role", "button");
      span.setAttribute("tabindex", "0");
    } else {
      span.removeAttribute("role");
      span.removeAttribute("tabindex");
      span.removeAttribute("aria-expanded");
    }
  }

  function init() {
    var drawer = document.getElementById("__drawer");
    var label = document.querySelector('label.md-header__button[for="__drawer"]');
    var sidebar = document.querySelector(".md-sidebar--primary");
    var nav = sidebar && sidebar.querySelector(".md-nav--primary");
    if (!drawer || !label || !nav || label.hasAttribute("data-menu-ready")) return;
    label.setAttribute("data-menu-ready", "1");
    var media = window.matchMedia ? window.matchMedia(DRAWER) : null;

    function inDrawer() {
      return !media || media.matches;
    }

    var button = buttonIn(label, "Меню");
    makeButton(button, true);

    // Every toggle of the menu: [span, its label, its checkbox].
    var toggles = [[button, label, drawer]];
    function add(found, name) {
      var span = buttonIn(found, name);
      toggles.push([span, found, document.getElementById(found.htmlFor)]);
      return span;
    }

    // The current page: its link, and below 960px Material's entry that
    // opens the page outline. The outline's own entries are not pages.
    var current = [];
    var active = nav.querySelectorAll(".md-nav__item--active > .md-nav__link--active");
    for (var i = 0; i < active.length; i++) {
      if (active[i].closest(".md-nav--secondary")) continue;
      var entry = active[i].localName === "label" ? add(active[i]) : active[i];
      if (entry !== active[i]) makeButton(entry, true);
      entry.setAttribute("aria-current", "page");
      current.push(entry);
    }

    // A stage is a heading from 1220px (Material leaves it out of the Tab
    // order there and does not let it be clicked) and opens its level in
    // the drawer; a topic opens in place; each level's title goes back up.
    var stages = [];
    var labels = nav.querySelectorAll("label.md-nav__link[for]:not(.md-nav__link--active), label.md-nav__title[for]");
    for (var j = 0; j < labels.length; j++) {
      var found = labels[j];
      if (found.htmlFor === "__drawer") continue;
      var title = found.classList.contains("md-nav__title");
      var span = add(found, title ? "Назад: " + found.textContent.replace(/\s+/g, " ").trim() : null);
      if (!title && found.parentNode.classList.contains("md-nav__item--section")) stages.push(span);
      else makeButton(span, true);
    }

    var close = document.createElement("button");
    close.setAttribute("type", "button");
    close.className = "drawer-close";
    close.textContent = "Закрыть меню";
    var inner = sidebar.querySelector(".md-sidebar__inner") || sidebar;
    inner.insertBefore(close, inner.firstChild);

    // aria-expanded follows each checkbox. Every way a toggle changes
    // (a click or tap, a key here, Material closing the drawer for a link
    // or a new address) fires change on its checkbox.
    function sync() {
      for (var k = 0; k < toggles.length; k++) {
        var t = toggles[k];
        if (t[0].getAttribute("role") === "button" && t[2]) {
          t[0].setAttribute("aria-expanded", t[2].checked ? "true" : "false");
        }
      }
    }

    function arrange() {
      for (var k = 0; k < stages.length; k++) makeButton(stages[k], inDrawer());
      sync();
    }

    // Material opens and closes the drawer by clicking its checkbox; so
    // does this script, so every route ends in the same change event.
    function setOpen(open) {
      if (drawer.checked !== open) drawer.click();
    }

    function focusFirst(candidates, options) {
      for (var k = 0; k < candidates.length; k++) {
        if (!shown(candidates[k])) continue;
        candidates[k].focus(options);
        if (document.activeElement === candidates[k]) return;
      }
      close.focus(options);
    }

    function pressed(event) {
      if (event.key !== "Enter" && event.key !== " ") return false;
      // Space would scroll the page; a span does nothing on Enter itself.
      event.preventDefault();
      return true;
    }

    document.addEventListener("change", sync);

    drawer.addEventListener("change", function () {
      if (!drawer.checked && sidebar.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });

    button.addEventListener("keydown", function (event) {
      if (!pressed(event)) return;
      var opening = !drawer.checked;
      setOpen(opening);
      if (opening) focusFirst(current);
    });

    close.addEventListener("click", function () {
      setOpen(false);
      button.focus();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !drawer.checked) return;
      setOpen(false);
      button.focus();
    });

    // Tab past the first or last entry leaves the drawer for the page under
    // the dim strip: the drawer closes and focus goes on. Focus lost to
    // nothing (a level sliding away) leaves it open.
    sidebar.addEventListener("focusout", function (event) {
      var next = event.relatedTarget;
      if (!drawer.checked || !next || sidebar.contains(next) || next === button) return;
      setOpen(false);
    });

    nav.addEventListener("keydown", function (event) {
      var span = event.target;
      if (!span.classList || !span.classList.contains("menu-toggle") || !pressed(event)) return;
      var owner = span.parentNode;
      owner.click();
      if (!inDrawer()) return;
      var spanOf = function (labelled) { return labelled.querySelector(".menu-toggle"); };
      if (owner.classList.contains("md-nav__title")) {
        // Back up: to the entry that opened this level.
        var entries = nav.querySelectorAll('label.md-nav__link[for="' + owner.htmlFor + '"]');
        focusFirst(Array.prototype.map.call(entries, spanOf));
      } else {
        // Into the new level: its title. The level is still sliding in from
        // the right; a plain focus() scrolled the drawer sideways to reach
        // it, and once the slide ended the level sat a drawer's width to the
        // left: the drawer looked empty. The title is at the top of its
        // level, so focus moves without scrolling.
        var level = owner.parentNode.querySelector(".md-nav");
        var title = level && level.querySelector(".md-nav__title");
        if (title && document.getElementById(owner.htmlFor).checked) focusFirst([spanOf(title)], { preventScroll: true });
      }
    });

    arrange();
    if (media && media.addEventListener) media.addEventListener("change", arrange);
    else if (media && media.addListener) media.addListener(arrange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
