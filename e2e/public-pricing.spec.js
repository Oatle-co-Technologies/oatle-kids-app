import { test, expect } from '@playwright/test';
for (const width of [1440,390]) test(`both published prices and limits are readable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/#pricing');
 const single=page.locator('#pricing article').filter({has:page.getByText('SINGLE CHILD',{exact:true})});
 const family=page.locator('#pricing article').filter({has:page.getByText('FAMILY',{exact:true})});
 await expect(single).toContainText('R120');await expect(family).toContainText('R200');
 await expect(single).toContainText('1 child playing at a time');await expect(family).toContainText('2 children playing at once');
 await expect(page.locator('#pricing article')).toHaveCount(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('link',{name:/Choose Family/})).toHaveAttribute('href','/app.html?auth=login');
});
