"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BusinessData, Insight, Language, LocalState, InsightStatus, Document, Conversation, Payment, Invoice, Customer, Product, PaymentPromise, CollectionFollowup } from "@/lib/types";
import { translate, type TranslationKey } from "@/lib/i18n";
import { businessService, auditService, eventBus } from "@/lib/services";
type Panel = {kind:"invoice"|"customer"|"vendor"|"product"|"document"|"evidence"|"action";id:string}|{kind:"actions"|"search"|"more"|"help"|"reset"|"createInvoice"|"createCustomer"|"createProduct"}|{kind:"recordPayment";invoiceId?:string}|{kind:"editProduct";productId:string}|{kind:"udhaarCustomer";customerId:string}|{kind:"recordPromise";customerId:string}|{kind:"recordFollowup";customerId:string};
const initial:LocalState={language:"en",theme:"dark",insightStatuses:{},actions:[],uploadedDocuments:[],conversations:[],customPayments:[],customInvoices:[],customCustomers:[],customVendors:[],customProducts:[],deletedProductIds:[],productOverrides:{},paymentPromises:[],collectionFollowups:[]};
const storageKey="vyaparai-demo-v1";
interface AppContextValue {
  data:BusinessData|null;
  local:LocalState;
  t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;
  lang:Language;
  setLanguage:(lang:Language)=>void;
  theme:"dark"|"light";
  setTheme:(theme:"dark"|"light")=>void;
  panel:Panel|null;
  open:(p:Panel)=>void;
  close:()=>void;
  notify:(key:TranslationKey)=>void;
  toast:string|null;
  clearToast:()=>void;
  status:(id:string)=>InsightStatus;
  setStatus:(id:string,status:InsightStatus)=>void;
  createAction:(insight:Insight,note:string)=>void;
  completeAction:(id:string)=>void;
  addDocument:(doc:Document)=>void;
  saveConversation:(c:Conversation)=>void;
  recordPayment:(p:Omit<Payment,"id">&{id?:string})=>void;
  createInvoice:(i:Omit<Invoice,"id">&{id?:string})=>void;
  createCustomer:(c:Omit<Customer,"id">&{id?:string})=>void;
  createProduct:(p:Omit<Product,"id">&{id?:string})=>void;
  updateProduct:(id:string,updates:Partial<Product>)=>void;
  deleteProduct:(id:string)=>void;
  recordPaymentPromise:(p:Omit<PaymentPromise,"id"|"createdAt">&{id?:string})=>void;
  recordFollowup:(f:Omit<CollectionFollowup,"id"|"createdAt">&{id?:string})=>void;
  updatePromiseStatus:(id:string,status:"fulfilled"|"missed"|"cancelled")=>void;
  reset:()=>void;
  demoState:"normal"|"loading"|"error"|"empty";
  setDemoState:(s:"normal"|"loading"|"error"|"empty")=>void;
  reload:()=>void;
}
const AppContext=createContext<AppContextValue|null>(null);
export function AppProvider({children}:{children:ReactNode}){
 const [data,setData]=useState<BusinessData|null>(null);const [local,setLocal]=useState<LocalState>(initial);const [ready,setReady]=useState(false);const [panel,setPanel]=useState<Panel|null>(null);const [toast,setToast]=useState<TranslationKey|null>(null);const [demoState,setDemoState]=useState<AppContextValue["demoState"]>("normal");
 const reload=useCallback(()=>{setDemoState("normal");businessService.load().then(setData).catch(()=>setDemoState("error"));},[]);
 useEffect(()=>{let active=true;businessService.load().then(result=>{if(!active)return;setData(result);try{const raw=localStorage.getItem(storageKey);if(raw){const s=JSON.parse(raw) as Partial<LocalState>;if(["en","hi","hinglish"].includes(s.language??"")&&Array.isArray(s.actions)&&Array.isArray(s.uploadedDocuments)&&Array.isArray(s.conversations)&&s.insightStatuses&&typeof s.insightStatuses==="object")setLocal(prev=>({...prev,...s}));}}catch{/* A corrupt or unavailable store falls back to the original demo. */}setReady(true);}).catch(()=>setDemoState("error"));return()=>{active=false;};},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(storageKey,JSON.stringify(local));}catch{/* The app remains usable if storage is unavailable. */}document.documentElement.lang=local.language==="hi"?"hi":local.language==="hinglish"?"hi-Latn":"en";const th=local.theme??"dark";if(th==="dark"){document.documentElement.classList.add("dark");document.documentElement.setAttribute("data-theme","dark");}else{document.documentElement.classList.remove("dark");document.documentElement.setAttribute("data-theme","light");}},[local,ready]);
 const t=(key:TranslationKey,vars?:Record<string,string|number>)=>translate(local.language,key,vars);

 const mergedData:BusinessData|null=useMemo(()=>{
  if(!data)return null;
  const deletedIds=new Set(local.deletedProductIds??[]);
  const overrides=local.productOverrides??{};
  const allProds=[...(local.customProducts??[]),...data.products.filter(p=>!(local.customProducts??[]).some(cp=>cp.id===p.id))];
  const finalProds=allProds.filter(p=>!deletedIds.has(p.id)).map(p=>overrides[p.id]?{...p,...overrides[p.id]}:p);
  return {
   ...data,
   invoices:[...(local.customInvoices??[]),...data.invoices],
   payments:[...(local.customPayments??[]),...data.payments],
   customers:[...(local.customCustomers??[]),...data.customers],
   vendors:[...(local.customVendors??[]),...data.vendors],
   products:finalProds
  };
 },[data,local.customInvoices,local.customPayments,local.customCustomers,local.customVendors,local.customProducts,local.deletedProductIds,local.productOverrides]);

 const recordPayment=useCallback((p:Omit<Payment,"id">&{id?:string})=>{
  const newPay:Payment={...p,id:p.id||`PAY-${Date.now().toString().slice(-5)}`};
  setLocal(s=>({...s,customPayments:[newPay,...(s.customPayments??[])]}));
  setToast("saved");
  void eventBus.emit({type:"PaymentReceived",businessId:"BIZ-1",payload:{invoiceId:newPay.invoiceId,amount:newPay.amount,customerId:newPay.customerId}});
  void auditService.log({businessId:"BIZ-1",action:"PaymentRecorded",actor:"ShopOwner",entityType:"payment",entityId:newPay.id,details:`Payment of ₹${newPay.amount.toLocaleString("en-IN")} recorded via ${newPay.method.toUpperCase()} for ${newPay.invoiceId}`});
 },[]);

 const createInvoice=useCallback((i:Omit<Invoice,"id">&{id?:string})=>{
  const newInv:Invoice={...i,id:i.id||`INV-${1041+(local.customInvoices?.length??0)}`};
  setLocal(s=>({...s,customInvoices:[newInv,...(s.customInvoices??[])]}));
  setToast("saved");
  void eventBus.emit({type:"InvoiceCreated",businessId:"BIZ-1",payload:{invoiceId:newInv.id,customerId:newInv.customerId,total:newInv.total}});
  void auditService.log({businessId:"BIZ-1",action:"InvoiceCreated",actor:"ShopOwner",entityType:"invoice",entityId:newInv.id,details:`Tax invoice ${newInv.id} created for ₹${newInv.total.toLocaleString("en-IN")}`});
 },[local.customInvoices]);

 const createCustomer=useCallback((c:Omit<Customer,"id">&{id?:string})=>{
  const newCust:Customer={...c,id:c.id||`CUS-${1016+(local.customCustomers?.length??0)}`};
  setLocal(s=>({...s,customCustomers:[newCust,...(s.customCustomers??[])]}));
  setToast("saved");
  void auditService.log({businessId:"BIZ-1",action:"CustomerCreated",actor:"ShopOwner",entityType:"customer",entityId:newCust.id,details:`Customer ${newCust.name} registered`});
 },[local.customCustomers]);

 const createProduct=useCallback((p:Omit<Product,"id">&{id?:string})=>{
  const newProd:Product={...p,id:p.id||`PRD-${31+(local.customProducts?.length??0)}`};
  setLocal(s=>({...s,customProducts:[newProd,...(s.customProducts??[])]}));
  setToast("saved");
  void auditService.log({businessId:"BIZ-1",action:"ProductCreated",actor:"ShopOwner",entityType:"product",entityId:newProd.id,details:`Inventory SKU ${newProd.sku} (${newProd.name}) registered`});
 },[local.customProducts]);

 const updateProduct=useCallback((id:string,updates:Partial<Product>)=>{
  setLocal(s=>{
   const isCustom=(s.customProducts??[]).some(p=>p.id===id);
   if(isCustom){
    return {...s,customProducts:(s.customProducts??[]).map(p=>p.id===id?{...p,...updates}:p)};
   }
   return {
    ...s,
    productOverrides:{...(s.productOverrides??{}),[id]:{...(s.productOverrides?.[id]??{}),...updates}}
   };
  });
  setToast("saved");
  void auditService.log({businessId:"BIZ-1",action:"ProductUpdated",actor:"ShopOwner",entityType:"product",entityId:id,details:`Inventory product ${id} modified`});
 },[]);

 const deleteProduct=useCallback((id:string)=>{
  setLocal(s=>({
   ...s,
   customProducts:(s.customProducts??[]).filter(p=>p.id!==id),
   deletedProductIds:Array.from(new Set([...(s.deletedProductIds??[]),id]))
  }));
  setToast("saved");
  void auditService.log({businessId:"BIZ-1",action:"ProductDeleted",actor:"ShopOwner",entityType:"product",entityId:id,details:`Inventory product ${id} removed`});
 },[]);

 const recordPaymentPromise=useCallback((p:Omit<PaymentPromise,"id"|"createdAt">&{id?:string})=>{
  const newPromise:PaymentPromise={...p,id:p.id||`PRM-${Date.now().toString().slice(-6)}`,createdAt:new Date().toISOString()};
  setLocal(s=>({...s,paymentPromises:[newPromise,...(s.paymentPromises??[])]}));
  setToast("promiseRecorded");
  void eventBus.emit({type:"PaymentPromiseRecorded",businessId:newPromise.businessId||"BIZ-1",payload:{customerId:newPromise.customerId,amount:newPromise.expectedAmount,date:newPromise.expectedDate}});
  void auditService.log({businessId:newPromise.businessId||"BIZ-1",action:"PaymentPromiseRecorded",actor:newPromise.recordedBy||"ShopOwner",entityType:"payment_promise",entityId:newPromise.id,details:`Payment promise of ₹${newPromise.expectedAmount.toLocaleString("en-IN")} recorded for ${newPromise.expectedDate} by customer ${newPromise.customerId}`});
 },[]);

 const recordFollowup=useCallback((f:Omit<CollectionFollowup,"id"|"createdAt">&{id?:string})=>{
  const newFollowup:CollectionFollowup={...f,id:f.id||`FOL-${Date.now().toString().slice(-6)}`,createdAt:new Date().toISOString()};
  setLocal(s=>({...s,collectionFollowups:[newFollowup,...(s.collectionFollowups??[])]}));
  setToast("followupRecorded");
  void auditService.log({businessId:newFollowup.businessId||"BIZ-1",action:"CollectionFollowupLogged",actor:newFollowup.recordedBy||"ShopOwner",entityType:"collection_followup",entityId:newFollowup.id,details:`${newFollowup.channel.toUpperCase()} follow-up (${newFollowup.status}) recorded for customer ${newFollowup.customerId}`});
 },[]);

 const updatePromiseStatus=useCallback((id:string,status:"fulfilled"|"missed"|"cancelled")=>{
  setLocal(s=>({...s,paymentPromises:(s.paymentPromises??[]).map(p=>p.id===id?{...p,status,updatedAt:new Date().toISOString()}:p)}));
  setToast("saved");
  void auditService.log({businessId:"BIZ-1",action:"PaymentPromiseStatusUpdated",actor:"ShopOwner",entityType:"payment_promise",entityId:id,details:`Payment promise ${id} marked as ${status}`});
 },[]);

 const value:AppContextValue={
  data:mergedData,local,t,lang:local.language,
  setLanguage:language=>setLocal(s=>({...s,language})),
  theme:local.theme??"dark",
  setTheme:theme=>setLocal(s=>({...s,theme})),
  panel,open:setPanel,close:()=>setPanel(null),
  notify:setToast,toast:toast?t(toast):null,clearToast:()=>setToast(null),
  status:id=>local.insightStatuses[id]??"open",
  setStatus:(id,status)=>{setLocal(s=>({...s,insightStatuses:{...s.insightStatuses,[id]:status}}));setToast(status==="handled"?"insightHandled":status==="dismissed"?"insightDismissed":"restored");},
  createAction:(insight,note)=>{if(local.actions.some(a=>a.insightId===insight.id&&a.status==="open")){setToast("reminderExists");setPanel({kind:"actions"});return;}setLocal(s=>({...s,actions:[{id:crypto.randomUUID(),insightId:insight.id,kind:insight.action,status:"open",createdAt:new Date().toISOString(),note,channel:"whatsapp",draftMessage:note,recipientName:typeof insight.summary==="object"?insight.summary[s.language]:undefined},...s.actions]}));setToast("actionCreated");setPanel({kind:"actions"});},
  completeAction:id=>{setLocal(s=>({...s,actions:s.actions.map(a=>a.id===id?{...a,status:"completed"}:a)}));setToast("actionComplete");},
  addDocument:doc=>setLocal(s=>({...s,uploadedDocuments:[doc,...s.uploadedDocuments]})),
  saveConversation:c=>setLocal(s=>({...s,conversations:[c,...s.conversations.filter(v=>v.id!==c.id)]})),
  recordPayment,createInvoice,createCustomer,createProduct,updateProduct,deleteProduct,
  recordPaymentPromise,recordFollowup,updatePromiseStatus,
  reset:()=>{setLocal({...initial,language:local.language});setDemoState("normal");setPanel(null);setToast("resetDone");},
  demoState,setDemoState,reload
 };
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const context=useContext(AppContext);if(!context)throw new Error("AppProvider is required");return context;}
