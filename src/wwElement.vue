<template>
  <div class="tc" :style="{'--tc-accent':content?.accentColor||'#c4262e'}" @keydown.esc="closeModal">
    <header class="tc-header">
      <div>
        <div class="tc-eyebrow">NVENT <span>/</span> EU CRA HUB <span>/</span> TEMPLATE MANAGER <span>/</span> TOOLS CATALOGUE</div>
        <div class="tc-title-line"><h1>Reusable Tools</h1><span class="tc-title-chip">PAGE 03</span></div>
        <p>Design reusable assessments once. Release controlled versions for the Template Builder.</p>
      </div>
      <div class="tc-header-actions">
        <button class="tc-btn tc-ghost" @click="openConnection">⚙ Connection</button>
        <button class="tc-btn tc-ghost" :disabled="loading||saving" @click="refresh">↻ Refresh</button>
        <button class="tc-btn tc-primary" :disabled="!canWrite||loading" @click="openNewTool">+ New Tool</button>
      </div>
    </header>

    <div v-if="!connected" class="tc-notice info"><strong>Connect to Supabase.</strong> Set the Project URL and <code>sb_publishable_…</code> key in WeWeb properties or open Connection. <button @click="openConnection">Configure</button></div>
    <div v-else-if="!writeEnabled" class="tc-notice info"><strong>Read-only mode.</strong> Enable development writes in component properties to create or edit tools.</div>
    <div v-else class="tc-notice caution"><strong>Development mode.</strong> Anonymous browser writes must only be enabled in an isolated development project; do not expose this deployment publicly.</div>
    <div v-if="error" class="tc-notice error" role="alert"><strong>Supabase error:</strong> {{error}} <button @click="error=''">Dismiss</button></div>
    <div v-if="notice" class="tc-notice success" role="status">{{notice}} <button @click="notice=''">Dismiss</button></div>

    <div v-if="loading" class="tc-loading">Loading live tool catalogue from Supabase…</div>
    <div v-else class="tc-layout">
      <aside class="tc-sidebar">
        <div class="tc-sidebar-head"><div><strong>TOOLS CATALOGUE</strong><span>{{cat.tools.length}} registered</span></div><button class="tc-plus" :disabled="!canWrite" title="Create tool" aria-label="Create new tool" @click="openNewTool">+</button></div>
        <input v-model="search" class="tc-search" type="search" placeholder="Search tools by name or code…" aria-label="Search tools" />
        <div class="tc-filter-row"><select v-model="filter" aria-label="Tool filter"><option value="all">All tools</option><option value="active">Active tools</option><option value="draft">Editable drafts</option><option value="released">With releases</option><option value="inactive">Inactive tools</option></select></div>
        <div class="tc-tool-list">
          <button v-for="t in filteredTools" :key="t.id" :class="['tc-tool-card',{selected:Number(t.id)===Number(selectedToolId)}]" @click="chooseTool(t.id)">
            <div class="tc-card-top"><strong>{{t.tool_name}}</strong><span :class="['tc-dot',{inactive:t.is_active===false}]"></span></div>
            <span class="tc-code">{{t.tool_code}}</span>
            <div class="tc-card-bottom"><span>{{releaseCount(t.id)}} releases</span><span>{{draftFor(t.id)?.is_locked===false?'Draft':releaseCount(t.id)?'Released':'No draft'}}</span></div>
          </button>
          <div v-if="!filteredTools.length" class="tc-blank">No matching tools. <span v-if="!cat.tools.length">Create your first questionnaire using + New Tool.</span></div>
        </div>
        <div class="tc-sidebar-footer"><span>Active releases are selectable in Template Builder.</span></div>
      </aside>

      <main class="tc-main">
        <template v-if="selectedTool">
          <div class="tc-context">
            <div class="tc-tool-heading"><div class="tc-kicker">{{selectedTool.tool_code}} · {{selectedTool.tool_type}}</div><h2>{{selectedTool.tool_name}}</h2><p>{{selectedTool.description||'No tool description provided.'}}</p></div>
            <div class="tc-heading-actions"><span :class="['tc-state',selectedTool.is_active===false?'inactive':currentDraft&&!currentDraft.is_locked?'draft':'released']">{{selectedTool.is_active===false?'Inactive':currentDraft&&!currentDraft.is_locked?'Draft editable':releaseCount(selectedTool.id)?'Released':'No editable draft'}}</span><button class="tc-btn tc-outline" :disabled="!canWrite||saving" @click="toggleTool">{{selectedTool.is_active===false?'Activate tool':'Deactivate tool'}}</button></div>
          </div>
          <div class="tc-workspace-bar"><div class="tc-workspace-summary"><span>Version <b>{{currentDraft?.draft_version||'—'}}</b></span><span>Sections <b>{{sectionCount}}</b></span><span>Questions <b>{{questionCount}}</b></span></div><div :class="['tc-save-status',saveState]" role="status">{{saveLabel}}</div></div>
          <nav class="tc-tabs" role="tablist" aria-label="Tools catalogue views">
            <button v-for="(tab,i) in tabs" :key="tab.id" role="tab" :aria-selected="activeTab===tab.id" :class="{active:activeTab===tab.id}" @click="activeTab=tab.id"><span>{{i+1}}</span> {{tab.label}}</button>
          </nav>

          <!-- 1 - Catalogue information -->
          <section v-if="activeTab==='catalogue'" class="tc-panel" aria-label="Tool Catalogue">
            <div class="tc-panel-heading"><div class="tc-kicker">01 / CATALOGUE</div><h3>Tool identity and lifecycle</h3><p>Registration is completed by + New Tool. Drafts are saved automatically.</p></div>
            <div class="tc-two-col"><div class="tc-card"><h4>Registered tool</h4><div class="tc-details"><div><span>Tool code</span><strong>{{selectedTool.tool_code}}</strong></div><div><span>Tool type</span><strong>{{selectedTool.tool_type}}</strong></div><div><span>Created</span><strong>{{formatDate(selectedTool.created_at)}}</strong></div><div><span>Last updated</span><strong>{{formatDate(selectedTool.updated_at)}}</strong></div></div><p class="tc-help">Tool code is a stable identifier. V1 supports the questionnaire tool type; other types require an editor and execution implementation.</p></div>
              <div class="tc-card"><h4>Availability</h4><div class="tc-mini-stats"><div><b>{{releaseCount(selectedTool.id)}}</b><span>Immutable releases</span></div><div><b>{{activeReleaseCount}}</b><span>Available versions</span></div><div><b>{{currentDraft&&!currentDraft.is_locked?'Yes':'No'}}</b><span>Editable draft</span></div></div><button class="tc-btn tc-outline" @click="activeTab='releases'">Manage releases →</button></div></div>
            <div class="tc-card tc-margin-top"><h4>What happens when you release?</h4><div class="tc-steps"><div><span>01</span><strong>Design</strong><small>Configure sections and questions in an automatically saved draft</small></div><div><span>02</span><strong>Validate</strong><small>Check question codes, available types and answer options</small></div><div><span>03</span><strong>Release</strong><small>Create an immutable tool definition stored in Supabase</small></div><div><span>04</span><strong>Reuse</strong><small>Select active releases in Template Builder</small></div></div></div>
          </section>

          <!-- 2 - Designer -->
          <section v-else-if="activeTab==='designer'" class="tc-panel" aria-label="Tool Designer">
            <div class="tc-panel-heading tc-flex-heading"><div><div class="tc-kicker">02 / TOOL DESIGNER</div><h3>Sections, questions and answer options</h3><p>Changes auto-save to the draft using revision checks. No separate Register or Save Tool button.</p></div><button class="tc-btn tc-primary" :disabled="!editable" @click="addSection">+ Section</button></div>
            <div v-if="!currentDraft||currentDraft.is_locked" class="tc-empty-state"><h4>This version is locked or has no editable draft</h4><p>Published releases cannot be edited. Create a new version to start from the previous definition.</p><button class="tc-btn tc-primary" :disabled="!canWrite" @click="openVersion">Create New Version</button></div>
            <template v-else>
              <div class="tc-card tc-settings"><div class="tc-settings-head"><h4>Tool metadata</h4><span>Auto-save</span></div><div class="tc-form-grid"><label>Tool name<input v-model="meta.name" :disabled="!editable" maxlength="180" /></label><label>Draft version<input v-model="meta.version" :disabled="!editable" placeholder="1.0.0" /></label><label class="wide">Description<textarea v-model="meta.description" :disabled="!editable" rows="2" /></label></div></div>
              <div class="tc-designer-layout">
                <aside class="tc-sections"><div class="tc-list-header"><strong>SECTIONS</strong><span>{{sectionCount}}</span></div><button v-for="(s,i) in sortedSections" :key="s.client_id" :class="['tc-section-button',{active:selectedSectionId===s.client_id}]" @click="selectSection(s.client_id)"><b>{{String(i+1).padStart(2,'0')}}</b><span>{{s.section_name||'Untitled section'}}<small>{{s.questions?.length||0}} questions</small></span></button><div v-if="!sectionCount" class="tc-small-empty">No sections yet.</div><button class="tc-add-inline" :disabled="!editable" @click="addSection">+ Add section</button></aside>
                <div class="tc-edit-area" v-if="selectedSection">
                  <div class="tc-card tc-section-editor"><div class="tc-card-head"><h4>Section details</h4><div class="tc-mini-actions"><button :disabled="!editable||sectionIndex<1" title="Move section up" @click="moveSection(-1)">↑</button><button :disabled="!editable||sectionIndex>=sectionCount-1" title="Move section down" @click="moveSection(1)">↓</button><button class="danger" :disabled="!editable" @click="removeSection">Delete</button></div></div><div class="tc-form-grid"><label>Section name<input v-model="selectedSection.section_name" :disabled="!editable" /></label><label class="tc-toggle"><input v-model="selectedSection.is_enabled" type="checkbox" :disabled="!editable" /> Enabled</label><label class="wide">Description<textarea v-model="selectedSection.description" rows="2" :disabled="!editable" /></label></div></div>
                  <div class="tc-card tc-questions-card"><div class="tc-card-head"><h4>Questions</h4><button class="tc-btn tc-small tc-primary" :disabled="!editable||!availableTypes.length" @click="addQuestion">+ Question</button></div><div class="tc-question-list"><button v-for="(q,i) in sortedQuestions" :key="q.client_id" :class="['tc-question-item',{active:selectedQuestionId===q.client_id}]" @click="selectedQuestionId=q.client_id"><strong>{{q.question_code||`Q ${i+1}`}}</strong><span>{{q.question_text||'Untitled question'}}</span><small>{{typeName(q.question_type)}}</small></button><div v-if="!sortedQuestions.length" class="tc-small-empty">Add a question to this section.</div></div></div>
                  <div v-if="selectedQuestion" class="tc-card tc-question-editor"><div class="tc-card-head"><h4>Edit question</h4><div class="tc-mini-actions"><button :disabled="!editable||questionIndex<1" @click="moveQuestion(-1)" title="Move up">↑</button><button :disabled="!editable||questionIndex>=sortedQuestions.length-1" @click="moveQuestion(1)" title="Move down">↓</button><button class="danger" :disabled="!editable" @click="removeQuestion">Delete</button></div></div>
                    <div class="tc-form-grid"><label>Question code<input v-model="selectedQuestion.question_code" :disabled="!editable" placeholder="Q_1" /></label><label>Question type<select v-model="selectedQuestion.question_type" :disabled="!editable"><option value="">Select type</option><option v-for="qt in availableTypes" :key="qt.type_code" :value="qt.type_code">{{qt.type_name}}</option></select></label><label class="wide">Question text<textarea v-model="selectedQuestion.question_text" rows="2" :disabled="!editable" /></label><label>Friendly name<input v-model="selectedQuestion.friendly_name" :disabled="!editable" /></label><label>Question hint<input v-model="selectedQuestion.question_hint" :disabled="!editable" /></label><label class="wide">Description / acceptable evidence<textarea v-model="selectedQuestion.description" rows="3" :disabled="!editable" /></label></div>
                    <div class="tc-check-row"><label><input type="checkbox" v-model="selectedQuestion.is_required" :disabled="!editable"/> Required</label><label><input type="checkbox" v-model="selectedQuestion.is_enabled" :disabled="!editable"/> Enabled</label><label><input type="checkbox" v-model="selectedQuestion.allows_comment" :disabled="!editable"/> Allow comment</label><label><input type="checkbox" v-model="selectedQuestion.allows_attachment" :disabled="!editable"/> Allow attachment</label></div>
                    <div v-if="selectedType?.supports_options===true||(selectedQuestion.options?.length||0)>0" class="tc-option-area"><div class="tc-card-head"><h4>Answer options</h4><button class="tc-btn tc-small tc-outline" :disabled="!editable||selectedType?.supports_options!==true" @click="addOption">+ Add option</button></div><div v-for="(o,i) in selectedQuestion.options" :key="o.client_id" class="tc-option-row"><span class="tc-option-number">{{i+1}}</span><label>Value<input v-model="o.option_value" :disabled="!editable" /></label><label>Label<input v-model="o.option_label" :disabled="!editable" /></label><label>Hint<input v-model="o.option_hint" :disabled="!editable" /></label><label class="tc-compact-check"><input type="checkbox" v-model="o.is_default" :disabled="!editable" /> Default</label><label class="tc-compact-check"><input type="checkbox" v-model="o.is_enabled" :disabled="!editable" /> Enabled</label><button class="tc-icon-danger" :disabled="!editable" title="Remove option" @click="removeOption(o.client_id)">×</button></div><p v-if="!selectedQuestion.options.length" class="tc-help">Option-based questions require at least two enabled options. Non-option question types must have no answer options.</p></div>
                  </div>
                </div>
                <div v-else class="tc-card tc-empty-edit"><h4>Select or create a section</h4><p>Use the section list to begin building reusable questionnaire content.</p></div>
              </div>
            </template>
          </section>

          <!-- 3 - Preview and validation -->
          <section v-else-if="activeTab==='preview'" class="tc-panel" aria-label="Preview and Validation">
            <div class="tc-panel-heading tc-flex-heading"><div><div class="tc-kicker">03 / PREVIEW & VALIDATION</div><h3>Test the reusable tool</h3><p>Local simulation only — no assessment submissions, uploads or review verdicts are persisted.</p></div><button class="tc-btn tc-primary" @click="runValidation">Validate tool</button></div>
            <div v-if="previewReleaseDef" class="tc-notice info">Viewing a released version. The editable draft has not been changed. <button @click="previewReleaseDef=null">Return to draft preview</button></div><div class="tc-validation-summary" :class="previewValidation.valid?'valid':'invalid'"><strong>{{previewValidation.valid?'Ready for release checks':'Not ready for release'}}</strong><span>{{previewValidation.sectionCount}} sections · {{previewValidation.questionCount}} questions · {{previewValidation.errors.length}} errors · {{previewValidation.warnings.length}} warnings</span></div>
            <div v-if="previewValidation.errors.length||previewValidation.warnings.length" class="tc-card tc-validation-list"><div v-for="(e,i) in previewValidation.errors" :key="'e'+i" class="tc-check-message fail">✕ {{e}}</div><div v-for="(w,i) in previewValidation.warnings" :key="'w'+i" class="tc-check-message warn">! {{w}}</div></div>
            <div v-for="s in previewSections.filter(x=>x.is_enabled!==false)" :key="s.client_id" class="tc-preview-section"><h4>{{s.section_name}}</h4><p v-if="s.description">{{s.description}}</p><div v-for="q in ordered(s.questions).filter(x=>x.is_enabled!==false)" :key="q.client_id" class="tc-preview-question"><div class="tc-preview-q-head"><strong>{{q.question_code}} · {{q.question_text}}</strong><small v-if="q.is_required">Required</small></div><p v-if="q.description">{{q.description}}</p><div class="tc-preview-answer" v-if="qType(cat.types,q.question_type)?.supports_options===true"><label v-for="o in ordered(q.options).filter(x=>x.is_enabled!==false)" :key="o.client_id"><input v-if="qType(cat.types,q.question_type)?.supports_multiple_values===true" type="checkbox" :checked="Array.isArray(previewAnswers[q.client_id])&&previewAnswers[q.client_id].includes(o.option_value)" @change="togglePreviewOption(q.client_id,o.option_value,$event.target.checked)"/><input v-else type="radio" :name="`preview-${q.client_id}`" :value="o.option_value" v-model="previewAnswers[q.client_id]"/>{{o.option_label}}</label></div><div v-else class="tc-preview-answer"><input v-if="/NUMBER|NUMERIC|INTEGER|DECIMAL/i.test(q.question_type)" type="number" v-model="previewAnswers[q.client_id]" placeholder="Enter a number"/><input v-else-if="/DATE/i.test(q.question_type)" type="date" v-model="previewAnswers[q.client_id]"/><textarea v-else v-model="previewAnswers[q.client_id]" rows="2" placeholder="Enter a response…"/></div><small v-if="q.question_hint" class="tc-hint">{{q.question_hint}}</small><div v-if="q.allows_comment" class="tc-extra-input"><label>Comment (simulation)<textarea v-model="previewComments[q.client_id]" rows="2"/></label></div><div v-if="q.allows_attachment" class="tc-hint">Attachments allowed in the actual assessment; upload is not performed in this preview.</div></div></div>
            <div v-if="!previewSections.length" class="tc-empty-state"><h4>Nothing to preview yet</h4><p>Open the designer and add your first section and question.</p></div>
          </section>

          <!-- 4 - Releases -->
          <section v-else-if="activeTab==='releases'" class="tc-panel" aria-label="Release Management">
            <div class="tc-panel-heading tc-flex-heading"><div><div class="tc-kicker">04 / RELEASE MANAGEMENT</div><h3>Controlled tool versions</h3><p>Published definitions are immutable. Only active tool releases appear in Template Builder.</p></div><button class="tc-btn tc-primary" :disabled="!canWrite||!!currentDraft&&!currentDraft.is_locked" @click="openVersion">+ Create New Version</button></div>
            <div v-if="currentDraft&&!currentDraft.is_locked" class="tc-card tc-draft-banner"><div><strong>Draft v{{currentDraft.draft_version}}</strong><p>Revision {{currentDraft.revision}} · {{validation.errors.length?`${validation.errors.length} validation issues`:'Ready for validation'}}</p></div><button class="tc-btn tc-primary" :disabled="!editable||!validation.valid||saving||dirty" @click="openRelease">Release Tool</button></div>
            <div class="tc-card"><h4>Released versions</h4><div v-for="r in releasesFor(selectedTool.id)" :key="r.id" class="tc-release-row"><div><div class="tc-release-title"><strong>v{{r.release_version}}</strong><span :class="['tc-state',r.is_active!==false?'released':'inactive']">{{r.is_active!==false?'Active':'Inactive'}}</span></div><small>Release #{{r.id}} · {{formatDate(r.created_at)}}</small><p>{{r.release_notes||'No release notes provided.'}}</p></div><div class="tc-release-buttons"><button class="tc-btn tc-outline tc-small" @click="previewRelease(r)">Preview</button><button class="tc-btn tc-outline tc-small" :disabled="!canWrite||busy" @click="toggleRelease(r)">{{r.is_active!==false?'Deactivate':'Activate'}}</button></div></div><div v-if="!releasesFor(selectedTool.id).length" class="tc-small-empty">No releases yet. Validate and release the draft to make this tool available in Template Builder.</div></div>
            <div class="tc-card tc-margin-top"><h4>Versioning rule</h4><p class="tc-help">Published releases never change their <code>definition</code>. New questions or revised answer options must be saved in a new version. Previously attached templates keep their original release references.</p></div>
          </section>
        </template>
        <div v-else class="tc-empty-state tc-main-empty"><div class="tc-empty-icon">▦</div><h3>{{cat.tools.length?'Select a tool from the catalogue':'Create your first reusable tool'}}</h3><p>Tool definitions and releases are loaded directly from your Supabase project. Registration happens automatically when you create a tool.</p><button class="tc-btn tc-primary" :disabled="!canWrite" @click="openNewTool">+ New Tool</button></div>
      </main>
    </div>

    <!-- One shared modal framework -->
    <div v-if="modal" class="tc-overlay" @click.self="closeModal"><form class="tc-dialog" role="dialog" aria-modal="true" :aria-label="modalTitle" @submit.prevent="submitModal"><div class="tc-dialog-head"><div class="tc-kicker">TOOLS CATALOGUE</div><h3>{{modalTitle}}</h3><button type="button" @click="closeModal" aria-label="Close dialog">✕</button></div><div class="tc-dialog-body">
      <template v-if="modal==='connection'"><p class="tc-help">Temporary connection values for this session. Set permanent values in the WeWeb component properties.</p><label>Supabase Project URL<input type="url" v-model="form.url" placeholder="https://your-project.supabase.co" required autocomplete="off"/></label><label>Publishable key<input type="password" v-model="form.key" placeholder="sb_publishable_…" required autocomplete="off"/></label><label class="tc-dialog-check"><input type="checkbox" v-model="form.writes" /> Enable development writes (unsafe without Auth/RLS)</label></template>
      <template v-else-if="modal==='new'"><label>Tool name<input v-model.trim="form.name" required maxlength="180" placeholder="Product Security Assessment"/></label><label>Tool code<input v-model.trim="form.code" required maxlength="80" placeholder="PRODUCT_SECURITY_ASSESSMENT"/></label><label>Tool type<select disabled><option>QUESTIONNAIRE</option></select></label><label>Description<textarea v-model="form.description" rows="3"/></label><p class="tc-help">Creates one catalogue record and an editable v1.0.0 draft in a single Supabase transaction.</p></template>
      <template v-else-if="modal==='version'"><label>Next draft version<input v-model.trim="form.version" required placeholder="1.1.0" pattern="[0-9]+\.[0-9]+\.[0-9]+"/></label><p class="tc-help">Copies the previous saved definition into a new editable draft. Existing releases remain immutable.</p></template>
      <template v-else-if="modal==='release'"><div class="tc-validation-summary valid"><strong>Definition passes local validation</strong><span>{{validation.questionCount}} questions in {{validation.sectionCount}} sections</span></div><label>Release notes<textarea v-model="form.notes" rows="4" placeholder="Describe changes in this version…"/></label><label class="tc-dialog-check"><input type="checkbox" v-model="form.confirm" required/> I confirm that this version is ready for Template Builder.</label></template>
      <div v-if="modalError" class="tc-form-error" role="alert">{{modalError}}</div>
      </div><div class="tc-dialog-footer"><button type="button" class="tc-btn tc-ghost" @click="closeModal" :disabled="busy">Cancel</button><button type="submit" class="tc-btn tc-primary" :disabled="busy||(modal==='release'&&!form.confirm)">{{busy?'Working…':modal==='new'?'Create Tool':modal==='version'?'Create Version':modal==='release'?'Release Tool':'Connect'}}</button></div></form></div>
  </div>
