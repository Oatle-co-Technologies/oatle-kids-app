import { createClient } from 'npm:@supabase/supabase-js@2';
import { validateReport } from '../_shared/report.mjs';
const headers = {'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || 'https://www.oatlekids.co.za', 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'};
Deno.serve(async req => {
 if (req.method === 'OPTIONS') return new Response('ok',{headers});
 if (req.method !== 'POST') return new Response('Method not allowed',{status:405,headers});
 try {
  if (Number(req.headers.get('content-length')) > 8192) throw new Error('invalid');
  const raw = await req.text(); if (raw.length > 8192) throw new Error('invalid');
  const body = JSON.parse(raw); validateReport(body.subject,body.scores);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.attempt_id)) throw new Error('invalid');
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {global:{headers:{Authorization:req.headers.get('Authorization') || ''}}});
  const {data:{user},error} = await client.auth.getUser();
  if (error || !user?.email_confirmed_at || body.owner_id !== user.id) return new Response('Verified account required',{status:401,headers});
  const result = await client.rpc('enqueue_assessment',{p_id:body.attempt_id,p_subject:body.subject,p_scores:body.scores});
  if (result.error) return new Response('Report could not be saved',{status:400,headers});
  return Response.json({queued:true},{headers});
 } catch { return new Response('Invalid report',{status:400,headers}); }
});
