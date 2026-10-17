"""Rebuild the manually selected review puzzle bank without changing source reviews."""
import html, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SELECTION = {
'darrell-walden-2129273':['2a5706fed95b0185','82ed4950dd9c6d64','6b1ab55135f7014f','fc04e56f9cd3ed6d','c97a2cc11370aa97','00e3db105803580d'],
'erik-craft-134228':['8b381d2d19ebd40b','9dec21230a817231','356f211ea66bf907','6afd71b8e42a92af','fce2bc417e8f5f06','6061cfaa7928fd30'],
'tenace-setor-2834621':['a9240d8d1a0298e8','90586146634df96d','50b17e543f450764','023916e8d19b7a05','ef4e2f659484797d','88f15b33bdc5a172'],
'carlos-hurtado-2566131':['c2683336e41dfb72','f6d598bcc0106930','9b6380e544f9aa32','d61f0b61a98f28a1','389f29c77744b10e','88e61d709b592f2c'],
'racheal-cooper-2709313':['18dd67a624513c20','150517d24687f76a','1635e229e505b6d5','0f8c864ce86829d4','5bf08e137432ddc5','643c4b8d776f4fda'],
'emily-boone-525729':['7b11304e7507f6b2','c34ec5ac69161e17','3f365a2a801bc7ea','957edd1c2e76f936','226f0bad4e6c69fa','2f3376c3372cf7f3'],
}
professors = json.loads((ROOT/'src/lib/data.json').read_text())['professors']
by_id = {p['id']: p for p in professors}
puzzles=[]
for pid, keys in SELECTION.items():
    p=by_id[pid]
    rows={r['key']:r for r in json.loads((ROOT/f'public/reviews/{pid}.json').read_text())}
    names = sorted(set([p['name'], *[t for n in [p['name'],*p['aliases']] for t in n.split() if len(t)>2]]),key=len,reverse=True)
    pattern = re.compile(r'\b(?:'+ '|'.join(re.escape(n) for n in names) +r')\b', re.I)
    clues=[]
    for key in keys:
        r=rows[key];text=pattern.sub('[name hidden]',html.unescape(r['comment']))
        clues.append({'key':key,'text':text,'date':r['date'],'course':r['course'],'redacted':text!=html.unescape(r['comment']),'sourcePath':f'/reviews/{pid}.json'})
    puzzles.append({'professorId':pid,'reviews':clues})
result={'professors':[{k:p[k] for k in ['id','name','department','group','aliases']} for p in professors], 'puzzles':puzzles}
output=ROOT/'src/lib/urdle/reviews.json'
encoded=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
import sys
if '--check' in sys.argv:
    assert output.read_text()==encoded, 'URdle clues no longer match their source records. Review before regenerating.'
    print('PASS: all 36 selected review clues match original records with documented name redactions.')
else: output.write_text(encoded)
