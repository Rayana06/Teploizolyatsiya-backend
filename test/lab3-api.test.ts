const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { DataSource } = require('typeorm');
const { createInsulationApplication } = require('../dist/main');

let app, origin, dataSource;

before(async () => {
  app = await createInsulationApplication();
  await app.listen(0, '127.0.0.1');
  origin = await app.getUrl();
  dataSource = app.get(DataSource);
});

after(async () => app?.close());

test('Lab 3 REST lifecycle: filter, upload, draft, publish, feed, like, delete and registration', async () => {
  const existingDrafts = await dataSource.query(
    `SELECT insulation_material_id, completed_at FROM insulation_materials WHERE creator_id=1 AND status='draft'`,
  );
  for (const draft of existingDrafts) {
    await dataSource.query(`UPDATE insulation_materials SET status='deleted' WHERE insulation_material_id=$1`, [draft.insulation_material_id]);
  }

  let materialId;
  let registeredUserId;
  try {
    const form = new FormData();
    form.set('name', 'API integration material');
    form.set('shortDescription', 'Created by the Lab 3 automated integration test.');
    form.set('insulationType', 'Минвата');
    form.set('thicknessMm', '75');
    form.set('image', new Blob([readFileSync(join(__dirname, '..', 'media/generated/technolight-optima-100-draft.jpg'))], { type: 'image/jpeg' }), 'lab3-image.jpg');
    form.set('video', new Blob([readFileSync(join(__dirname, '..', 'media/generated/technolight-optima-100-draft.mp4'))], { type: 'video/mp4' }), 'lab3-video.mp4');
    const creation = await fetch(origin + '/api/insulation-materials', { method: 'POST', body: form });
    const creationText = await creation.text();
    assert.equal(creation.status, 201, creationText);
    const created = JSON.parse(creationText);
    materialId = created.id;
    assert.match(created.imageFileName, /^image-[a-z0-9.-]+\.jpg$/);
    assert.match(created.videoFileName, /^video-[a-z0-9.-]+\.mp4$/);
    assert.equal(created.status, 'draft');
    assert.equal(created.isCreator, 1);

    const draftResponse = await fetch(origin + '/api/insulation-materials/draft');
    assert.equal(draftResponse.status, 200);
    assert.equal((await draftResponse.json()).id, materialId);

    const listBeforePublish = await fetch(origin + '/api/insulation-materials?maxThicknessMm=80&insulationType=Минвата');
    assert.equal(listBeforePublish.status, 200);
    const filteredList = await listBeforePublish.json();
    assert.ok(filteredList.items.every(item => item.thicknessMm <= 80));
    assert.deepEqual(Object.keys(filteredList.items[0]).sort(), [
      'id', 'imageUrl', 'insulationType', 'isCreator', 'likeCount', 'name', 'thicknessMm',
    ].sort());

    const forbiddenSystemField = await fetch(origin + `/api/insulation-materials/${materialId}/publish`, {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'published' }),
    });
    assert.equal(forbiddenSystemField.status, 400);

    const publication = await fetch(origin + `/api/insulation-materials/${materialId}/publish`, {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    const publicationText = await publication.text();
    assert.equal(publication.status, 200, publicationText);
    assert.equal(JSON.parse(publicationText).status, 'published');

    const firstFeedResponse = await fetch(origin + '/api/insulation-materials/feed');
    assert.equal(firstFeedResponse.status, 200);
    const firstFeed = await firstFeedResponse.json();
    assert.deepEqual(Object.keys(firstFeed).sort(), [
      'id', 'imageUrl', 'insulationType', 'likeCount', 'liked', 'name',
      'shortDescription', 'thicknessMm', 'videoUrl',
    ].sort());
    assert.ok(firstFeed.liked === 0 || firstFeed.liked === 1);
    assert.equal(firstFeed.isCreator, undefined);
    assert.equal((await fetch(origin + `/api/insulation-materials/feed/${materialId}`)).status, 400);
    assert.equal((await fetch(origin + '/api/insulation-materials/feed?next=true')).status, 400);
    assert.equal((await fetch(origin + `/api/insulation-materials/feed/${materialId}?next=true`)).status, 200);

    const like = await fetch(origin + `/api/insulation-materials/${materialId}/like`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ liked: 1 }),
    });
    assert.equal(like.status, 201);
    assert.equal((await like.json()).liked, 1);
    const unlike = await fetch(origin + `/api/insulation-materials/${materialId}/like`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ liked: 0 }),
    });
    assert.equal(unlike.status, 201);
    assert.equal((await unlike.json()).liked, 0);

    const deletion = await fetch(origin + `/api/insulation-materials/${materialId}`, { method: 'DELETE' });
    assert.equal(deletion.status, 204);
    const deleted = await dataSource.query(`SELECT status, completed_at FROM insulation_materials WHERE insulation_material_id=$1`, [materialId]);
    assert.equal(deleted[0].status, 'deleted');
    assert.ok(deleted[0].completed_at);
    const listAfterDelete = await fetch(origin + '/api/insulation-materials');
    assert.equal(listAfterDelete.status, 200);
    assert.equal((await listAfterDelete.json()).items.some(item => item.id === materialId), false);

    const email = `lab3.${Date.now()}@teploshchit.local`;
    const registration = await fetch(origin + '/api/users/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, displayName: 'Lab 3 test', password: 'lab3-password' }),
    });
    const registrationText = await registration.text();
    assert.equal(registration.status, 201, registrationText);
    const user = JSON.parse(registrationText);
    registeredUserId = user.id;
    assert.equal(user.passwordHash, undefined);
  } finally {
    if (materialId) {
      await dataSource.query(`DELETE FROM insulation_material_likes WHERE insulation_material_id=$1`, [materialId]);
      await dataSource.query(`DELETE FROM insulation_materials WHERE insulation_material_id=$1`, [materialId]);
    }
    if (registeredUserId) await dataSource.query(`DELETE FROM users WHERE user_id=$1`, [registeredUserId]);
    for (const draft of existingDrafts) {
      await dataSource.query(`UPDATE insulation_materials SET status='draft', completed_at=$1 WHERE insulation_material_id=$2`, [draft.completed_at, draft.insulation_material_id]);
    }
  }
});
