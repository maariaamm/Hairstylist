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

// Opening hours per weekday. The index matches Date.getDay():
// 0 = Sunday ... 6 = Saturday. null means closed all day.
const OPENING_HOURS = [
  null, // Sunday: closed
  { open: 9, close: 18 }, // Monday
  { open: 9, close: 18 }, // Tuesday
  { open: 9, close: 18 }, // Wednesday
  { open: 9, close: 18 }, // Thursday
  { open: 9, close: 18 }, // Friday
  { open: 10, close: 15 }, // Saturday
];

// Formats a number as two digits ex. "09"
function pad(number) {
  return String(number).padStart(2, "0");
}

// Writes a message (status) about whether the salon is open right now
function updateOpenStatus() {
  const statusElement = document.getElementById("open-status");
  if (!statusElement) return;

  const now = new Date();
  const today = OPENING_HOURS[now.getDay()];
  const currentHour = now.getHours() + now.getMinutes() / 60;

  if (!today) {
    statusElement.textContent = "Vi har stängt idag.";
  } else if (currentHour < today.open) {
    statusElement.textContent =
      "Vi har stängt just nu! vi öppnar kl " + pad(today.open) + ":00 idag.";
  } else if (currentHour >= today.close) {
    statusElement.textContent = "Vi har stängt för idag.";
  } else {
    statusElement.textContent =
      "Vi har öppet nu! vi stänger kl " + pad(today.close) + ":00.";
  }
}

updateOpenStatus();

// Simple patterns for e-mail and phone number
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;

// Shows an error message under a field and marks the field as invalid
function setError(fieldId, message) {
  document.getElementById(fieldId + "-error").textContent = message;
  document.getElementById(fieldId).setAttribute("aria-invalid", "true");
}

// Removes all error messages, invalid markings and old success messages in a form
function clearErrors(form) {
  form.querySelectorAll(".error").forEach(function (element) {
    element.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach(function (field) {
    field.removeAttribute("aria-invalid");
  });
  form.querySelectorAll(".success").forEach(function (element) {
    element.textContent = "";
  });
}

// Moves the cursor to the first field with an error
function focusFirstError(form) {
  const firstInvalid = form.querySelector("[aria-invalid='true']");
  if (firstInvalid) firstInvalid.focus();
}

// Returns today's date as "YYYY-MM-DD" in local time.
function todayString() {
  const now = new Date();
  return (
    now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
  );
}

/*  BOOKING REQUEST FORM */

function initBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  // Do not allow dates before today in the date picker
  const dateInput = document.getElementById("b-date");
  dateInput.min = todayString();

  form.addEventListener("submit", function (e) {
    // Stop the browser from sending the form
    e.preventDefault();
    clearErrors(form);
    let valid = true;

    // Read and trim the values
    const name = document.getElementById("b-name").value.trim();
    const phone = document.getElementById("b-phone").value.trim();
    const email = document.getElementById("b-email").value.trim();
    const service = document.getElementById("b-service").value;
    const date = dateInput.value;
    const time = document.getElementById("b-time").value;

    if (name.length < 2) {
      setError("b-name", "Ange ditt namn (minst 2 tecken).");
      valid = false;
    }

    if (!PHONE_PATTERN.test(phone)) {
      setError("b-phone", "Ange ett giltigt telefonnummer.");
      valid = false;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError("b-email", "Ange en giltig e-postadress.");
      valid = false;
    }

    if (!service) {
      setError("b-service", "Välj en tjänst.");
      valid = false;
    }

    // Date must be chosen, not in the past and on a day the salon is open
    let dayHours = null; // opening hours for the chosen day, used to check the time
    if (!date) {
      setError("b-date", "Välj ett datum.");
      valid = false;
    } else {
      const chosen = new Date(date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (chosen < today) {
        setError("b-date", "Datumet kan inte ligga i det förflutna.");
        valid = false;
      } else if (!OPENING_HOURS[chosen.getDay()]) {
        setError("b-date", "Salongen har stängt på söndagar.");
        valid = false;
      } else {
        dayHours = OPENING_HOURS[chosen.getDay()];
      }
    }

    // Time must be chosen and before closing time on the chosen day
    if (!time) {
      setError("b-time", "Välj en tid.");
      valid = false;
    } else if (dayHours && Number(time.slice(0, 2)) >= dayHours.close) {
      setError(
        "b-time",
        "Salongen stänger kl " +
          pad(dayHours.close) +
          ":00 den dagen. Välj en tidigare tid.",
      );
      valid = false;
    }

    // If something is wrong show focus on the first error and stop here
    if (!valid) {
      focusFirstError(form);
      return;
    }

    // if everything is correct save the request in localStorage
    const booking = { name, phone, email, service, date, time };
    try {
      localStorage.setItem("lastBooking", JSON.stringify(booking));
    } catch (error) {}

    // Show a confirmation and empty the form
    document.getElementById("booking-success").textContent =
      "Tack " +
      name +
      "! Vi har tagit emot din förfrågan om " +
      service +
      " den " +
      date +
      " kl " +
      time +
      ". Vi bekräftar via e-post.";
    form.reset();
  });
}

initBookingForm();

// COMMIT: feat: add booking form validation and confirmation message

/* ==========================================================
   6. CONTACT FORM
   Used on: contact.html (form #contact-form)
   ========================================================== */

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    let valid = true;

    const name = document.getElementById("c-name").value.trim();
    const email = document.getElementById("c-email").value.trim();
    const subject = document.getElementById("c-subject").value.trim();
    const message = document.getElementById("c-message").value.trim();

    if (name.length < 2) {
      setError("c-name", "Ange ditt namn (minst 2 tecken).");
      valid = false;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError("c-email", "Ange en giltig e-postadress.");
      valid = false;
    }

    if (subject.length < 3) {
      setError("c-subject", "Ange ett ämne (minst 3 tecken).");
      valid = false;
    }

    if (message.length < 10) {
      setError("c-message", "Meddelandet måste vara minst 10 tecken.");
      valid = false;
    }

    if (!valid) {
      focusFirstError(form);
      return;
    }

    // Everything is correct: show a confirmation and empty the form
    document.getElementById("contact-success").textContent =
      "Tack för ditt meddelande! Vi svarar så snart vi kan.";
    form.reset();
  });
}

initContactForm();

// COMMIT: feat: add contact form validation
