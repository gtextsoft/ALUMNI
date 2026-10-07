const SUBMIT_URL = "https://collector.stephenakintayofoundation.org/v1/forms/0pabp9fXfE3p4fa1/submit";
const WHATSAPP_URL = "https://chat.whatsapp.com/REPLACE_WITH_INVITE";
const YEAR_MIN = 1980;
const YEAR_MAX = 2027;

const form = document.querySelector("#alumni-form");
const formAlert = document.querySelector("#form-alert");
const welcome = document.querySelector("#welcome");
const registerIntro = document.querySelector("#register-intro");
const submitButton = document.querySelector("#submit-button");
const whatsappLink = document.querySelector("#whatsapp-link");
const currently = document.querySelector("#currently_with_gtext");
const yearLeft = document.querySelector("#year_left");
const yearLeftMark = document.querySelector("#year_left_mark");

whatsappLink.href = WHATSAPP_URL;

function setFieldError(input, message) {
  const error = document.querySelector("#" + input.id + "-error");
  if (!error) {
    return;
  }
  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", error.id);
    error.hidden = false;
    error.textContent = message;
  } else {
    input.removeAttribute("aria-invalid");
    error.hidden = true;
    error.textContent = "";
  }
}

function showAlert(message, requestId) {
  formAlert.hidden = false;
  formAlert.replaceChildren();
  const line = document.createElement("p");
  line.textContent = message || "Registration could not be sent. Please try again.";
  formAlert.append(line);
  if (requestId) {
    const ref = document.createElement("p");
    ref.textContent = "Reference: " + requestId;
    formAlert.append(ref);
  }
  formAlert.tabIndex = -1;
  formAlert.focus();
}

function clearAlert() {
  formAlert.hidden = true;
  formAlert.replaceChildren();
}

function syncYearLeft() {
  const stillThere = currently.checked;
  yearLeft.required = !stillThere;
  yearLeft.disabled = stillThere;
  yearLeftMark.hidden = stillThere;
  if (stillThere) {
    yearLeft.value = "";
    setFieldError(yearLeft, "");
  }
}

function validYear(value) {
  if (!/^\d{4}$/.test(value)) {
    return false;
  }
  const year = Number(value);
  return year >= YEAR_MIN && year <= YEAR_MAX;
}

function validate() {
  let firstInvalid = null;

  function fail(input, message) {
    setFieldError(input, message);
    if (!firstInvalid) {
      firstInvalid = input;
    }
  }

  function pass(input) {
    setFieldError(input, "");
  }

  const fullName = form.elements.full_name;
  if (fullName.value.trim().length < 2) {
    fail(fullName, "Enter your full name.");
  } else {
    pass(fullName);
  }

  const email = form.elements.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    fail(email, "Enter a valid email address.");
  } else {
    pass(email);
  }

  const phone = form.elements.phone;
  const digits = phone.value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    fail(phone, "Enter a WhatsApp number we can reach.");
  } else {
    pass(phone);
  }

  const location = form.elements.current_location;
  if (!location.value) {
    fail(location, "Select your current location.");
  } else {
    pass(location);
  }

  const entity = form.elements.gtext_entity;
  if (!entity.value) {
    fail(entity, "Select the Gtext entity you worked with.");
  } else {
    pass(entity);
  }

  const role = form.elements.role;
  if (role.value.trim().length < 2) {
    fail(role, "Enter your last or most recent role at Gtext.");
  } else {
    pass(role);
  }

  const joined = form.elements.year_joined;
  if (!validYear(joined.value.trim())) {
    fail(joined, "Enter the year you joined, from 1980 to 2027.");
  } else {
    pass(joined);
  }

  if (!currently.checked) {
    if (!validYear(yearLeft.value.trim())) {
      fail(yearLeft, "Enter the year you left, or mark that you are currently with Gtext.");
    } else if (validYear(joined.value.trim()) && Number(yearLeft.value) < Number(joined.value)) {
      fail(yearLeft, "Year left cannot be earlier than the year you joined.");
    } else {
      pass(yearLeft);
    }
  }

  const linkedin = form.elements.linkedin;
  const linkedinValue = linkedin.value.trim();
  if (linkedinValue && !/^https?:\/\/\S+$/i.test(linkedinValue)) {
    fail(linkedin, "Enter a full LinkedIn link, starting with https://");
  } else if (linkedinValue) {
    pass(linkedin);
  }

  if (firstInvalid) {
    firstInvalid.focus();
  }
  return !firstInvalid;
}

function payload() {
  const data = {
    full_name: form.elements.full_name.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    current_location: form.elements.current_location.value,
    gtext_entity: form.elements.gtext_entity.value,
    role: form.elements.role.value.trim(),
    year_joined: form.elements.year_joined.value.trim(),
    currently_with_gtext: currently.checked ? "Yes" : "No",
    website: form.elements.website.value
  };

  const optionalNames = [
    "department",
    "employment_type",
    "current_job",
    "organisation",
    "industry",
    "linkedin",
    "social"
  ];

  optionalNames.forEach(function (name) {
    const value = form.elements[name].value.trim();
    if (value) {
      data[name] = value;
    }
  });

  if (!currently.checked && yearLeft.value.trim()) {
    data.year_left = yearLeft.value.trim();
  }

  const interests = Array.from(form.querySelectorAll('input[name="interests"]:checked')).map(function (box) {
    return box.value;
  });
  if (interests.length) {
    data.interests = interests.join(", ");
  }

  const mentoring = form.querySelector('input[name="mentoring"]:checked');
  if (mentoring) {
    data.mentoring = mentoring.value;
  }

  return data;
}

function showWelcome() {
  form.hidden = true;
  registerIntro.hidden = true;
  welcome.hidden = false;
  welcome.classList.add("is-shown");
  const title = document.querySelector("#welcome-title");
  title.tabIndex = -1;
  title.focus();
}

currently.addEventListener("change", syncYearLeft);

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearAlert();

  if (form.elements.website.value) {
    return;
  }

  if (!validate()) {
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending registration...";

  try {
    const response = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload())
    });

    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok || data.ok !== true) {
      showAlert(data.message, data.requestId);
      return;
    }

    showWelcome();
  } catch (error) {
    showAlert("Registration could not be sent. Please try again.");
  } finally {
    if (!form.hidden) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit registration";
    }
  }
});
