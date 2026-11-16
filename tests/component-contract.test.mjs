import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../src/wwElement.vue',import.meta.url),'utf8');

test('Page 3 preserves all three major views and independent Page 2 content ownership',()=>{
  assert.match(component,/activeTab==='catalogue'/);
  assert.match(component,/activeTab==='details'/);
  assert.match(component,/activeTab==='releases'/);
  assert.match(component,/Template Builder configures/);
  assert.doesNotMatch(component,/cra_tm_save_tool_question|cra_tm_save_tool_answer_option|cra_tm_save_tool_section/);
});
test('v2.1 integration checks are visible to administrators',()=>{
  assert.match(component,/selectedReadiness\.ready/);
  assert.match(component,/compatibleReleaseTotal/);
  assert.match(component,/compatibilityFor\(release\)/);
  assert.match(component,/validateNextVersion\(form\.value\.version/);
});
test('availability mutations guard against losing pending metadata',()=>{
  const start=component.indexOf('async function toggleToolActive');
  const end=component.indexOf('watch(()=>[projectUrl.value,publishableKey.value]');
  const code=component.slice(start,end);
  assert.match(code,/if\(dirty\.value&&!await saveDraft\(\)\)/);
  assert.match(code,/cra_tm_set_catalogue_release_active/);
});
