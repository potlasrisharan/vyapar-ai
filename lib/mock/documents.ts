import { documents } from "./seed";
import { sleep } from "@/lib/utils/format";
export async function getDocuments() { return documents; }
export async function simulateUpload(onStage: (stage:number)=>void, signal: AbortSignal) { for(let i=0;i<4;i++){if(signal.aborted)throw new DOMException("Cancelled","AbortError");onStage(i);await sleep(650);}if(signal.aborted)throw new DOMException("Cancelled","AbortError"); }