</template>

<script setup>
import {ref,reactive,computed,watch,onMounted,onBeforeUnmount,nextTick} from 'vue';
import {createApi,projectUrl,publicKey,positiveId,unwrap} from './api.mjs';
import {emptyDefinition,token,clone,itemId,newSection,newQuestion,newOption,ordered,qType,normalizedDefinition,validateDefinition,nextVersion} from './logic.mjs';
const props=defineProps({content:{type:Object,default:()=>({})}});
const emit=defineEmits(['trigger-event']);
const content=computed(()=>props.content??{});
const trigger=(name,event={})=>emit('trigger-event',{name,event});
const override=ref(null);
const url=computed(()=>override.value?.url??content.value?.supabaseUrl??'');
const key=computed(()=>override.value?.key??content.value?.publishableKey??'');
const writeEnabled=computed(()=>override.value?.writes??(content.value?.enableMutations===true));
const canWrite=computed(()=>connected.value&&writeEnabled.value);
const api=computed(()=>{try{return createApi({url:url.value,key:key.value});}catch{return null;}});
const connected=computed(()=>!!api.value);
const cat=ref({tools:[],releases:[],drafts:[],types:[]});
const selectedToolId=ref(Number(content.value?.initialToolId||0));
const selectedTool=computed(()=>cat.value.tools.find(x=>Number(x.id)===Number(selectedToolId.value))||null);
const currentDraft=computed(()=>cat.value.drafts.find(x=>Number(x.tool_id)===Number(selectedToolId.value))||null);
const editable=computed(()=>canWrite.value&&!!currentDraft.value&&!currentDraft.value.is_locked&&selectedTool.value?.tool_type==='QUESTIONNAIRE');
const activeTab=ref('catalogue');
const tabs=[{id:'catalogue',label:'Tool Catalogue'},{id:'designer',label:'Tool Designer'},{id:'preview',label:'Preview & Validation'},{id:'releases',label:'Release Management'}];
const loading=ref(false),busy=ref(false),saving=ref(false),error=ref(''),notice=ref('');
const search=ref(''),filter=ref('all');
const working=ref(emptyDefinition());
const previewReleaseDef=ref(null);
const meta=reactive({name:'',description:'',version:'1.0.0'});
const dirty=ref(false),saveState=ref('idle'),serverRevision=ref(0);
const selectedSectionId=ref(''),selectedQuestionId=ref('');
const previewAnswers=reactive({}),previewComments=reactive({});
const modal=ref(''),modalError=ref(''),form=ref({});
const modalTitle=computed(()=>({connection:'Supabase connection',new:'Create reusable tool',version:'Create next draft version',release:'Confirm tool release'})[modal.value]||'Tool');
let saveTimer=null,hydrating=false,savePromise=null;
const availableTypes=computed(()=>cat.value.types.filter(t=>t.is_active!==false).sort((a,b)=>Number(a.display_order||0)-Number(b.display_order||0)));
const filteredTools=computed(()=>cat.value.tools.filter(t=>{
 const q=search.value.trim().toLowerCase();if(q&&!`${t.tool_name} ${t.tool_code} ${t.description||''}`.toLowerCase().includes(q))return false;
 if(filter.value==='active'&&t.is_active===false)return false;
 if(filter.value==='inactive'&&t.is_active!==false)return false;
 if(filter.value==='draft'&&draftFor(t.id)?.is_locked!==false)return false;
 if(filter.value==='released'&&!releaseCount(t.id))return false;
 return true;
}).sort((a,b)=>String(a.tool_name).localeCompare(String(b.tool_name))));
const sortedSections=computed(()=>ordered(working.value?.sections));
const sectionCount=computed(()=>sortedSections.value.length);
const questionCount=computed(()=>sortedSections.value.reduce((n,s)=>n+(Array.isArray(s.questions)?s.questions.length:0),0));
const selectedSection=computed(()=>working.value.sections?.find(s=>s.client_id===selectedSectionId.value)||null);
const sortedQuestions=computed(()=>ordered(selectedSection.value?.questions));
const selectedQuestion=computed(()=>selectedSection.value?.questions?.find(q=>q.client_id===selectedQuestionId.value)||null);
const selectedType=computed(()=>qType(cat.value.types,selectedQuestion.value?.question_type));
const sectionIndex=computed(()=>sortedSections.value.findIndex(s=>s.client_id===selectedSectionId.value));
const questionIndex=computed(()=>sortedQuestions.value.findIndex(q=>q.client_id===selectedQuestionId.value));
const validation=computed(()=>validateDefinition(normalizedDefinition(working.value),cat.value.types));
const previewSections=computed(()=>ordered(previewReleaseDef.value?.sections??working.value?.sections));
const previewValidation=computed(()=>validateDefinition(normalizedDefinition(previewReleaseDef.value??working.value),cat.value.types));
const activeReleaseCount=computed(()=>releasesFor(selectedToolId.value).filter(r=>r.is_active!==false).length);
const saveLabel=computed(()=>saveState.value==='saving'?'Saving draft…':saveState.value==='unsaved'?'Unsaved changes':saveState.value==='error'?'Save failed · retry after correction':currentDraft.value?.is_locked?'Released · locked':currentDraft.value?'All changes saved':'No editable draft');
function draftFor(id){return cat.value.drafts.find(x=>Number(x.tool_id)===Number(id))||null;}
function releasesFor(id){return cat.value.releases.filter(x=>Number(x.tool_id)===Number(id)).sort((a,b)=>Number(b.id)-Number(a.id));}
function releaseCount(id){return releasesFor(id).length;}
function formatDate(d){return d?new Date(d).toLocaleString():'—';}
function typeName(code){return qType(cat.value.types,code)?.type_name||code||'Choose type';}
async function hydrate(toolId){
 hydrating=true;
 const d=draftFor(toolId),tool=cat.value.tools.find(t=>Number(t.id)===Number(toolId));
 working.value=d?.definition?.schema_version===1?normalizedDefinition(clone(d.definition)):emptyDefinition();
 previewReleaseDef.value=null;
 meta.name=tool?.tool_name||'';meta.description=tool?.description||'';meta.version=d?.draft_version||'1.0.0';
 serverRevision.value=Number(d?.revision||0);dirty.value=false;saveState.value=d?.is_locked?'locked':'saved';
 selectedSectionId.value=working.value.sections?.[0]?.client_id||'';
 selectedQuestionId.value=working.value.sections?.[0]?.questions?.[0]?.client_id||'';
 for(const k of Object.keys(previewAnswers))delete previewAnswers[k];for(const k of Object.keys(previewComments))delete previewComments[k];
 await nextTick();hydrating=false;
}
async function loadAll(preferId=null){
 if(!api.value){cat.value={tools:[],releases:[],drafts:[],types:[]};return;}
 loading.value=true;error.value='';
 try{
  const next=await api.value.catalogue();cat.value=next;
  const chosen=preferId??(next.tools.some(t=>Number(t.id)===Number(selectedToolId.value))?selectedToolId.value:Number(content.value?.initialToolId||0));
  selectedToolId.value=next.tools.some(t=>Number(t.id)===Number(chosen))?Number(chosen):Number(next.tools[0]?.id||0);
  await hydrate(selectedToolId.value);
 }catch(e){error.value=e.message||String(e);}finally{loading.value=false;}
}
async function refresh(){if(!await flushSave())return;await loadAll(selectedToolId.value);}
async function chooseTool(id){if(Number(id)===Number(selectedToolId.value))return;if(!await flushSave())return;selectedToolId.value=Number(id);await hydrate(id);activeTab.value='catalogue';trigger('tool-selected',{tool_id:Number(id)});}
watch([url,key],()=>{if(connected.value)loadAll();},{flush:'post'});
onMounted(()=>{if(connected.value)loadAll();});
onBeforeUnmount(()=>{if(saveTimer)clearTimeout(saveTimer);});
watch([working,meta],()=>{if(hydrating||!editable.value)return;dirty.value=true;saveState.value='unsaved';scheduleSave();},{deep:true});
function scheduleSave(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=null;flushSave();},950);}
async function flushSave(){
 if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}
 if(savePromise){await savePromise.catch(()=>{});if(!dirty.value)return saveState.value!=='error';}
 if(!dirty.value||!editable.value)return true;
 const toolId=Number(selectedToolId.value),snapshot=normalizedDefinition(working.value),snapshotMeta={name:meta.name,description:meta.description,version:meta.version};
 const signature=JSON.stringify({snapshot,snapshotMeta});
 saveState.value='saving';saving.value=true;
 const task=(async()=>{
  const result=unwrap(await api.value.rpc('cra_tm_save_catalogue_tool_draft',{p_tool_id:positiveId(toolId),p_expected_revision:serverRevision.value,p_definition:snapshot,p_draft_version:snapshotMeta.version,p_tool_name:snapshotMeta.name,p_description:snapshotMeta.description||null}));
  if(!result?.revision)throw new Error('Draft save did not return a revision.');
  serverRevision.value=Number(result.revision);
  const d=draftFor(toolId);if(d){d.revision=serverRevision.value;d.draft_version=snapshotMeta.version;d.definition=snapshot;d.updated_at=result.updated_at;}
  const t=cat.value.tools.find(x=>Number(x.id)===toolId);if(t){t.tool_name=snapshotMeta.name;t.description=snapshotMeta.description;}
  const currentSignature=JSON.stringify({snapshot:normalizedDefinition(working.value),snapshotMeta:{name:meta.name,description:meta.description,version:meta.version}});
  dirty.value=currentSignature!==signature;
  saveState.value=dirty.value?'unsaved':'saved';
  if(!dirty.value)trigger('draft-saved',{tool_id:toolId,revision:serverRevision.value});
 })();
 savePromise=task;
 try{await task;}catch(e){error.value=e.message||String(e);saveState.value='error';dirty.value=true;return false;}
 finally{if(savePromise===task)savePromise=null;saving.value=false;}
 if(dirty.value){scheduleSave();return await flushSave();}
 return true;
}
function selectSection(id){selectedSectionId.value=id;selectedQuestionId.value=selectedSection.value?.questions?.[0]?.client_id||'';}
function addSection(){if(!editable.value)return;const section=newSection(sectionCount.value);working.value.sections.push(section);selectSection(section.client_id);activeTab.value='designer';}
function addQuestion(){if(!editable.value||!selectedSection.value)return;const s=selectedSection.value;const count=s.questions?.length||0;
 const q=newQuestion(`Q_${count+1}`,availableTypes.value[0]?.type_code||'',count);s.questions.push(q);selectedQuestionId.value=q.client_id;}
