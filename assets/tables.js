/*
  Content tables on narrow screens (T15 U5).

  Below 700px components.css shows every content table as stacked rows:
  one block per row, each cell after its column's name. This script gives
  each body cell its column's name (data-label, the header cell's text)
  and marks the table (data-stack); the CSS stacks only marked tables, so
  without the script a table stays a table and scrolls. A table with an
  unnamed column is not marked: one of its cells would show without a name.

  display: block takes the table semantics away in some browsers, so the
  table, its row groups, rows, header cells and cells get their ARIA roles
  explicitly. Screen readers then read a stacked row as a table row.

  Pages are encrypted with StatiCrypt: the real page is written with
  document.write after it is unlocked, so this runs at once when the
  document is already parsed, otherwise on DOMContentLoaded.
*/
(function () {
  "use strict";

  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var GROUPS = { thead: true, tbody: true, tfoot: true };

  function columnNames(table) {
    var head = table.querySelector("thead");
    var row = head && head.querySelector("tr");
    if (!row) return null;
    var names = [];
    each(row.children, function (cell) { names.push(cell.textContent.replace(/\s+/g, " ").trim()); });
    return names.length && names.every(Boolean) ? names : null;
  }

  function stack(table) {
    var names = columnNames(table);
    if (!names) return;
    table.setAttribute("role", "table");
    each(table.children, function (group) {
      if (GROUPS[group.localName]) group.setAttribute("role", "rowgroup");
    });
    each(table.querySelectorAll("tr"), function (row) {
      row.setAttribute("role", "row");
      each(row.children, function (cell, index) {
        if (cell.localName === "th") {
          cell.setAttribute("role", row.parentElement.localName === "thead" ? "columnheader" : "rowheader");
        } else {
          cell.setAttribute("role", "cell");
          if (names[index]) cell.setAttribute("data-label", names[index]);
        }
      });
    });
    table.setAttribute("data-stack", "");
  }

  function run() {
    each(document.querySelectorAll(".md-typeset table:not([class])"), stack);
  }

  if (document.readyState !== "loading") {
    run();
  } else {
    document.addEventListener("DOMContentLoaded", run);
  }
})();
