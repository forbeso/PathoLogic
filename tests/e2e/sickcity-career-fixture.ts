import type { Page } from '@playwright/test';
// Exercise real career dispatch deterministically; no scenario-picker UI or test route.
export async function careerAssignment(page:Page,index:number) {
  await page.addInitScript(({index})=>{
    localStorage.setItem('pathologix:learner-progress:v1',JSON.stringify({totalXp:500,awardedIds:[],recentEvents:[]}));
    const random=Math.random;
    Math.random=()=> (index+random()*.99)/10;
  },{index});
}
