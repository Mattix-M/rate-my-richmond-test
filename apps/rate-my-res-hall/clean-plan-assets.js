// Pilot drawings: source-derived vectors, with the original PDF retained in the viewer.
const sourceSha256 = 'dfe3500142cbd7ddd36056374db205a5d557e0e8733b014aa2a089f22fb5fd34';
export const cleanPlanAssets = {
  pages: {
    'dfe3500142cbd7dd:1': {
      url: './data/housing/clean-plans/north-court-ground-phase2.svg',
      width: 2400,
      height: 1855,
      sourceSha256,
      // x0, y0, x1, y1, normalized to the full original page.
      // Keep these coordinates when positioning original room markers.
      contentBounds: [138 / 792, 230 / 612, 614 / 792, 372 / 612],
      label: 'North Court · Ground floor · Phase 2',
      provenance: 'Original PDF vectors with simplified labels and source-contour room fills',
    },
  },
  rooms: {
    'room-description-0764': {
      url: './data/housing/clean-plans/north-court-013.svg',
      width: 549,
      height: 916,
      sourceSha256,
      planId: 'dfe3500142cbd7dd',
      pageNumber: 1,
      bounds: [0.48041666666666666, 0.4226415094339623, 0.5358333333333334, 0.5423180592991914],
      label: 'North Court · Room 013',
      provenance: 'Manually traced from the reviewed room crop; source wall openings and fixtures preserved',
    },
  },
};

// Generated vectors are optional: source previews remain usable if the manifest fails.
export const cleanPlanManifestFiles = [
 'clean-raster-assets.json', 'clean-vector-assets.json',
 ...['manual-north-east', 'manual-north-west', 'manual-gateway', 'manual-lakeview', 'manual-small-halls', 'manual-atlantic-floors', 'manual-ufa', 'manual-keller-floors', 'manual-wood-robins', 'manual-north-remaining', 'manual-gateway-rest', 'manual-wood-robins-floors', 'manual-gray', 'manual-north-other-floors', 'manual-lora', 'manual-marsh-south', 'manual-dennis-thomas', 'manual-lora-floors', 'manual-rh1-rh3', 'manual-law-floors', 'manual-marsh-south-floors', 'manual-lakeview-floors', 'manual-gateway-floors', 'manual-moore-floors', 'manual-gray-jeter-floors', 'manual-moore-semantic', 'manual-westhampton-lower', 'manual-westhampton-upper', 'manual-north-floor-overviews', 'manual-westhampton-fourth', 'manual-mf-west-floors', 'manual-dennis-thomas-floors'].map(dir=>`clean-plans/${dir}/manifest.json`),
 'manual-gateway-151-155.json', 'clean-plans/manual-gateway-153/manifest.json', 'clean-plans/manual-gateway-157/manifest.json',
];
export async function loadCleanPlanAssets(){
 const results=await Promise.all(cleanPlanManifestFiles.map(async file=>{
  try{const response=await fetch('data/housing/'+file);return response.ok?await response.json():null;}catch{return null;}
 }));
 const manualPages=cleanPlanAssets.pages,manualRooms=cleanPlanAssets.rooms;
 // Native vector geometry takes precedence over traced raster outlines.
 for(const generated of results.filter(Boolean)){
  cleanPlanAssets.pages={...cleanPlanAssets.pages,...generated.pages};
  cleanPlanAssets.rooms={...cleanPlanAssets.rooms,...generated.rooms};
 }
 cleanPlanAssets.pages={...cleanPlanAssets.pages,...manualPages};
 cleanPlanAssets.rooms={...cleanPlanAssets.rooms,...manualRooms};
 return results.some(Boolean);
}
