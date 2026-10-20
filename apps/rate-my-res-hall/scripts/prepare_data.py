"""Rebuild local campus data from checked-in, attributed source snapshots."""
from pathlib import Path
import json, gzip, xml.etree.ElementTree as ET, hashlib
ROOT = Path(__file__).resolve().parents[1]
S = ROOT / 'data/sources'
def read(name): return json.loads((S/name).read_text())
buildings = read('official-buildings.json')['children']['locations']
residences = read('official-residences.json')['children']['locations']
housing = {
'Dennis Hall': 'first years/dennis.html', 'Lora Robins Court': 'first years/lora-robins.html',
'Marsh Hall': 'first years/marsh-hall.html', 'Moore Hall': 'first years/moore-hall.html',
'Robins Hall': 'first years/robins-hall.html', 'Wood Hall': 'upperclass/wood-hall.html',
'Gray Court': 'upperclass/gray-court.html', 'Residence Hall No. 1': 'upperclass/jeter-hall.html',
'Keller Hall': 'upperclass/keller-hall.html', 'Lakeview Hall': 'upperclass/lakeview-hall.html',
'Residence Hall No. 3': 'upperclass/mitchell-freeman-hall.html', 'North Court': 'upperclass/north-court.html',
'South Court': 'upperclass/south-court.html', 'Residence Hall No. 2': 'upperclass/thomas-hall.html',
'Westhampton Hall': 'upperclass/westhampton-hall.html', 'University Forest Apartments': 'upperclass/ufa-gateway.html',
'Gateway Village Apartments': 'upperclass/ufa-gateway.html', 'Atlantic House':'law-housing/atlantic-house.html',
'Pacific House':'law-housing/pacific-house.html'}
aliases={'Residence Hall No. 1':['Jeter Hall'], 'Residence Hall No. 2':['Thomas Hall'], 'Residence Hall No. 3':['Freeman Hall','Mitchell-Freeman Hall'], 'Humanities Building':['Ryland Hall'], 'Fountain Hall':['Puryear Hall']}
groups={}
for b in buildings:
 name=b['name'].strip()
 g=groups.setdefault(name, {'id':str(b['id']), 'name':name, 'lat':b['lat'], 'lng':b['lng'], 'locations':[], 'sourceIds':[], 'aliases':aliases.get(name,[])})
 g['locations'].append({'lat':b['lat'],'lng':b['lng'],'sourceId':b['id']})
 g['sourceIds'].append(b['id'])
for r in residences:
 g=groups[r['name']];g.update(lat=r['lat'],lng=r['lng'],residenceSourceId=r['id'])
for name,g in groups.items():
 g['residential']=name in housing
 g['kind']='Apartments' if 'Apartments' in name else ('Residence' if g['residential'] else 'Campus location')
 g['officialUrl']=f"https://maps.richmond.edu/?id=1949#!m/{g.get('residenceSourceId',g['sourceIds'][0])}"
 if g['residential']:
  g['housingUrl']='https://residencelife.richmond.edu/housing/'+housing[name].replace(' ','%20')
  g['interiors']={'status':'not-integrated','floors':[], 'rooms':[], 'sourceDocuments':[]}
places=sorted(groups.values(),key=lambda x:x['name'])
root=ET.fromstring(gzip.decompress((S/'osm-campus.xml.gz').read_bytes()))
nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in root.findall('node')}
features=[]
for w in root.findall('way'):
 tags={t.attrib['k']:t.attrib['v'] for t in w.findall('tag')}
 kind=next((k for k in ['building','natural','water','waterway','leisure','landuse','highway','amenity'] if k in tags),None)
 if not kind:continue
 if kind=='amenity' and tags[kind]!='parking':continue
 refs=[n.attrib['ref'] for n in w.findall('nd')]
 if any(n not in nodes for n in refs):continue
 coords=[nodes[n] for n in refs]
 if len(coords)<2:continue
 polygon=refs[0]==refs[-1] and len(coords)>3 and (kind!='highway' or tags.get('area')=='yes')
 properties={k:tags[k] for k in ['name','building','natural','water','waterway','leisure','landuse','highway','amenity','surface'] if k in tags}
 properties.update(osmId=w.attrib['id'],kind=kind)
 features.append({'type':'Feature','properties':properties,'geometry':{'type':'Polygon' if polygon else 'LineString','coordinates':[coords] if polygon else coords}})
