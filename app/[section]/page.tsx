import { PageView } from "@/components/page-view";
import type { Route } from "@/lib/types";
const sections:Route[]=["documents","invoices","payments","customers","vendors","inventory","expenses","insights","assistant","settings","udhaar-khata","banking"];
export function generateStaticParams(){return sections.map(section=>({section}));}
export const dynamicParams=false;
export default async function Section({params}:{params:Promise<{section:Route}>}){const {section}=await params;return <PageView route={section}/>;}
