(function () {
  "use strict";

  var PREFIX = "progress:";

  function readState(key) {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function writeState(key, checked) {
    try {
      if (checked) {
        window.localStorage.setItem(key, "1");
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      /* storage unavailable: keep state in memory only */
    }
  }

  function updateFooter(list) {
    var boxes = list.querySelectorAll("input[type=checkbox]");
    var done = 0;
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) done++;
    }
    var footer = list.nextElementSibling;
    if (!footer || !footer.classList.contains("progress-footer")) {
      footer = document.createElement("p");
      footer.className = "progress-footer";
      list.parentNode.insertBefore(footer, list.nextSibling);
    }
    footer.textContent = "Выполнено: " + done + " из " + boxes.length;
  }

  function rowText(row) {
    return row.textContent.replace(/\s+/g, " ").trim();
  }

  // A tick is stored under its row's name, not its place, so rows can be
  // added, moved or removed without moving the other rows' ticks: the
  // address of the row's first link as the page writes it, or else its
  // text. Rows with the same name on a page (every topic ends with
  // «Проект готов») are numbered in page order from 0. The key is
  // progress:<page path>:<name>:<number>. Ticks stored by position before
  // (progress:<page path>:<index>) are never read, and are left alone.
  function rowName(row) {
    if (!row) return "";
    var link = row.querySelector("a[href]");
    return link ? link.getAttribute("href") : rowText(row);
  }

  function init() {
    var all = document.querySelectorAll(".progress-list input[type=checkbox]");
    var seen = Object.create(null);  // name -> rows with that name so far
    for (var i = 0; i < all.length; i++) {
      var box = all[i];
      var row = box.closest(".task-list-item");
      var name = rowName(row);
      var number = seen[name] || 0;
      seen[name] = number + 1;
      if (box.getAttribute("data-progress-ready")) continue;
      box.setAttribute("data-progress-ready", "1");
      box.disabled = false;
      // The box is named after its row («Урок 1. Что такое программа…»):
      // its <label> holds only the box and the drawn tick.
      if (row) box.setAttribute("aria-label", rowText(row));
      var key = PREFIX + window.location.pathname + ":" + name + ":" + number;
      box.checked = readState(key);
      box.addEventListener("change", (function (b, k) {
        return function () {
          writeState(k, b.checked);
          var list = b.closest(".progress-list");
          if (list) updateFooter(list);
        };
      })(box, key));
      // The whole row toggles the box. Clicks on a lesson link still open
      // the lesson; clicks on the box itself are handled by its <label>.
      if (row) {
        row.addEventListener("click", (function (b) {
          return function (event) {
            if (event.target.closest("a, label, input")) return;
            b.click();
          };
        })(box));
      }
    }
    var lists = document.querySelectorAll(".progress-list");
    for (var j = 0; j < lists.length; j++) updateFooter(lists[j]);
  }

  document.addEventListener("DOMContentLoaded", init);
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  }
})();
