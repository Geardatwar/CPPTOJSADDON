// cultivationModule.js
function debug(message) {
  console.warn(`[Debug] ${message}`);
}

var Module = {
  onRuntimeInitialized: function() {
      debug("Cultivation system runtime initialized");
  }
};

var Module = (() => {
  var _scriptName = import.meta.url;
  
  return (
function(moduleArg = {}) {
  var moduleRtn;

var Module=moduleArg;var readyPromiseResolve,readyPromiseReject;var readyPromise=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject});var ENVIRONMENT_IS_WEB=true;var ENVIRONMENT_IS_WORKER=false;var moduleOverrides=Object.assign({},Module);var arguments_=[];var thisProgram="./this.program";var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var readAsync,readBinary;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(typeof document!="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src}if(_scriptName){scriptDirectory=_scriptName}if(scriptDirectory.startsWith("blob:")){scriptDirectory=""}else{scriptDirectory=scriptDirectory.substr(0,scriptDirectory.replace(/[?#].*/,"").lastIndexOf("/")+1)}{readAsync=url=>fetch(url,{credentials:"same-origin"}).then(response=>{if(response.ok){return response.arrayBuffer()}return Promise.reject(new Error(response.status+" : "+response.url))})}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.error.bind(console);Object.assign(Module,moduleOverrides);moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];var wasmBinary=Module["wasmBinary"];var WebAssembly={Memory:function(opts){this.buffer=new ArrayBuffer(opts["initial"]*65536)},Module:function(binary){},Instance:function(module,info){this.exports=(
// EMSCRIPTEN_START_ASM
function instantiate(D){function c(d){d.set=function(a,b){this[a]=b};d.get=function(a){return this[a]};return d}function B(C){var e=new ArrayBuffer(16908288);var f=new Int8Array(e);var g=new Int16Array(e);var h=new Int32Array(e);var i=new Uint8Array(e);var j=new Uint16Array(e);var k=new Uint32Array(e);var l=new Float32Array(e);var m=new Float64Array(e);var n=Math.imul;var o=Math.fround;var p=Math.abs;var q=Math.clz32;var r=Math.min;var s=Math.max;var t=Math.floor;var u=Math.ceil;var v=Math.trunc;var w=Math.sqrt;var x=66576;var y=0;
// EMSCRIPTEN_START_FUNCS
function K(a){a=o(a);var b=0,c=0,d=0,e=0,f=0;c=h[256];b=c>>>16|0;e=n(b,19605);d=n(b,32557);b=c&65535;f=n(b,32557);d=d+(f>>>16|0)|0;b=(d&65535)+n(b,19605)|0;y=(n(h[257],1284865837)+e|0)+n(c,1481765933)+(d>>>16)+(b>>>16)|0;c=f&65535|b<<16;b=y;d=b;e=b+1|0;b=c+1|0;c=b?d:e;h[256]=b;h[257]=c;return o(o(c>>>1|0)*o(4.656612873077393e-10))<a|0}function J(a,b){a=a|0;b=b|0;var c=0,d=0;d=h[b>>2];c=h[b+4>>2]-d|0;b=c>>4;c=(b&c>>31)-1|0;while(1){a:{if((b|0)<=0){b=c;break a}b=b-1|0;if(h[((b<<4)+d|0)+4>>2]>(a|0)){continue}}break}return((b|0)>0?b:0)|0}function M(a,b,c){a=a|0;b=b|0;c=c|0;var d=o(0);if((b|0)<(c|0)){d=o(o(o(a-b|0)/o(c-b|0))*o(100));if(o(p(d))<o(2147483648)){return~~d|0}a=-2147483648}else{a=100}return a|0}
function L(a,b,c){a=a|0;b=b|0;c=o(c);c=o(c*o(a|0));if(o(p(c))<o(2147483648)){return(b?~~c:a)|0}return(b?-2147483648:a)|0}function I(a,b){a=a|0;b=b|0;var c=o(0);c=o(o(o(a|0)/o(b|0))*o(100));return o(c>o(100)?o(100):c)}function G(a){a=a|0;a=x-a&-16;x=a;return a|0}function H(a){a=a|0;x=a}function F(){return x|0}function E(){}
// EMSCRIPTEN_END_FUNCS
var z=c([]);function A(){return e.byteLength/65536|0}return{a:Object.create(Object.prototype,{grow:{},buffer:{get:function(){return e}}}),b:E,c:M,d:L,e:K,f:J,g:I,h:z,i:H,j:G,k:F}}return B(D)}
// EMSCRIPTEN_END_ASM


)(info)},instantiate:function(binary,info){return{then:function(ok){var module=new WebAssembly.Module(binary);ok({instance:new WebAssembly.Instance(module,info)})}}},RuntimeError:Error,isWasm2js:true};if(WebAssembly.isWasm2js){wasmBinary=[]}var wasmMemory;var ABORT=false;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateMemoryViews(){var b=wasmMemory.buffer;Module["HEAP8"]=HEAP8=new Int8Array(b);Module["HEAP16"]=HEAP16=new Int16Array(b);Module["HEAPU8"]=HEAPU8=new Uint8Array(b);Module["HEAPU16"]=HEAPU16=new Uint16Array(b);Module["HEAP32"]=HEAP32=new Int32Array(b);Module["HEAPU32"]=HEAPU32=new Uint32Array(b);Module["HEAPF32"]=HEAPF32=new Float32Array(b);Module["HEAPF64"]=HEAPF64=new Float64Array(b)}var __ATPRERUN__=[];var __ATINIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){var preRuns=Module["preRun"];if(preRuns){if(typeof preRuns=="function")preRuns=[preRuns];preRuns.forEach(addOnPreRun)}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function postRun(){var postRuns=Module["postRun"];if(postRuns){if(typeof postRuns=="function")postRuns=[postRuns];postRuns.forEach(addOnPostRun)}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnInit(cb){__ATINIT__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;Module["monitorRunDependencies"]?.(runDependencies)}function removeRunDependency(id){runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}function abort(what){Module["onAbort"]?.(what);what="Aborted("+what+")";err(what);ABORT=true;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}var dataURIPrefix="data:application/octet-stream;base64,";var isDataURI=filename=>filename.startsWith(dataURIPrefix);function findWasmBinary(){if(Module["locateFile"]){var f="cultivation_math.wasm";if(!isDataURI(f)){return locateFile(f)}return f}return new URL("cultivation_math.wasm",import.meta.url).href}var wasmBinaryFile;function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw"both async and sync fetching of the wasm failed"}function getBinaryPromise(binaryFile){if(!wasmBinary){return readAsync(binaryFile).then(response=>new Uint8Array(response),()=>getBinarySync(binaryFile))}return Promise.resolve().then(()=>getBinarySync(binaryFile))}function instantiateArrayBuffer(binaryFile,imports,receiver){return getBinaryPromise(binaryFile).then(binary=>WebAssembly.instantiate(binary,imports)).then(receiver,reason=>{err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason)})}function instantiateAsync(binary,binaryFile,imports,callback){if(!binary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(binaryFile)&&typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{var result=WebAssembly.instantiateStreaming(response,imports);return result.then(callback,function(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(binaryFile,imports,callback)})})}return instantiateArrayBuffer(binaryFile,imports,callback)}function getWasmImports(){return{a:wasmImports}}function createWasm(){var info=getWasmImports();function receiveInstance(instance,module){wasmExports=instance.exports;wasmMemory=wasmExports["a"];updateMemoryViews();addOnInit(wasmExports["b"]);removeRunDependency("wasm-instantiate");return wasmExports}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"])}if(Module["instantiateWasm"]){try{return Module["instantiateWasm"](info,receiveInstance)}catch(e){err(`Module.instantiateWasm callback failed with error: ${e}`);readyPromiseReject(e)}}wasmBinaryFile??=findWasmBinary();instantiateAsync(wasmBinary,wasmBinaryFile,info,receiveInstantiationResult).catch(readyPromiseReject);return{}}var callRuntimeCallbacks=callbacks=>{callbacks.forEach(f=>f(Module))};var noExitRuntime=Module["noExitRuntime"]||true;var stackRestore=val=>__emscripten_stack_restore(val);var stackSave=()=>_emscripten_stack_get_current();var getCFunc=ident=>{var func=Module["_"+ident];return func};var writeArrayToMemory=(array,buffer)=>{HEAP8.set(array,buffer)};var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++}else if(c<=2047){len+=2}else if(c>=55296&&c<=57343){len+=4;++i}else{len+=3}}return len};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}}heap[outIdx]=0;return outIdx-startIdx};var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);var stackAlloc=sz=>__emscripten_stack_alloc(sz);var stringToUTF8OnStack=str=>{var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8(str,ret,size);return ret};var UTF8Decoder=typeof TextDecoder!="undefined"?new TextDecoder:undefined;var UTF8ArrayToString=(heapOrArray,idx=0,maxBytesToRead=NaN)=>{var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heapOrArray[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.subarray(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var UTF8ToString=(ptr,maxBytesToRead)=>ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):"";var ccall=(ident,returnType,argTypes,args,opts)=>{var toC={string:str=>{var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=stringToUTF8OnStack(str)}return ret},array:arr=>{var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}};function convertReturnValue(ret){if(returnType==="string"){return UTF8ToString(ret)}if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func(...cArgs);function onDone(ret){if(stack!==0)stackRestore(stack);return convertReturnValue(ret)}ret=onDone(ret);return ret};var cwrap=(ident,returnType,argTypes,opts)=>{var numericArgs=!argTypes||argTypes.every(type=>type==="number"||type==="boolean");var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return(...args)=>ccall(ident,returnType,argTypes,args,opts)};var wasmImports={};var wasmExports=createWasm();var ___wasm_call_ctors=()=>(___wasm_call_ctors=wasmExports["b"])();var _calculateProgressToNextStage=Module["_calculateProgressToNextStage"]=(a0,a1,a2)=>(_calculateProgressToNextStage=Module["_calculateProgressToNextStage"]=wasmExports["c"])(a0,a1,a2);var _calculatePowerGain=Module["_calculatePowerGain"]=(a0,a1,a2)=>(_calculatePowerGain=Module["_calculatePowerGain"]=wasmExports["d"])(a0,a1,a2);var _rollForEnlightenment=Module["_rollForEnlightenment"]=a0=>(_rollForEnlightenment=Module["_rollForEnlightenment"]=wasmExports["e"])(a0);var _getCurrentStageIndex=Module["_getCurrentStageIndex"]=(a0,a1)=>(_getCurrentStageIndex=Module["_getCurrentStageIndex"]=wasmExports["f"])(a0,a1);var _calculateMeditationProgress=Module["_calculateMeditationProgress"]=(a0,a1)=>(_calculateMeditationProgress=Module["_calculateMeditationProgress"]=wasmExports["g"])(a0,a1);var __emscripten_stack_restore=a0=>(__emscripten_stack_restore=wasmExports["i"])(a0);var __emscripten_stack_alloc=a0=>(__emscripten_stack_alloc=wasmExports["j"])(a0);var _emscripten_stack_get_current=()=>(_emscripten_stack_get_current=wasmExports["k"])();Module["ccall"]=ccall;Module["cwrap"]=cwrap;var calledRun;var calledPrerun;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(){if(runDependencies>0){return}if(!calledPrerun){calledPrerun=1;preRun();if(runDependencies>0){return}}function doRun(){if(calledRun)return;calledRun=1;Module["calledRun"]=1;if(ABORT)return;initRuntime();readyPromiseResolve(Module);Module["onRuntimeInitialized"]?.();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(()=>{setTimeout(()=>Module["setStatus"](""),1);doRun()},1)}else{doRun()}}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}run();moduleRtn=readyPromise;


  return moduleRtn;
}
);
})();
export default Module;

