// University-linked example-unit tours. These are not scans of every room.
export const tourDirectorySource = "https://richmond.starrezhousing.com/StarRezPortalX/ADAB3F4D/9/480/Home-Housing_Virtual_Tour";
export const housingTours = [
  {
    "placeId": "571561",
    "name": "Dennis Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-dennis-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571574",
    "name": "Lora Robins Court",
    "url": "https://tours.vividmediany.com/3d-model/richmond-lora-robins-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571575",
    "name": "Marsh Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-marsh-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571759",
    "name": "Moore Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-moore-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571861",
    "name": "Robins Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-robins-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571975",
    "name": "Wood Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-wood-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "572073",
    "name": "Gateway Village Apartments",
    "url": "https://tours.vividmediany.com/3d-model/richmond-gateway-apartment/fullscreen/",
    "sampleLabel": "Apartment",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571565",
    "name": "Gray Court",
    "url": "https://tours.vividmediany.com/3d-model/richmond-gray-court-double/fullscreen/",
    "sampleLabel": "Double room",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571571",
    "name": "Keller Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-keller-double-bath/fullscreen/",
    "sampleLabel": "Double room with bath",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571573",
    "name": "Lakeview Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-lakeview-double-suite/fullscreen/",
    "sampleLabel": "Double suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571760",
    "name": "North Court",
    "url": "https://tours.vividmediany.com/3d-model/richmond-north-hall-suites/fullscreen/",
    "sampleLabel": "Suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571570",
    "name": "Residence Hall No. 1",
    "url": "https://tours.vividmediany.com/3d-model/richmond-res-hall-1-suite/fullscreen/",
    "sampleLabel": "Suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571872",
    "name": "Residence Hall No. 2",
    "url": "https://tours.vividmediany.com/3d-model/richmond-res-hall-2-suites/fullscreen/",
    "sampleLabel": "Suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571562",
    "name": "Residence Hall No. 3",
    "url": "https://tours.vividmediany.com/3d-model/richmond-res-hall-3-suites/fullscreen/",
    "sampleLabel": "Suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571866",
    "name": "South Court",
    "url": "https://tours.vividmediany.com/3d-model/richmond-south-double-suite/fullscreen/",
    "sampleLabel": "Double suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "572061",
    "name": "University Forest Apartments",
    "url": "https://tours.vividmediany.com/3d-model/richmond-university-forest-apt/fullscreen/",
    "sampleLabel": "Apartment",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  },
  {
    "placeId": "571973",
    "name": "Westhampton Hall",
    "url": "https://tours.vividmediany.com/3d-model/richmond-westhampton-hall-suites/fullscreen/",
    "sampleLabel": "Suite",
    "labelBasis": "University-linked tour title",
    "scope": "Example unit; room number and coverage are not verified."
  }
];
export function tourForHall(id){ return housingTours.find(tour=>tour.placeId===String(id)) || null; }
export function findTours(query=""){ const text=query.trim().toLowerCase(); return housingTours.filter(tour=>`${tour.name} ${tour.sampleLabel} ${tour.placeId==='572061'?'ufa':''} ${tour.placeId==='571574'?'loro':''}`.toLowerCase().includes(text)); }
