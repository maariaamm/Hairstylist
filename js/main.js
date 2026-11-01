function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");

  // Stop if the page has no menu
  if (!toggle || !nav) return;

  // Opens or closes the menu and keeps the accessibility attributes in sync
  function setMenu(isOpen) {
    nav.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Stäng meny" : "Öppna meny");
  }

  // Click on the hamburger button: open if closed, close if open
  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });

  // Pressing Escape closes the menu and returns focus to the button
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Close the menu when a link is clicked
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });
}

initMobileMenu();
