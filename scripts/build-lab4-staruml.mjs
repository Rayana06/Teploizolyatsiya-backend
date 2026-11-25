import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('docs/lab4/teploshchit-lab4.mdj');
const previewPath = resolve('docs/lab4/sequence-diagram.svg');
const ref = ($ref) => ({ $ref });
const font = 'Arial;13;0';

const ids = {
  project: 'LAB4_PROJECT', model: 'LAB4_MODEL', classDiagram: 'LAB4_CLASS_DIAGRAM',
  spa: 'LAB4_CLASS_SPA', users: 'LAB4_CLASS_USERS_API', materials: 'LAB4_CLASS_MATERIALS_API',
  collaboration: 'LAB4_COLLABORATION', interaction: 'LAB4_INTERACTION', sequence: 'LAB4_SEQUENCE_DIAGRAM',
};

const operationSpecs = [
  ['authenticate', ids.users, 'POST /api/users/authenticate', ['email: string', 'password: string'], 'user + Set-Cookie'],
  ['list', ids.materials, 'GET /api/insulation-materials', ['maxThicknessMm?: number', 'insulationType?: string', 'search?: string'], 'items + count'],
  ['create', ids.materials, 'POST /api/insulation-materials', ['fields: multipart', 'image: file', 'video: file'], 'draft'],
  ['draft', ids.materials, 'GET /api/insulation-materials/draft', [], 'draft fields'],
  ['publish', ids.materials, 'PUT /api/insulation-materials/{id}/publish', ['id: number'], 'published service'],
  ['feedStart', ids.materials, 'GET /api/insulation-materials/feed', [], 'feed item'],
  ['feedNext', ids.materials, 'GET /api/insulation-materials/feed/{id}?next=true', ['id: number', 'next: boolean'], 'next feed item'],
  ['setLike', ids.materials, 'POST /api/insulation-materials/{id}/like', ['id: number', 'liked: boolean'], 'liked + likesCount'],
  ['register', ids.users, 'POST /api/users/register', ['email: string', 'displayName: string', 'password: string'], 'user'],
  ['logout', ids.users, 'POST /api/users/logout', [], 'ok'],
  ['softDelete', ids.materials, 'DELETE /api/insulation-materials/{id}', ['id: number'], '204'],
];

const operations = new Map();
for (const [name, owner, stereotype, parameters, result] of operationSpecs) {
  const id = `LAB4_OP_${name.toUpperCase()}`;
  const umlName = name === 'feedStart' || name === 'feedNext' ? 'feed' : name;
  operations.set(name, {
    _type: 'UMLOperation', _id: id, _parent: ref(owner), name: umlName, stereotype,
    parameters: [
      ...parameters.map((parameter, index) => {
        const [parameterName, type = ''] = parameter.split(':').map((value) => value.trim());
        return { _type: 'UMLParameter', _id: `${id}_P${index + 1}`, _parent: ref(id), name: parameterName, type };
      }),
      { _type: 'UMLParameter', _id: `${id}_RETURN`, _parent: ref(id), type: result, direction: 'return' },
    ],
  });
}

const classModel = (id, name, operationNames, stereotype) => ({
  _type: 'UMLClass', _id: id, _parent: ref(ids.model), name, stereotype,
  operations: operationNames.map((operationName) => operations.get(operationName)),
});

let viewCounter = 0;
const nextViewId = (prefix) => `LAB4_VIEW_${prefix}_${++viewCounter}`;

