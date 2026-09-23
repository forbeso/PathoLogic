/** Select the nearest of the eight keyboard directions in the current camera frame. */
export function walkingKeys(dx:number,dz:number,facing:number) {
 const forward=dx*Math.sin(facing)-dz*Math.cos(facing);
 const right=dx*Math.cos(facing)+dz*Math.sin(facing);
 const threshold=Math.max(Math.abs(forward),Math.abs(right))*Math.tan(Math.PI/8);
 if(Math.hypot(dx,dz)<1e-6) return [];
 return [...(Math.abs(forward)>threshold?[forward>0?'w':'s']:[]),...(Math.abs(right)>threshold?[right>0?'d':'a']:[])];
}
