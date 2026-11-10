import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLIC_PLAN_FACTS, PUBLIC_ACTIVITY_FACTS } from '../src/lib/publicPlanFacts.js';
import { SUBSCRIPTION_PLANS } from '../src/lib/subscriptionPlans.js';
import { context } from '../api/chat.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('public prices match checkout and both plans have distinct visible cards',()=>{
 const section=html.split('id="pricing"')[1].split('</section>')[0];
 assert.equal((section.match(/<article class="price-card">/g)||[]).length,2);
 for(const plan of Object.values(SUBSCRIPTION_PLANS)) {assert(section.includes('R'+plan.price));assert(PUBLIC_PLAN_FACTS.includes('R'+plan.price+'/month'));}
 assert(!section.includes('R220'));assert(section.includes('2 children playing at once'));
});
test('the assistant receives the current plan limits, promo restriction, sync rules and activity facts',()=>{
 assert(context.includes(PUBLIC_PLAN_FACTS));assert(context.includes(PUBLIC_ACTIVITY_FACTS));
 for(const fact of ['1 child profile','2 registered devices','up to 3 child profiles','2 children playing at once','Single Child limits only','90 seconds','Existing recurring amounts are not changed automatically'])assert(context.includes(fact),fact);
 assert(context.includes('Writing and Arts'));assert(context.includes('unlimited offline'));
});
