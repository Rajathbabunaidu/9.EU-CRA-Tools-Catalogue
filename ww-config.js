export default {
  editor: { label: { en: 'EU CRA Hub — Tools Catalogue' }, icon: 'layout' },
  properties: {
    supabaseUrl: { label:{en:'Supabase Project URL'}, type:'Text', section:'settings', bindable:true, defaultValue:'' },
    publishableKey: { label:{en:'Supabase Publishable Key (sb_publishable_)'},type:'Text',section:'settings',bindable:true,defaultValue:'' },
    enableMutations: { label:{en:'Allow development write operations'},type:'OnOff',section:'settings',bindable:true,defaultValue:false },
    initialToolId: { label:{en:'Initial Tool ID (optional)'},type:'Number',section:'settings',bindable:true,defaultValue:0 },
    accentColor: { label:{en:'Accent colour'},type:'Color',section:'style',bindable:true,defaultValue:'#c4262e' }
  },
  triggerEvents: [
    {name:'tool-created',label:{en:'Tool Created'},event:{tool_id:0}},
    {name:'draft-saved',label:{en:'Draft Saved'},event:{tool_id:0,revision:0}},
    {name:'tool-released',label:{en:'Tool Released'},event:{tool_id:0,release_id:0,release_version:''}},
    {name:'tool-selected',label:{en:'Tool Selected'},event:{tool_id:0}}
  ]
};
