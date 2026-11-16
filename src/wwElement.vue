<template>
  <div class="tc-root" :style="{'--tc-accent':content?.accentColor||'#c4262e'}">
    <header class="tc-header">
      <div class="tc-heading"><span class="tc-kicker">EU CRA HUB · PAGE 03</span><div class="tc-title-line"><h2>Reusable Tools</h2><span class="tc-page-tag">TOOL CATALOGUE</span></div><p>Register tool capabilities once. Configure the actual sections, questions and rules in Template Builder.</p></div>
      <div class="tc-head-actions"><button class="tc-btn tc-outline" type="button" @click="openConnection">⚙ Connection</button><button class="tc-btn tc-outline" type="button" :disabled="loading||!connected" @click="refresh">↻ Refresh</button><button class="tc-btn tc-primary" type="button" :disabled="!canWrite||busy" @click="openNewTool">＋ New Tool</button></div>
    </header>

    <div v-if="!connected" class="tc-banner tc-banner-alert"><strong>Supabase connection needed.</strong> Configure the project URL and <code>sb_publishable_</code> key in WeWeb properties, or use Connection.</div>
    <div v-else-if="!writeEnabled" class="tc-banner tc-banner-info"><strong>Read-only mode.</strong> Enable development writes in the WeWeb component properties only for your isolated Supabase development project.</div>
    <div v-else class="tc-banner tc-banner-warning"><strong>Development mode.</strong> This publishable-key-only component uses anonymous database permissions; never expose a write-enabled version publicly.</div>
    <div v-if="error" class="tc-banner tc-banner-error" role="alert"><span>{{error}}</span><button type="button" class="tc-text-btn" @click="error=''">Dismiss</button></div>
    <div v-if="notice" class="tc-banner tc-banner-ok" role="status"><span>{{notice}}</span><button type="button" class="tc-text-btn" @click="notice=''">Dismiss</button></div>

    <div class="tc-shell">
      <aside class="tc-sidebar">
        <div class="tc-side-heading"><div><strong>REGISTERED TOOLS</strong><small>{{tools.length}} in catalogue</small></div><button class="tc-icon-btn tc-accent-icon" :disabled="!canWrite||busy" title="Create tool" @click="openNewTool">＋</button></div>
        <label class="tc-visually-hidden" for="tc-tool-search">Search tools</label><input id="tc-tool-search" v-model="search" class="tc-input" placeholder="Search name or code…" />
        <label class="tc-visually-hidden" for="tc-status-filter">Filter status</label><select id="tc-status-filter" v-model="filter" class="tc-input"><option value="all">All tools</option><option value="active">Active tools</option><option value="released">Available releases</option><option value="draft">Draft tools</option><option value="inactive">Inactive tools</option></select>
        <div class="tc-side-list"><button v-for="tool in filteredTools" :key="tool.id" type="button" :class="['tc-side-tool',{selected:tool.id===selectedId}]" @click="selectTool(tool.id,'details')"><span class="tc-side-top"><b>{{tool.tool_name}}</b><i :class="['tc-dot',{'tc-dot-grey':tool.is_active===false}]"></i></span><small>{{tool.tool_code}}</small><span class="tc-side-bottom"><span>{{releaseCount(tool.id)}} releases</span><span>{{statusFor(tool)}}</span></span></button>
          <div v-if="!filteredTools.length" class="tc-side-empty">{{loading?'Loading…':tools.length?'No matching tools':'No tools registered yet'}}</div>
        </div>
        <div class="tc-sidebar-tip">Only an <b>active tool</b> with an <b>active release</b> is selectable in Page 2.</div>
      </aside>

      <main class="tc-main">
        <nav class="tc-tabs" aria-label="Tools Catalogue views"><button v-for="tab in tabs" :key="tab.id" type="button" :class="['tc-tab',{active:activeTab===tab.id}]" :disabled="tab.id!=='catalogue'&&!selectedTool" @click="activeTab=tab.id"><span class="tc-tab-step">{{tab.number}}</span>{{tab.title}}</button></nav>

        <div v-if="loading" class="tc-state-page">Loading tools from Supabase…</div>
        <section v-else-if="activeTab==='catalogue'" class="tc-view">
          <div class="tc-view-heading"><div><span class="tc-kicker">01 / TOOLS CATALOGUE</span><h3>Choose a reusable tool</h3><p>Browse available tool capabilities. Registration and release management happen here; assessment content belongs in Template Builder.</p></div><button class="tc-btn tc-primary" :disabled="!canWrite||busy" @click="openNewTool">＋ Register tool</button></div>
          <div class="tc-overview-counters"><div><span>Registered tools</span><strong>{{tools.length}}</strong></div><div><span>Active releases</span><strong>{{activeReleaseTotal}}</strong></div><div><span>Editable drafts</span><strong>{{editableDraftTotal}}</strong></div></div>
          <div class="tc-banner tc-banner-info tc-spacing-top"><strong>Template Builder handoff:</strong> {{compatibleReleaseTotal}} active release(s) have a v2-compatible questionnaire capability. Active legacy releases may still be listed by Page 2; create a v2 release before using them in new templates.</div>
          <div class="tc-marketplace"><div class="tc-market-heading"><h4>Installed catalogue</h4><span>These entries are stored in Supabase</span></div><div class="tc-card-grid"><button v-for="tool in filteredTools" :key="tool.id" type="button" class="tc-market-card" @click="selectTool(tool.id,'details')"><div class="tc-card-top"><div :class="['tc-market-icon',iconClass(iconFor(tool))]">{{iconGlyph(iconFor(tool))}}</div><span :class="['tc-pill',pillFor(tool)]">{{statusFor(tool)}}</span></div><h4>{{tool.tool_name}}</h4><p>{{tool.description||'Reusable assessment tool, configured inside a template after attachment.'}}</p><div class="tc-market-card-foot"><span>{{typeLabel(tool.tool_type)}} · {{categoryFor(tool)}}</span><span>{{releaseCount(tool.id)}} releases</span></div></button>
            <div v-if="!filteredTools.length" class="tc-empty-card"><div class="tc-empty-icon">▦</div><strong>{{tools.length?'No tools match these filters':'Your tool catalogue is empty'}}</strong><p>Create the first questionnaire tool or change the filter.</p><button class="tc-btn tc-primary" :disabled="!canWrite" @click="openNewTool">＋ New tool</button></div>
          </div></div>
          <div class="tc-marketplace tc-engine-box"><div class="tc-market-heading"><h4>Tool engines</h4><span>Only implemented engines can be registered and released</span></div><div class="tc-engine-grid"><div class="tc-engine-item"><span class="tc-engine-icon">☷</span><div><strong>Questionnaire</strong><p>Sections, questions, answer options, hints, attachments and rules configured in Page 2.</p></div><span class="tc-pill tc-pill-ready">Supported</span></div><div class="tc-engine-item"><span class="tc-engine-icon">☑</span><div><strong>Dedicated checklist</strong><p>Requires a checklist-specific editor and assessment renderer.</p></div><span class="tc-pill tc-pill-muted">Planned</span></div><div class="tc-engine-item"><span class="tc-engine-icon">▤</span><div><strong>Dedicated evidence collector</strong><p>Requires its own evidence-specific editor and assessment renderer.</p></div><span class="tc-pill tc-pill-muted">Planned</span></div></div></div>
        </section>

        <section v-else-if="activeTab==='details'&&selectedTool" class="tc-view">
          <div class="tc-view-heading"><div><span class="tc-kicker">02 / TOOL PROFILE</span><h3>{{selectedTool.tool_name}}</h3><p>Register tool identity and catalogue metadata here. There is no question editor on this page.</p></div><div class="tc-view-actions"><span :class="['tc-pill',pillFor(selectedTool)]">{{statusFor(selectedTool)}}</span><button class="tc-btn tc-outline" @click="activeTab='releases'">Releases →</button></div></div>
          <div v-if="!isSupportedType(selectedTool.tool_type)" class="tc-banner tc-banner-warning">This historical tool has type <b>{{selectedTool.tool_type}}</b>. It is visible for reference, but cannot be edited or newly released until its dedicated editor and renderer exist.</div>
          <div v-if="legacyDraft" class="tc-banner tc-banner-warning tc-legacy"><div><strong>Legacy v1 designer draft detected.</strong><p>Its old sections/questions are preserved in Supabase. Convert it into a catalogue-only draft before releasing. The old content will be retained under <code>legacy_definition</code> but will not be copied into new templates.</p></div><button class="tc-btn tc-primary" :disabled="!canWrite||busy" @click="convertLegacy">Convert draft</button></div>
          <div class="tc-profile-grid"><div class="tc-panel"><div class="tc-panel-head"><h4>Tool metadata</h4><span :class="['tc-save-indicator',{'tc-save-issue':saveState==='error'}]">{{saveLabel}}</span></div><div class="tc-form-grid"><label class="tc-field"><span>Tool name</span><input v-model="meta.name" :disabled="!editable" class="tc-input" maxlength="180" placeholder="Product Security Questionnaire"/></label><label class="tc-field"><span>Tool type</span><input class="tc-input" :value="typeLabel(selectedTool.tool_type)" disabled /></label><label class="tc-field"><span>Category</span><select v-model="meta.category" class="tc-input" :disabled="!editable"><option v-for="c in categories" :key="c" :value="c">{{c}}</option></select></label><label class="tc-field"><span>Catalogue icon</span><select v-model="meta.icon" class="tc-input" :disabled="!editable"><option v-for="o in iconChoices" :key="o.value" :value="o.value">{{o.label}}</option></select></label><label class="tc-field tc-full"><span>Stable tool code <small>— generated automatically</small></span><input class="tc-input" :value="selectedTool.tool_code" disabled /></label><label class="tc-field tc-full"><span>Description</span><textarea v-model="meta.description" :disabled="!editable" class="tc-input" rows="4" maxlength="5000" placeholder="What is this tool used for?" /></label></div><div class="tc-profile-footer"><div><strong>{{currentDraft?.is_locked===false?'Editable draft':'Released / no active draft'}}</strong><p>{{currentDraft?.is_locked===false?'Changes save automatically. A release is required for Template Builder.':'Published releases are immutable. Create a new draft version to edit.'}}</p></div><button v-if="editable" class="tc-btn tc-outline" :disabled="!dirty||saving" @click="saveDraft">{{saving?'Saving…':dirty?'Save now':'Saved'}}</button></div></div>
            <div class="tc-panel tc-summary-panel"><div class="tc-panel-head"><h4>Availability</h4></div><div class="tc-summary-card"><span>Tool</span><b>{{selectedTool.is_active!==false?'Active':'Inactive'}}</b></div><div class="tc-summary-card"><span>Active releases</span><b>{{activeReleasesFor(selectedTool.id).length}}</b></div><div class="tc-summary-card"><span>Current draft</span><b>{{currentDraft?.is_locked===false?'v'+currentDraft.draft_version:'None'}}</b></div><div class="tc-summary-card"><span>Page 2 active-flag selection</span><b>{{activeReleasesFor(selectedTool.id).length&&selectedTool.is_active!==false?'Selectable':'Not available'}}</b></div>
              <div class="tc-summary-card"><span>v2 compatibility</span><b>{{selectedReadiness.ready?'Ready':'Needs attention'}}</b></div>
              <p :class="['tc-mini-note',{'tc-save-issue':!selectedReadiness.ready}]">{{selectedReadiness.message}}</p><button class="tc-btn tc-outline tc-block" :disabled="!canWrite||busy" @click="toggleToolActive(selectedTool)">{{selectedTool.is_active===false?'Activate tool':'Deactivate tool'}}</button><p class="tc-mini-note">Deactivation prevents new assignments. Previously attached templates retain their existing tool references.</p></div></div>
          <div class="tc-panel tc-handoff"><div class="tc-panel-head"><h4>What Template Builder configures</h4><span class="tc-pill tc-pill-ready">Page 2 ownership</span></div><div class="tc-handoff-grid"><div><span class="tc-handoff-ico">☷</span><strong>Sections and questions</strong><p>Question text, type, description and hint</p></div><div><span class="tc-handoff-ico">◎</span><strong>Answers and evidence</strong><p>Options, comments, attachments and validation</p></div><div><span class="tc-handoff-ico">⚙</span><strong>Rules and review</strong><p>Conditional logic, risk/gap rules, approval stages</p></div></div><p class="tc-mini-note">A released catalogue tool is just the capability. Each contributor gets its own independent tool instance and configures its own assessment content. Dynamic question types and answer-option conditions are configured in Template Builder, not here.</p></div>
        </section>

        <section v-else-if="activeTab==='releases'&&selectedTool" class="tc-view">
          <div class="tc-view-heading"><div><span class="tc-kicker">03 / RELEASE MANAGEMENT</span><h3>{{selectedTool.tool_name}} · Versions</h3><p>Controlled releases for Template Builder. Existing release definitions remain immutable.</p></div><button class="tc-btn tc-primary" :disabled="!canWrite||busy||!isSupportedType(selectedTool.tool_type)||!releasesFor(selectedTool.id).length||!!currentDraft&&!currentDraft.is_locked" @click="openNewVersion">＋ New Version</button></div>
          <div class="tc-panel tc-release-banner" v-if="currentDraft?.is_locked===false"><div><span class="tc-kicker">CURRENT DRAFT</span><h4>Version {{currentDraft.draft_version}}</h4><p>{{legacyDraft?'Legacy draft must be converted before it can be released.':'This release contains the tool capability, not questions or section definitions.'}}</p><p class="tc-mini-note">Draft revision {{currentDraft.revision}}</p></div><button class="tc-btn tc-primary" :disabled="!editable||legacyDraft||busy||saving" @click="openRelease">Release Tool</button></div>
          <div class="tc-panel"><div class="tc-panel-head"><h4>Published releases</h4><small>{{releasesFor(selectedTool.id).length}} total</small></div><div v-for="release in releasesFor(selectedTool.id)" :key="release.id" class="tc-release-row"><div class="tc-release-icon">▣</div><div class="tc-release-info"><div class="tc-release-title"><strong>v{{release.release_version}}</strong><span :class="['tc-pill',release.is_active!==false?'tc-pill-ready':'tc-pill-muted']">{{release.is_active!==false?'Active':'Inactive'}}</span><span :class="['tc-pill',compatibilityPill(release)]" :title="compatibilityFor(release).label">{{compatibilityFor(release).label}}</span></div><p>{{release.release_notes||'No release notes provided.'}}</p><small>Release #{{release.id}} · {{formatDate(release.created_at)}}</small></div><button class="tc-btn tc-outline tc-small" :disabled="!canWrite||busy" @click="toggleReleaseActive(release)">{{release.is_active===false?'Activate':'Deactivate'}}</button></div><div v-if="!releasesFor(selectedTool.id).length" class="tc-release-empty">No releases yet. Complete the tool profile, then release its draft to make it available in Template Builder.</div></div>
          <div class="tc-banner tc-banner-info tc-spacing-top"><strong>About previous releases:</strong> Existing v1 question definitions remain preserved for historical reference. The v2 catalogue upgrade stops copying them into new template instances. Build questions directly in Page 2 after adding the tool.</div>
        </section>
        <div v-else class="tc-state-page"><div class="tc-empty-icon">▦</div><h3>Select a tool to view its details</h3><p>Choose a tool from the left panel or return to the catalogue.</p><button class="tc-btn tc-primary" @click="activeTab='catalogue'">Browse catalogue</button></div>
      </main>
    </div>

    <div v-if="modal" class="tc-overlay" @click.self="closeModal"><form class="tc-modal" role="dialog" aria-modal="true" :aria-label="modalTitle" @submit.prevent="submitModal"><div class="tc-modal-head"><div><span class="tc-kicker">TOOLS CATALOGUE</span><h3>{{modalTitle}}</h3></div><button type="button" class="tc-icon-btn" aria-label="Close" @click="closeModal">✕</button></div><div class="tc-modal-body">
      <template v-if="modal==='connection'"><p class="tc-mini-note">These connection values last only while this component remains mounted. Set them permanently in WeWeb properties.</p><label class="tc-field"><span>Supabase Project URL</span><input v-model.trim="form.url" class="tc-input" type="url" required placeholder="https://project.supabase.co" autocomplete="off" /></label><label class="tc-field"><span>Publishable key</span><input v-model.trim="form.key" class="tc-input" type="password" required placeholder="sb_publishable_…" autocomplete="off" /></label><label class="tc-check"><input v-model="form.writes" type="checkbox" /> Enable development writes (isolated project only)</label></template>
      <template v-else-if="modal==='new'"><label class="tc-field"><span>Tool name</span><input v-model.trim="form.name" class="tc-input" maxlength="180" required placeholder="Product Security Questionnaire"/></label><label class="tc-field"><span>Supported tool type</span><select class="tc-input" disabled><option>Questionnaire</option></select></label><label class="tc-field"><span>Description (optional)</span><textarea v-model="form.description" class="tc-input" rows="3" maxlength="5000"/></label><p class="tc-mini-note">The stable tool code is generated automatically. A v1.0.0 draft is created. You will manage questions separately in Template Builder.</p></template>
      <template v-else-if="modal==='version'"><label class="tc-field"><span>New version</span><input v-model.trim="form.version" class="tc-input" required pattern="[0-9]+\.[0-9]+\.[0-9]+" placeholder="1.0.1"/></label><p class="tc-mini-note">Creates a new editable catalogue profile based on the last release. Previous releases are not changed.</p></template>
      <template v-else-if="modal==='release'"><div class="tc-preview-box"><strong>Ready to release: {{selectedTool?.tool_name}}</strong><p>Version {{currentDraft?.draft_version}} · Questionnaire capability · No questions stored in this release</p></div><label class="tc-field"><span>Release notes</span><textarea v-model="form.notes" class="tc-input" rows="4" placeholder="What changed in this tool version?"/></label><label class="tc-check"><input v-model="form.confirm" type="checkbox" required /> I confirm this catalogue capability is ready for selection in Template Builder.</label></template>
      <p v-if="modalError" class="tc-modal-error" role="alert">{{modalError}}</p>
    </div><div class="tc-modal-footer"><button class="tc-btn tc-outline" type="button" :disabled="busy" @click="closeModal">Cancel</button><button class="tc-btn tc-primary" type="submit" :disabled="busy||(modal==='release'&&!form.confirm)">{{busy?'Working…':modal==='new'?'Create Tool':modal==='version'?'Create Version':modal==='release'?'Release Tool':'Connect'}}</button></div></form></div>
  </div>
