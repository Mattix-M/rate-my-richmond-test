// Editable reconstructions of six publicly viewable sample suites.
// The coordinates below are hand-drawn from the saved overhead tour views.
// Their scale is NOMINAL: neither room nor furniture dimensions were measured.
// Each model preserves the visible arrangement of rooms, recesses and fixed bath
// areas. It is not an architectural survey, a room assignment or a fit guarantee.

const colors = { bed: '#849ac0', desk: '#ae8464', dresser: '#b28163' };
const bedroomColor = '#e5d5bc';
const bathColor = '#d0dadb';
const entryColor = '#dcd4c6';

function model({ id, hall, slug, reference, outline, doors, windows, fixed, zones, furniture, notes }) {
  const [left, top, right, bottom, scale] = reference;
  const point = ([x, y]) => [(x - left) * scale, (bottom - y) * scale];
  const polygon = (points) => points.map(point);
  const rectangle = ([x1, y1, x2, y2]) => ({
    x: ((x1 + x2) / 2 - left) * scale,
    z: (bottom - (y1 + y2) / 2) * scale,
    width: (x2 - x1) * scale,
    depth: (y2 - y1) * scale,
    rotation: 0
  });
  const opening = ({ at, span, wall, ...rest }) => {
    const [x, z] = point(at);
    return { x, z, width: span * scale, wall, ...rest };
  };
  const source = `https://tours.vividmediany.com/3d-model/${slug}/fullscreen/`;
  return {
    id: `tour-${id}-example`, hall, name: 'Tour example · suite',
    width: (right - left) * scale, depth: (bottom - top) * scale, height: 8,
    outline: polygon(outline),
    doors: doors.map(opening),
    windows: windows.map((window) => opening({ sill: 3, height: 4, ...window })),
    obstacles: fixed.map(([fixedId, name, kind, bounds, height = 8]) => ({
      id: `${id}-${fixedId}`, name, kind, ...rectangle(bounds), height
    })),
    zones: zones.map(([name, points, color]) => ({ name, outline: polygon(points), color })),
    initialFurniture: furniture.map(([type, itemId, bounds, rotation]) => {
      const item = rectangle(bounds);
      // Beds retain their long side as local depth; desks retain the long side
      // as local width, so the furniture renderer places pillows/fronts sensibly.
      const turn = rotation ?? (type === 'bed' ? item.width > item.depth : item.depth > item.width);
      if (turn === true || turn === 90) {
        [item.width, item.depth] = [item.depth, item.width];
        item.rotation = 90;
      }
      return { type, id: `${id}-${itemId}`, ...item, height: type === 'bed' ? 2 : type === 'desk' ? 2.5 : 3, color: colors[type] };
    }),
    source, planUrl: source,
    dimensionLabel: 'Tour reconstruction · dimensions unverified',
    scaleStatus: 'unmeasured-tour-reference',
    notes: `${notes} This is an unmatched example suite, not a verified room number. Overall scale, furniture sizes, wall/window heights and opening positions are nominal visual estimates. Low fixed areas reserve bathroom or entry circulation; movable furniture must stay in the bedrooms. Consult the linked tour and official floorplan before making a purchase or assuming a layout fits.`,
    tourReference: { auditedAt: '2026-10-22', credit: 'University of Richmond · Vivid Media LLC · Matterport', screenshot: `research/virtual-tours/suites-${id}-floorplan.jpg` }
  };
}

