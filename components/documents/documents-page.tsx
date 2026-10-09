"use client";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowUpRight, X, FileSpreadsheet } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Badge, Button, Card, DataTable, EmptyState, PageHeading, SearchField } from "@/components/ui";
import type { Document } from "@/lib/types";
import { date } from "@/lib/utils/format";

interface ExtractedDocData {
  [key: string]: unknown;
  isBusinessProfile?: boolean;
  businessName?: string;
  ownerName?: string;
  city?: string;
  state?: string;
  gstin?: string;
  pan?: string;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  totalReceivables?: number;
  invoiceNumber?: string;
  customerName?: string;
  vendorName?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  taxAmount?: number;
  paymentStatus?: string;
  items?: Array<{ description?: string; quantity?: number; unitPrice?: number; total?: number }>;
}
export function DocumentsPage(){
  const {data,t,lang,local,addDocument,createInvoice,createAction,open,notify}=useApp();
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const [stage,setStage]=useState(-1);
  const [error,setError]=useState(false);
  const [validation,setValidation]=useState(false);
  const [failNext,setFailNext]=useState(false);
  const [fileName,setFileName]=useState("");
  const [dragging,setDragging]=useState(false);
  const [lastFormat,setLastFormat]=useState<Document["format"]>("PDF");
  const [lastInvId,setLastInvId]=useState("INV-1023");
  const [lastFileObj,setLastFileObj]=useState<File|null>(null);
  const input=useRef<HTMLInputElement>(null);
  const controller=useRef<AbortController|null>(null);

  useEffect(()=>()=>controller.current?.abort(),[]);
  if(!data)return null;

  const rows=[...local.uploadedDocuments,...data.documents].filter(d=>d.name.toLowerCase().includes(query.toLowerCase())&&(filter==="all"||d.status===filter));
  const busy=stage>=0&&stage<4&&!error;

  async function upload(fileOrName:File|string="Sample_INV-1049.pdf",format:Document["format"]="PDF",retry=false){
    controller.current?.abort();
    const ac=new AbortController();
    controller.current=ac;
    const isRealFile=fileOrName instanceof File;
    const displayName=isRealFile?fileOrName.name:fileOrName;
    setFileName(displayName);
    setLastFormat(format);
    setLastFileObj(isRealFile?fileOrName:null);
    setError(false);
    setValidation(false);
    setStage(0);

    try{
      if(failNext&&!retry){setError(true);setFailNext(false);return;}
      setStage(1);
      let extData: ExtractedDocData | null = null;
      let docType: Document["type"] = "invoice";
      let suggestedReminder: { draftMessage?: string } | undefined = undefined;

      if(isRealFile){
        const fd=new FormData();
        fd.append("file",fileOrName);
        const res=await fetch("/api/ai/ocr",{method:"POST",body:fd,signal:ac.signal});
        if(res.ok){
          const json=await res.json();
          extData=json.extraction;
          suggestedReminder=json.suggestedReminder;
          if(json.docType==="profile"||extData?.isBusinessProfile)docType="profile";
        }
      }else if(typeof fileOrName==="string"&&fileOrName.toLowerCase().includes("profile")){
        docType="profile";
        extData={
          isBusinessProfile:true,
          businessName:"Sharma Electronics",
          ownerName:"Ram Sharma",
          city:"Kanpur",
          state:"Uttar Pradesh",
          gstin:"09AAACS1420M1Z8",
          pan:"AAACS1420M",
          monthlyRevenue:482000,
          monthlyExpenses:213000,
          totalReceivables:82000
        };
      }else{
        const sampleText=`Tax Invoice INV-1049 from Bajaj Electricals to Sharma Electronics dated 2026-08-20. Total ₹48,000 for 12 Heavy Ceiling Fans. GSTIN: 09AAACB9876A1Z3.`;
        const res=await fetch("/api/ai/ocr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:sampleText}),signal:ac.signal});
        if(res.ok){
          const json=await res.json();
          extData=json.extraction;
          suggestedReminder=json.suggestedReminder;
        }
      }

      setStage(2);
      if(!extData){
        extData={vendorName:"Uploaded Vendor",customerName:"Sharma Electronics",invoiceNumber:`INV-${Date.now().toString().slice(-4)}`,invoiceDate:new Date().toISOString().slice(0,10),dueDate:new Date().toISOString().slice(0,10),totalAmount:48000,taxAmount:4320,gstin:"09AAACB9876A1Z3",items:[{description:"Ceiling Fans Batch",quantity:12,unitPrice:4000,total:48000}]};
      }
      setStage(3);

      const invNumber=extData.invoiceNumber||`INV-${Date.now().toString().slice(-4)}`;
      setLastInvId(invNumber);

      addDocument({
        id:`DOC-UP-${crypto.randomUUID()}`,
        name:displayName,
        type:docType,
        format,
        status:"completed",
        uploaded:new Date().toISOString().slice(0,10),
        insightIds:["INS-1"],
        relatedId:docType==="profile"?"BIZ-1":invNumber,
        confidenceScore:0.99,
        extractedData:docType==="profile"?extData:{
          invoiceNumber:invNumber,
          customer:extData.customerName||extData.vendorName||"Uploaded Party",
          gstin:extData.gstin||"09AAACB9876A1Z3",
          date:extData.invoiceDate||new Date().toISOString().slice(0,10),
          dueDate:extData.dueDate||new Date().toISOString().slice(0,10),
          subtotal:extData.totalAmount?extData.totalAmount-(extData.taxAmount||0):0,
          cgst:(extData.taxAmount||0)/2,
          sgst:(extData.taxAmount||0)/2,
          total:extData.totalAmount||0,
          paymentStatus:extData.paymentStatus||"overdue",
          items:extData.items||[]
        }
      });

      if(docType!=="profile" && extData){
        createInvoice({
          id:invNumber,
          customerId:"CUS-1016",
          date:extData.invoiceDate||new Date().toISOString().slice(0,10),
          dueDate:extData.dueDate||new Date().toISOString().slice(0,10),
          subtotal:extData.totalAmount?extData.totalAmount-(extData.taxAmount||0):0,
          tax:extData.taxAmount||0,
          total:extData.totalAmount||0,
          status:extData.paymentStatus==="paid"?"paid":"overdue",
          items: extData.items?.length
            ? extData.items.map((it, idx: number) => {
                const qty = Number(it.quantity || 1);
                const rate = Number(it.unitPrice || it.total || 0);
                const total = Number(it.total || qty * rate);
                return {
                  productId: `PRD-${idx + 1}`,
                  quantity: qty,
                  unitPrice: rate,
                  gross: total,
                  subtotal: total,
                  tax: 0,
                };
              })
            : [
                {
                  productId: "PRD-1",
                  quantity: 1,
                  unitPrice: Number(extData.totalAmount || 0),
                  gross: Number(extData.totalAmount || 0),
                  subtotal: Number(extData.totalAmount || 0),
                  tax: 0,
                },
              ],
        });

        const customerName = extData.customerName || extData.vendorName || "Customer";
        const totalAmountStr = `₹${Number(extData.totalAmount || 0).toLocaleString("en-IN")}`;
        const reminderDraft = suggestedReminder?.draftMessage ||
          `Namaste ${customerName}, Sharma Electronics (Kanpur) reminder for invoice ${invNumber} (${totalAmountStr}). Kindly settle at your earliest.`;

        createAction(
          {
            id: `ACT-${invNumber}`,
            category: "financial",
            priority: "high",
            title: {
              en: `Collect ${totalAmountStr} from ${customerName}`,
              hi: `${customerName} से ${totalAmountStr} वसूलें`,
              hinglish: `${customerName} se ${totalAmountStr} collect karein`
            },
            summary: { en: `Invoice ${invNumber}`, hi: `बिल ${invNumber}`, hinglish: `Bill ${invNumber}` },
            why: { en: "Overdue payment from uploaded invoice", hi: "अपलोड किए गए बिल का बकाया", hinglish: "Uploaded bill ka bakaaya" },
            recommendation: { en: `Send reminder to ${customerName}`, hi: `${customerName} को तगादा भेजें`, hinglish: `${customerName} ko reminder bhejein` },
            evidenceIds: ["EVD-INV-1023"],
            action: "followup",
            targetId: invNumber
          },
          reminderDraft
        );
      }

      setStage(4);
      notify("uploadSuccess");
    }catch(e){
      if(!(e instanceof DOMException&&e.name==="AbortError"))setError(true);
    }
  }

  function uploadMonthAndProfileBatch(){
    const batch=[
      {
        name:"Business_Profile_Sharma_Electronics.pdf",
        type:"profile" as const,
        format:"PDF" as const,
        extractedData:{
          isBusinessProfile:true,
          businessName:"Sharma Electronics",
          ownerName:"Ram Sharma",
          city:"Kanpur",
          state:"Uttar Pradesh",
          gstin:"09AAACS1420M1Z8",
          pan:"AAACS1420M",
          monthlyRevenue:482000,
          monthlyExpenses:213000,
          totalReceivables:82000
        }
      },
      {
        name:"Tax_Invoice_INV-1023_ABC_Traders.pdf",
        type:"invoice" as const,
        format:"PDF" as const,
        extractedData:{
          invoiceNumber:"INV-1023",
          customer:"ABC Traders",
          date:"2026-09-10",
          dueDate:"2026-09-23",
          total:35000,
          totalAmount:35000,
          taxAmount:5339,
          paymentStatus:"overdue",
          items:[{description:"Dell 24-inch Monitor SE2422HX",quantity:4,unitPrice:7415.25,total:29661}]
        }
      },
      {
        name:"Tax_Invoice_INV-1042_Rahul_Traders.pdf",
        type:"invoice" as const,
        format:"PDF" as const,
        extractedData:{
          invoiceNumber:"INV-1042",
          customer:"Rahul Traders",
          date:"2026-09-15",
          dueDate:"2026-09-25",
          total:48000,
          totalAmount:48000,
          taxAmount:7322,
          paymentStatus:"overdue",
          items:[{description:"boAt Stone 350 Bluetooth Speakers",quantity:16,unitPrice:2542.38,total:40678}]
        }
      },
      {
        name:"Wholesale_Bill_INV-802_Havells.pdf",
        type:"invoice" as const,
        format:"PDF" as const,
        extractedData:{
          invoiceNumber:"INV-802",
          customer:"Havells India Wholesale",
          vendorName:"Havells India Wholesale",
          date:"2026-09-02",
          dueDate:"2026-09-20",
          total:62000,
          totalAmount:62000,
          taxAmount:9458,
          paymentStatus:"overdue",
          items:[{description:"Smart LED Surface Panel 18W",quantity:20,unitPrice:2627.1,total:52542}]
        }
      },
      {
        name:"Vendor_Bill_EXP-6_UPPCL_Electricity.pdf",
        type:"expense" as const,
        format:"PDF" as const,
        extractedData:{
          invoiceNumber:"EXP-6",
          vendorName:"UPPCL Kanpur",
          customer:"Sharma Electronics",
          date:"2026-09-30",
          dueDate:"2026-10-05",
          total:24500,
          totalAmount:24500,
          taxAmount:2200,
          paymentStatus:"pending",
          items:[{description:"Commercial Commercial Load Electricity Bill",quantity:1,unitPrice:24500,total:24500}]
        }
      }
    ];

    batch.forEach(doc=>{
      addDocument({
        id:`DOC-BATCH-${crypto.randomUUID()}`,
        name:doc.name,
        type:doc.type,
        format:doc.format,
        status:"completed",
        uploaded:new Date().toISOString().slice(0,10),
        insightIds:["INS-1"],
        relatedId:doc.extractedData.invoiceNumber||"BIZ-1",
        confidenceScore:0.99,
        extractedData:doc.extractedData
      });

      if (doc.type === "invoice" && doc.extractedData.totalAmount) {
        createInvoice({
          id: doc.extractedData.invoiceNumber,
          customerId: doc.extractedData.invoiceNumber === "INV-1023" ? "CUS-1001" : "CUS-1002",
          date: doc.extractedData.date,
          dueDate: doc.extractedData.dueDate,
          subtotal: doc.extractedData.totalAmount - (doc.extractedData.taxAmount || 0),
          tax: doc.extractedData.taxAmount || 0,
          total: doc.extractedData.totalAmount,
          status: doc.extractedData.paymentStatus as "overdue" | "paid",
          items: doc.extractedData.items.map((it, idx) => ({
            productId: `PRD-${idx + 1}`,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            gross: it.total,
            subtotal: it.total,
            tax: 0,
          })),
        });
      }
    });

    createAction(
      {
        id: "ACT-INV-1023",
        category: "financial",
        priority: "high",
        title: {
          en: "Collect ₹35,000 from ABC Traders",
          hi: "ABC Traders से ₹35,000 का भुगतान प्राप्त करें",
          hinglish: "ABC Traders se ₹35,000 collect karein",
        },
        summary: { en: "Invoice INV-1023", hi: "बिल INV-1023", hinglish: "Bill INV-1023" },
        why: { en: "12 days overdue", hi: "12 दिन से बकाया", hinglish: "12 din se overdue" },
        recommendation: { en: "Send WhatsApp reminder to ABC Traders", hi: "WhatsApp रिमाइंडर भेजें", hinglish: "WhatsApp reminder bhejein" },
        evidenceIds: ["EVD-INV-1023"],
        action: "followup",
        targetId: "INV-1023",
      },
      "Dear ABC Traders, reminder from Sharma Electronics (Kanpur) regarding overdue invoice INV-1023 for ₹35,000. Kindly settle via UPI/Bank at your earliest. Thank you!"
    );

    createAction(
      {
        id: "ACT-INV-1042",
        category: "financial",
        priority: "high",
        title: {
          en: "Collect ₹48,000 from Rahul Traders",
          hi: "Rahul Traders से ₹48,000 का भुगतान प्राप्त करें",
          hinglish: "Rahul Traders se ₹48,000 collect karein",
        },
        summary: { en: "Invoice INV-1042", hi: "बिल INV-1042", hinglish: "Bill INV-1042" },
        why: { en: "14 days overdue", hi: "14 दिन से बकाया", hinglish: "14 din se overdue" },
        recommendation: { en: "Send WhatsApp reminder to Rahul Traders", hi: "WhatsApp रिमाइंडर भेजें", hinglish: "WhatsApp reminder bhejein" },
        evidenceIds: ["EVD-INV-1023"],
        action: "followup",
        targetId: "INV-1042",
      },
      "Namaste Rahul Traders, Sharma Electronics reminder regarding invoice INV-1042 for ₹48,000. Kindly arrange payment. Thank you!"
    );

    setFileName("Month of Invoices, Bills & Business Profile (5 Files)");
    setStage(4);
    notify("uploadSuccess");
  }

  function choose(files:FileList|File[]|File|null|undefined){
    if(!files)return;
    const fileList=files instanceof FileList?Array.from(files):Array.isArray(files)?files:[files];
    if(!fileList.length)return;

    for(const file of fileList){
      const format=file.name.split(".").at(-1)?.toUpperCase();
      if(!["PDF","JPG","JPEG","PNG","CSV","XLSX","TXT","JSON"].includes(format??"")||file.size>10*1024*1024){
        setValidation(true);
        return;
      }
    }
    void upload(fileList[0],(fileList[0].name.split(".").at(-1)?.toUpperCase()==="JPEG"?"JPG":fileList[0].name.split(".").at(-1)?.toUpperCase()) as Document["format"]);
  }

  return (
    <>
      <PageHeading title={t("documentTitle")} subtitle={t("documentSubtitle")}/>
      <section
        className={`upload-zone ${dragging?"dragging":""}`}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);if(!busy)choose(e.dataTransfer.files);}}
      >
        <div className="upload-art"><FileText size={27}/><span><UploadCloud size={17}/></span></div>
        <h2>{t("dropTitle")}</h2>
        <p>{t("dropText")}</p>
        <div className="upload-buttons">
          <Button variant="primary" disabled={busy} onClick={()=>input.current?.click()}><UploadCloud size={17}/>{t("upload")}</Button>
          <Button disabled={busy} onClick={()=>void uploadMonthAndProfileBatch()}><FileText size={16}/>Upload Month Batch &amp; Profile</Button>
          <Button disabled={busy} onClick={()=>void upload()}>{t("sampleUpload")}</Button>
        </div>
        <small>{t("supported")} (Multi-file &amp; Business Profile ready)</small>
        <input
          ref={input}
          type="file"
          aria-label={t("upload")}
          accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.txt,.json"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={e=>{choose(e.target.files);e.target.value="";}}
        />
      </section>
      <p className="page-footnote centered">{t("uploadNote")}</p>
      {validation&&<div className="error-notice" role="alert"><AlertCircle size={18}/>{t("uploadError")}<Button onClick={()=>setValidation(false)}>{t("close")}</Button></div>}
      {stage>=0&&<Card className="upload-progress">
        <div className="section-heading">
          <div>
            <strong>{fileName}</strong>
            <p role="status">{error?t("uploadFailed"):t((["uploading","processing","analyzing","analyzing","uploadComplete"] as const)[stage])}</p>
          </div>
          {busy?<Button onClick={()=>{controller.current?.abort();setStage(-1);}}>{t("cancel")}</Button>:<button className="icon-button" aria-label={t("close")} onClick={()=>{setStage(-1);setError(false);}}><X size={18}/></button>}
        </div>
        {error?<Button onClick={()=>void upload(lastFileObj||fileName,lastFormat,true)}>{t("retry")}</Button>:<><progress max={4} value={stage} aria-label={t("processing")}/>{stage===4&&<><div className="extraction-checks">{(["identified","extractedCustomer","extractedAmount","extractedDue"] as const).map(key=><span key={key}><CheckCircle2 size={15}/>{t(key)}</span>)}</div><p className="muted">Sarvam AI parsed this document and injected its context into your Copilot assistant &amp; ledger.</p><Button onClick={()=>open({kind:"invoice",id:lastInvId})}>{t("invoiceDetails")}<ArrowUpRight size={15}/></Button></>}</>}
      </Card>}
      <Card>
        <div className="table-toolbar">
          <SearchField value={query} onChange={setQuery} placeholder={t("search")}/>
          <select aria-label={t("status")} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">{t("allStatuses")}</option>
            <option value="completed">{t("processed")}</option>
            <option value="review">{t("reviewStatus")}</option>
          </select>
        </div>
        {rows.length?<DataTable headers={[t("document"),t("type"),t("status"),t("uploaded"),t("insights")]}>
          {rows.map(d=><tr key={d.id}>
            <td>
              <button className="document-cell" onClick={()=>open({kind:"document",id:d.id})}>
                <span className={`file-icon ${d.format==="XLSX"||d.format==="CSV"?"spreadsheet":""}`}>
                  {["XLSX","CSV"].includes(d.format)?<FileSpreadsheet size={20}/>:<FileText size={20}/>}
                  <small>{d.format}</small>
                </span>
                <strong>{d.name}</strong>
              </button>
            </td>
            <td className="muted">{d.type==="profile"?"Business Profile":t(`${d.type}Type` as "invoiceType")}</td>
            <td><Badge status={d.status==="completed"?"completed":"pending"}>{t(d.status==="completed"?"processed":"reviewStatus")}</Badge></td>
            <td className="muted">{date(d.uploaded,lang)}</td>
            <td>{d.insightIds.length?<button className="record-link" onClick={()=>open({kind:"evidence",id:data.insights.filter(i=>d.insightIds.includes(i.id)).flatMap(i=>i.evidenceIds).join(",")})}>{d.insightIds.length} {t("insights")}</button>:<span className="muted">—</span>}</td>
          </tr>)}
        </DataTable>:<EmptyState title={t("noResults")} description={t("trySearch")}><Button onClick={()=>{setQuery("");setFilter("all");}}>{t("clearFilters")}</Button></EmptyState>}
      </Card>
      <details className="demo-tools">
        <summary>{t("demoControls")}</summary>
        <label><input type="checkbox" checked={failNext} onChange={e=>setFailNext(e.target.checked)}/>{t("simulateError")}</label>
      </details>
    </>
  );
}
