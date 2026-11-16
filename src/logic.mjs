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
/** Inspect an immutable catalogue release without modifying its historical definition.
 * Page 2 currently filters only active tool/release flags; compatibility is reported
 * separately so a legacy release is never silently represented as v2-ready.
 */
export const REQUIRED_QUESTIONNAIRE_CAPABILITIES = Object.freeze([
  'template_question_builder','supports_sections','supports_questions',
  'supports_options','supports_attachments','supports_comments',
  'supports_conditional_rules','supports_risk_issue_rules'
]);
export function releaseCompatibility(release,toolType='QUESTIONNAIRE') {
  if (!release || typeof release !== 'object') return {code:'MISSING',ready:false,label:'Missing release'};
  if (!isSupportedType(toolType))return {code:'UNSUPPORTED',ready:false,label:'Unsupported tool engine'};
  const definition=release.definition;
  if (definition && String(definition.schema_version)==='1')return {code:'LEGACY',ready:false,label:'Legacy v1 definition'};
  if (!isCapabilityDefinition(definition) || definition.tool_type!==toolType)
    return {code:'INVALID',ready:false,label:'Incompatible release definition'};
  // Section/question data remains owned by the Template Builder, never by a released capability.
  if (Object.hasOwn(definition,'sections') || Object.hasOwn(definition,'questions'))
    return {code:'INVALID',ready:false,label:'Contains questionnaire content'};
  const missing=REQUIRED_QUESTIONNAIRE_CAPABILITIES.filter(key=>definition.capabilities[key]!==true);
  if(missing.length)return {code:'INCOMPLETE',ready:false,label:'Incomplete capability definition',missing};
  return {code:'READY',ready:true,label:'Compatible with Template Builder'};
}
export function integrationReadiness(tool,releases=[]) {
  if (!tool)return {ready:false,code:'MISSING_TOOL',message:'Select a registered tool.'};
  if (tool.is_active===false)return {ready:false,code:'INACTIVE_TOOL',message:'Activate the tool to enable new assignments.'};
  const active=(releases||[]).filter(r=>r.is_active!==false && Number(r.tool_id)===Number(tool.id));
  if (!active.length)return {ready:false,code:'NO_ACTIVE_RELEASE',message:'Create or activate a release.'};
  const compatible=orderedReleases(active,tool.id).find(r=>releaseCompatibility(r,tool.tool_type).ready);
  if(!compatible)return {ready:false,code:'LEGACY_OR_INCOMPATIBLE',message:'No active v2-compatible release. Create a new catalogue-only release.'};
  return {ready:true,code:'READY',releaseId:Number(compatible.id),version:compatible.release_version,
    message:`Compatible release v${compatible.release_version} is active.`};
}
/** UI-side validation; database uniqueness and revision checks remain authoritative. */
export function validateNextVersion(candidate,releases=[]) {
  const value=String(candidate??'').trim();
  if(!/^\d+\.\d+\.\d+$/.test(value))return 'Version must use numeric format (for example 1.0.1).';
  const parts=value.split('.').map(Number);
  if(parts.some(n=>!Number.isSafeInteger(n)))return 'Version numbers are too large.';
  const previous=(releases||[]).map(x=>String(x.release_version||'')).filter(x=>/^\d+\.\d+\.\d+$/.test(x));
  if(previous.some(x=>compareVersions(value,x)===0))return 'This version number already exists.';
  if(previous.some(x=>compareVersions(value,x)<=0))return 'The new version must be higher than every existing release.';
  return null;
}
export function validateDraft({name,category,icon}) {
  const issues=[];
  if(!String(name||'').trim())issues.push('Tool name is required.');
  if(String(name||'').length>180)issues.push('Tool name exceeds 180 characters.');
  if(!CATEGORIES.includes(category))issues.push('Select a valid catalogue category.');
  if(!ICONS.includes(icon))issues.push('Select an icon.');
  return issues;
}