export const tourSuiteRooms = [
  model({
    id: 'gray', hall: 'Gray Court', slug: 'richmond-gray-court-double',
    reference: [379, 186, 903, 430, .06],
    outline: [[379,196],[489,196],[489,186],[585,186],[585,300],[699,300],[699,186],[793,186],[793,196],[903,196],[903,430],[699,430],[699,425],[585,425],[585,430],[490,430],[490,418],[379,418]],
    doors: [{ at:[539,430],span:45,wall:'south' },{ at:[748,430],span:45,wall:'south' }],
    windows: [{ at:[537,186],span:72,wall:'north' },{ at:[744,186],span:72,wall:'north' }],
    fixed: [
      ['bath-reserved','Suite bathroom · fixed','fixture',[585,300,699,425],.06],
      ['bath-west-upper','Bathroom partition','wall',[583,300,588,344]],
      ['bath-west-lower','Bathroom partition','wall',[583,391,588,425]],
      ['bath-east-upper','Bathroom partition','wall',[696,300,701,344]],
      ['bath-east-lower','Bathroom partition','wall',[696,391,701,425]],
      ['bath-fixtures','Bath fixtures · approximate','fixture',[592,304,690,338],2.4],
      ['bath-vanity','Vanity · approximate','fixture',[595,402,664,423],2.6]
    ],
    zones: [
      ['Double bedroom A',[[379,196],[585,196],[585,430],[490,430],[490,418],[379,418]],bedroomColor],
      ['Double bedroom B',[[699,196],[903,196],[903,430],[699,430]],bedroomColor],
      ['Suite bathroom',[[585,300],[699,300],[699,425],[585,425]],bathColor]
    ],
    furniture: [
      ['bed','bed-a1',[384,201,491,250]],['bed','bed-a2',[384,365,491,414]],
      ['bed','bed-b1',[792,201,897,250]],['bed','bed-b2',[792,376,897,424]],
      ['desk','desk-a1',[385,279,417,340]],['desk','desk-a2',[550,286,580,346]],
      ['desk','desk-b1',[705,285,735,346]],['desk','desk-b2',[867,285,897,346]]
    ],
    notes: 'The tour shows two double bedrooms flanking a central bathroom. The central gap above the bathroom and the shallow bedroom-entry steps are retained as an approximate silhouette. Bath fixture boundaries and closet locations were not resolved; the fixed fixture block is schematic. Under-bed drawers are not added as overlapping floor furniture.'
  }),
  model({
    id: 'keller', hall: 'Keller Hall', slug: 'richmond-keller-double-bath',
    reference: [410,125,870,464,.055],
    outline: [[410,176],[410,125],[470,125],[470,176],[548,176],[548,125],[808,125],[808,187],[830,192],[850,207],[865,231],[870,288],[854,321],[833,336],[808,342],[808,464],[578,464],[578,454],[454,454],[454,391],[410,391]],
    doors: [{ at:[410,255],span:52,wall:'west' }],
    windows: [{ at:[866,263],span:90,wall:'east' }],
    fixed: [
      ['closet','Built-in closet · approximate','closet',[413,128,467,174],7],
      ['bath-main','Private bathroom · fixed','fixture',[414,314,568,390],.06],
      ['bath-shower-zone','Shower area · fixed','fixture',[454,390,510,454],.06],
      ['bath-toilet-zone','Toilet area · fixed','fixture',[518,390,568,454],.06],
      ['bath-wall-north','Bathroom partition','wall',[414,308,540,313]],
      ['bath-wall-east','Bathroom partition','wall',[569,350,574,454]],
      ['bath-shower','Shower · approximate','fixture',[457,395,505,449],.3],
      ['bath-toilet','Toilet · approximate','fixture',[535,410,557,442],1.5],
      ['window-heater','Window heater · keep clear','fixture',[831,221,855,302],2.5]
    ],
    zones: [
      ['Double bedroom',[[410,176],[548,176],[548,125],[808,125],[808,187],[830,192],[850,207],[865,231],[870,288],[854,321],[833,336],[808,342],[808,464],[578,464],[578,308],[410,308]],'#d5d9de'],
      ['Private bathroom',[[414,314],[568,314],[568,454],[454,454],[454,391],[414,391]],bathColor]
    ],
    furniture: [
      ['bed','bed-a',[679,132,801,188]],['bed','bed-b',[676,404,801,458]],
      ['desk','desk-a',[554,131,620,171]],['desk','desk-b',[582,350,617,399]],
      ['dresser','dresser',[773,365,804,397]]
    ],
    notes: 'This sample is a double with a private bath, a bay window, an entrance recess and a visible built-in closet. The bedroom and bathroom retain separate footprints. The bay and fixed heater are approximate, not measured. The upper entrance-side recess includes scan uncertainty and should not be treated as exact cabinetry geometry.'
  }),
  model({
    id: 'lakeview', hall: 'Lakeview Hall', slug: 'richmond-lakeview-double-suite',
    reference: [433,118,850,497,.06],
    outline: [[454,118],[730,118],[730,126],[850,126],[850,214],[848,214],[848,286],[815,286],[815,437],[850,437],[850,490],[730,490],[730,497],[454,497],[454,431],[433,431],[433,378],[454,378],[454,241],[433,241],[433,183],[454,183]],
    doors: [{ at:[815,330],span:45,wall:'east' }],
    windows: [{ at:[433,211],span:52,wall:'west' },{ at:[433,405],span:52,wall:'west' }],
    fixed: [
      ['bedroom-divider','Bedroom partition','wall',[454,303,731,309]],
      ['bath-wall-a','Bathroom partition','wall',[729,126,735,219]],
      ['bath-wall-b','Bathroom partition','wall',[729,280,735,331]],
      ['bath-wall-c','Bathroom partition','wall',[729,386,735,490]],
      ['bath-passage','Bathroom passage · fixed','fixture',[736,127,815,490],.06],
      ['bath-toilet-zone','Toilet area · fixed','fixture',[815,127,849,214],.06],
      ['bath-vanity-zone','Vanity area · fixed','fixture',[815,214,848,286],.06],
      ['bath-shower-zone','Shower area · fixed','fixture',[815,437,848,490],.06],
      ['toilet','Toilet · approximate','fixture',[819,140,845,180],1.5],
      ['vanity-a','Vanity · approximate','fixture',[749,132,782,158],2.6],
      ['vanity-b','Vanity · approximate','fixture',[819,223,845,282],2.6],
      ['shower','Shower · approximate','fixture',[819,442,846,487],.3]
    ],
    zones: [
      ['Double bedroom A',[[454,118],[729,118],[729,303],[454,303],[454,241],[433,241],[433,183],[454,183]],bedroomColor],
      ['Double bedroom B',[[454,310],[729,310],[729,497],[454,497],[454,431],[433,431],[433,378],[454,378]],bedroomColor],
      ['Bathroom passage',[[736,127],[849,127],[849,286],[815,286],[815,437],[848,437],[848,490],[736,490]],bathColor]
    ],
    furniture: [
      ['bed','bed-a1',[459,123,565,173]],['bed','bed-a2',[459,252,565,299]],
      ['bed','bed-b1',[459,315,565,366]],['bed','bed-b2',[459,444,565,491]],
      ['desk','desk-a1',[577,124,626,154]],['desk','desk-a2',[578,271,626,299]],
      ['desk','desk-b1',[577,316,626,345]],['desk','desk-b2',[577,463,626,491]]
    ],
    notes: 'The tour shows two double bedrooms side by side, each opening into the tiled bathroom passage. The bathroom passage is reserved as circulation, not a living room. Toilet, shower and vanity areas are separate fixed regions. Door openings and shallow window projections follow the visible sample only.'
  }),
  model({
    id: 'north', hall: 'North Court', slug: 'richmond-north-hall-suites',
    reference: [367,209,913,410,.065],
    outline: [[367,233],[432,233],[432,210],[621,210],[621,233],[654,233],[654,231],[741,231],[741,233],[776,233],[776,209],[866,209],[866,233],[913,233],[913,410],[617,410],[617,365],[658,365],[658,321],[603,321],[603,358],[548,358],[548,410],[367,410]],
    doors: [{ at:[579,358],span:35,wall:'south' },{ at:[913,374],span:37,wall:'east' }],
    windows: [{ at:[526,210],span:170,wall:'north' },{ at:[821,209],span:80,wall:'north' }],
    fixed: [
      ['bath-main','Suite bathroom · fixed','fixture',[659,232,741,410],.06],
      ['bath-shower-zone','Shower area · fixed','fixture',[617,366,659,410],.06],
      ['bath-west-upper','Bathroom partition','wall',[654,233,659,270]],
      ['bath-west-lower','Bathroom partition','wall',[654,313,659,321]],
      ['bath-east-upper','Bathroom partition','wall',[740,233,745,275]],
      ['bath-east-lower','Bathroom partition','wall',[740,312,745,410]],
      ['bath-inner-a','Bathroom partition','wall',[659,322,683,327]],
      ['bath-inner-b','Bathroom partition','wall',[719,322,741,327]],
      ['vanity','Vanity · approximate','fixture',[681,236,715,263],2.6],
      ['toilet','Toilet · approximate','fixture',[712,373,736,404],1.5],
      ['shower','Shower · approximate','fixture',[621,370,653,405],.3]
    ],
    zones: [
      ['Double bedroom',[[367,233],[432,233],[432,210],[621,210],[621,233],[654,233],[654,321],[603,321],[603,358],[548,358],[548,410],[367,410]],bedroomColor],
      ['Single bedroom',[[745,233],[776,233],[776,209],[866,209],[866,233],[913,233],[913,410],[745,410]],bedroomColor],
      ['Suite bathroom',[[659,232],[740,232],[740,410],[617,410],[617,366],[659,366]],bathColor]
    ],
    furniture: [
      ['bed','bed-double-a',[372,239,476,282]],['bed','bed-double-b',[372,363,476,405]],
      ['bed','bed-single',[865,300,908,403]],
      ['desk','desk-double-a',[373,291,404,345]],['desk','desk-double-b',[547,326,598,355]],
      ['desk','desk-single',[749,325,782,377]],['dresser','dresser-single',[790,239,825,264]]
    ],
    notes: 'The sample has one double bedroom on the left and one single on the right, with a two-part bathroom between them and an irregular entry-side notch. This is NOT verified as room North0013. Closet boundaries and the exact use of each recess were not established, so no invented closets are added. Bathroom and bedroom partitions have circulation gaps.'
  }),
  model({
    id: 'south', hall: 'South Court', slug: 'richmond-south-double-suite',
    reference: [382,184,903,431,.06],
    outline: [[382,204],[499,204],[499,194],[553,194],[553,204],[589,204],[589,217],[598,217],[598,202],[648,202],[648,214],[690,214],[690,196],[725,196],[725,184],[781,184],[781,195],[903,195],[903,431],[646,431],[646,342],[690,342],[690,334],[630,334],[630,288],[592,288],[592,430],[382,430]],
    doors: [{ at:[548,430],span:44,wall:'south' },{ at:[646,391],span:45,wall:'west' }],
    windows: [{ at:[526,194],span:50,wall:'north' },{ at:[752,184],span:51,wall:'north' }],
    fixed: [
      ['bath-main','Suite bathroom · fixed','fixture',[598,215,689,288],.06],
      ['bath-shower-zone','Shower area · fixed','fixture',[630,288,689,334],.06],
      ['bath-west-upper','Bathroom partition','wall',[591,217,597,240]],
      ['bath-west-lower','Bathroom partition','wall',[591,278,597,288]],
      ['bath-east-upper','Bathroom partition','wall',[688,215,693,240]],
      ['bath-east-lower','Bathroom partition','wall',[688,279,693,334]],
      ['bath-crosswall','Bathroom partition','wall',[630,287,654,292]],
      ['toilet','Toilet · approximate','fixture',[609,218,636,250],1.5],
      ['vanity','Vanity · approximate','fixture',[651,217,684,241],2.6],
      ['shower','Shower · approximate','fixture',[635,296,684,329],.3]
    ],
    zones: [
      ['Double bedroom A',[[382,204],[499,204],[499,194],[553,194],[553,204],[589,204],[589,288],[592,288],[592,430],[382,430]],bedroomColor],
      ['Double bedroom B',[[694,196],[725,196],[725,184],[781,184],[781,195],[903,195],[903,431],[646,431],[646,342],[694,342]],bedroomColor],
      ['Suite bathroom',[[598,215],[688,215],[688,334],[630,334],[630,288],[598,288]],bathColor]
    ],
    furniture: [
      ['bed','bed-a1',[387,209,496,253]],['bed','bed-a2',[387,376,501,424]],
      ['bed','bed-b1',[786,200,897,248]],['bed','bed-b2',[789,377,898,424]],
      ['desk','desk-a1',[386,285,416,344]],['desk','desk-a2',[553,285,587,346]],
      ['desk','desk-b1',[698,286,730,345]],['desk','desk-b2',[867,288,898,350]]
    ],
    notes: 'The tour shows two double bedrooms on opposite sides of a bathroom, with different entry-side recesses and a lower bathroom/entry notch. Bedroom shapes are intentionally not mirrored. The shower, toilet and vanity are illustrative fixed shapes in the scanned bathroom locations. Their dimensions and internal door positions remain unverified.'
  }),
  model({
    id: 'westhampton', hall: 'Westhampton Hall', slug: 'richmond-westhampton-hall-suites',
    reference: [430,106,849,499,.06],
    outline: [[430,121],[487,121],[487,107],[569,107],[569,121],[621,121],[621,119],[688,119],[688,106],[774,106],[774,119],[849,119],[849,343],[808,343],[808,364],[849,364],[849,428],[811,428],[811,438],[710,438],[710,479],[541,479],[541,444],[531,444],[531,499],[477,499],[477,444],[430,444],[430,350],[500,350],[500,298],[430,298]],
    doors: [{ at:[760,438],span:48,wall:'south' }],
    windows: [{ at:[528,107],span:74,wall:'north' },{ at:[731,106],span:76,wall:'north' }],
    fixed: [
      ['bedroom-divider','Bedroom partition','wall',[615,121,621,344]],
      ['single-entry-a','Bedroom partition','wall',[500,344,537,350]],
      ['single-entry-b','Bedroom partition','wall',[595,344,615,350]],
      ['double-entry','Bedroom partition','wall',[621,343,710,349]],
      ['toilet-zone','Toilet area · fixed','fixture',[432,352,535,443],.06],
      ['shower-zone','Shower area · fixed','fixture',[478,443,531,499],.06],
      ['bath-passage','Bathroom passage · fixed','fixture',[542,352,706,479],.06],
      ['suite-entry','Suite entry · keep clear','fixture',[711,350,807,437],.06],
      ['bath-partition-a','Bathroom partition','wall',[536,352,541,374]],
      ['bath-partition-b','Bathroom partition','wall',[536,428,541,444]],
      ['toilet','Toilet · approximate','fixture',[446,360,479,388],1.5],
      ['shower','Shower · approximate','fixture',[482,448,526,493],.3],
      ['vanity','Vanity · approximate','fixture',[642,449,700,476],2.6],
      ['entry-storage','Fixed storage · approximate','closet',[815,367,846,425],7]
    ],
    zones: [
      ['Single bedroom',[[430,121],[487,121],[487,107],[569,107],[569,121],[615,121],[615,344],[500,344],[500,298],[430,298]],bedroomColor],
      ['Double bedroom',[[621,119],[688,119],[688,106],[774,106],[774,119],[849,119],[849,343],[621,343]],bedroomColor],
      ['Suite bathroom',[[432,352],[706,352],[706,479],[542,479],[542,444],[531,444],[531,499],[478,499],[478,444],[432,444]],bathColor],
      ['Entry',[[711,350],[807,350],[807,437],[711,437]],entryColor]
    ],
    furniture: [
      ['bed','bed-single',[435,127,486,246]],['bed','bed-double-a',[626,125,677,244]],['bed','bed-double-b',[793,124,843,246]],
      ['desk','desk-single',[541,130,610,159]],['dresser','dresser-single',[574,215,610,249]],
      ['desk','desk-double-a',[626,309,699,338]],['desk','desk-double-b',[812,270,843,335]]
    ],
    notes: 'This sample has a single and a double bedroom opening onto a shared bathroom/entry area. The left bedroom recess, separate shower extension and right entry/storage wing are reconstructed as distinct areas. Some scan edges are incomplete; the outside silhouette and storage block are schematic, not proof of exact wall or closet positions.'
  })
];
