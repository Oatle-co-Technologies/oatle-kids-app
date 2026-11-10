export async function sendEmail(fetcher, apiKey, id, payload) {
 const response = await fetcher('https://api.resend.com/emails',{
  method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`oatle/${id}`},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)
 });
 if (!response.ok) throw new Error('provider_error');
 const result = await response.json();
 if (!result.id) throw new Error('provider_error');
 return result.id;
}
export async function hashToken(token) {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
