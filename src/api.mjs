/** Supabase public PostgREST client for WeWeb coded element. No secrets or credentials stored. */
export const TABLES=Object.freeze({tools:'cra_tm_tools',releases:'cra_tm_tool_releases',drafts:'cra_tm_tool_drafts',types:'cra_tm_question_types'});
export function projectUrl(s){
 const source=String(s??'').trim().replace(/\/+$/,'');
 let url;try{url=new URL(source);}catch{throw new Error('Provide a valid Supabase Project URL.');}
 if(!['https:'].includes(url.protocol)&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('Supabase requires HTTPS.');
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Use only the project origin (https://<project>.supabase.co).');
 return url.origin;
}
export function publicKey(s){const key=String(s??'').trim();if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw new Error('Use an sb_publishable_ key, never sb_secret_ or service_role.');return key;}
export function positiveId(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<1)throw new Error('A valid positive record ID is required.');return n;}
export function unwrap(result){return Array.isArray(result)?result[0]:result;}
export function createApi({url,key,fetchFn=fetch}){
 const base=projectUrl(url),apiKey=publicKey(key);
 async function request(path,{method='GET',query={},body,signal}={}){
  const u=new URL(`${base}/rest/v1/${path}`);
  for(const [k,v] of Object.entries(query)){if(v!==null&&v!==undefined&&v!=='')u.searchParams.set(k,String(v));}
  const headers={apikey:apiKey,Accept:'application/json'};
  if(body!==undefined){headers['Content-Type']='application/json';headers.Prefer='return=representation';}
  let response;try{response=await fetchFn(u.toString(),{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal});}catch(e){throw new Error('Cannot reach Supabase: '+String(e?.message||e));}
  const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
  if(!response.ok){const message=(data&&typeof data==='object'?(data.message||data.error_description||data.error):data)||response.statusText;throw new Error(`${response.status} · ${String(message).slice(0,650)}`);}
  return data;
 }
 async function rows(table,filter={},order='id.asc'){
  const all=[];for(let offset=0;offset<10000;offset+=500){const chunk=await request(table,{query:{select:'*',order,...filter,limit:500,offset}});if(!Array.isArray(chunk))throw new Error(`Unexpected Supabase result for ${table}`);all.push(...chunk);if(chunk.length<500)return all;}
  throw new Error('More than 10,000 rows. Narrow the catalogue query.');
 }
 const rpc=(name,params={})=>request(`rpc/${name}`,{method:'POST',body:params});
 const catalogue=async()=>{const [tools,releases,drafts,types]=await Promise.all([rows(TABLES.tools),rows(TABLES.releases),rows(TABLES.drafts),rows(TABLES.types)]);return {tools,releases,drafts,types};};
 return {request,rows,rpc,catalogue};
}
