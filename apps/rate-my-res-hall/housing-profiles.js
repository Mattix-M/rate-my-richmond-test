// Official housing guidance; student reputations are not assignment rules.
// Entries are supplemented with published capacity/room-type data at render time.
const returning='https://residencelife.richmond.edu/housing/upperclass/';
const programs='https://livinglearning.richmond.edu/about/communities/residential.html';
const firstYear={eligibility:'First-year housing. Assignments are handled through the university housing process.'};
const upperlevel={eligibility:'Returning undergraduate students.',sourceUrl:returning};
const apartment={eligibility:'Juniors and seniors. Apartment selection requires a roommate group of four.',selectionNote:'All four beds must be filled. A group that includes a sophomore is not eligible for apartment selection. Use the best eligible time slot in your group.',sourceUrl:returning};
export const housingProfiles={
 '572483':{eligibility:'Law-student housing.',bathrooms:'Single bedrooms with hall bathrooms.',sourceUrl:'https://residencelife.richmond.edu/housing/law-housing/'},
 '572484':{eligibility:'Law-student housing.',bathrooms:'Single bedrooms with hall bathrooms.',sourceUrl:'https://residencelife.richmond.edu/housing/law-housing/'},
 '571561':{...firstYear,renovated:'2023',bathrooms:'Hall bathrooms.',features:['HVAC, bathrooms and lounges renovated in 2023.']},
 '571565':{...upperlevel,renovated:'2018',bathrooms:'Coed by suite, with adjoining bathrooms. Some rooms use a bathroom outside the room; check the individual listing.'},
 '571571':{...upperlevel,bathrooms:'Private or suite bathrooms; check your room’s description.',features:['Residential floor plans cover floors 3–5.']},
 '571573':{...upperlevel,renovated:'2019',bathrooms:'Single/double and double/double suites sharing a bathroom.',features:['Room and lounge improvements in 2019.']},
 '571574':{...firstYear,renovated:'2019',features:['Air conditioning','Elevator, floor lounges and a lower-level classroom'],bathrooms:'Traditional hall bathrooms. Gender-assigned community bathrooms and gender-inclusive bathrooms/showers are available.',program:{name:'Richmond Endeavor',text:'Endeavor students live together in LoRo. It is a year-long living-learning program that includes pre-orientation; the hall also houses other first-year students.',url:programs},sources:['https://livinglearning.richmond.edu/endeavor/apply/faq.html'],selectionNote:'Endeavor participants must still complete the housing application. A requested roommate must also be accepted into Endeavor. Endeavor uses doubles; singles are limited to approved accommodations requiring one.'},
 '571575':{...firstYear,renovated:'2017',bathrooms:'Hall bathrooms.',features:['Air conditioning','Tile floors']},
 '571759':{...firstYear,renovated:'2018',bathrooms:'Hall bathrooms.',features:['Air conditioning','Tile floors']},
 '571760':{...upperlevel,renovated:'2017 / 2024',features:['The second renovation phase added 63 beds in 2024.']},
 '571570':{...upperlevel,renovated:'2015'},
 '571872':{...upperlevel,renovated:'2015 / 2023'},
 '571562':{...upperlevel,renovated:'2008 / 2021'},
 '571861':{...firstYear,renovated:'2021',bathrooms:'Check the room: some have a half bathroom.',features:['Air conditioning','Laminate floors']},
 '571866':{...upperlevel,renovated:'2018',bathrooms:'Predominantly two double rooms sharing a bathroom.',program:{name:'Sophomore Scholars in Residence',text:'South Court houses the SSIR cohort. The university describes the hall as almost exclusively SSIR, with a shared first-floor lounge for studying and community meetings.',url:programs},selectionNote:'SSIR students can live with other SSIR participants across different SSIR classes. Confirm your program’s selection process.'},
 '572061':{...apartment,renovated:'2014–17',features:['Kitchen and shared living space','UFA laundry is in a separate building'],sources:['https://residencelife.richmond.edu/policies-and-services/services/index.html'],bathrooms:'Typical townhouses have two double bedrooms, one full bathroom upstairs and a half bathroom downstairs. One-level exceptions are marked in the layout selector.'},
 '572073':{...apartment,bathrooms:'Four single bedrooms and two bathrooms per apartment, with a full kitchen and shared living space.',features:['Buildings 151 and 155 have no elevator.','Elevator access in 153 and 157 applies only to indicated units.']},
 '571973':{...upperlevel,features:['Laminate floors installed in 2022.'],bathrooms:'Suites and separate rooms. Some singles use shared private hall half bathrooms; check the individual room listing.'},
 '571975':{eligibility:'First-year and returning undergraduate students.',renovated:'2021',bathrooms:'Community bathrooms.',features:['Air conditioning','Laminate floors']}
};