</template>

<script setup>
import {computed,onBeforeUnmount,onMounted,reactive,ref,watch,nextTick} from 'vue';
import {createApi,firstRow} from './api.mjs';
import {CATEGORIES,ICONS,isSupportedType,isCapabilityDefinition,catalogueDefinition,draftMetadata,
  nextVersion,orderedReleases,toolStatus,validateDraft,releaseCompatibility,integrationReadiness,validateNextVersion} from './logic.mjs';

const props=defineProps({content:{type:Object,default:()=>({})}});
const emit=defineEmits(['trigger-event']);
const content=computed(()=>props.content??{});
function trigger(name,event={}){emit('trigger-event',{name,event});}
const override=ref(null);
const projectUrl=computed(()=>override.value?.url??content.value?.supabaseUrl??'');
const publishableKey=computed(()=>override.value?.key??content.value?.publishableKey??'');
const writeEnabled=computed(()=>override.value?.writes??(content.value?.enableMutations===true));
const api=computed(()=>{try{return createApi({url:projectUrl.value,key:publishableKey.value});}catch{return null;}});
const connected=computed(()=>!!api.value);
const canWrite=computed(()=>connected.value&&writeEnabled.value);
const tools=ref([]),releases=ref([]),drafts=ref([]);
const loading=ref(false),busy=ref(false),saving=ref(false),error=ref(''),notice=ref('');
const search=ref(''),filter=ref('all'),selectedId=ref(Number(content.value?.initialToolId)||0),activeTab=ref('catalogue');
const tabs=[{id:'catalogue',number:1,title:'Tool Catalogue'},{id:'details',number:2,title:'Tool Profile'},{id:'releases',number:3,title:'Release Management'}];
const categories=CATEGORIES,iconChoices=[{value:'clipboard-list',label:'Questionnaire'},{value:'shield-check',label:'Shield'},{value:'list-checks',label:'Checklist icon'},{value:'file-check-2',label:'Document'}];
const meta=reactive({name:'',description:'',category:'Assessment',icon:'clipboard-list'});
const selectedTool=computed(()=>tools.value.find(t=>Number(t.id)===Number(selectedId.value))||null);
const currentDraft=computed(()=>drafts.value.find(d=>Number(d.tool_id)===Number(selectedId.value))||null);
const legacyDraft=computed(()=>!!currentDraft.value&&!isCapabilityDefinition(currentDraft.value?.definition));
const editable=computed(()=>canWrite.value&&selectedTool.value&&isSupportedType(selectedTool.value.tool_type)&&currentDraft.value?.is_locked===false&&!legacyDraft.value);
const dirty=ref(false),saveState=ref('idle');
const saveLabel=computed(()=>saving.value?'Saving…':dirty.value?'Unsaved changes':saveState.value==='error'?'Save failed':editable.value?'Auto-saved':'Read only');
const modal=ref(''),modalError=ref(''),form=ref({});
const modalTitle=computed(()=>({connection:'Supabase connection',new:'Create reusable tool',release:'Release tool capability',version:'Create new version'})[modal.value]||'Tool');
let editGeneration=0,saveTimer=null,savePromise=null,loadSequence=0,hydrating=false;
const activeReleaseTotal=computed(()=>releases.value.filter(r=>r.is_active!==false&&tools.value.some(t=>t.id===r.tool_id&&t.is_active!==false)).length);
const editableDraftTotal=computed(()=>drafts.value.filter(d=>d.is_locked===false).length);
const selectedReadiness=computed(()=>integrationReadiness(selectedTool.value,releasesFor(selectedId.value)));
const compatibleReleaseTotal=computed(()=>releases.value.filter(r=>r.is_active!==false&&
  tools.value.some(t=>Number(t.id)===Number(r.tool_id)&&t.is_active!==false&&releaseCompatibility(r,t.tool_type).ready)).length);
