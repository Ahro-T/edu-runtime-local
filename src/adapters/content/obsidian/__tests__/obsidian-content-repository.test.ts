import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import pino from 'pino';
import { ObsidianContentRepository } from '../ObsidianContentRepository.js';

const logger = pino({ level: 'silent' });

async function createFixtureVault(): Promise<string> {
  const vaultPath = await mkdtemp(join(tmpdir(), 'test-vault-'));
  await mkdir(join(vaultPath, 'agents'));
  await mkdir(join(vaultPath, 'harnesses'));
  await mkdir(join(vaultPath, 'openclaw'));
  await mkdir(join(vaultPath, 'templates'));

  const nodeA = `---
id: node-a
pillar: agents
node_type: concept
title: Node A
summary: First node
prerequisites: []
related: []
assessment_template: tpl-node-a-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

Body of node A.
`;

  const nodeB = `---
id: node-b
pillar: agents
node_type: concept
title: Node B
summary: Second node
prerequisites:
  - node-a
related: []
assessment_template: tpl-node-b-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

Body of node B.
`;

  const nodeC = `---
id: node-c
pillar: harnesses
node_type: concept
title: Node C
summary: Harness node
prerequisites: []
related:
  - node-a
assessment_template: tpl-node-c-v1
mastery_stage_target: quiz
teacher_prompt_mode: socratic
---

Body of node C.
`;

  const tplA = `---
id: tpl-node-a-v1
nodeId: node-a
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: Answer using the five slots.
rubric:
  passRules:
    - all slots present
  failRules:
    - missing definition
  remediationRules:
    - relation missing
---
`;

  const tplB = `---
id: tpl-node-b-v1
nodeId: node-b
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: Answer using the five slots.
rubric:
  passRules:
    - all slots present
  failRules:
    - missing definition
  remediationRules:
    - relation missing
---
`;

  const tplC = `---
id: tpl-node-c-v1
nodeId: node-c
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: Answer using the five slots.
rubric:
  passRules:
    - all slots present
  failRules:
    - missing definition
  remediationRules:
    - relation missing
---
`;

  await writeFile(join(vaultPath, 'agents', 'node-a.md'), nodeA);
  await writeFile(join(vaultPath, 'agents', 'node-b.md'), nodeB);
  await writeFile(join(vaultPath, 'harnesses', 'node-c.md'), nodeC);
  await writeFile(join(vaultPath, 'templates', 'tpl-node-a-v1.md'), tplA);
  await writeFile(join(vaultPath, 'templates', 'tpl-node-b-v1.md'), tplB);
  await writeFile(join(vaultPath, 'templates', 'tpl-node-c-v1.md'), tplC);

  return vaultPath;
}

describe('ObsidianContentRepository', () => {
  let vaultPath: string;
  let repo: ObsidianContentRepository;

  beforeAll(async () => {
    vaultPath = await createFixtureVault();
    repo = new ObsidianContentRepository(vaultPath, logger);
  });

  it('getNodeById returns existing node', async () => {
    const node = await repo.getNodeById('node-a');
    expect(node).not.toBeNull();
    expect(node?.id).toBe('node-a');
    expect(node?.pillar).toBe('agents');
    expect(node?.masteryStageTarget).toBe('descriptive');
    expect(node?.teacherPromptMode).toBe('guided');
  });

  it('getNodeById returns null for missing node', async () => {
    const node = await repo.getNodeById('does-not-exist');
    expect(node).toBeNull();
  });

  it('getTemplateById returns existing template', async () => {
    const tpl = await repo.getTemplateById('tpl-node-a-v1');
    expect(tpl).not.toBeNull();
    expect(tpl?.id).toBe('tpl-node-a-v1');
    expect(tpl?.requiredSlots).toEqual(['definition', 'importance', 'relation', 'example', 'boundary']);
  });

  it('getTemplateByNodeId returns template for node', async () => {
    const tpl = await repo.getTemplateByNodeId('node-b');
    expect(tpl).not.toBeNull();
    expect(tpl?.id).toBe('tpl-node-b-v1');
  });

  it('listNodesByPillar returns only nodes in that pillar', async () => {
    const agentNodes = await repo.listNodesByPillar('agents');
    expect(agentNodes).toHaveLength(2);
    expect(agentNodes.every(n => n.pillar === 'agents')).toBe(true);

    const harnessNodes = await repo.listNodesByPillar('harnesses');
    expect(harnessNodes).toHaveLength(1);
    expect(harnessNodes[0].pillar).toBe('harnesses');
  });

  it('getPrerequisites returns prerequisite nodes', async () => {
    const prereqs = await repo.getPrerequisites('node-b');
    expect(prereqs).toHaveLength(1);
    expect(prereqs[0].id).toBe('node-a');
  });

  it('getPrerequisites returns empty array for node with no prerequisites', async () => {
    const prereqs = await repo.getPrerequisites('node-a');
    expect(prereqs).toHaveLength(0);
  });

  it('getRelatedNodes returns related nodes', async () => {
    const related = await repo.getRelatedNodes('node-c');
    expect(related).toHaveLength(1);
    expect(related[0].id).toBe('node-a');
  });

  it('validateContent returns no errors for valid vault', async () => {
    const errors = await repo.validateContent();
    expect(errors).toHaveLength(0);
  });

  it('exportSnapshot returns all nodes, templates, and relations', async () => {
    const snapshot = await repo.exportSnapshot();
    expect(snapshot.nodes).toHaveLength(3);
    expect(snapshot.templates).toHaveLength(3);
    expect(snapshot.exportedAt).toBeInstanceOf(Date);
    // node-b has node-a as prerequisite -> one prerequisite-of relation
    const prereqRelation = snapshot.relations.find(
      r => r.fromNodeId === 'node-a' && r.toNodeId === 'node-b' && r.relationType === 'prerequisite-of',
    );
    expect(prereqRelation).toBeDefined();
  });
});

describe('ObsidianContentRepository validation', () => {
  it('validateContent reports broken prerequisite refs', async () => {
    const vaultPath = await mkdtemp(join(tmpdir(), 'test-vault-invalid-'));
    await mkdir(join(vaultPath, 'agents'));
    await mkdir(join(vaultPath, 'templates'));

    const brokenNode = `---
id: broken-node
pillar: agents
node_type: concept
title: Broken
summary: Has broken prereq
prerequisites:
  - nonexistent-node
related: []
assessment_template: tpl-broken-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---
`;
    const tpl = `---
id: tpl-broken-v1
nodeId: broken-node
requiredSlots:
  - definition
instructions: Answer.
rubric:
  passRules: []
  failRules: []
  remediationRules: []
---
`;
    await writeFile(join(vaultPath, 'agents', 'broken.md'), brokenNode);
    await writeFile(join(vaultPath, 'templates', 'tpl-broken-v1.md'), tpl);

    const repo = new ObsidianContentRepository(vaultPath, logger);
    const errors = await repo.validateContent();
    expect(errors.some(e => e.includes('nonexistent-node'))).toBe(true);

    await rm(vaultPath, { recursive: true });
  });
});
