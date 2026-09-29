/* RSVP form. Nothing is stored or sent by this site: submitting opens the
   guest's email app with a pre-written reply addressed to the host. */
window.initWeddingRSVP = function (form, config, names) {
  const email = String(config.email || '').trim();
  const emailOk = /^[^\s@<>?,;:%]+@[^\s@<>?,;:%]+\.[^\s@<>?,;:%]+$/.test(email);

  form.innerHTML = `
    <label for="rsvp-name">Your full name</label>
    <input id="rsvp-name" name="guestName" autocomplete="name" maxlength="120" placeholder="First and last name" required>
    <label for="rsvp-attendance">Will you be joining us?</label>
    <select id="rsvp-attendance" name="attendance" required>
      <option value="">Please select your response</option>
      <option value="yes">Joyfully accepts</option>
      <option value="no">Regretfully declines</option>
    </select>
    <div id="rsvp-party" hidden>
      <label for="rsvp-count">Number of guests attending</label>
      <input id="rsvp-count" name="guestCount" type="number" min="1" max="100" step="1" value="1" disabled aria-describedby="rsvp-count-help">
      <small id="rsvp-count-help">Including yourself</small>
    </div>
    <button type="submit" class="action rsvp-link">Prepare RSVP email</button>
    <p class="rsvp-help" role="status"></p>`;

  const field = id => form.querySelector('#' + id);
  const name = field('rsvp-name'), attendance = field('rsvp-attendance');
  const party = field('rsvp-party'), count = field('rsvp-count');
  const help = form.querySelector('.rsvp-help');

  const syncParty = () => {
    const attending = attendance.value === 'yes';
    party.hidden = !attending;
    count.disabled = !attending;
    count.required = attending;
  };
  attendance.addEventListener('change', syncParty);
  name.addEventListener('input', () => name.setCustomValidity(''));
  syncParty();

  help.textContent = emailOk
    ? 'Your email app will open with your reply. Please send the email to confirm your RSVP.'
    : 'You’re welcome to fill in your details. Email RSVP will be available once the host adds their address.';

  form.addEventListener('submit', event => {
    event.preventDefault();
    const guest = name.value.trim();
    name.setCustomValidity(guest ? '' : 'Please enter your full name.');
    if (!form.reportValidity()) return;
    if (!emailOk) {
      help.textContent = 'The host’s RSVP email is not available yet. Your reply has not been sent.';
      return;
    }
    const attending = attendance.value === 'yes';
    const body = [
      `Dear ${names},`, '',
      'Thank you for your kind invitation.', '',
      `Guest name: ${guest}`,
      `Response: ${attending ? 'Joyfully accepts' : 'Regretfully declines'}`,
      `Number of guests attending: ${attending ? count.value : '0'}`, '',
      'With warm wishes,', guest
    ].join('\n');
    const subject = `Wedding RSVP — ${names}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    help.textContent = 'Your reply is ready in your email app. Please press Send there to confirm your RSVP.';
  });
};
