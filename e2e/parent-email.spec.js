import {test,expect} from '@playwright/test';
const userId='a1234567-1234-4123-8123-123456789012';
const user={id:userId,email:'parent@example.invalid',email_confirmed_at:'2026-01-01',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};
async function mock(page,authenticated=false,access=false) {
 const calls=[];
 let progress={revision:0,data:{'oatle-age-group':'big'}};
 await page.route('https://test.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url());
  let data={};
  if(url.pathname.endsWith('/auth/v1/user')) data=user;
  else if(url.pathname.endsWith('/auth/v1/signup')) {calls.push(request.postDataJSON());data={user,session:null};}
  else if(url.pathname.endsWith('/entitlements')) data=access?{user_id:userId,status:'active',expires_at:null}:null;
  else if(url.pathname.endsWith('/email_preferences')) data={opted_in:false};
  else if(url.pathname.includes('/rpc/')) {
   const body=request.postDataJSON();calls.push({rpc:url.pathname,body});
   if(url.pathname.endsWith('/household_overview')) data={limits:{plan_id:'family',profiles:3,devices:2,playing:2},profiles:[{id:'test-child',nickname:'Explorer'}],devices:[]};
   else if(url.pathname.endsWith('/register_household_device')) data={outcome:'registered'};
   else if(url.pathname.endsWith('/start_child_session')) data={outcome:'started',...progress,lease_seconds:90};
   else if(url.pathname.endsWith('/save_child_progress')) {progress={revision:progress.revision+1,data:body.p_data};data={outcome:'saved',revision:progress.revision};}
   else data={outcome:'ended'};
  }
  else if(url.pathname.includes('/functions/v1/parent-email')) {calls.push(request.postDataJSON());data={queued:true};}
  await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)});
 });
 // Every external destination is blocked except the mocked Supabase host.
 await page.route(/https?:\/\/(?!127\.0\.0\.1|test\.supabase\.co)/,route=>route.abort());
 if(authenticated) await page.addInitScript(({user,userId})=>{
  if(!localStorage.getItem('sb-test-auth-token')) localStorage.setItem('sb-test-auth-token',JSON.stringify({access_token:'fake-token',refresh_token:'fake-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user}));
  sessionStorage.setItem(`oatle-selected-child:${userId}`,'test-child');localStorage.setItem('oatle-age-group','big');
 },{user,userId});
 return calls;
}
test('signup marketing is optional, unchecked and recorded before any checkout',async({page})=>{
 const calls=await mock(page);
 await page.goto('/app.html?auth=signup');
 const consent=page.getByRole('checkbox',{name:/Yes, email me/});await expect(consent).not.toBeChecked();
 await page.getByRole('textbox',{name:'Email',exact:true}).fill('parent@example.invalid');
 await page.getByLabel('Password',{exact:true}).fill('testing123');
 await page.getByRole('checkbox',{name:/I agree/}).check();
 await consent.check();await page.getByRole('button',{name:'Create Account',exact:true}).click();
 await expect.poll(()=>calls.length).toBe(1);expect(calls[0].data.email_marketing_opt_in).toBe(true);
});
test('registered non-subscriber can opt out on the subscription screen',async({page})=>{
 const calls=await mock(page,true,false);await page.goto('/app.html');
 await expect(page.getByRole('heading',{name:'Email preferences'})).toBeVisible();
 const consent=page.getByRole('checkbox',{name:/Send me optional/});await expect(consent).not.toBeChecked();
 await page.getByRole('button',{name:'Save email preferences'}).click();
 await expect(page.getByText('Email preferences saved.')).toBeVisible();expect(calls[0].body.p_opted_in).toBe(false);
});
for(const subject of ['reading','maths']) test(`${subject} completed attempt resumes and submits once to authenticated parent`,async({page})=>{
 const calls=await mock(page,true,true);await page.goto('/app.html');
 await expect(page.getByRole('button',{name:/Reading Adventure/})).toBeVisible();
 await page.evaluate(async subject=>{
  const storage=(await import('/src/lib/profileStorage.js')).learningStorage;
  const {selectAssessment}=await import('/src/utils/assessmentSelection.js');
  if(subject==='reading') {
   const bank=await import('/src/data/assessmentQuestions.js');
   const questions=selectAssessment(bank.assessmentQuestions,bank.assessmentSkills,4);
   const scores=Object.fromEntries(bank.assessmentSkills.map(({id})=>[id,{correct:2,total:4}]));
   storage.setItem('atli-space-progress',JSON.stringify({unlocked:9,activePlanet:9,question:27,missions:{}}));
   storage.setItem('oatle-reading-assessment-attempt',JSON.stringify({active:true,questionIds:questions.map(q=>q.assessmentId),answered:28,scores}));
  } else {
   const bank=await import('/src/data/mathAssessmentQuestions.js');
   const questions=selectAssessment(bank.mathAssessmentQuestions,bank.assessmentSkills,2);
   storage.setItem('oatle-maths-progress',JSON.stringify({unlocked:9,activeMission:9,question:19,missions:{}}));
   storage.setItem('oatle-maths-assessment-attempt',JSON.stringify({active:true,questionIds:questions.map(q=>q.assessmentId),answers:questions.map((q,i)=>({skill:q.skill,correct:i%2===0}))}));
  }
 },subject);
 await page.reload();
 await page.getByRole('button',{name:subject==='reading'?/Reading Adventure/:/Maths Adventure/}).click();
 await page.getByRole('button',{name:subject==='reading'?/Pluto/:/Maths Check-in/}).click();
 if(subject==='reading') await page.getByRole('button',{name:/Return to assessment/}).click();
 await expect.poll(()=>calls.filter(c=>c.subject===subject).length).toBe(1);
 expect(Object.keys(calls.find(c=>c.subject===subject).scores)).toHaveLength(subject==='reading'?7:10);
 await page.waitForTimeout(500);expect(calls.filter(c=>c.subject===subject)).toHaveLength(1);
});
