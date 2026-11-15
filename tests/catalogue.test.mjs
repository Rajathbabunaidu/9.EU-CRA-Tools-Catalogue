import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueDefinition,isCapabilityDefinition,draftMetadata,nextVersion,compareVersions,orderedReleases,toolStatus,validateDraft,isSupportedType} from '../src/logic.mjs';
import {createApi,firstRow,validProjectUrl,validPublishableKey} from '../src/api.mjs';

test('definition v2 has capabilities and NO question content',()=>{
  const d=catalogueDefinition({category:'Compliance',icon:'shield-check'});
  assert.equal(isCapabilityDefinition(d),true);
  assert.equal(d.schema_version,2);
  assert.equal(d.kind,'TOOL_CAPABILITY');
  assert.equal(d.tool_type,'QUESTIONNAIRE');
  assert.equal(d.catalogue.category,'Compliance');
  assert.equal('sections' in d,false);
  assert.equal('questions' in d,false);
});
test('old draft preserved, not materialized or erased',()=>{
  const old={schema_version:1,sections:[{section_name:'Previous section',questions:[{question_text:'Historical question'}]}]};
  const d=catalogueDefinition({},old);
  assert.deepEqual(d.legacy_definition,old);
  assert.equal('sections' in d,false);
});
test('legacy and invalid definitions are distinguished',()=>{
  assert.equal(isCapabilityDefinition({schema_version:1,sections:[]}),false);
  assert.equal(isCapabilityDefinition({schema_version:2,kind:'TOOL_CAPABILITY'}),false);
  assert.deepEqual(draftMetadata({schema_version:1}),{category:'Assessment',icon:'clipboard-list'});
  assert.equal(isSupportedType('QUESTIONNAIRE'),true);
  assert.equal(isSupportedType('CHECKLIST'),false);
});
test('versions use numeric ordering',()=>{
  assert.equal(nextVersion('1.0.9'),'1.0.10');
  assert.ok(compareVersions('1.0.10','1.0.9')>0);
  const r=orderedReleases([{tool_id:1,release_version:'1.0.9'},{tool_id:1,release_version:'1.0.10'},
    {tool_id:2,release_version:'10.0.0'}],1);
  assert.deepEqual(r.map(x=>x.release_version),['1.0.10','1.0.9']);
});
test('only active releases under active tool make catalogue selectable',()=>{
  assert.equal(toolStatus({is_active:true},null,[{is_active:true}]),'Available');
  assert.equal(toolStatus({is_active:false},null,[{is_active:true}]),'Inactive');
  assert.equal(toolStatus({is_active:true},{is_locked:false},[]),'Draft');
  assert.equal(toolStatus({is_active:true},null,[{is_active:false}]),'No active releases');
});
test('draft validation covers editable metadata',()=>{
  assert.deepEqual(validateDraft({name:'CRA',category:'Assessment',icon:'clipboard-list'}),[]);
  assert.ok(validateDraft({name:'',category:'Unknown',icon:'bad'}).length>=3);
});
test('project URL and key reject unsafe forms',()=>{
  assert.equal(validProjectUrl('https://acme.supabase.co/'),'https://acme.supabase.co');
  assert.throws(()=>validProjectUrl('https://acme.supabase.co/rest/v1'));
  assert.throws(()=>validProjectUrl('javascript:alert(1)'));
  assert.throws(()=>validPublishableKey('sb_secret_abc'));
  assert.equal(validPublishableKey('sb_publishable_abcd_12'),'sb_publishable_abcd_12');
});
test('REST adapter sends publishable key only as apikey and correct RPC args',async()=>{
  const history=[];
  const mock=async(url,options)=>{
    history.push({url,options});
    if(url.includes('cra_tm_tools'))return {ok:true,text:async()=>JSON.stringify([{id:1,tool_code:'A',tool_name:'A'}])};
    if(url.includes('cra_tm_tool_releases'))return {ok:true,text:async()=>JSON.stringify([])};
    if(url.includes('cra_tm_tool_drafts'))return {ok:true,text:async()=>JSON.stringify([])};
    return {ok:true,text:async()=>JSON.stringify([{tool_id:21,draft_id:32,revision:1}])};
  };
  const api=createApi({url:'https://acme.supabase.co',key:'sb_publishable_abc',fetchFn:mock});
  const cat=await api.catalogue();assert.equal(cat.tools[0].id,1);
  const created=firstRow(await api.rpc('cra_tm_create_catalogue_tool',{p_tool_code:null,p_tool_name:'My Tool',p_description:null}));
  assert.equal(created.tool_id,21);
  assert.ok(history.every(x=>x.options.headers.apikey==='sb_publishable_abc'));
  assert.ok(history.every(x=>!Object.hasOwn(x.options.headers,'Authorization')));
  assert.equal(JSON.parse(history.at(-1).options.body).p_tool_code,null);
});
test('REST adapter reports helpful errors',async()=>{
  const api=createApi({url:'https://acme.supabase.co',key:'sb_publishable_abc',fetchFn:async()=>({ok:false,status:401,statusText:'Unauthorized',text:async()=>JSON.stringify({message:'permission denied for function'})})});
  await assert.rejects(()=>api.rpc('save',{}),/401 · permission denied for function/);
});