export const CultivationMath = {
  initialized: false,
  initialize: function() {
      if (this.initialized) {
          return Promise.resolve();
      }
      
      debug("Starting cultivation math initialization");
      return new Promise((resolve) => {
          try {
              if (typeof Module._calculateProgressToNextStage === 'function' &&
                  typeof Module._calculatePowerGain === 'function' &&
                  typeof Module._rollForEnlightenment === 'function' &&
                  typeof Module._getCurrentStageIndex === 'function' &&
                  typeof Module._calculateMeditationProgress === 'function') {
                  
                  this.calculateProgress = function(currentPower, currentStageReq, nextStageReq) {
                      return Module._calculateProgressToNextStage(currentPower, currentStageReq, nextStageReq);
                  };
                  
                  this.calculatePowerGain = function(basePower, isEnlightened, enlightenmentBonus) {
                      return Module._calculatePowerGain(basePower, isEnlightened, enlightenmentBonus);
                  };
                  
                  this.rollForEnlightenment = function(chance) {
                      return Module._rollForEnlightenment(chance);
                  };
                  
                  this.getCurrentStageIndex = function(power, stages) {
                      return Module._getCurrentStageIndex(power, stages);
                  };
                  
                  this.calculateMeditationProgress = function(meditationTime, maxTime) {
                      return Module._calculateMeditationProgress(meditationTime, maxTime);
                  };
                  
                  this.initialized = true;
                  debug("Cultivation math functions set up successfully");
                  resolve();
              } else {
                  throw new Error("Cultivation math functions not available");
              }
          } catch (e) {
              debug(`Setup error: ${e.toString()}`);
              throw e;
          }
      });
  }
};