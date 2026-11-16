import {saveBlobToOPFS} from "./storage.js";
import {saveVideo} from "./database.js";
// This initial version saves a complete response. Large-file resumable Range downloads
// require a source that supports CORS + HTTP Range and will be added after source testing.
export async function downloadVideo(video,onProgress=()=>{}){
  if(!video.url)throw new Error("Video belum memiliki URL langsung.");
  const response=await fetch(video.url,{mode:"cors"});
  if(!response.ok)throw new Error(`Sumber mengembalikan HTTP ${response.status}`);
  if(!response.body)throw new Error("Browser tidak menyediakan stream untuk sumber ini.");
  const total=Number(response.headers.get("content-length"))||0;
  const reader=response.body.getReader();const chunks=[];let received=0;
  while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;onProgress({received,total,percent:total?Math.round(received/total*100):null});}
  const blob=new Blob(chunks,{type:response.headers.get("content-type")||"video/mp4"});
  const fileName=await saveBlobToOPFS(video.id,blob);
  await saveVideo({...video,offline:true,fileName,downloadedBytes:received});
  return fileName;
}
