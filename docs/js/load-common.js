// docs/js/load-common.js
document.addEventListener("DOMContentLoaded", function() {
  // header
  const header = document.getElementById("main-header");
  if (header) {
    fetch("./header.html")
      .then(res => res.text())
      .then(html => { header.innerHTML = html; });
  }
  // footer
  const footer = document.getElementById("main-footer");
  if (footer) {
    fetch("./footer.html")
      .then(res => res.text())
      .then(html => { footer.innerHTML = html; });
  }
});