function classView(classId, name, operationNames, left, top, width) {
  const viewId = nextViewId('CLASS');
  const nameCompartmentId = nextViewId('NAME_COMP');
  const stereotypeId = nextViewId('STEREOTYPE');
  const nameId = nextViewId('NAME');
  const namespaceId = nextViewId('NAMESPACE');
  const propertyId = nextViewId('PROPERTY');
  const attributeId = nextViewId('ATTRIBUTE_COMP');
  const operationCompartmentId = nextViewId('OP_COMP');
  const receptionId = nextViewId('RECEPTION_COMP');
  const templateId = nextViewId('TEMPLATE_COMP');
  const height = 44 + operationNames.length * 18;
  const operationViews = operationNames.map((operationName, index) => {
    const operation = operations.get(operationName);
    const inputNames = operation.parameters.filter((parameter) => parameter.direction !== 'return').map((parameter) => parameter.name).join(', ');
    return {
      _type: 'UMLOperationView', _id: nextViewId('OP'), _parent: ref(operationCompartmentId),
      model: ref(operation._id), font, left: left + 5, top: top + 32 + index * 18,
      width: width - 10, height: 15,
      text: `+${operation.name}(${inputNames})`, horizontalAlignment: 0,
    };
  });
  return {
    _type: 'UMLClassView', _id: viewId, _parent: ref(ids.classDiagram), model: ref(classId),
    subViews: [
      {
        _type: 'UMLNameCompartmentView', _id: nameCompartmentId, _parent: ref(viewId), model: ref(classId),
        subViews: [
          { _type: 'LabelView', _id: stereotypeId, _parent: ref(nameCompartmentId), visible: false, font, left, top, height: 13 },
          { _type: 'LabelView', _id: nameId, _parent: ref(nameCompartmentId), font: 'Arial;13;1', left: left + 5, top: top + 7, width: width - 10, height: 15, text: name },
          { _type: 'LabelView', _id: namespaceId, _parent: ref(nameCompartmentId), visible: false, font, left, top, height: 13 },
          { _type: 'LabelView', _id: propertyId, _parent: ref(nameCompartmentId), visible: false, font, left, top, height: 13 },
        ],
        font, left, top, width, height: 27,
        stereotypeLabel: ref(stereotypeId), nameLabel: ref(nameId), namespaceLabel: ref(namespaceId), propertyLabel: ref(propertyId),
      },
      { _type: 'UMLAttributeCompartmentView', _id: attributeId, _parent: ref(viewId), model: ref(classId), visible: false, font, left, top: top + 27, width, height: 10 },
      { _type: 'UMLOperationCompartmentView', _id: operationCompartmentId, _parent: ref(viewId), model: ref(classId), subViews: operationViews, font, left, top: top + 27, width, height: height - 27 },
      { _type: 'UMLReceptionCompartmentView', _id: receptionId, _parent: ref(viewId), model: ref(classId), visible: false, font, left, top, width: 10, height: 10 },
      { _type: 'UMLTemplateParameterCompartmentView', _id: templateId, _parent: ref(viewId), model: ref(classId), visible: false, font, left, top, width: 10, height: 10 },
    ],
    font, containerChangeable: true, left, top, width, height,
    nameCompartment: ref(nameCompartmentId), suppressAttributes: true,
    attributeCompartment: ref(attributeId), operationCompartment: ref(operationCompartmentId),
    receptionCompartment: ref(receptionId), templateParameterCompartment: ref(templateId),
  };
}

const lifelineSpecs = [
  ['client', ids.spa, 170],
  ['usersApi', ids.users, 610],
  ['materialsApi', ids.materials, 1070],
];
const roles = [];
const participants = [];
const lifelines = [];
const lineParts = new Map();

