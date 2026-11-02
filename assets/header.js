// Header: the theme toggle answers Space, and the site name links home.
//
// - Theme toggle (T15 U10). Tab lands on the checked radio, the theme on
//   show. Material clicks the visible label on Enter, but Space on a checked
//   radio does nothing. Space now clicks that label too: it is the one right
//   after the checked radio and switches to the other theme.
// - Site name (T15 U13). Material's logo link, the way home, is hidden
//   (chrome.css), and the site name was plain text. The name becomes a link
//   to the logo link's own relative address, so it works on both hosts and
//   from file:// in the offline copy.
//
// StatiCrypt writes the page after it is unlocked: run now if the page is
// already parsed, otherwise once it is.
(function () {
  "use strict";

  document.addEventListener("keydown", function (event) {
    var radio = event.target;
    if (event.key !== " " || !radio.matches || !radio.matches('input[name="__palette"]')) return;
    var label = radio.nextElementSibling;
    if (!label || label.localName !== "label") return;
    event.preventDefault();
    label.click();
  });

  function linkSiteName() {
    var logo = document.querySelector("a.md-logo");
    var name = document.querySelector(".md-header__topic > .md-ellipsis");
    if (!logo || !name || name.querySelector("a")) return;
    var link = document.createElement("a");
    link.setAttribute("href", logo.getAttribute("href"));
    link.textContent = name.textContent.trim();
    name.textContent = "";
    name.appendChild(link);
  }

  if (document.readyState !== "loading") linkSiteName();
  else document.addEventListener("DOMContentLoaded", linkSiteName);
})();
