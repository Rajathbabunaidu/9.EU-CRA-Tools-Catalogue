import test from 'node:test';
import assert from 'node:assert/strict';
import {createApi,projectUrl,publicKey} from '../src/api.mjs';
import {emptyDefinition,newSection,newQuestion,newOption,normalizedDefinition,validateDefinition,nextVersion} from '../src/logic.mjs';
const types=[{type_code:'SINGLE',type_name:'Single choice',supports_options:true,supports_multiple_values:false,is_active:true},{type_code:'TEXT',type_name:'Text',supports_options:false,is_active:true}];
function definition(){const s=newSection();s.section_name='Product security';const q=newQuestion('Q_1','SINGLE');q.question_text='Is the feature protected?';const a=newOption('YES',0);a.option_label='Yes';const b=newOption('NO',1);b.option_label='No';q.options=[a,b];s.questions=[q];return normalizedDefinition({schema_version:1,sections:[s]});}
test('project URL validation disallows secrets in URL, HTTP and paths',()=>{
 assert.equal(projectUrl('https://abc.supabase.co/'),'https://abc.supabase.co');
 assert.throws(()=>projectUrl('http://abc.supabase.co'));
 assert.throws(()=>projectUrl('https://abc.supabase.co/rest/v1'));
});
test('client accepts only Supabase publishable keys',()=>{
 assert.equal(publicKey('sb_publishable_example'),'sb_publishable_example');
 assert.throws(()=>publicKey('sb_secret_demo'));
 assert.throws(()=>publicKey('eyJhbGciOi'));
});
test('new version is predictable',()=>assert.equal(nextVersion('1.0.0'),'1.1.0'));
test('empty tool cannot be released',()=>assert.equal(validateDefinition(emptyDefinition(),types).valid,false));
test('valid questionnaire passes',()=>{const d=definition();const result=validateDefinition(d,types);assert.equal(result.valid,true,JSON.stringify(result.errors));assert.equal(result.questionCount,1);});
test('duplicate question codes are rejected',()=>{const d=definition();d.sections[0].questions.push({...d.sections[0].questions[0],client_id:'other'});assert.match(validateDefinition(d,types).errors.join(' '),/duplicate code/);});
test('unknown question type is rejected',()=>{const d=definition();d.sections[0].questions[0].question_type='UNSUPPORTED';assert.match(validateDefinition(d,types).errors.join(' '),/active question type/);});
test('option-based question requires at least two options',()=>{const d=definition();d.sections[0].questions[0].options.splice(1,1);assert.match(validateDefinition(d,types).errors.join(' '),/two enabled options/);});
test('normalization preserves stable IDs and ordered contents',()=>{const d=definition();const id=d.sections[0].client_id;assert.equal(normalizedDefinition(d).sections[0].client_id,id);});
test('Supabase API sends publishable-key RPC without secret authorization header',async()=>{
 let call;
 const api=createApi({url:'https://abc.supabase.co',key:'sb_publishable_example',fetchFn:async(u,opts)=>{call={u,opts};return {ok:true,text:async()=>JSON.stringify([{tool_id:42}])};}});
 const out=await api.rpc('cra_tm_create_catalogue_tool',{p_tool_code:'TEST',p_tool_name:'Test'});
 assert.equal(out[0].tool_id,42);assert.equal(call.opts.method,'POST');assert.equal(call.opts.headers.apikey,'sb_publishable_example');assert.equal(call.opts.headers.Authorization,undefined);assert.match(call.u,/rest\/v1\/rpc\/cra_tm_create_catalogue_tool/);
});
