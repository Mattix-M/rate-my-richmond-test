/** Relative scale from the exact campus OSM polygons: local equirectangular
 * meters, aligned to the longest exterior edge, normalized to 280 SVG units.
 * Footprint dimensions are mapped estimates; storey/window heights remain illustrative. */
const metricScales={
  "264345592": {
    "name": "North Court",
    "unitsPerMeter": 2.268771,
    "widthMeters": 123.415,
    "depthMeters": 80.777
  },
  "264371584": {
    "name": "Residence Hall No.1",
    "unitsPerMeter": 4.110993,
    "widthMeters": 68.11,
    "depthMeters": 25.517
  },
  "264371581": {
    "name": "Wood Hall",
    "unitsPerMeter": 4.990758,
    "widthMeters": 56.104,
    "depthMeters": 13.56
  },
  "264367670": {
    "name": "Robins Hall",
    "unitsPerMeter": 6.247423,
    "widthMeters": 44.818,
    "depthMeters": 34.663
  },
  "264345602": {
    "name": "Gray Court",
    "unitsPerMeter": 3.387273,
    "widthMeters": 71.186,
    "depthMeters": 82.662
  },
  "264367675": {
    "name": "Moore Hall",
    "unitsPerMeter": 4.746202,
    "widthMeters": 58.995,
    "depthMeters": 48.871
  },
  "264250593": {
    "name": "Keller Hall",
    "unitsPerMeter": 4.014752,
    "widthMeters": 69.743,
    "depthMeters": 30.3
  },
  "264371580": {
    "name": "Residential Hall No. 2",
    "unitsPerMeter": 4.42424,
    "widthMeters": 63.288,
    "depthMeters": 29.996
  },
  "264367678": {
    "name": "Marsh Hall",
    "unitsPerMeter": 3.254985,
    "widthMeters": 86.022,
    "depthMeters": 46.112
  },
  "264345594": {
    "name": "Westhampton Residence Hall",
    "unitsPerMeter": 3.546015,
    "widthMeters": 78.962,
    "depthMeters": 29.562
  },
  "264367682": {
    "name": "Lakeview Hall",
    "unitsPerMeter": 3.857269,
    "widthMeters": 72.59,
    "depthMeters": 32.752
  },
  "264345593": {
    "name": "South Court",
    "unitsPerMeter": 4.378639,
    "widthMeters": 63.947,
    "depthMeters": 35.843
  },
  "264367672": {
    "name": "Dennis Hall",
    "unitsPerMeter": 5.966314,
    "widthMeters": 46.93,
    "depthMeters": 30.665
  },
  "264371582": {
    "name": "Residential Hall No.3",
    "unitsPerMeter": 4.556232,
    "widthMeters": 61.454,
    "depthMeters": 29.538
  },
  "264364113": {
    "name": "Atlantic House",
    "unitsPerMeter": 23.525894,
    "widthMeters": 11.902,
    "depthMeters": 10.202
  },
  "264364112": {
    "name": "Pacific House",
    "unitsPerMeter": 16.81821,
    "widthMeters": 16.649,
    "depthMeters": 13.407
  },
  "264250580": {
    "name": "Lora Robins Court",
    "unitsPerMeter": 4.442595,
    "widthMeters": 63.026,
    "depthMeters": 52.529
  },
  "264336158": {
    "name": "Gateway Building 151",
    "unitsPerMeter": 7.382987,
    "widthMeters": 37.925,
    "depthMeters": 26.287
  },
  "264336159": {
    "name": "Gateway Building 153",
    "unitsPerMeter": 5.514431,
    "widthMeters": 50.776,
    "depthMeters": 30.037
  },
  "264336160": {
    "name": "Gateway Building 155",
    "unitsPerMeter": 10.731298,
    "widthMeters": 26.092,
    "depthMeters": 25.916
  },
  "264336161": {
    "name": "Gateway Building 157",
    "unitsPerMeter": 5.153618,
    "widthMeters": 54.331,
    "depthMeters": 38.477
  }
};
export function buildingMetricScale(sourceOsmId){return metricScales[String(sourceOsmId)]?.unitsPerMeter??null;}
export function buildingMetricDimensions(sourceOsmId){const value=metricScales[String(sourceOsmId)];return value?{...value}:null;}
