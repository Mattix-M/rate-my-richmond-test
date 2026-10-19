import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeedback, readVisitor, signVisitor, sameOrigin} from '../src/lib/feedback-policy.ts';

test('accepts votes and bounded plain-text ideas, rejects malformed submissions', () => {
  assert.deepEqual(parseFeedback({type:'vote', vote:'like'}), {type:'vote', vote:'like'});
  assert.deepEqual(parseFeedback({type:'feedback',category:'Game idea',message:'  Campus map game  '}), {type:'feedback',category:'Game idea',message:'Campus map game'});
  for (const input of [null, {}, {type:'vote',vote:'five stars'}, {type:'vote',vote:'like',website:'spam'}, {type:'feedback',category:'Fake category',message:'A game'}, {type:'feedback',category:'Other',message:'hi'}, {type:'feedback',category:'Other',message:'x'.repeat(1501)}, {type:'feedback',category:'Other',message:'bad\u0000text'}]) assert.equal(parseFeedback(input), null);
});
test('only a valid server-signed random ID can select a private record', () => {
  const id='021109ac-e66f-4439-9fb3-43d1ea4ac280';
  const signed=signVisitor(id,'test-secret');
  assert.equal(readVisitor(signed,'test-secret'), id);
  assert.equal(readVisitor(signed,'different-secret'), null);
  assert.equal(readVisitor(signed.replace('021109ac','121109ac'),'test-secret'), null);
  for (const value of [undefined, '../private.json', id, `${id}.00`]) assert.equal(readVisitor(value,'test-secret'), null);
});
test('submissions require the exact origin, including local development port', () => {
  assert.equal(sameOrigin('http://127.0.0.1:3000','http://127.0.0.1:3000/api/feedback/'),true);
  assert.equal(sameOrigin('https://www.ratemyrichmond.com','https://www.ratemyrichmond.com/api/feedback/'),true);
  assert.equal(sameOrigin('https://evil.example','https://www.ratemyrichmond.com/api/feedback/'),false);
  assert.equal(sameOrigin(null,'https://www.ratemyrichmond.com/api/feedback/'),false);
  assert.equal(sameOrigin('http://127.0.0.1:3001','http://127.0.0.1:3000/api/feedback/'),false);
});
