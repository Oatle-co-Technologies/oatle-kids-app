import { createClient } from 'npm:@supabase/supabase-js@2';
import { eligibleForReminder, reportText } from '../_shared/report.mjs';
import { sendEmail, hashToken } from '../_shared/delivery.mjs';
Deno.serve(async req => {
 const secret = Deno.env.get('EMAIL_WORKER_SECRET');
 if (!secret || req.headers.get('Authorization') !== `Bearer ${secret}`) return new Response('Unauthorized',{status:401});
 if (req.method !== 'POST') return new Response('Method not allowed',{status:405});
 // Explicit kill switch: no claims, tokens, provider calls or marketing enqueue while disabled.
 if (Deno.env.get('EMAIL_DELIVERY_ENABLED') !== 'true') return Response.json({disabled:true});
 const apiKey = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('EMAIL_FROM'), tokenSecret = Deno.env.get('EMAIL_TOKEN_SECRET');
 if (!apiKey || !from || !tokenSecret) return new Response('Missing email configuration',{status:503});
 const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const check = (r:any) => {if(r.error) throw new Error('database_error'); return r.data;};
 try {
  if (Deno.env.get('MARKETING_REMINDERS_ENABLED') === 'true') check(await db.rpc('enqueue_subscription_reminders'));
  const jobs = check(await db.rpc('claim_parent_emails')) || [];
  for (const job of jobs) {
   const update = async (values:any) => check(await db.from('parent_email_outbox').update(values).eq('id',job.id));
   try {
    const {data:{user},error} = await db.auth.admin.getUserById(job.user_id);
    if (error) throw new Error('auth_error');
    if (!user?.email || !user.email_confirmed_at) {await update({status:'suppressed'});continue;}
    let payload = job.payload;
    if (job.kind === 'reminder') {
     const preference = check(await db.from('email_preferences').select('opted_in').eq('user_id',user.id).maybeSingle());
     const subscriptions = check(await db.from('subscriptions').select('status,current_period_end').eq('user_id',user.id));
     const entitlements = check(await db.from('entitlements').select('status,expires_at').eq('user_id',user.id));
     // Recheck immediately before each provider submission, including retries.
     if (!eligibleForReminder(user,preference,subscriptions,entitlements)) {await update({status:'suppressed'});continue;}
     if (!payload) {
      const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(tokenSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
      const token = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(job.id)))).map(b=>b.toString(16).padStart(2,'0')).join('');
      check(await db.from('email_unsubscribe_tokens').upsert({token_hash:await hashToken(token),user_id:user.id}));
      const link = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-unsubscribe?token=${token}`;
      payload = {from,to:[user.email],subject:'Ready for your next Oatle Kids adventure?',text:`You opted in to Oatle Kids updates. When you are ready, explore subscription options at https://www.oatlekids.co.za/app.html\n\nUnsubscribe: ${link}\nYou can also change email preferences in your parent account.`,headers:{'List-Unsubscribe':`<${link}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}};
     }
    } else if (!payload) {
     const report = check(await db.from('assessment_reports').select('subject,scores').eq('id',job.report_id).eq('user_id',user.id).single());
     payload = {from,to:[user.email],subject:'Your Oatle Kids assessment report',text:reportText(report.subject,report.scores)};
    }
    // Freeze payload for provider idempotency; changed account addresses need review.
    if (payload.to[0] !== user.email) {await update({status:'review'});continue;}
    if (!job.payload) await update({payload});
    const providerId = await sendEmail(fetch,apiKey,job.id,payload);
    await update({status:'sent',sent_at:new Date().toISOString(),provider_id:providerId,locked_until:null});
   } catch {
    await update({status:'pending',available_at:new Date(Date.now()+Math.min(3600000,60000*2**Math.min(job.attempts,6))).toISOString(),locked_until:null});
   }
  }
  return Response.json({processed:jobs.length});
 } catch {return new Response('Email worker unavailable',{status:503});}
});
