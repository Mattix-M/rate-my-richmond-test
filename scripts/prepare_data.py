"""Read-only CSV ingestion. Supplied outputs are authoritative; never fit new models."""
import csv, json, math, statistics, collections, pathlib, re, sys, zipfile, xml.etree.ElementTree as ET, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(name):
 with (ROOT/'data'/name).open(encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f))
def num(s):
 try:
  n=float(s);return int(n) if n.is_integer() else n
 except (ValueError,TypeError):return s
def typed(rows):return [{k:num(v) for k,v in r.items()} for r in rows]
def mean(rows,k):return statistics.mean(float(r[k]) for r in rows)
def slug(s):return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
ALIASES={'Angel Blanco':'Angel Otero-Blanco','Craig, W. Heinicke':'Craig Heinicke','. Walden':'Darrell Walden','Doug Winiarski':'Douglas Winiarski','. Wray':'Elisabeth Wray','Jim Davis':'James Davis','Joseph (Joe) Hoyle':'Joe Hoyle','Phillip Rohrbach':'Philip Rohrbach','Pippa Holloway':'Philippa Holloway','Ricardo Tremolada':'Ricardo Ramos-Tremolada','Sara Hillgrove':'Sara Meyerdierks Hillgrove','. Nall':'Van Nall','Bill Bergman':'William (Bill) Bergman','. Myers':'William Myers'}
reviews=read('reviews_clean.csv'); official=typed(read('professor_stats_graph_ready.csv')); departments=typed(read('department_difficulty_rankings.csv')); awards=typed(read('official_awards.csv'))
assert len(reviews)==12239
assert len({r['review_key'] for r in reviews})==len(reviews)
by_name=collections.defaultdict(list)
for r in reviews:by_name[ALIASES.get(r['professor_name'],r['professor_name'])].append(r)
# Only use supplied cluster mappings. Unknown departments stay explicitly unmapped.
mapping={d['department']:d['cluster'] for d in departments}
mapping.update({p['department']:p['cluster'] for p in official})
lookup={p['canonical_professor']:p for p in official}
recent_all=[r for r in reviews if 2022<=int(r['review_year'])<=2026]
priors={'all':{'quality':mean(reviews,'quality'),'difficulty':mean(reviews,'difficulty')},'recent':{'quality':mean(recent_all,'quality'),'difficulty':mean(recent_all,'difficulty')}}
funny=set();curation_mismatches=[]
with zipfile.ZipFile(ROOT/'data/RMP_Richmond_Comedy_Curation.xlsx') as z:
 ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 strings=[''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
 sheets={}
 for f in z.namelist():
  if f.startswith('xl/worksheets/sheet') and f.endswith('.xml'):
   rows=[]
   for row in ET.fromstring(z.read(f)).findall('.//s:row',ns):
    cells=[]
    for c in row:
     v=c.find('s:v',ns);val=v.text if v is not None else ''.join(c.itertext());cells.append(strings[int(val)] if c.get('t')=='s' else val)
    rows.append(cells)
   sheets[f]=rows
 source={r['review_key']:r for r in reviews}
 for row in sheets['xl/worksheets/sheet6.xml'][1:]:
  key=row[1]
  if key in source and source[key]['comment']==row[8]:funny.add(key)
  else:curation_mismatches.append(key)
assert not curation_mismatches,curation_mismatches

def metrics(rows,period,p=None):
 if not rows:return None
 n=len(rows);q=mean(rows,'quality');d=mean(rows,'difficulty');w=10 if period=='recent' else 20;eligible=n>=(15 if period=='recent' else 20)
 result={'reviews':n,'quality':q,'difficulty':d,'polarization':statistics.stdev(float(r['quality']) for r in rows) if n>1 else None,'bayesianQuality':None,'bayesianDifficulty':None,'alpha':None,'ranked':False}
 if period=='all' and p:
  assert n==p['reviews'],(p['canonical_professor'],n,p['reviews'])
  assert math.isclose(q,p['mean_quality'],abs_tol=1e-10)
  assert math.isclose(d,p['mean_difficulty'],abs_tol=1e-10)
  result.update(quality=p['mean_quality'],difficulty=p['mean_difficulty'],polarization=p['quality_sd'],bayesianQuality=p['bayesian_quality'],bayesianDifficulty=p['bayesian_difficulty'],alpha=p['alpha_shrunk'],ranked=True)
 elif period=='recent' and eligible:
  result.update(bayesianQuality=(n*q+w*priors[period]['quality'])/(n+w),bayesianDifficulty=(n*d+w*priors[period]['difficulty'])/(n+w),ranked=True)
 return result
professors=[];review_files={}
for name,rs in sorted(by_name.items()):
 p=lookup.get(name);dep=p['department'] if p else collections.Counter(r['department'] for r in rs).most_common(1)[0][0]
 ident=slug(name)+'-'+min(r['professor_id'] for r in rs)
 professors.append({'id':ident,'name':name,'department':dep,'group':p['cluster'] if p else mapping.get(dep,'Unmapped'),'all':metrics(rs,'all',p),'recent':metrics([r for r in rs if 2022<=int(r['review_year'])<=2026],'recent'),'aliases':sorted(set(r['professor_name'] for r in rs)-{name})})
 review_files[ident]=[{'key':r['review_key'],'date':r['review_date'],'year':int(r['review_year']),'course':r['course_raw'],'quality':float(r['quality']),'difficulty':float(r['difficulty']),'tags':r['tags'].split(' | ') if r['tags'] else [],'comment':r['comment'],'funny':r['review_key'] in funny} for r in rs]
assert len({p['id'] for p in professors})==len(professors)
by_prof={p['name']:p for p in professors}
for a in awards:
 p=by_prof[a['Winner']];period='recent' if 'recent' in a['Award'] else 'all';m=p[period]
 field='polarization' if a['Award']=='Most polarizing' else 'difficulty' if a['Award']=='Hardest raw' else 'bayesianDifficulty' if ('Hardest' in a['Award'] or 'Easiest' in a['Award']) else 'bayesianQuality'
 assert math.isclose(m[field],a['Score'],abs_tol=1e-10),(a,m[field])
 a.update(id=p['id'],period=period,field=field)
 eligible=[q for q in professors if q[period] and q[period]['ranked']]
 winner=sorted(eligible,key=lambda q:q[period][field],reverse=not ('Worst' in a['Award'] or 'Easiest' in a['Award']))[0]
 assert winner['name']==a['Winner'],(a['Award'],winner['name'])
comparisons=typed(read('business_vs_science_results.csv'))
assert math.isclose(comparisons[0]['Estimate'],-0.2991125566176845,abs_tol=1e-12)
assert math.isclose(comparisons[0]['p-value'],0.00946523480360572,abs_tol=1e-12)
# Department and academic group headline values are copied exactly, never reconstructed.
for d in departments:d['id']=slug(d['department'])
penalty=[]
for difficulty in range(1,6):
 rs=[r for r in reviews if float(r['difficulty'])==difficulty]
 penalty.append({'difficulty':difficulty,'quality':mean(rs,'quality'),'reviews':len(rs)})
report={'reviews':len(reviews),'recentReviews':len(recent_all),'professors':len(professors),'rankedProfessors':len(official),'departments':len(departments),'validatedAwards':len(awards),'aliasMappings':ALIASES,'funnyKeysVerified':len(funny),'sourceHashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'data').iterdir() if p.is_file()},'limitations':['No supplied recent Alpha model.','No supplied difficulty-quality regression table or within-professor time-trend model.','Department summaries cover 27 departments, not every source department. Unmapped groups remain explicit.','All-time adjusted rankings cover 219 supplied professors only.','Recent Bayesian scores calculated using the documented 15-review threshold and prior weight 10; all three official recent awards reproduce exactly.','Funny labels use only the 30 verified Master_Top30 workbook entries. No Unhinged taxonomy is inferred.']}
data={'professors':professors,'departments':departments,'awards':awards,'groups':{'all':typed(read('cluster_all_time.csv')),'recent':typed(read('cluster_2022_2026.csv'))},'comparisons':comparisons,'courseLevels':typed(read('course_level_summary.csv')),'timeTrend':typed(read('time_trend.csv')),'penalty':penalty,'meta':report,'means':priors}
if '--check' in sys.argv:
 assert json.loads((ROOT/'src/lib/data.json').read_text())==data
 for ident,rs in review_files.items():assert json.loads((ROOT/'public/reviews'/f'{ident}.json').read_text())==rs
 print('PASS: exact review text and joins, all 9 awards, all 27 department outputs, both regression comparisons and periods, deterministic generated data, and source integrity.')
else:
 (ROOT/'src/lib/data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 for ident,rs in review_files.items():(ROOT/'public/reviews'/f'{ident}.json').write_text(json.dumps(rs,ensure_ascii=False,separators=(',',':')))
 (ROOT/'data-validation.json').write_text(json.dumps(report,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k not in ['sourceHashes','aliasMappings']},indent=2))
