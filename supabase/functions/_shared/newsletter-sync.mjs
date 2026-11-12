const listId = 3;
const listPath = '/contacts/lists/' + listId;

export async function reconcileNewsletter({ apiKey, audience, dryRun = true, fetcher = fetch }) {
  async function request(path, body) {
    const response = await fetcher('https://api.brevo.com/v3' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Brevo request failed: ' + response.status);
    return response;
  }

  const list = await (await request(listPath)).json();
  if (list.id !== listId || list.name !== 'Oatle Kids Newsletter') {
    throw new Error('Unexpected newsletter list');
  }

  const members = new Map();
  const limit = 50;
  for (let offset = 0; ; offset += limit) {
    const { contacts } = await (await request(listPath + '/contacts?limit=' + limit + '&offset=' + offset)).json();
    if (!Array.isArray(contacts)) throw new Error('Invalid Brevo contact list');
    for (const contact of contacts) {
      if (contact.email) members.set(contact.email.trim().toLowerCase(), contact.email);
    }
    if (contacts.length < limit) break;
  }

  const removals = [...members].filter(([email]) => !audience.has(email));
  const additions = [...audience].filter(email => !members.has(email));
  if (!dryRun) {
    for (const [, email] of removals) {
      const result = await (await request(listPath + '/contacts/remove', { emails: [email] })).json();
      if (result.contacts?.failure?.length) throw new Error('Brevo list removal failed');
    }
    for (const email of additions) {
      // Leave Brevo's existing unsubscribe and blocklist preferences in place.
      await request('/contacts', { email, listIds: [listId], updateEnabled: true });
    }
  }
  return { dryRun, additions: additions.length, removals: removals.length };
}
