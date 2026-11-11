const form = document.getElementById('unsubscribe-form');
const status = document.getElementById('status');
const token = location.hash.slice(1);

if (!/^[a-f0-9]{64}$/.test(token)) {
  status.textContent = 'This link is invalid. You can change your email preferences in Oatle Kids.';
} else {
  form.hidden = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch('https://bcjyucxpmkxrhkdcgbsk.supabase.co/functions/v1/email-unsubscribe', {
        method: 'POST', body: new URLSearchParams({ token }),
      });
      if (!response.ok) throw new Error('Unsubscribe failed');
      form.hidden = true;
      history.replaceState(null, '', location.pathname);
      status.textContent = 'You’re unsubscribed from Oatle Kids marketing emails.';
    } catch {
      status.textContent = 'We couldn’t unsubscribe you. Try again or update Email Preferences in Oatle Kids.';
      button.disabled = false;
    }
  });
}