function compatibilityFor(release){return releaseCompatibility(release,selectedTool.value?.tool_type);}
function compatibilityPill(release){return compatibilityFor(release).ready?'tc-pill-ready':'tc-pill-warning';}
const filteredTools=computed(()=>tools.value.filter(t=>{
  const q=search.value.toLowerCase().trim();
  if(q&&!`${t.tool_name} ${t.tool_code} ${t.description||''}`.toLowerCase().includes(q))return false;
  if(filter.value==='active'&&t.is_active===false)return false;
  if(filter.value==='inactive'&&t.is_active!==false)return false;
  if(filter.value==='released'&&activeReleasesFor(t.id).length===0)return false;
  if(filter.value==='draft'&&draftFor(t.id)?.is_locked!==false)return false;
  return true;
}).sort((a,b)=>String(a.tool_name).localeCompare(String(b.tool_name))));
function releasesFor(id){return orderedReleases(releases.value,id);}
function activeReleasesFor(id){return releasesFor(id).filter(r=>r.is_active!==false);}
function releaseCount(id){return releasesFor(id).length;}
function draftFor(id){return drafts.value.find(d=>Number(d.tool_id)===Number(id))||null;}
function statusFor(tool){return toolStatus(tool,draftFor(tool.id),releasesFor(tool.id));}
function pillFor(tool){const s=statusFor(tool);return s==='Available'?'tc-pill-ready':s==='Draft'?'tc-pill-warning':'tc-pill-muted';}
function definitionFor(tool){return draftFor(tool.id)?.definition||releasesFor(tool.id)[0]?.definition||null;}
function categoryFor(tool){return draftMetadata(definitionFor(tool)).category;}
function iconFor(tool){return draftMetadata(definitionFor(tool)).icon;}
function iconClass(icon){return `tc-icon-${String(icon||'clipboard-list').replace(/[^a-z-]/g,'')}`;}
function iconGlyph(icon){return ({'clipboard-list':'☷','shield-check':'◇','list-checks':'☑','file-check-2':'▣'})[icon]||'▦';}
function typeLabel(type){return type==='QUESTIONNAIRE'?'Questionnaire':String(type||'Unknown type');}
function formatDate(stamp){if(!stamp)return 'Unknown date';const d=new Date(stamp);return Number.isNaN(d.getTime())?'Unknown date':d.toLocaleDateString();}
function hydrateTool(){hydrating=true;dirty.value=false;saveState.value='idle';editGeneration++;
  if(selectedTool.value){const d=draftMetadata(definitionFor(selectedTool.value));
    Object.assign(meta,{name:selectedTool.value.tool_name||'',description:selectedTool.value.description||'',category:d.category,icon:d.icon});}
  else Object.assign(meta,{name:'',description:'',category:'Assessment',icon:'clipboard-list'});
  nextTick(()=>{hydrating=false;});
}
async function refresh(){if(dirty.value&&!busy.value&&!await saveDraft())return;if(!api.value){error.value='Enter your Supabase URL and publishable key.';return;}
  const seq=++loadSequence;loading.value=true;error.value='';
  try{const loaded=await api.value.catalogue();if(seq!==loadSequence)return;
    tools.value=loaded.tools||[];releases.value=loaded.releases||[];drafts.value=loaded.drafts||[];
    if(!tools.value.some(t=>Number(t.id)===Number(selectedId.value)))selectedId.value=Number(tools.value[0]?.id||0);
    hydrateTool();}
  catch(e){if(seq===loadSequence)error.value=`Supabase: ${e?.message||'Unable to load catalogue'}`;}
  finally{if(seq===loadSequence)loading.value=false;}
}
async function selectTool(id,tab='details'){
  clearTimeout(saveTimer);
  if(dirty.value&&!await saveDraft())return;
  selectedId.value=Number(id);hydrateTool();activeTab.value=tab;
  trigger('tool-selected',{tool_id:selectedId.value});
}
function scheduleSave(){if(hydrating||!editable.value)return;dirty.value=true;editGeneration++;saveState.value='waiting';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(),900);}
watch(()=>[meta.name,meta.description,meta.category,meta.icon],scheduleSave);
async function saveDraft(){
  clearTimeout(saveTimer);
  if(savePromise){const ok=await savePromise;if(!ok)return false;if(dirty.value)return saveDraft();return true;}
  if(!dirty.value)return true;
  if(!editable.value)return false;
  const issues=validateDraft(meta);
  if(issues.length){saveState.value='error';error.value=issues.join(' ');return false;}
  const gen=editGeneration,id=selectedId.value,d=currentDraft.value;
  const snapshot={name:meta.name.trim(),description:meta.description,category:meta.category,icon:meta.icon};
  const prev=d?.definition?.legacy_definition??null;
  const p={p_tool_id:Number(id),p_expected_revision:Number(d.revision),p_definition:catalogueDefinition(snapshot,prev),
    p_draft_version:d.draft_version,p_tool_name:snapshot.name,p_description:snapshot.description};
  saving.value=true;saveState.value='saving';
  savePromise=(async()=>{try{
    const out=firstRow(await api.value.rpc('cra_tm_save_catalogue_tool_draft',p));
    const existing=drafts.value.find(x=>Number(x.tool_id)===id);
    if(existing){existing.revision=out?.revision||Number(d.revision)+1;existing.definition=p.p_definition;existing.updated_at=out?.updated_at;}
    const tool=tools.value.find(x=>Number(x.id)===id);
    if(tool){tool.tool_name=snapshot.name;tool.description=snapshot.description;}
    if(gen===editGeneration){dirty.value=false;saveState.value='saved';}else{saveState.value='waiting';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(),600);}
    trigger('draft-saved',{tool_id:id,revision:Number(out?.revision||0)});
    return true;
  }catch(e){error.value=`Save failed: ${e?.message||'Unknown error'}`;saveState.value='error';return false;}
  finally{saving.value=false;}})();
  try{return await savePromise;}finally{savePromise=null;}
}
async function convertLegacy(){if(!canWrite.value||!legacyDraft.value)return;
  busy.value=true;error.value='';
  try{const d=currentDraft.value,t=selectedTool.value;
    const output=firstRow(await api.value.rpc('cra_tm_save_catalogue_tool_draft',{
      p_tool_id:t.id,p_expected_revision:d.revision,p_definition:catalogueDefinition({category:'Assessment',icon:'clipboard-list'},d.definition),
      p_draft_version:d.draft_version,p_tool_name:t.tool_name,p_description:t.description||null}));
    notice.value=`Legacy draft converted. Original content was preserved in legacy_definition. Revision ${output?.revision||''}.`;
    await refresh();activeTab.value='details';
  }catch(e){error.value=`Conversion failed: ${e?.message||'Unknown error'}`;}
  finally{busy.value=false;}
}
function openConnection(){form.value={url:projectUrl.value,key:publishableKey.value,writes:writeEnabled.value};modal.value='connection';modalError.value='';}
function openNewTool(){if(!canWrite.value)return;form.value={name:'',description:''};modalError.value='';modal.value='new';}
function openRelease(){if(!editable.value)return;form.value={notes:'',confirm:false};modalError.value='';modal.value='release';}
function openNewVersion(){if(!canWrite.value||!selectedTool.value||!releasesFor(selectedId.value).length)return;
  const latest=releasesFor(selectedId.value)[0];form.value={version:nextVersion(latest?.release_version||'0.0.0')};modalError.value='';modal.value='version';}