for (const [name, classId, x] of lifelineSpecs) {
  const attributeId = `LAB4_ROLE_${name.toUpperCase()}`;
  const lifelineId = `LAB4_LIFELINE_${name.toUpperCase()}`;
  const viewId = nextViewId('LIFELINE');
  const nameCompartmentId = nextViewId('LIFELINE_NAME_COMP');
  const stereotypeId = nextViewId('LIFELINE_STEREOTYPE');
  const nameId = nextViewId('LIFELINE_NAME');
  const namespaceId = nextViewId('LIFELINE_NAMESPACE');
  const propertyId = nextViewId('LIFELINE_PROPERTY');
  const lineId = nextViewId('LINE');
  roles.push({ _type: 'UMLAttribute', _id: attributeId, _parent: ref(ids.collaboration), name, type: ref(classId) });
  participants.push({ _type: 'UMLLifeline', _id: lifelineId, _parent: ref(ids.interaction), represent: ref(attributeId), isMultiInstance: false });
  lineParts.set(name, lineId);
  const lifelineLabel = classId === ids.spa
    ? 'Фронтенд SPA (создатель)'
    : classId === ids.users
      ? ': Домен users (UsersAPI)'
      : ': Домен insulation-materials (InsulationMaterialsAPI)';
  lifelines.push({
    _type: 'UMLSeqLifelineView', _id: viewId, _parent: ref(ids.sequence), model: ref(lifelineId),
    subViews: [
      {
        _type: 'UMLNameCompartmentView', _id: nameCompartmentId, _parent: ref(viewId), model: ref(lifelineId),
        subViews: [
          { _type: 'LabelView', _id: stereotypeId, _parent: ref(nameCompartmentId), visible: false, font, left: x - 115, top: 35, height: 13 },
          { _type: 'LabelView', _id: nameId, _parent: ref(nameCompartmentId), font: 'Arial;13;1', left: x - 115, top: 52, width: 230, height: 15, text: lifelineLabel },
          { _type: 'LabelView', _id: namespaceId, _parent: ref(nameCompartmentId), visible: false, font, left: x - 115, top: 35, height: 13 },
          { _type: 'LabelView', _id: propertyId, _parent: ref(nameCompartmentId), visible: false, font, left: x - 115, top: 35, height: 13 },
        ],
        font, left: x - 120, top: 40, width: 240, height: 40,
        stereotypeLabel: ref(stereotypeId), nameLabel: ref(nameId), namespaceLabel: ref(namespaceId), propertyLabel: ref(propertyId),
      },
      { _type: 'UMLLinePartView', _id: lineId, _parent: ref(viewId), model: ref(lifelineId), font, left: x, top: 80, width: 1, height: 820 },
    ],
    font, left: x - 120, top: 40, width: 240, height: 860,
    nameCompartment: ref(nameCompartmentId), linePart: ref(lineId),
  });
}

const sequenceSteps = [
  ['authenticate', 'usersApi', 'email, password', '200(user, Set-Cookie: sessionId)'],
  ['list', 'materialsApi', 'maxThicknessMm=100, insulationType="Минвата"', '200(items[], count)'],
  ['create', 'materialsApi', 'fields, image, video, Cookie: sessionId', '201(draftId, creatorId, status)'],
  ['draft', 'materialsApi', 'Cookie: sessionId', '200(draft fields)'],
  ['publish', 'materialsApi', 'id, Cookie: sessionId', '200(status=published, publishedAt)'],
  ['feedStart', 'materialsApi', 'без id', '200(itemId, liked, likesCount)'],
  ['feedNext', 'materialsApi', 'id, next=true', '200(next item)'],
  ['setLike', 'materialsApi', 'id, liked=true, Cookie: sessionId', '201(liked=true, likesCount)'],
];
const httpVerbs = { authenticate: 'POST', list: 'GET', create: 'POST', draft: 'GET', publish: 'PUT', feedStart: 'GET', feedNext: 'GET', setLike: 'POST' };
const httpPaths = {
  authenticate: '/api/users/authenticate',
  list: '/api/insulation-materials',
  create: '/api/insulation-materials',
  draft: '/api/insulation-materials/draft',
  publish: '/api/insulation-materials/{id}/publish',
  feedStart: '/api/insulation-materials/feed',
  feedNext: '/api/insulation-materials/feed/{id}?next=true',
  setLike: '/api/insulation-materials/{id}/like',
};
const messages = [];
const messageViews = [];
const lifelineIds = { client: 'LAB4_LIFELINE_CLIENT', usersApi: 'LAB4_LIFELINE_USERSAPI', materialsApi: 'LAB4_LIFELINE_MATERIALSAPI' };

