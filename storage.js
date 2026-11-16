const ROOT="Personalflix", DIR="videos";
async function videoDir(){const root=await navigator.storage.getDirectory();const app=await root.getDirectoryHandle(ROOT,{create:true});return app.getDirectoryHandle(DIR,{create:true});}
export async function storageStatus(){if(!navigator.storage?.getDirectory)throw new Error("OPFS tidak didukung browser ini.");const [estimate,persisted]=await Promise.all([navigator.storage.estimate(),navigator.storage.persisted()]);return {usage:estimate.usage||0,quota:estimate.quota||0,persisted};}
export async function saveBlobToOPFS(id,blob){const dir=await videoDir();const handle=await dir.getFileHandle(`${id}.video`,{create:true});const writable=await handle.createWritable();await writable.write(blob);await writable.close();return `${id}.video`;}
export async function getOPFSFile(fileName){const dir=await videoDir();const handle=await dir.getFileHandle(fileName);return handle.getFile();}
export async function removeOPFSFile(fileName){const dir=await videoDir();await dir.removeEntry(fileName).catch(()=>{});}
export async function hasOPFS(){try{await navigator.storage.getDirectory();return true}catch{return false}}