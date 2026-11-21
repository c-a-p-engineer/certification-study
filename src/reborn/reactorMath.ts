/** Presentation-only charge meter; never contributes to learning XP or grading. */
export function reactorCharge(value:number):number{
 return Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0;
}
