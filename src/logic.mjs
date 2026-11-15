/** Stable tool-definition JSON contract (v1), shared by editor, preview & release validators. */
export const emptyDefinition=()=>({schema_version:1,sections:[]});
export const token=(s)=>String(s??'').trim().replace(/[^A-Za-z0-9_-]/g,'_').toUpperCase().slice(0,80);
export const clone=(v)=>JSON.parse(JSON.stringify(v));
export const itemId=()=>typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function newSection(order=0){return {client_id:itemId(),section_name:'New section',description:'',display_order:order,is_enabled:true,configuration:{},questions:[]};}
export function newQuestion(code='Q_1',type='',order=0){return {client_id:itemId(),question_code:code,question_text:'New question',friendly_name:'',description:'',question_hint:'',question_type:type,display_order:order,is_required:true,is_enabled:true,allows_attachment:false,allows_comment:true,configuration:{},validation_rules:{},options:[]};}
export function newOption(value='OPTION_1',order=0){return {client_id:itemId(),option_value:value,option_label:'New option',option_hint:'',display_order:order,is_default:false,is_enabled:true,configuration:{}};}
export function ordered(items){return [...(Array.isArray(items)?items:[])].sort((a,b)=>Number(a?.display_order??0)-Number(b?.display_order??0));}
export function qType(types,code){return (Array.isArray(types)?types:[]).find(t=>t.type_code===code)||null;}
export function isMultiple(t){return t?.supports_options===true&&t?.supports_multiple_values===true;}
export function normalizedDefinition(def){
 const source=def&&typeof def==='object'&&!Array.isArray(def)?def:emptyDefinition();
 return {schema_version:1,sections:ordered(source.sections).map((s,si)=>({
  client_id:String(s.client_id||itemId()),section_name:String(s.section_name||''),description:String(s.description||''),display_order:si,is_enabled:s.is_enabled!==false,configuration:s.configuration&&typeof s.configuration==='object'&&!Array.isArray(s.configuration)?s.configuration:{},
  questions:ordered(s.questions).map((q,qi)=>({client_id:String(q.client_id||itemId()),question_code:token(q.question_code),question_text:String(q.question_text||''),friendly_name:String(q.friendly_name||''),description:String(q.description||''),question_hint:String(q.question_hint||''),question_type:String(q.question_type||''),display_order:qi,is_required:q.is_required===true,is_enabled:q.is_enabled!==false,allows_attachment:q.allows_attachment===true,allows_comment:q.allows_comment!==false,configuration:q.configuration&&typeof q.configuration==='object'&&!Array.isArray(q.configuration)?q.configuration:{},validation_rules:q.validation_rules&&typeof q.validation_rules==='object'&&!Array.isArray(q.validation_rules)?q.validation_rules:{},
   options:ordered(q.options).map((o,oi)=>({client_id:String(o.client_id||itemId()),option_value:token(o.option_value),option_label:String(o.option_label||''),option_hint:String(o.option_hint||''),display_order:oi,is_default:o.is_default===true,is_enabled:o.is_enabled!==false,configuration:o.configuration&&typeof o.configuration==='object'&&!Array.isArray(o.configuration)?o.configuration:{}}))
  }))
 }))};
}
export function validateDefinition(def,types=[]){
 const errors=[],warnings=[];
 if(def?.schema_version!==1){errors.push('Unsupported definition schema version.');return {errors,warnings,valid:false,questionCount:0,sectionCount:0};}
 if(!Array.isArray(def?.sections)){errors.push('Sections must be an array.');return {errors,warnings,valid:false,questionCount:0,sectionCount:0};}
 if(!def.sections.length)errors.push('Add at least one section.');
 let questionCount=0,activeCount=0;
 for(const [si,s] of def.sections.entries()){
  const section=`Section ${si+1}`;
  if(!String(s?.section_name||'').trim())errors.push(`${section}: name is required.`);
  if(!Array.isArray(s?.questions)){errors.push(`${section}: questions must be an array.`);continue;}
  if(s.questions.length===0)warnings.push(`${section} has no questions.`);
  const questionCodes=new Set();
  for(const [qi,q] of s.questions.entries()){
   questionCount++;const label=`${section}, question ${qi+1}`;const code=String(q?.question_code||'').trim();
   if(!code)errors.push(`${label}: code required.`);
   if(questionCodes.has(code))errors.push(`${label}: duplicate code ${code}.`);questionCodes.add(code);
   if(!String(q?.question_text||'').trim())errors.push(`${label}: question text required.`);
   const qt=qType(types,q?.question_type);
   if(!qt||qt.is_active===false)errors.push(`${label}: select an active question type.`);
   if(!Array.isArray(q?.options)){errors.push(`${label}: options must be an array.`);continue;}
   const values=new Set();let enabled=0,defaults=0;
   for(const [oi,o] of q.options.entries()){
    if(!String(o?.option_label||'').trim()||!String(o?.option_value||'').trim())errors.push(`${label}, option ${oi+1}: value and label required.`);
    if(values.has(o.option_value))errors.push(`${label}: duplicate option value ${o.option_value}.`);
    values.add(o.option_value);if(o.is_enabled!==false)enabled++;if(o.is_default===true)defaults++;
   }
   if(qt?.supports_options===true&&enabled<2)errors.push(`${label}: at least two enabled options required.`);
   if(qt?.supports_options===false&&q.options.length)errors.push(`${label}: selected type cannot have options.`);
   if(qt?.supports_multiple_values!==true&&defaults>1)warnings.push(`${label}: multiple default options are configured.`);
   if(s.is_enabled!==false&&q.is_enabled!==false)activeCount++;
  }
 }
 if(!activeCount)errors.push('At least one enabled question in an enabled section is required.');
 return {errors,warnings,valid:errors.length===0,questionCount,sectionCount:def.sections.length};
}
export function nextVersion(current){
 const match=/^(\d+)\.(\d+)\.(\d+)$/.exec(String(current||''));
 if(!match)return '1.0.0';return `${match[1]}.${Number(match[2])+1}.0`;
}
