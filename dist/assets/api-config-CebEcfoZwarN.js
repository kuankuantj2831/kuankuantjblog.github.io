const DEFAULT_API_BASE='https://1321178544-g8m9k3cmc6.ap-beijing.tencentscf.com';
let API_BASE_URL;

(function resolveBase(){
let resolved=DEFAULT_API_BASE;
try{
const custom=window.API_BASE_URL;
if(custom&&typeof custom==='string'){
const trimmed=String(custom).trim().slice(0,256);
if(/^https:\/\/[a-zA-Z0-9._-]+\/?$/i.test(trimmed)){
resolved=trimmed.replace(/\/+$/,'');
}
}
}catch(_e){}
API_BASE_URL=Object.freeze(resolved);
})();

let _apiToken='';
let _tokenTimestamp=0;
const TOKEN_MAX_AGE_MS=86400000;
const MAX_TOKEN_LEN=4096;

function isValidJWT(token){
if(typeof token!=='string')return false;
var parts=token.split('.');
if(parts.length!==3)return false;
for(var i=0;i<3;i++){
if(!parts[i]||parts[i].length<1||parts[i].length>2048)return false;
if(!/^[A-Za-z0-9_-]*$/.test(parts[i]))return false;
}
return true;
}

function setApiToken(token){
if(typeof token!=='string'){_apiToken='';_tokenTimestamp=0;return;}
var trimmed=String(token).trim();
if(!trimmed||trimmed.length>MAX_TOKEN_LEN){_apiToken='';_tokenTimestamp=0;return;}
if(isValidJWT(trimmed)){_apiToken=trimmed;_tokenTimestamp=Date.now();}
else if(trimmed.length>=16&&trimmed.length<=512){_apiToken=trimmed;_tokenTimestamp=Date.now();}
else{_apiToken='';_tokenTimestamp=0;}
}

function getApiToken(){
if(_apiToken&&Date.now()-_tokenTimestamp>TOKEN_MAX_AGE_MS){_apiToken='';_tokenTimestamp=0;}
return _apiToken;
}

function clearApiToken(){_apiToken='';_tokenTimestamp=0;}

function getApiUrl(endpoint){
if(typeof endpoint!=='string'||!endpoint)return'';
var e=String(endpoint).trim();
if(!e||e.charAt(0)!=='/')return'';
if(/[\r\n\x00]/.test(e))return'';
if(e.indexOf('..')!==-1||e.indexOf('//')!==-1)return'';
return API_BASE_URL+e;
}

function buildAuthHeaders(){
var headers={'Content-Type':'application/json','Accept':'application/json','X-Requested-With':'XMLHttpRequest','X-Client-Version':'4.6.1'};
var token=getApiToken();
if(token)headers['Authorization']='Bearer '+token;
return headers;
}

function safeFetch(url,options){
options=options||{};
if(typeof url!=='string'||!url)return Promise.reject(new Error('Invalid URL'));
const timeout=typeof options.timeout==='number'&&options.timeout>0&&options.timeout<=120000?options.timeout:12000;
let controller;
try{controller=new AbortController();}catch(e){controller={signal:null,abort:()=>{}};}
const tid=setTimeout(()=>{try{controller.abort();}catch(_){}},timeout);
const fetchOptions={
method:(options.method||'GET').toUpperCase(),
headers:Object.assign({},buildAuthHeaders(),options.headers||{}),
credentials:'omit',
signal:controller.signal,
mode:'cors',
cache:'default',
redirect:'follow',
referrerPolicy:'strict-origin-when-cross-origin',
keepalive:false,
priority:'auto'
};
const allowedMethods=new Set(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']);
if(!allowedMethods.has(fetchOptions.method)){clearTimeout(tid);return Promise.reject(new Error('Invalid HTTP method: '+fetchOptions.method));}
if(options.body){
const bodyStr=typeof options.body==='string'?options.body:JSON.stringify(options.body);
if(bodyStr.length>10485760){clearTimeout(tid);return Promise.reject(new Error('Request body too large'));}
fetchOptions.body=bodyStr;
}
return fetch(url,fetchOptions).then(res=>{clearTimeout(tid);if(!res.ok&&res.status>=400){const err=new Error('HTTP '+res.status+': '+res.statusText);err.status=res.status;err.response=res;throw err;}return res;}).catch(err=>{clearTimeout(tid);throw err;});
}

window.ApiConfig={
API_BASE_URL:API_BASE_URL,
API_ENDPOINTS:{
auth:{login:'/auth/login',register:'/auth/register',me:'/auth/me'},
profiles:'/profiles',
messages:{unreadCount:'/messages/unread-count'},
online:{count:'/online/count'}
},
getApiUrl:getApiUrl,
setApiToken:setApiToken,
getApiToken:getApiToken,
clearApiToken:clearApiToken,
buildAuthHeaders:buildAuthHeaders,
safeFetch:safeFetch
};

export{API_BASE_URL,getApiUrl,setApiToken,getApiToken,clearApiToken,buildAuthHeaders,safeFetch};

export var API_ENDPOINTS=Object.freeze({
auth:Object.freeze({login:'/auth/login',register:'/auth/register',me:'/auth/me'}),
profiles:'/profiles',
messages:Object.freeze({unreadCount:'/messages/unread-count'}),
online:Object.freeze({count:'/online/count'})
});