function closeModal(){if(busy.value)return;modal.value='';modalError.value='';}
async function submitModal(){
  if(modal.value==='connection'){try{createApi({url:form.value.url,key:form.value.key});if(dirty.value&&!await saveDraft())throw Error('Save the current draft before changing connection.');override.value={url:form.value.url,key:form.value.key,writes:!!form.value.writes};modal.value='';await refresh();}catch(e){modalError.value=e?.message||'Invalid connection';}return;}
  if(!canWrite.value){modalError.value='Development writes are disabled';return;}
  busy.value=true;modalError.value='';error.value='';
  try{
    if(modal.value==='new'){
      if(!String(form.value.name||'').trim())throw Error('Tool name is required');
      const out=firstRow(await api.value.rpc('cra_tm_create_catalogue_tool',{
        p_tool_code:null,p_tool_name:String(form.value.name).trim(),p_description:form.value.description||null}));
      const newId=Number(out?.tool_id);if(!newId)throw Error('Create RPC did not return a tool ID');
      await refresh();selectedId.value=newId;hydrateTool();activeTab.value='details';
      trigger('tool-created',{tool_id:newId});notice.value='Tool registered. Its code was generated automatically. Release it when ready.';
    }else if(modal.value==='release'){
      if(legacyDraft.value)throw Error('Convert legacy draft first');
      if(!await saveDraft())throw Error('Save the profile before releasing');
      const d=currentDraft.value;if(!d||d.is_locked)throw Error('No editable draft');
      const out=firstRow(await api.value.rpc('cra_tm_release_catalogue_tool',{
        p_tool_id:selectedId.value,p_expected_revision:d.revision,p_release_notes:form.value.notes||null}));
      trigger('tool-released',{tool_id:selectedId.value,release_id:Number(out?.release_id||0),release_version:out?.release_version||''});
      notice.value='Tool capability released. It is now eligible for Page 2 when active.';
      await refresh();activeTab.value='releases';
    }else if(modal.value==='version'){
      const versionIssue=validateNextVersion(form.value.version,releasesFor(selectedId.value));
      if(versionIssue)throw Error(versionIssue);
      if(dirty.value&&!await saveDraft())throw Error('Save current edits first');
      await api.value.rpc('cra_tm_start_catalogue_tool_version',{
        p_tool_id:selectedId.value,p_next_version:form.value.version});
      notice.value=`Created new editable draft v${form.value.version}.`;
      await refresh();activeTab.value='details';
    }
    modal.value='';
  }catch(e){modalError.value=e?.message||'Operation failed';}
  finally{busy.value=false;}
}
async function toggleToolActive(tool){if(!canWrite.value)return;
  busy.value=true;error.value='';try{
    if(dirty.value&&!await saveDraft())throw Error('Save or correct the current draft before changing availability.');
    await api.value.rpc('cra_tm_set_catalogue_tool_active',{p_tool_id:tool.id,p_is_active:tool.is_active===false});
    notice.value='Tool availability updated.';await refresh();}catch(e){error.value=`Could not update tool: ${e?.message||'Unknown error'}`;}finally{busy.value=false;}
}
async function toggleReleaseActive(release){if(!canWrite.value)return;
  busy.value=true;error.value='';try{
    if(dirty.value&&!await saveDraft())throw Error('Save or correct the current draft before changing release availability.');
    await api.value.rpc('cra_tm_set_catalogue_release_active',{p_release_id:release.id,p_is_active:release.is_active===false});
    notice.value='Release availability updated.';await refresh();}catch(e){error.value=`Could not update release: ${e?.message||'Unknown error'}`;}finally{busy.value=false;}
}
watch(()=>[projectUrl.value,publishableKey.value],()=>{loadSequence++;tools.value=[];releases.value=[];drafts.value=[];hydrateTool();if(connected.value)refresh();});
onMounted(()=>{if(connected.value)refresh();});
onBeforeUnmount(()=>{clearTimeout(saveTimer);loadSequence++;});
</script>