function addOption(){if(!editable.value||!selectedQuestion.value)return;const q=selectedQuestion.value;const n=q.options.length+1;q.options.push(newOption(`OPTION_${n}`,n-1));}
function removeOption(id){if(!editable.value||!selectedQuestion.value)return;if(!window.confirm('Remove this answer option from the draft?'))return;selectedQuestion.value.options=selectedQuestion.value.options.filter(o=>o.client_id!==id);}
function removeQuestion(){if(!editable.value||!selectedSection.value)return;if(!window.confirm('Remove this question and all its answer options?'))return;selectedSection.value.questions=selectedSection.value.questions.filter(q=>q.client_id!==selectedQuestionId.value);selectedQuestionId.value=sortedQuestions.value[0]?.client_id||'';}
function removeSection(){if(!editable.value)return;if(!window.confirm('Remove this section and all its questions?'))return;working.value.sections=working.value.sections.filter(s=>s.client_id!==selectedSectionId.value);selectedSectionId.value=sortedSections.value[0]?.client_id||'';selectedQuestionId.value=selectedSection.value?.questions?.[0]?.client_id||'';}
function moveItem(list,selectedId,step){const orderedList=ordered(list);const i=orderedList.findIndex(x=>x.client_id===selectedId);if(i<0||i+step<0||i+step>=orderedList.length)return;[orderedList[i],orderedList[i+step]]=[orderedList[i+step],orderedList[i]];orderedList.forEach((x,j)=>{x.display_order=j;});}
function moveSection(step){moveItem(working.value.sections,selectedSectionId.value,step);}
function moveQuestion(step){if(selectedSection.value)moveItem(selectedSection.value.questions,selectedQuestionId.value,step);}
function togglePreviewOption(qid,value,checked){const a=Array.isArray(previewAnswers[qid])?[...previewAnswers[qid]]:[];previewAnswers[qid]=checked?[...new Set([...a,value])]:a.filter(x=>x!==value);}
function runValidation(){previewReleaseDef.value=null;activeTab.value='preview';notice.value=validation.value.valid?'Local validation passed. You may release when the latest draft save is complete.':`Validation found ${validation.value.errors.length} issue(s).`;}
function openConnection(){modal.value='connection';form.value={url:url.value,key:key.value,writes:writeEnabled.value};modalError.value='';}
function openNewTool(){if(!canWrite.value)return;modal.value='new';form.value={name:'',code:'',description:''};modalError.value='';}
function openVersion(){if(!canWrite.value||!selectedTool.value)return;const r=releasesFor(selectedToolId.value)[0];modal.value='version';form.value={version:nextVersion(currentDraft.value?.draft_version||r?.release_version)};modalError.value='';}
function openRelease(){if(!editable.value||!validation.value.valid||dirty.value||saving.value)return;modal.value='release';form.value={notes:'',confirm:false};modalError.value='';}
function closeModal(){if(!busy.value){modal.value='';modalError.value='';}}
async function submitModal(){
 modalError.value='';busy.value=true;
 try{
  if(modal.value==='connection'){projectUrl(form.value.url);publicKey(form.value.key);override.value={url:form.value.url,key:form.value.key,writes:form.value.writes===true};modal.value='';return;}
  if(!canWrite.value)throw new Error('Enable development writes to make changes.');
  if(modal.value==='new'){
   const out=unwrap(await api.value.rpc('cra_tm_create_catalogue_tool',{p_tool_code:token(form.value.code),p_tool_name:String(form.value.name).trim(),p_description:form.value.description||null}));
   if(!out?.tool_id)throw new Error('No tool ID returned.');modal.value='';await loadAll(out.tool_id);activeTab.value='designer';notice.value='Tool registered with editable v1.0.0 draft.';trigger('tool-created',{tool_id:out.tool_id});
  }else if(modal.value==='version'){
   const out=unwrap(await api.value.rpc('cra_tm_start_catalogue_tool_version',{p_tool_id:positiveId(selectedToolId.value),p_next_version:String(form.value.version).trim()}));
   if(!out?.draft_id)throw new Error('No draft ID returned.');modal.value='';await loadAll(selectedToolId.value);activeTab.value='designer';notice.value=`Editable v${form.value.version} created.`;
  }else if(modal.value==='release'){
   if(!form.value.confirm)throw new Error('Confirm the release.');if(!validation.value.valid)throw new Error('Resolve all validation errors before release.');
   if(!await flushSave())throw new Error('Save the draft successfully before release.');
   const out=unwrap(await api.value.rpc('cra_tm_release_catalogue_tool',{p_tool_id:positiveId(selectedToolId.value),p_expected_revision:serverRevision.value,p_release_notes:form.value.notes||null}));
   if(!out?.release_id)throw new Error('Release creation did not return an ID.');modal.value='';await loadAll(selectedToolId.value);activeTab.value='releases';notice.value=`Released version ${out.release_version}. It is now eligible for Template Builder.`;trigger('tool-released',{tool_id:Number(selectedToolId.value),release_id:out.release_id,release_version:out.release_version});
  }
 }catch(e){modalError.value=e.message||String(e);}finally{busy.value=false;}
}
async function toggleRelease(r){if(!canWrite.value)return;if(!window.confirm(`${r.is_active!==false?'Deactivate':'Activate'} release v${r.release_version}? Previously attached templates are not modified.`))return;busy.value=true;error.value='';try{await api.value.rpc('cra_tm_set_catalogue_release_active',{p_release_id:positiveId(r.id),p_is_active:r.is_active===false});await loadAll(selectedToolId.value);notice.value='Release availability updated.';}catch(e){error.value=e.message||String(e);}finally{busy.value=false;}}
async function toggleTool(){if(!canWrite.value)return;if(!window.confirm(`${selectedTool.value.is_active!==false?'Deactivate':'Activate'} tool ${selectedTool.value.tool_name}?`))return;busy.value=true;error.value='';try{await api.value.rpc('cra_tm_set_catalogue_tool_active',{p_tool_id:positiveId(selectedToolId.value),p_is_active:selectedTool.value.is_active===false});await loadAll(selectedToolId.value);notice.value='Tool availability updated.';}catch(e){error.value=e.message||String(e);}finally{busy.value=false;}}
function previewRelease(r){
 if(dirty.value){error.value='Save your current draft first before previewing a released version.';return;}
 if(r.definition?.schema_version!==1){error.value='This legacy release does not use the supported questionnaire definition schema.';return;}
 previewReleaseDef.value=normalizedDefinition(clone(r.definition));
 activeTab.value='preview';
 for(const k of Object.keys(previewAnswers))delete previewAnswers[k];
 for(const k of Object.keys(previewComments))delete previewComments[k];
 notice.value=`Previewing immutable release v${r.release_version}. The draft is unchanged.`;
}

