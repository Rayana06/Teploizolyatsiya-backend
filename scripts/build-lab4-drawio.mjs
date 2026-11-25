import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('docs/lab4/sequence-diagram.drawio');

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const participants = [
  { id: 'client', x: 70, width: 290, label: 'Фронтенд SPA (создатель)' },
  { id: 'users', x: 490, width: 310, label: ': Домен users (UsersAPI)' },
  { id: 'materials', x: 900, width: 420, label: ': Домен insulation-materials (InsulationMaterialsAPI)' },
];

const xCenters = Object.fromEntries(participants.map((participant) => [participant.id, participant.x + participant.width / 2]));

const steps = [
  { target: 'users', verb: 'POST', path: '/api/users/authenticate', args: 'email, password', response: '200(user, Set-Cookie: sessionId)', signature: 'UsersAPI.authenticate' },
  { target: 'materials', verb: 'GET', path: '/api/insulation-materials', args: 'maxThicknessMm=100, insulationType="Минвата"', response: '200(items[], count)', signature: 'InsulationMaterialsAPI.list' },
  { target: 'materials', verb: 'POST', path: '/api/insulation-materials', args: 'fields, image, video, Cookie: sessionId', response: '201(draftId, creatorId, status)', signature: 'InsulationMaterialsAPI.create' },
  { target: 'materials', verb: 'GET', path: '/api/insulation-materials/draft', args: 'Cookie: sessionId', response: '200(draft fields)', signature: 'InsulationMaterialsAPI.draft' },
  { target: 'materials', verb: 'PUT', path: '/api/insulation-materials/{id}/publish', args: 'id, Cookie: sessionId', response: '200(status=published, publishedAt)', signature: 'InsulationMaterialsAPI.publish' },
  { target: 'materials', verb: 'GET', path: '/api/insulation-materials/feed', args: 'без id', response: '200(itemId, liked, likesCount)', signature: 'InsulationMaterialsAPI.feed()' },
  { target: 'materials', verb: 'GET', path: '/api/insulation-materials/feed/{id}?next=true', args: 'id, next=true', response: '200(next item)', signature: 'InsulationMaterialsAPI.feed(id,next)' },
  { target: 'materials', verb: 'POST', path: '/api/insulation-materials/{id}/like', args: 'id, liked=true, Cookie: sessionId', response: '201(liked=true, likesCount)', signature: 'InsulationMaterialsAPI.setLike' },
];

let idCounter = 10;
const nextId = () => String(idCounter++);
const cells = [];

cells.push(`<mxCell id="${nextId()}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1"><mxGeometry x="20" y="20" width="1360" height="1130" as="geometry"/></mxCell>`);
cells.push(`<mxCell id="${nextId()}" value="sd Диаграмма последовательности" style="shape=note;whiteSpace=wrap;html=1;size=18;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;fontSize=15;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="20" y="20" width="300" height="42" as="geometry"/></mxCell>`);

for (const participant of participants) {
  cells.push(`<mxCell id="${participant.id}" value="${escapeXml(participant.label)}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;fontStyle=1;fontSize=14;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="${participant.x}" y="100" width="${participant.width}" height="50" as="geometry"/></mxCell>`);
  cells.push(`<mxCell id="${nextId()}" value="" style="endArrow=none;html=1;rounded=0;dashed=1;dashPattern=4 4;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${xCenters[participant.id]}" y="150" as="sourcePoint"/><mxPoint x="${xCenters[participant.id]}" y="1120" as="targetPoint"/></mxGeometry></mxCell>`);
}

steps.forEach((step, index) => {
  const requestY = 195 + index * 112;
  const responseY = requestY + 46;
  const requestId = nextId();
  const responseId = nextId();
  const operationName = step.signature.split('.').at(-1).replace(/\(.*/, '');
  const requestLabel = `${index * 2 + 1}: ${step.verb} ${step.path} — ${operationName}(${step.args})`;
  const responseLabel = `${index * 2 + 2}: ${step.response}`;
  const activationX = xCenters[step.target] - 10;
  const activationId = nextId();
  cells.push(`<mxCell id="${activationId}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111827;strokeWidth=2;" vertex="1" parent="1"><mxGeometry x="${activationX}" y="${requestY - 5}" width="20" height="56" as="geometry"/></mxCell>`);
  cells.push(`<mxCell id="${requestId}" value="${escapeXml(requestLabel)}" signature="${escapeXml(step.signature)}" arguments="${escapeXml(step.args)}" httpMethod="${step.verb}" style="edgeStyle=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=2;endArrow=block;endFill=1;fontSize=13;fontColor=#000000;labelBackgroundColor=#FFFFFF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${xCenters.client}" y="${requestY}" as="sourcePoint"/><mxPoint x="${activationX}" y="${requestY}" as="targetPoint"/></mxGeometry></mxCell>`);
  cells.push(`<mxCell id="${responseId}" value="${escapeXml(responseLabel)}" arguments="${escapeXml(step.response)}" style="edgeStyle=none;html=1;rounded=0;dashed=1;dashPattern=7 5;strokeColor=#000000;strokeWidth=1.5;endArrow=open;endFill=0;fontSize=13;fontColor=#000000;labelBackgroundColor=#FFFFFF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${activationX}" y="${responseY}" as="sourcePoint"/><mxPoint x="${xCenters.client}" y="${responseY}" as="targetPoint"/></mxGeometry></mxCell>`);
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Codex" version="24.7.17">
  <diagram id="lab4-sequence" name="Sequence ЛР4">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, xml, 'utf8');
console.log(outputPath);
