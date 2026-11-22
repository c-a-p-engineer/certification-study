/**
 * Orthographic camera fit for model previews inside compact UI cards.
 * The extents are model bounding-box corners projected into camera space.
 * A 22% safe inset protects wide animal meshes and authored idle animations.
 * Battle framing uses a fixed camera and does not call this function.
 */
export function enemyCardFrustumHalfHeight(
 width:number,height:number,horizontalExtent:number,verticalExtent:number,
):number{
 const aspect=Math.max(1,width)/Math.max(1,height);
 const horizontal=Math.max(0,horizontalExtent)+0.18;
 const vertical=Math.max(0,verticalExtent)+0.18;
 return Math.max(1.52,horizontal/(aspect*0.78),vertical/0.78);
}