function messageView(modelId, from, to, y, label, reply = false) {
  const viewId = nextViewId('MESSAGE');
  const nameId = nextViewId('MESSAGE_NAME');
  const stereotypeId = nextViewId('MESSAGE_STEREOTYPE');
  const propertyId = nextViewId('MESSAGE_PROPERTY');
  const activationId = nextViewId('ACTIVATION');
  const xs = { client: 170, usersApi: 610, materialsApi: 1070 };
  const labelLeft = Math.min(xs[from], xs[to]) + 8;
  return {
    _type: 'UMLSeqMessageView', _id: viewId, _parent: ref(ids.sequence), model: ref(modelId),
    subViews: [
      { _type: 'EdgeLabelView', _id: nameId, _parent: ref(viewId), model: ref(modelId), font: 'Arial;12;0', left: labelLeft, top: y - 18, width: Math.abs(xs[to] - xs[from]) - 16, height: 15, text: label, alpha: 1.5708, distance: 10, hostEdge: ref(viewId), edgePosition: 1 },
      { _type: 'EdgeLabelView', _id: stereotypeId, _parent: ref(viewId), model: ref(modelId), visible: false, font, left: labelLeft, top: y - 30, height: 13, hostEdge: ref(viewId), edgePosition: 1 },
      { _type: 'EdgeLabelView', _id: propertyId, _parent: ref(viewId), model: ref(modelId), visible: false, font, left: labelLeft, top: y + 4, height: 13, hostEdge: ref(viewId), edgePosition: 1 },
      { _type: 'UMLActivationView', _id: activationId, _parent: ref(viewId), model: ref(modelId), visible: !reply, font, left: xs[to] - 7, top: y, width: 14, height: reply ? 25 : 40 },
    ],
    font, lineMode: reply ? 1 : 0, head: ref(lineParts.get(to)), tail: ref(lineParts.get(from)),
    points: `${xs[from]}:${y};${xs[to]}:${y}`, nameLabel: ref(nameId), stereotypeLabel: ref(stereotypeId), propertyLabel: ref(propertyId), activation: ref(activationId),
  };
}

sequenceSteps.forEach(([operationName, target, args, response], index) => {
  const requestId = `LAB4_MESSAGE_${index + 1}_REQUEST`;
  const responseId = `LAB4_MESSAGE_${index + 1}_RESPONSE`;
  const requestY = 115 + index * 94;
  const responseY = requestY + 40;
  const operation = operations.get(operationName);
  messages.push({
    _type: 'UMLMessage', _id: requestId, _parent: ref(ids.interaction), name: operation.name, stereotype: httpVerbs[operationName],
    source: ref(lifelineIds.client), target: ref(lifelineIds[target]), signature: ref(operation._id), arguments: args,
  });
  messages.push({
    _type: 'UMLMessage', _id: responseId, _parent: ref(ids.interaction), name: response,
    source: ref(lifelineIds[target]), target: ref(lifelineIds.client), messageSort: 'reply', arguments: response,
  });
  messageViews.push(messageView(requestId, 'client', target, requestY, `${index + 1}: ${httpVerbs[operationName]} ${httpPaths[operationName]}(${args})`));
  messageViews.push(messageView(responseId, target, 'client', responseY, response, true));
});