<style scoped>
.tc-root{--tc-accent:#c4262e;--tc-ink:#1c3149;--tc-muted:#75849a;--tc-line:#dce3ed;--tc-bg:#f8fafc;color:var(--tc-ink);font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:13px;line-height:1.45;min-height:780px;background:var(--tc-bg)}.tc-root *{box-sizing:border-box}.tc-root button,.tc-root input,.tc-root textarea,.tc-root select{font:inherit}.tc-root button{cursor:pointer}.tc-root button:disabled{opacity:.48;cursor:not-allowed}.tc-header{display:flex;justify-content:space-between;align-items:center;padding:22px 24px 17px;gap:16px;background:white;border:1px solid var(--tc-line);border-radius:12px 12px 0 0}.tc-kicker{font-size:10px;letter-spacing:1.5px;font-weight:850;color:var(--tc-accent);text-transform:uppercase}.tc-title-line{display:flex;align-items:center;gap:12px}.tc-heading h2{margin:4px 0 3px;font-size:28px;letter-spacing:-.8px}.tc-heading p,.tc-view-heading p{margin:3px 0 0;color:var(--tc-muted);font-size:12px}.tc-page-tag{font-size:10px;color:var(--tc-muted);padding:4px 9px;border:1px solid var(--tc-line);border-radius:7px}.tc-head-actions,.tc-view-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.tc-btn{display:inline-flex;justify-content:center;align-items:center;border:1px solid var(--tc-line);border-radius:8px;gap:5px;padding:10px 14px;font-weight:650;font-size:12px;min-height:37px;white-space:nowrap}.tc-primary{background:var(--tc-accent);color:white;border-color:var(--tc-accent)}.tc-primary:hover:enabled{filter:brightness(.92)}.tc-outline{background:white;color:#455673}.tc-outline:hover:enabled{background:#f7f9fc}.tc-small{padding:6px 10px;min-height:30px}.tc-block{width:100%;margin-top:12px}.tc-banner{margin:12px 19px 0;padding:11px 13px;display:flex;justify-content:space-between;gap:12px;align-items:center;border-radius:8px;border:1px solid #dfe6ee;font-size:12px}.tc-banner p{margin:4px 0 0;font-size:11px}.tc-banner-alert{background:#fff6f3;border-color:#f6cbbd;color:#a83e2a}.tc-banner-info{background:#eef5fe;border-color:#d6e5f9;color:#426b98}.tc-banner-warning{background:#fff7e8;border-color:#f8ddb0;color:#906422}.tc-banner-error{background:#fff0f2;border-color:#f5c6ce;color:#b62a3c}.tc-banner-ok{background:#effbf4;border-color:#bde7cd;color:#216944}.tc-text-btn{border:0;background:transparent;text-decoration:underline;color:inherit;font-size:11px}.tc-shell{display:grid;grid-template-columns:246px minmax(0,1fr);border:1px solid var(--tc-line);margin:12px 19px 20px;background:white;border-radius:10px;min-height:690px;overflow:hidden}.tc-sidebar{border-right:1px solid var(--tc-line);padding:14px 12px;background:#fff;min-width:0}.tc-side-heading{display:flex;justify-content:space-between;align-items:center;margin:4px 0 15px}.tc-side-heading strong{display:block;font-size:10px;letter-spacing:.6px}.tc-side-heading small{display:block;color:var(--tc-muted);font-size:10px;margin-top:4px}.tc-icon-btn{background:#fff;border:1px solid var(--tc-line);height:32px;width:32px;border-radius:7px;display:flex;justify-content:center;align-items:center;font-weight:700;color:#8190a5}.tc-accent-icon{color:var(--tc-accent);border-color:#f2cfd2;background:#fff7f7}.tc-input{width:100%;min-width:0;border:1px solid #d7e0eb;background:white;border-radius:8px;color:var(--tc-ink);outline:none;padding:10px 12px;min-height:39px;font-size:12px}.tc-input:focus{border-color:var(--tc-accent);box-shadow:0 0 0 2px rgba(196,38,46,.08)}.tc-input:disabled{background:#f5f7fa;color:#73829a}.tc-sidebar>.tc-input{margin-bottom:9px}.tc-side-list{display:flex;flex-direction:column;gap:9px;margin-top:12px;max-height:550px;overflow:auto}.tc-side-tool{display:flex;flex-direction:column;align-items:stretch;text-align:left;gap:7px;width:100%;padding:12px;border:1px solid var(--tc-line);border-radius:9px;background:white;min-width:0}.tc-side-tool.selected{background:#fff4f4;border-color:#f3bfc3;border-left:3px solid var(--tc-accent);padding-left:10px}.tc-side-top{display:flex;justify-content:space-between;gap:5px}.tc-side-top b{font-size:12px;overflow-wrap:anywhere}.tc-dot{width:8px;height:8px;flex:none;border-radius:50%;background:#31b976;margin-top:3px}.tc-dot-grey{background:#abb6c7}.tc-side-tool small{font-size:9px;color:var(--tc-muted);overflow-wrap:anywhere}.tc-side-bottom{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:var(--tc-muted)}.tc-sidebar-tip{font-size:10px;line-height:1.6;color:#8490a4;border-top:1px solid var(--tc-line);margin-top:18px;padding-top:16px}.tc-side-empty{color:var(--tc-muted);font-size:11px;padding:14px 4px}.tc-main{min-width:0}.tc-tabs{display:flex;gap:8px;border-bottom:1px solid var(--tc-line);padding:0 20px;overflow:auto;min-height:54px}.tc-tab{display:flex;align-items:center;gap:8px;padding:13px 13px 12px;border:0;border-bottom:3px solid transparent;background:transparent;color:#8090a6;font-size:11px;font-weight:750;white-space:nowrap}.tc-tab.active{color:var(--tc-accent);border-bottom-color:var(--tc-accent)}.tc-tab-step{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#f1f3f6;color:#7c899b;width:22px;height:22px;font-size:10px}.tc-tab.active .tc-tab-step{background:#ffeded;color:var(--tc-accent)}.tc-view{padding:23px 20px 28px}.tc-view-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:20px}.tc-view-heading h3{font-size:23px;line-height:1.2;letter-spacing:-.5px;margin:8px 0 0}.tc-overview-counters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:19px}.tc-overview-counters>div{border:1px solid var(--tc-line);border-radius:10px;background:#fff;padding:14px}.tc-overview-counters span{display:block;color:var(--tc-muted);font-size:11px}.tc-overview-counters strong{display:block;font-size:25px;letter-spacing:-.5px;margin-top:3px}.tc-marketplace{border:1px solid var(--tc-line);border-radius:10px;padding:15px;background:white;margin-bottom:18px}.tc-market-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.tc-market-heading h4{font-size:13px;margin:0}.tc-market-heading span{font-size:10px;color:var(--tc-muted)}.tc-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.tc-market-card{border:1px solid var(--tc-line);border-radius:10px;text-align:left;background:#fff;padding:16px;display:flex;flex-direction:column;min-height:185px;transition:border-color .1s}.tc-market-card:hover{border-color:var(--tc-accent)}.tc-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:6px}.tc-market-icon{background:#fff2f2;color:var(--tc-accent);border-radius:10px;width:41px;height:41px;display:flex;align-items:center;justify-content:center;font-size:22px}.tc-market-card h4{font-size:13px;margin:11px 0 5px}.tc-market-card p{font-size:11px;color:var(--tc-muted);margin:0 0 12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.tc-market-card-foot{display:flex;justify-content:space-between;border-top:1px solid #edf0f5;padding-top:9px;margin-top:auto;gap:10px;font-size:9px;color:var(--tc-muted)}.tc-pill{display:inline-flex;align-items:center;white-space:nowrap;border-radius:20px;padding:4px 8px;font-size:10px;font-weight:700;border:1px solid transparent}.tc-pill-ready{background:#ecfbf3;border-color:#d3eddd;color:#1b8e57}.tc-pill-warning{background:#fff7e8;border-color:#fae6bc;color:#b77a18}.tc-pill-muted{background:#f1f4f8;border-color:#e5eaf1;color:#7c8ca2}.tc-engine-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.tc-engine-item{display:flex;align-items:flex-start;gap:10px;border:1px solid #e9edf3;border-radius:8px;padding:12px}.tc-engine-icon{flex:none;font-size:20px;color:#6f8199}.tc-engine-item>div{flex:1}.tc-engine-item strong{font-size:11px}.tc-engine-item p{font-size:10px;color:var(--tc-muted);margin:4px 0 0}.tc-engine-item .tc-pill{font-size:9px}.tc-profile-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(225px,1fr);gap:14px}.tc-panel{border:1px solid var(--tc-line);border-radius:10px;padding:17px;background:white;margin-bottom:14px;min-width:0}.tc-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:17px}.tc-panel-head h4{margin:0;font-size:13px}.tc-panel-head small{color:var(--tc-muted)}.tc-save-indicator{font-size:10px;color:#299e61}.tc-save-issue{color:#d13742}.tc-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.tc-field{display:flex;flex-direction:column;gap:7px;min-width:0;font-size:11px;font-weight:600;color:#5a6a83}.tc-field small{font-weight:400;color:#8593a8}.tc-full{grid-column:1/-1}.tc-field textarea{resize:vertical}.tc-profile-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:18px;border-top:1px solid #edf0f5;padding-top:14px}.tc-profile-footer strong{font-size:11px}.tc-profile-footer p,.tc-mini-note{color:var(--tc-muted);font-size:10px;line-height:1.55;margin:4px 0}.tc-summary-card{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #edf0f5;padding:13px 0;font-size:11px}.tc-summary-card span{color:var(--tc-muted)}.tc-summary-card b{text-align:right}.tc-handoff-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.tc-handoff-grid>div{padding:13px;background:#f8fafc;border-radius:8px}.tc-handoff-ico{display:block;color:var(--tc-accent);font-size:21px;margin-bottom:6px}.tc-handoff strong{font-size:12px}.tc-handoff p{color:var(--tc-muted);font-size:10px;margin:4px 0}.tc-handoff>.tc-mini-note{margin-top:11px}.tc-legacy{align-items:center;margin:0 0 16px}.tc-release-banner{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#fff9f9}.tc-release-banner h4{margin:4px 0;font-size:16px}.tc-release-banner p{margin:3px 0;color:var(--tc-muted);font-size:11px}.tc-release-row{display:flex;align-items:center;gap:13px;padding:17px 0;border-top:1px solid #e9edf3}.tc-release-icon{flex:none;width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#f6f8fb;border-radius:8px;font-size:18px;color:var(--tc-accent)}.tc-release-info{flex:1;min-width:0}.tc-release-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.tc-release-title strong{font-size:13px}.tc-release-info p{font-size:11px;color:var(--tc-muted);margin:4px 0}.tc-release-info small{font-size:10px;color:#98a5b4}.tc-release-empty{padding:30px 12px;text-align:center;color:var(--tc-muted);font-size:12px}.tc-spacing-top{margin:6px 0 0}.tc-state-page{display:flex;justify-content:center;align-items:center;flex-direction:column;gap:10px;min-height:400px;color:var(--tc-muted)}.tc-state-page h3{font-size:18px;color:var(--tc-ink);margin:0}.tc-state-page p{margin:0 0 9px;font-size:11px}.tc-empty-card{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;gap:9px;grid-column:1/-1}.tc-empty-card p{font-size:11px;color:var(--tc-muted);margin:0 0 5px}.tc-empty-icon{font-size:40px;color:#a6b3c3}.tc-overlay{position:fixed;z-index:99999;inset:0;background:rgba(16,28,45,.5);display:flex;justify-content:center;align-items:center;padding:20px}.tc-modal{width:min(100%,560px);max-height:92vh;overflow-y:auto;background:white;border-radius:12px;box-shadow:0 14px 45px #0002}.tc-modal-head{padding:20px 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #edf0f4}.tc-modal-head h3{margin:6px 0 0;font-size:19px}.tc-modal-body{padding:22px;display:flex;flex-direction:column;gap:15px}.tc-modal-footer{border-top:1px solid #edf0f4;display:flex;justify-content:flex-end;gap:9px;padding:16px 22px}.tc-check{display:flex;align-items:flex-start;gap:9px;font-size:11px;color:#51627e}.tc-check input{accent-color:var(--tc-accent);margin:2px}.tc-preview-box{background:#f7f9fc;border:1px solid #e7ebf1;border-radius:8px;padding:13px}.tc-preview-box strong{font-size:12px}.tc-preview-box p{font-size:11px;color:var(--tc-muted);margin:3px 0}.tc-modal-error{border:1px solid #f0c4ce;background:#fff3f4;color:#ae2432;border-radius:7px;padding:10px;font-size:11px}.tc-visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@media(max-width:1000px){.tc-shell{grid-template-columns:215px minmax(0,1fr)}.tc-engine-grid{grid-template-columns:1fr}.tc-profile-grid{grid-template-columns:1fr}.tc-header{align-items:flex-start;flex-direction:column}}@media(max-width:700px){.tc-shell{display:block;margin:10px 8px}.tc-sidebar{border-right:0;border-bottom:1px solid var(--tc-line)}.tc-side-list{max-height:180px}.tc-header{padding:18px 14px}.tc-view{padding:16px 12px}.tc-overview-counters{gap:6px}.tc-overview-counters>div{padding:10px}.tc-card-grid,.tc-form-grid,.tc-handoff-grid{grid-template-columns:1fr}.tc-market-heading,.tc-view-heading{flex-direction:column;align-items:flex-start}.tc-head-actions{width:100%}.tc-head-actions .tc-btn{flex:1}.tc-full{grid-column:auto}.tc-banner{margin:9px 8px 0}.tc-release-row{flex-wrap:wrap}.tc-modal{max-height:85vh}}
</style>
