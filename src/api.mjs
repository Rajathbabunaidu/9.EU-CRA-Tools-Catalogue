/** Supabase REST adapter. Only the publishable key is accepted (no secret/Bearer header). */
export function validProjectUrl(value) {
  const raw=String(value??'').trim();
  let u;try{u=new URL(raw);}catch{throw Error('Enter a valid Supabase Project URL.');}
  if(!['https:'].includes(u.protocol) && !(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))
    throw Error('Supabase URL must use HTTPS.');
  if(u.username||u.password||u.hash||u.search||(u.pathname!=='/'&&u.pathname!==''))
    throw Error('Enter the project URL without /rest/v1, credentials or query parameters.');
  return u.origin;
}
export function validPublishableKey(value) {
  const key=String(value??'').trim();
  if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw Error('Enter an sb_publishable_ key, not a secret key.');
  return key;
}
export function createApi({url,key,fetchFn=fetch}) {
  const base=validProjectUrl(url),apiKey=validPublishableKey(key);
  async function request(path,{method='GET',params={},body}={}){
    const endpoint=new URL(`${base}/rest/v1/${path}`);
    for(const [name,value] of Object.entries(params||{}))if(value!==null&&value!==undefined)endpoint.searchParams.set(name,String(value));
    const headers={apikey:apiKey,Accept:'application/json'};
    if(body!==undefined){headers['Content-Type']='application/json';headers.Prefer='return=representation';}
    let response;try{response=await fetchFn(endpoint.toString(),{method,headers,body:body===undefined?undefined:JSON.stringify(body)});}
    catch(e){throw new Error(`Connection failed: ${e?.message||'network unavailable'}`);}
    let result=null;const raw=await response.text();try{result=raw?JSON.parse(raw):null;}catch{result=raw;}
    if(!response.ok){const detail=result&&typeof result==='object'?(result.message||result.details||result.hint||response.statusText):(result||response.statusText);
      throw new Error(`${response.status} · ${String(detail).slice(0,650)}`);}
    return result;
  }
  async function rows(table){
    let data=[],offset=0;const count=500;
    for(;offset<10000;offset+=count){
      const page=await request(table,{params:{select:'*',order:'id.asc',limit:count,offset}});
      if(!Array.isArray(page))throw Error(`Unexpected response for ${table}`);
      data.push(...page);if(page.length<count)return data;
    }
    throw Error(`Catalogue ${table} exceeds 10,000 records.`);
  }
  async function catalogue(){
    const [tools,releases,drafts]=await Promise.all([
      rows('cra_tm_tools'),rows('cra_tm_tool_releases'),rows('cra_tm_tool_drafts')]);
    return {tools,releases,drafts};
  }
  const rpc=(functionName,params)=>request(`rpc/${functionName}`,{method:'POST',body:params||{}});
  return {catalogue,rpc,rows,request};
}
export function firstRow(json){return Array.isArray(json)?json[0]||null:json;}
