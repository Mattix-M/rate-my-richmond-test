# Housing registration product improvements

## Implemented in this update
- Shared hall guide for all nineteen residences/communities, with desktop side panel and phone disclosure below the model.
- Capacity and construction date from published statistics; renovation dates, eligibility, room/bath arrangements and supported amenities from official housing pages.
- Room-record coverage labeled distinctly from certified total room counts. Unknown capacities remain unknown.
- Endeavor/LoRo and SSIR/South program context with official links. No unsourced Greek-life badge for Gray.
- Junior/senior four-person apartment eligibility; law-housing identification; mixed first-year/returning classification for Wood; Gateway elevator caveats.
- In-view save-to-shortlist and hall-specific comparison links.
- Social preview and crisp icon family.

## Highest-value next phase
1. Shareable ranked shortlist: ordered hall/room choices, backups, private notes; device-local by default, explicit share link export.
2. Roommate planner: year and group size against dated published selection rules; clearly explain incompatibilities. Never promise a room or lottery outcome.
3. Room-level bathroom and selection-unit clarity: suite versus separately selected adjoining room, number of bedrooms/beds, special accessible layouts and staff rooms.
4. Compare published cost by academic year, kitchen/laundry/elevator access, measured room area where source dimensions permit, and approximate walking routes to user-selected places. No invented live availability.
5. Student reviews: year lived, hall/floor without exact bedroom identifier, room type, noise, upkeep, bathrooms, location, overall experience and would-choose-again. Show sample size/year distribution; keep program eligibility separate from impressions.
6. Explainable preference matching: user-selected priorities and factual attributes first; review-based factors only after sufficient recent responses exist.
7. Selection checklist with editable tasks, official-process links and dated schedule only when next cycle published.

## Reviews implementation boundary
Do not show fabricated ratings or seed copied third-party reviews. A public submission system needs persistent storage, moderation/reporting, rate limits, duplicate controls, and a clear privacy/removal policy. Prefer optional university-email verification with public anonymity, while explicitly documenting what verification does and does not prove. Never publish account emails, room numbers or roommate names in reviews. No new review form is shipped in this update because there is no submission backend yet.

## Research
Checked October20,2026. Official livinglearning pages support LoRo Endeavor and South SSIR. Current returning housing page supports junior/senior apartment eligibility/four-person groups. Official Gray housing page supports upperlevel/coed bysuite, not 'Greek dorm'. Sparse or old thirdparty reviews exist but are not representative enough to label a hall.

- https://livinglearning.richmond.edu/about/communities/residential.html
- https://livinglearning.richmond.edu/endeavor/apply/faq.html
- https://residencelife.richmond.edu/housing/upperclass/
- https://residencelife.richmond.edu/housing/upperclass/gray-court.html
- https://residencelife.richmond.edu/housing/upperclass/ufa-gateway.html
- https://residencelife.richmond.edu/policies-and-services/services/index.html
- https://residencelife.richmond.edu/policies-and-services/facilities-furniture/
- https://universityfinance.richmond.edu/tuition/fees/index.html

## Follow-up features implemented
- Optional year/program guide: first-year, sophomore, junior, senior or law, plus Endeavor/SSIR. Matching halls appear first and gain a blue map ring. Every hall stays browsable. Explanations and source links are available with mouse, keyboard and touch. Preferences are stored only on the device.
- Room-size comparison: 1,069 source records across 19 halls/buildings, in overlaid or side-by-side views, at one shared scale, with B rotation and area/percentage differences. URL preserves room choices, rotation and view.
- Only explicit feet/inches pairs are parsed. Gray’s clearly stated double-room default is separately labeled. Ambiguous/additive dimensions and identified staff/accessible rooms are excluded. Moore A202’s suspicious published5×13-foot double is quarantined rather than corrected by guesswork.
- These are dimension-based rectangles, not calibrated traces of irregular room perimeters; actual usable area may differ. Accurate irregular outlines remain a future step requiring verified wall geometry and scale.
- Hall links retain context when opening the comparison; unavailable dimension data gets a visible explanation. Existing saved-place filter is labeled Shortlist.

### Verification
- Shared-scale arithmetic, Unicode feet/inches conversion, bad/incomplete dimensions, unique room identifiers, Gray default labeling and quarantine are covered by regression tests.
- All19residence profile/year/program combinations and apartment/program exceptions are covered by rule tests.
- Browser checked narrow320/390px layouts, optional guide persistence, SSIRmatchingonlySouth, all19remainvisible, visible reason/source,16px phone controls, scaledSVGrotationand side-by-side, contextpassing and deep links.