</script>

<style scoped>
.tc{--tc-accent:#c4262e;--tc-border:#e2e7ee;--tc-text:#26384a;--tc-muted:#738297;--tc-bg:#f6f8fb;color:var(--tc-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;background:#f8fafc;padding:28px 31px 55px;min-height:700px;box-sizing:border-box}
.tc *{box-sizing:border-box}.tc button,.tc input,.tc textarea,.tc select{font:inherit}.tc button{cursor:pointer}.tc button:disabled{cursor:not-allowed;opacity:.42}.tc h1,.tc h2,.tc h3,.tc h4,.tc p{margin:0}.tc a{color:inherit}.tc h1{font-size:28px;letter-spacing:-.7px;line-height:1.22;font-weight:770}.tc h2{font-size:19px;letter-spacing:-.3px}.tc h3{font-size:18px;letter-spacing:-.2px}.tc h4{font-size:13px}.tc p{color:#748296}.tc label{display:flex;flex-direction:column;gap:6px;color:#53657a;font-size:11px;font-weight:650;min-width:0}.tc input:not([type=checkbox]):not([type=radio]),.tc select,.tc textarea{border:1px solid #dfe5ec;border-radius:7px;color:#304055;background:white;outline:none;min-width:0;padding:10px 11px;width:100%;font-weight:500;font-size:11px}.tc textarea{resize:vertical;min-height:57px}.tc :is(input,textarea,select):focus{border-color:#ce6269;box-shadow:0 0 0 2px #d5404830}.tc input[type=checkbox],.tc input[type=radio]{accent-color:var(--tc-accent);width:14px;height:14px}.tc-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:21px}.tc-eyebrow{font-size:9px;font-weight:780;letter-spacing:1.3px;color:#b1bac5;margin-bottom:9px}.tc-eyebrow span{color:var(--tc-accent);margin:0 6px}.tc-title-line{display:flex;align-items:center;gap:10px}.tc-title-chip{font-size:9px;color:#8e9bac;border:1px solid #e6eaf0;border-radius:5px;padding:4px 7px;background:white;font-weight:780}.tc-header p{font-size:11.5px;margin-top:7px;max-width:650px}.tc-header-actions{display:flex;gap:8px;flex-wrap:wrap}.tc-btn{border:1px solid transparent;border-radius:7px;padding:9px 13px;font-size:10.5px;font-weight:730;background:white;white-space:nowrap}.tc-btn.tc-primary{background:var(--tc-accent);color:white;border-color:var(--tc-accent)}.tc-btn.tc-outline{color:var(--tc-accent);border-color:#ebcdd0}.tc-btn.tc-ghost{background:white;color:#526477;border-color:#e2e7ed}.tc-btn.tc-small{padding:6px 9px;font-size:9.5px}.tc-notice{margin:0 0 13px;border:1px solid;border-radius:8px;padding:10px 13px;font-size:10.8px;display:flex;align-items:center;flex-wrap:wrap;gap:7px}.tc-notice button{margin-left:auto;border:0;background:none;color:inherit;text-decoration:underline;font-size:10px}.tc-notice.info{background:#eff5fa;border-color:#d5e4ef;color:#4e738e}.tc-notice.caution{background:#fff9ed;border-color:#f4e2b8;color:#906c36}.tc-notice.error{background:#fff0f1;border-color:#efced1;color:#b83b45}.tc-notice.success{background:#eff9f3;border-color:#cde6d4;color:#327b53}.tc-notice code{font-size:10px}.tc-layout{display:grid;grid-template-columns:250px minmax(0,1fr);align-items:start;gap:16px}.tc-sidebar{background:white;border:1px solid var(--tc-border);border-radius:12px;padding:15px;min-height:670px}.tc-sidebar-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.tc-sidebar-head strong{font-size:10px;letter-spacing:.6px;display:block}.tc-sidebar-head span{display:block;font-size:9px;color:#9ca8b6;margin-top:2px}.tc-plus{width:29px;height:29px;border:1px solid #f0d0d2;color:var(--tc-accent);font-size:19px;background:#fff8f8;border-radius:7px}.tc-search{margin-bottom:9px}.tc-filter-row select{padding:8px 10px;margin-bottom:13px;background:#f9fbfd}.tc-tool-list{display:flex;flex-direction:column;gap:8px;max-height:650px;overflow-y:auto}.tc-tool-card{padding:13px;text-align:left;border-radius:8px;border:1px solid #e7ebf0;background:#fff;width:100%;color:#3c4b5e}.tc-tool-card.selected{border-color:#e7b7ba;background:#fff8f8;box-shadow:inset 3px 0 var(--tc-accent)}.tc-card-top{display:flex;justify-content:space-between;align-items:start;gap:8px}.tc-card-top strong{font-size:11px}.tc-code{display:block;color:#9ca8b6;letter-spacing:.1px;margin-top:4px;font-size:9px}.tc-dot{background:#3ca677;border-radius:50%;width:7px;height:7px;flex:0 0 7px;margin-top:4px}.tc-dot.inactive{background:#b0b8c3}.tc-card-bottom{display:flex;justify-content:space-between;margin-top:12px;font-size:9px;color:#8d9aac}.tc-blank,.tc-small-empty{font-size:10px;color:#929eac;padding:19px 8px;line-height:1.65}.tc-sidebar-footer{border-top:1px solid #f0f1f4;margin-top:19px;padding-top:12px;font-size:9.5px;color:#a3acb8}.tc-main{background:white;border:1px solid var(--tc-border);border-radius:12px;min-height:670px;min-width:0;overflow:hidden}.tc-context{padding:21px 24px 18px;display:flex;align-items:start;justify-content:space-between;gap:15px}.tc-kicker{font-size:9px;letter-spacing:1.1px;color:var(--tc-accent);font-weight:800;text-transform:uppercase;margin-bottom:5px}.tc-tool-heading h2{font-size:20px}.tc-tool-heading p{font-size:10.7px;margin-top:4px}.tc-heading-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.tc-state{display:inline-flex;border-radius:5px;background:#eef9f2;color:#36815c;font-size:9px;font-weight:800;padding:5px 8px;white-space:nowrap}.tc-state.draft{background:#fff3dd;color:#9c722e}.tc-state.inactive{background:#f1f2f5;color:#7c8795}.tc-workspace-bar{border-top:1px solid #eff1f4;border-bottom:1px solid #eff1f4;background:#fbfcfd;padding:10px 24px;display:flex;gap:12px;justify-content:space-between;align-items:center}.tc-workspace-summary{display:flex;gap:20px;color:#96a1ad;font-size:9.8px}.tc-workspace-summary b{color:#43576a;margin-left:4px}.tc-save-status{font-size:9.5px;font-weight:750;color:#4f9768}.tc-save-status.unsaved,.tc-save-status.saving{color:#a87624}.tc-save-status.error{color:#bd3944}.tc-save-status.locked{color:#8e98a5}.tc-tabs{display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--tc-border);padding:0 17px;overflow-x:auto}.tc-tabs button{padding:14px 10px 13px;border:0;border-bottom:3px solid transparent;background:transparent;color:#778597;white-space:nowrap;font-size:10px;font-weight:780}.tc-tabs button.active{border-bottom-color:var(--tc-accent);color:var(--tc-accent)}.tc-tabs button span{font-size:9px;border:1px solid #e5e9ee;border-radius:50%;width:18px;height:18px;display:inline-grid;place-items:center;margin-right:5px}.tc-tabs button.active span{border-color:#eabdc0;background:#fff0f0}.tc-panel{padding:23px 24px 32px;min-width:0}.tc-panel-heading{margin-bottom:20px}.tc-panel-heading p{font-size:10.7px;margin-top:6px}.tc-flex-heading{display:flex;justify-content:space-between;align-items:start;gap:15px}.tc-two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}.tc-card{border:1px solid var(--tc-border);border-radius:9px;background:#fff;padding:17px;min-width:0}.tc-card h4{margin-bottom:13px}.tc-details{display:grid;grid-template-columns:1fr 1fr;gap:18px 8px}.tc-details span,.tc-mini-stats span{display:block;font-size:9.5px;color:#9aa5b3}.tc-details strong{display:block;font-size:10.5px;margin-top:3px;overflow-wrap:anywhere}.tc-help{font-size:10px;color:#8591a1;margin-top:12px;line-height:1.6}.tc-mini-stats{display:flex;justify-content:space-between;gap:10px;margin:15px 0 20px}.tc-mini-stats>div{flex:1}.tc-mini-stats b{font-size:19px;display:block}.tc-margin-top{margin-top:14px}.tc-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.tc-steps>div{padding:10px;background:#f8fafb;border-radius:8px;border:1px solid #ebeff3}.tc-steps span{color:#b0bcc8;font-size:9px;font-weight:800;display:block}.tc-steps strong{display:block;margin:6px 0 4px;font-size:11px}.tc-steps small{display:block;color:#8b98a8;font-size:9.6px}.tc-settings{margin-bottom:16px;background:#fcfdfe}.tc-settings-head,.tc-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.tc-settings-head span{font-size:9px;color:#4b9766}.tc-card-head h4{margin:0}.tc-form-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.tc-form-grid .wide{grid-column:1/-1}.tc-form-grid .tc-toggle{flex-direction:row;align-items:center;align-self:end;padding-bottom:10px}.tc-designer-layout{display:grid;grid-template-columns:170px minmax(0,1fr);gap:14px}.tc-sections{border:1px solid #e8ecf1;border-radius:9px;background:#fafcfe;min-height:260px;padding:10px;align-self:start}.tc-list-header{display:flex;justify-content:space-between;color:#8999a8;font-size:9px;letter-spacing:.5px;padding:7px 8px 12px}.tc-section-button{display:flex;width:100%;align-items:center;gap:10px;text-align:left;border:1px solid transparent;background:transparent;border-radius:7px;padding:10px 8px;color:#607386;margin-bottom:5px}.tc-section-button b{font-size:10px;color:#a1adbb}.tc-section-button span{font-size:10px;font-weight:720;overflow-wrap:anywhere}.tc-section-button small{font-weight:500;display:block;font-size:9px;margin-top:3px;color:#9ba7b6}.tc-section-button.active{background:#fff3f3;border-color:#f0d8d8;color:var(--tc-accent)}.tc-add-inline{border:1px dashed #e6babc;background:white;color:var(--tc-accent);font-size:10px;padding:9px;border-radius:6px;width:100%;margin-top:9px}.tc-edit-area{display:flex;flex-direction:column;gap:13px;min-width:0}.tc-mini-actions{display:flex;gap:5px}.tc-mini-actions button{background:#f7f9fb;border:1px solid #e4e8ed;color:#6f7e8e;border-radius:5px;padding:4px 8px;font-size:10px;font-weight:730}.tc-mini-actions button.danger{color:#b14a51;background:#fff8f8;border-color:#f2d8da}.tc-question-list{display:flex;flex-direction:column;gap:6px;max-height:290px;overflow-y:auto}.tc-question-item{display:flex;gap:8px;align-items:center;text-align:left;width:100%;border:1px solid #e9edf1;border-radius:7px;padding:9px 11px;background:#fff;color:#617285;min-width:0}.tc-question-item.active{border-color:#e9b6b9;background:#fff8f8}.tc-question-item strong{color:var(--tc-accent);font-size:10px;white-space:nowrap}.tc-question-item span{font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tc-question-item small{font-size:9px;color:#9faab6;white-space:nowrap}.tc-check-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;padding:12px 0;border-top:1px solid #eef1f4}.tc-check-row label,.tc-preview-answer label{display:flex;flex-direction:row;align-items:center;font-size:10px;color:#647487;gap:6px}.tc-option-area{border-top:1px solid #e9edf1;margin-top:4px;padding-top:15px}.tc-option-row{display:grid;grid-template-columns:22px 1fr 1.4fr 1fr auto auto 24px;gap:7px;align-items:center;margin-bottom:10px}.tc-option-row input:not([type=checkbox]){padding:8px}.tc-option-number{font-size:10px;color:#9aa5b1}.tc-option-row .tc-compact-check{display:flex;align-items:center;flex-direction:column;gap:1px;font-size:8px}.tc-icon-danger{color:#bc5360;border:0;background:#fff3f3;border-radius:4px;font-size:16px}.tc-empty-edit,.tc-main-empty,.tc-empty-state{text-align:center;padding:38px 24px}.tc-main-empty{margin:auto;max-width:480px;padding:100px 26px}.tc-main-empty p,.tc-empty-state p{font-size:11px;margin:8px 0 17px}.tc-empty-icon{font-size:35px;color:#c1cad4;margin-bottom:12px}.tc-loading{border:1px solid #e3e7ec;border-radius:9px;padding:40px 25px;text-align:center;color:#8594a5;background:white}.tc-validation-summary{border-radius:8px;padding:14px 17px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px;border:1px solid}.tc-validation-summary.valid{background:#eff9f3;border-color:#d3e7d8;color:#34794d}.tc-validation-summary.invalid{background:#fff5ef;border-color:#f0dfd3;color:#a86642}.tc-validation-summary strong{font-size:11px}.tc-validation-summary span{font-size:10px}.tc-check-message{padding:9px 2px;border-bottom:1px solid #f0f2f4;font-size:10px}.tc-check-message.fail{color:#b34b55}.tc-check-message.warn{color:#b17e31}.tc-preview-section{border:1px solid #e3e8ec;border-radius:10px;padding:17px 20px;margin:13px 0}.tc-preview-section h4{font-size:13px}.tc-preview-section>p{font-size:10.5px;margin-top:5px}.tc-preview-question{border-top:1px solid #edf0f3;padding:15px 0;margin-top:14px}.tc-preview-q-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.tc-preview-q-head strong{font-size:11px}.tc-preview-q-head small{background:#fceeee;color:#a65d64;border-radius:4px;padding:3px 6px;font-size:9px}.tc-preview-question>p{font-size:10px;margin:6px 0 10px}.tc-preview-answer{display:flex;gap:9px;flex-direction:column;margin-top:9px}.tc-preview-answer>input,.tc-preview-answer>textarea{max-width:420px}.tc-hint{display:block;font-size:9.4px;color:#9ca6b2;margin-top:7px}.tc-extra-input{margin-top:13px;max-width:500px}.tc-release-row{padding:16px 0;border-top:1px solid #edf0f3;display:flex;justify-content:space-between;gap:15px;align-items:start}.tc-release-title{display:flex;gap:9px;align-items:center}.tc-release-title strong{font-size:13px}.tc-release-row small{display:block;font-size:9px;margin-top:5px;color:#98a4b0}.tc-release-row p{font-size:10px;margin-top:5px}.tc-release-buttons{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.tc-draft-banner{display:flex;justify-content:space-between;align-items:center;gap:15px;background:#fffaf2;border-color:#f2e2c9;margin-bottom:13px}.tc-draft-banner p{font-size:10px;margin-top:4px}.tc-overlay{position:fixed;inset:0;background:#1524357a;z-index:9000;display:flex;justify-content:center;align-items:center;padding:20px}.tc-dialog{width:min(520px,100%);max-height:95vh;background:white;border-radius:12px;box-shadow:0 30px 80px #0003;display:flex;flex-direction:column;overflow:hidden}.tc-dialog-head{padding:18px 23px;border-bottom:1px solid #e5e9ee;position:relative}.tc-dialog-head h3{margin:0;font-size:19px}.tc-dialog-head>button{position:absolute;top:14px;right:16px;border:none;background:transparent;color:#8391a0;font-size:16px}.tc-dialog-body{padding:21px 23px;overflow-y:auto;display:flex;flex-direction:column;gap:14px}.tc-dialog-check{display:flex!important;flex-direction:row!important;align-items:center}.tc-dialog-footer{padding:15px 23px;border-top:1px solid #e5e9ee;display:flex;justify-content:flex-end;gap:8px}.tc-form-error{background:#fff1f2;color:#b23f49;border:1px solid #efc7c9;padding:10px;border-radius:7px;font-size:10.5px}
@media(max-width:1220px){.tc{padding:21px 18px 40px}.tc-layout{grid-template-columns:220px minmax(0,1fr)}.tc-designer-layout{grid-template-columns:155px minmax(0,1fr)}.tc-option-row{grid-template-columns:18px 1fr 1.5fr;align-items:end}.tc-option-row>label:nth-of-type(3){grid-column:2/4}.tc-option-row .tc-compact-check{flex-direction:row}.tc-option-row .tc-icon-danger{grid-column:3;justify-self:end}}
@media(max-width:850px){.tc-header,.tc-context,.tc-flex-heading{flex-wrap:wrap}.tc-layout{grid-template-columns:1fr}.tc-sidebar{min-height:initial}.tc-tool-list{display:flex;flex-direction:row;overflow-x:auto}.tc-tool-card{min-width:180px;max-width:220px}.tc-designer-layout{grid-template-columns:1fr}.tc-sections{min-height:auto}.tc-two-col,.tc-steps{grid-template-columns:1fr 1fr}}
@media(max-width:530px){.tc{padding:12px 9px 30px}.tc h1{font-size:24px}.tc-context,.tc-panel{padding:15px 12px}.tc-workspace-bar{padding:10px 12px;flex-wrap:wrap}.tc-workspace-summary{gap:10px}.tc-form-grid,.tc-two-col,.tc-steps{grid-template-columns:1fr}.tc-form-grid .wide{grid-column:auto}.tc-option-row{grid-template-columns:20px 1fr 1fr}.tc-option-row>label:nth-of-type(3){grid-column:2/4}.tc-dialog-body{padding:15px}.tc-draft-banner,.tc-release-row{flex-wrap:wrap}}
</style>