const project = {
  _type: 'Project', _id: ids.project, name: 'Теплощит — лабораторная работа №4',
  ownedElements: [{
    _type: 'UMLModel', _id: ids.model, _parent: ref(ids.project), name: 'Теплощит — SPA backend',
    ownedElements: [
      classModel(ids.spa, 'SPAClient', [], 'boundary'),
      classModel(ids.users, 'UsersAPI', ['register', 'authenticate', 'logout'], 'domain /api/users'),
      classModel(ids.materials, 'InsulationMaterialsAPI', ['list', 'create', 'draft', 'publish', 'feedStart', 'feedNext', 'setLike', 'softDelete'], 'domain /api/insulation-materials'),
      {
        _type: 'UMLClassDiagram', _id: ids.classDiagram, _parent: ref(ids.model), name: 'Диаграмма классов API — ЛР4',
        ownedViews: [
          classView(ids.spa, 'SPAClient', [], 50, 80, 250),
          classView(ids.users, 'UsersAPI', ['register', 'authenticate', 'logout'], 360, 60, 330),
          classView(ids.materials, 'InsulationMaterialsAPI', ['list', 'create', 'draft', 'publish', 'feedStart', 'feedNext', 'setLike', 'softDelete'], 750, 30, 430),
        ],
      },
      {
        _type: 'UMLCollaboration', _id: ids.collaboration, _parent: ref(ids.model), name: 'HTTP-взаимодействие SPA и доменов',
        attributes: roles,
        ownedElements: [{
          _type: 'UMLInteraction', _id: ids.interaction, _parent: ref(ids.collaboration), name: 'Бизнес-процесс SPA',
          ownedElements: [{
            _type: 'UMLSequenceDiagram', _id: ids.sequence, _parent: ref(ids.interaction),
            name: 'Sequence — полный бизнес-процесс ЛР4', ownedViews: [...lifelines, ...messageViews], showSequenceNumber: true,
          }],
          participants, messages,
        }],
      },
    ],
  }],
};

const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const svgLines = [];
sequenceSteps.forEach(([operationName, target, args, response], index) => {
  const xs = { usersApi: 610, materialsApi: 1070 };
  const y = 125 + index * 94;
  const tx = xs[target];
  svgLines.push(`<line x1="170" y1="${y}" x2="${tx}" y2="${y}" class="request" marker-end="url(#arrow)"/>`);
  const operation = operations.get(operationName);
  svgLines.push(`<text x="${(170 + tx) / 2}" y="${y - 9}" text-anchor="middle">${escapeXml(`${index + 1}: ${httpVerbs[operationName]} ${httpPaths[operationName]}(${args})`)}</text>`);
  svgLines.push(`<line x1="${tx}" y1="${y + 40}" x2="170" y2="${y + 40}" class="reply" marker-end="url(#arrowReply)"/>`);
  svgLines.push(`<text x="${(170 + tx) / 2}" y="${y + 31}" text-anchor="middle" class="response">${escapeXml(response)}</text>`);
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="920" viewBox="0 0 1240 920">
<defs><marker id="arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0 L9,3.5 L0,7 Z" fill="#164e63"/></marker><marker id="arrowReply" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0 L9,3.5 L0,7 Z" fill="#64748b"/></marker></defs>
<style>text{font:13px Arial,sans-serif;fill:#102a43}.head{fill:#e0f2fe;stroke:#0369a1;stroke-width:2}.title{font:bold 20px Arial}.lifeline{stroke:#94a3b8;stroke-dasharray:7 5}.request{stroke:#164e63;stroke-width:2}.reply{stroke:#64748b;stroke-width:1.5;stroke-dasharray:7 5}.response{fill:#475569;font-size:12px}</style>
<rect width="1240" height="920" fill="#fff"/><text x="620" y="27" text-anchor="middle" class="title">Теплощит — полный бизнес-процесс SPA</text>
<g><rect x="50" y="42" width="240" height="44" rx="5" class="head"/><text x="170" y="69" text-anchor="middle">Фронтенд SPA (создатель)</text><line x1="170" y1="86" x2="170" y2="895" class="lifeline"/></g>
<g><rect x="470" y="42" width="280" height="44" rx="5" class="head"/><text x="610" y="69" text-anchor="middle">: Домен users (UsersAPI)</text><line x1="610" y1="86" x2="610" y2="895" class="lifeline"/></g>
<g><rect x="875" y="42" width="390" height="44" rx="5" class="head"/><text x="1070" y="69" text-anchor="middle">: Домен insulation-materials (InsulationMaterialsAPI)</text><line x1="1070" y1="86" x2="1070" y2="895" class="lifeline"/></g>
${svgLines.join('\n')}</svg>`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
await writeFile(previewPath, svg, 'utf8');
console.log(outputPath);
console.log(previewPath);
