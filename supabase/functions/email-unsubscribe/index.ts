import { createClient } from 'npm:@supabase/supabase-js@2';
import { hashToken } from '../_shared/delivery.mjs';
Deno.serve(async req => {
 let token = new URL(req.url).searchParams.get('token') || '';
 if (!token && req.method === 'POST' && req.headers.get('Origin') === 'https://www.oatlekids.co.za') {
  const body = await req.text();
  if (body.length <= 100) token = new URLSearchParams(body).get('token') || '';
 }
 const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'https://www.oatlekids.co.za','Content-Security-Policy':"default-src 'none'; form-action 'self'; frame-ancestors 'none'"};
 if (!/^[a-f0-9]{64}$/.test(token)) return new Response('Invalid unsubscribe link',{status:400,headers});
 // GET never changes consent: email security scanners can safely follow the link.
 if (req.method === 'GET') return new Response('<!doctype html><title>Oatle Kids email preferences</title><h1>Stop marketing emails</h1><p>Educational reports will continue.</p><form method="post"><button>Unsubscribe from marketing</button></form>',{headers});
 if (req.method !== 'POST') return new Response('Method not allowed',{status:405,headers});
 const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data,error} = await db.rpc('unsubscribe_email',{p_hash:await hashToken(token)});
 return new Response(error || !data ? 'Could not update preferences. Sign in to change your email preferences.' : 'You are unsubscribed from marketing emails. Educational reports are separate.',{status:error || !data ? 400:200,headers});
});
