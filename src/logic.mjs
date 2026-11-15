/** Page 3 catalogue definitions contain NO sections, questions or answer options. */
export const SUPPORTED_TOOL_TYPES = Object.freeze({ QUESTIONNAIRE: 'Questionnaire' });
export const CATEGORIES = Object.freeze(['Assessment','Compliance','Security','Operations']);
export const ICONS = Object.freeze(['clipboard-list','shield-check','list-checks','file-check-2']);
export function isSupportedType(type) { return Object.hasOwn(SUPPORTED_TOOL_TYPES, String(type||'')); }
export function isCapabilityDefinition(d) {
  return d && String(d.schema_version)==='2' && d.kind==='TOOL_CAPABILITY' &&
    d.tool_type==='QUESTIONNAIRE' && typeof d.catalogue==='object' && d.catalogue!==null &&
    typeof d.capabilities==='object' && d.capabilities!==null;
}
export function catalogueDefinition({category='Assessment',icon='clipboard-list'}={}, legacy=null) {
  const obj={schema_version:2,kind:'TOOL_CAPABILITY',tool_type:'QUESTIONNAIRE',
    catalogue:{category:CATEGORIES.includes(category)?category:'Assessment',icon:ICONS.includes(icon)?icon:'clipboard-list'},
    capabilities:{template_question_builder:true,supports_sections:true,supports_questions:true,
      supports_options:true,supports_attachments:true,supports_comments:true,
      supports_conditional_rules:true,supports_risk_issue_rules:true}};
  if(legacy && typeof legacy==='object')obj.legacy_definition=legacy;
  return obj;
}
export function draftMetadata(d) {
  const c=isCapabilityDefinition(d)?d.catalogue:{};
  return {category:CATEGORIES.includes(c?.category)?c.category:'Assessment',icon:ICONS.includes(c?.icon)?c.icon:'clipboard-list'};
}
export function nextVersion(current='0.0.0') {
  const bits=String(current).split('.').map(x=>Number(x));
  if(bits.length!==3 || bits.some(x=>!Number.isSafeInteger(x)||x<0))return '1.0.0';
  return `${bits[0]}.${bits[1]}.${bits[2]+1}`;
}
export function compareVersions(a,b) {
  const one=String(a).split('.').map(Number),two=String(b).split('.').map(Number);
  for(let i=0;i<3;i++)if((one[i]||0)!==(two[i]||0))return (one[i]||0)-(two[i]||0);
  return 0;
}
export function orderedReleases(releases,toolId) {
  return (Array.isArray(releases)?releases:[]).filter(r=>Number(r.tool_id)===Number(toolId))
    .sort((a,b)=>compareVersions(b.release_version,a.release_version));
}
export function toolStatus(tool,draft,releases) {
  if(tool?.is_active===false)return 'Inactive';
  if((releases||[]).some(r=>r.is_active!==false))return 'Available';
  if(draft && draft.is_locked===false)return 'Draft';
  if((releases||[]).length)return 'No active releases';
  return 'Not released';
}
export function validateDraft({name,category,icon}) {
  const issues=[];
  if(!String(name||'').trim())issues.push('Tool name is required.');
  if(String(name||'').length>180)issues.push('Tool name exceeds 180 characters.');
  if(!CATEGORIES.includes(category))issues.push('Select a valid catalogue category.');
  if(!ICONS.includes(icon))issues.push('Select an icon.');
  return issues;
}