# Reconstruct complete multipolygon rings; omit incomplete relations rather than guess.
ways={w.attrib['id']:[n.attrib['ref'] for n in w.findall('nd')] for w in root.findall('way')}
def join_rings(parts):
 parts=[p[:] for p in parts];rings=[]
 while parts:
  ring=parts.pop()
  while ring[0]!=ring[-1]:
   found=False
   for i,part in enumerate(parts):
    if ring[-1]==part[0]:ring+=part[1:]
    elif ring[-1]==part[-1]:ring+=part[-2::-1]
    else:continue
    parts.pop(i);found=True;break
   if not found:return None
  rings.append(ring)
 return rings
def contains(point,ring):
 x,y=point;inside=False
 for a,b in zip(ring,ring[1:]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
 return inside
for relation in root.findall('relation'):
 tags={t.attrib['k']:t.attrib['v'] for t in relation.findall('tag')}
 if tags.get('type')!='multipolygon':continue
 kind=next((k for k in ['building','natural','water','leisure','landuse','highway','amenity'] if k in tags),None)
 if not kind:continue
 members=relation.findall('member')
 if any(m.attrib['ref'] not in ways for m in members if m.attrib['type']=='way'):continue
 outer=join_rings([ways[m.attrib['ref']] for m in members if m.attrib['type']=='way' and m.get('role')=='outer'])
 inner=join_rings([ways[m.attrib['ref']] for m in members if m.attrib['type']=='way' and m.get('role')=='inner'])
 if not outer or inner is None:continue
 if any(n not in nodes for ring in outer+inner for n in ring):continue
 outer=[[nodes[n] for n in ring] for ring in outer];inner=[[nodes[n] for n in ring] for ring in inner]
 polygons=[[ring]+[hole for hole in inner if contains(hole[0],ring)] for ring in outer]
 properties={k:tags[k] for k in ['name','building','natural','water','leisure','landuse','highway','amenity','surface'] if k in tags}
 properties.update(osmId=relation.attrib['id'],osmType='relation',kind=kind)
 features.append({'type':'Feature','properties':properties,'geometry':{'type':'MultiPolygon','coordinates':polygons}})
# Interior snapshots remain separate; merge only verified availability and references.
interior_index=ROOT/'data/housing/index.json'
if interior_index.exists():
 housing_index=json.loads(interior_index.read_text())
 for place in places:
  interior=housing_index['places'].get(place['id'])
  if interior:
   place['interiors']={'status':'plans-available','floorLabels':list(dict.fromkeys(p['label'] for p in interior['plans'])), 'rooms':[], 'roomGeometryStatus':'not-mapped', 'sourceDocuments':[p['sourceUrl'] for p in interior['plans']], 'indexUrl':'data/housing/index.json','roomDescriptionsUrl':'data/housing/room-descriptions.json'}
(ROOT/'data/places.json').write_text(json.dumps(places,indent=2)+'\n')
(ROOT/'data/campus.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'))+'\n')
manifest={'schemaVersion':1,'retrievedOn':'2026-10-19','officialMapId':1949,'officialBuildingRecords':len(buildings),'officialResidenceEntries':len(residences),'uniquePlaces':len(places),'residentialPlaces':sum(p['residential'] for p in places),'osmFeatures':len(features),'osmBuildingFootprints':sum(f['properties']['kind']=='building' for f in features),'coverageBounds':[[37.568,-77.548],[37.583,-77.531]],'sources':[
 {'name':'University of Richmond interactive map','url':'https://maps.richmond.edu/?id=1949','data':'Public Buildings (56622) and Residence Halls (55369) category records; geographic marker positions, not surveyed entrances.'},
 {'name':'Residence Life housing directory','url':'https://residencelife.richmond.edu/housing/','data':'Residence links; Atlantic and Pacific Houses supplement the 17 map residence categories.'},
 {'name':'Official printable campus map','url':'https://www.richmond.edu/about/visit/maps/print/campusmap.pdf','data':'Reference PDF archived locally; not the rendered basemap.'},
 {'name':'OpenStreetMap contributors','url':'https://www.openstreetmap.org/copyright','data':'Way geometry from the campus bounding box. ODbL. Footprints are community mapped, not university verified. No inferred footprints.'}],
 'limitations':['Snapshot, not a live university feed.','Coverage is the listed source records, not a claim of every campus building or residence.','Group pins for apartment complexes represent multiple buildings.','Map positions are not entrances, room locations or accessible routes.','Interior plan and description availability is recorded in data/housing/index.json. Clickable room geometry and comparison are not implemented.','OSM ways and complete multipolygon relations included; incomplete relations omitted.'],
 'snapshots':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in S.iterdir() if p.is_file()}}
(ROOT/'data/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f"Prepared {len(places)} places, {manifest['residentialPlaces']} residential groups, {len(features)} OSM features")
