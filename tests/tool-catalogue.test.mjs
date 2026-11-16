// v2.1.0 contract tests replacing obsolete v1 questionnaire-designer tests.
// Sections/questions/options are intentionally owned by Page 2, not Page 3.
import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueDefinition,releaseCompatibility,integrationReadiness,validateNextVersion,
  REQUIRED_QUESTIONNAIRE_CAPABILITIES} from '../src/logic.mjs';

const tool={id:12,tool_type:'QUESTIONNAIRE',is_active:true};
const version=(n,definition=catalogueDefinition(),active=true)=>
  ({id:n,tool_id:12,release_version:`1.0.${n}`,definition,is_active:active});

test('new v2 capability can be handed off to Template Builder',()=>{
  const r=version(1);
  assert.deepEqual(REQUIRED_QUESTIONNAIRE_CAPABILITIES.length,8);
  assert.equal(releaseCompatibility(r,tool.tool_type).ready,true);
  const ready=integrationReadiness(tool,[r]);
  assert.equal(ready.ready,true);
  assert.equal(ready.releaseId,1);
});
test('legacy releases are visible but do not falsely claim v2 compatibility',()=>{
  const old=version(1,{schema_version:1,sections:[{questions:[{question_text:'Historical'}]}]});
  assert.equal(releaseCompatibility(old,'QUESTIONNAIRE').code,'LEGACY');
  assert.equal(integrationReadiness(tool,[old]).code,'LEGACY_OR_INCOMPATIBLE');
});
test('inactive, missing and unsupported release states are explicit',()=>{
  assert.equal(integrationReadiness({...tool,is_active:false},[version(1)]).code,'INACTIVE_TOOL');
  assert.equal(integrationReadiness(tool,[version(1,catalogueDefinition(),false)]).code,'NO_ACTIVE_RELEASE');
  assert.equal(releaseCompatibility(version(1),'CHECKLIST').code,'UNSUPPORTED');
  assert.equal(releaseCompatibility(null,'QUESTIONNAIRE').code,'MISSING');
});
test('definitions that contain questionnaire content or missing flags are not compatible',()=>{
  const content=catalogueDefinition();content.sections=[];
  assert.equal(releaseCompatibility(version(1,content)).code,'INVALID');
  const incomplete=catalogueDefinition();delete incomplete.capabilities.supports_options;
  assert.equal(releaseCompatibility(version(1,incomplete)).code,'INCOMPLETE');
  assert.deepEqual(releaseCompatibility(version(1,incomplete)).missing,['supports_options']);
});
test('readiness chooses the highest compatible active release',()=>{
  const list=[version(2,{schema_version:1}),version(1),version(3,catalogueDefinition(),false)];
  assert.equal(integrationReadiness(tool,list).releaseId,1);
});
test('version validation is strict, increasing and checks duplicates',()=>{
  const list=[version(9),version(10)];
  assert.equal(validateNextVersion('1.0.11',list),null);
  assert.match(validateNextVersion('1.0.10',list),/already exists/);
  assert.match(validateNextVersion('1.0.9',list),/already exists/);
  assert.match(validateNextVersion('1.0.8',list),/higher/);
  assert.match(validateNextVersion('1.x.0',list),/numeric/);
  assert.match(validateNextVersion('999999999999999999999.0.0',list),/too large/);
});
