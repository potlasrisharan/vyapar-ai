"use client";
import { useEffect, useState } from "react";
import { Database, RotateCcw, Monitor, Languages, ChevronDown, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { BusinessMini, LanguageSwitcher } from "@/components/layout/shell";
import { Button, Card, FieldPair, PageHeading, SectionHeading } from "@/components/ui";
import { models } from "@/lib/mock/ai";
export function SettingsPage(){
  const {t,open,setDemoState}=useApp();
  const [logs,setLogs]=useState<import("@/lib/types").AuditLogEntry[]>([]);
  useEffect(()=>{
    import("@/lib/services").then(s=>s.auditService.getLogs()).then(setLogs).catch(()=>{});
  },[]);

  return <><PageHeading title={t("settings")} subtitle={t("settingsSubtitle")}/><div className="settings-grid"><div><Card className="settings-card"><SectionHeading title={t("businessProfile")}/><BusinessMini/><FieldPair label={t("owner")}>Ramesh Sharma</FieldPair><FieldPair label={t("city")}>Kanpur, Uttar Pradesh</FieldPair><FieldPair label="GSTIN">09AABCU9603R1ZM</FieldPair><FieldPair label="AWS Region">ap-southeast-2 (Sydney)</FieldPair><FieldPair label={t("type")}>{t("retailer")}</FieldPair><span className="prototype-label">{t("sampleData")}</span></Card><Card className="settings-card"><SectionHeading title={t("preferences")}/><div className="preference-row"><Languages size={20}/><div><h3>{t("language")}</h3><p>{t("languageDescription")}</p></div><LanguageSwitcher/></div><div className="preference-row"><Monitor size={20}/><div><h3>{t("appearance")}</h3><p>{t("systemAppearance")}</p></div></div></Card></div><div><Card className="settings-card"><SectionHeading title={t("demoControls")}/><p>{t("demoControlsNote")}</p><div className="settings-buttons"><Button onClick={()=>{setDemoState("loading");setTimeout(()=>setDemoState("normal"),2200);}}>{t("previewLoading")}</Button><Button onClick={()=>setDemoState("error")}>{t("previewError")}</Button><Button onClick={()=>setDemoState("empty")}>{t("previewEmpty")}</Button></div><Button variant="danger" onClick={()=>open({kind:"reset"})}><RotateCcw size={15}/>{t("reset")}</Button></Card><Card className="settings-card privacy-card"><ShieldCheck size={24}/><p>{t("privacyNote")}</p><small>AWS IAM Role & ap-southeast-2 CloudWatch Compliant</small></Card></div></div>
  <div style={{marginTop:"1.5rem"}}>
    <Card className="settings-card">
      <SectionHeading title="Audit Trail & Event Provenance (R29)" description="Deterministic, timestamped record of business ledger operations and AI insights"/>
    <div className="activity-list" style={{marginTop:"1rem"}}>
      {logs.slice(0,6).map(log=>(
        <div key={log.id} className="activity-row" style={{cursor:"default"}}>
          <span className="activity-icon teal"><ShieldCheck size={16}/></span>
          <span>
            <strong>{log.action}</strong>
            <small>{log.details}</small>
          </span>
          <span style={{textAlign:"right"}}>
            <strong>{log.actor}</strong>
            <small>{log.timestamp.slice(0,10)}</small>
          </span>
        </div>
      ))}
    </div>
  </Card>
  </div>
  <details className="developer-panel"><summary><Database size={17}/>{t("developerStatus")}<ChevronDown size={16}/></summary><p>{t("mockOnly")}</p><div className="model-grid">{models.map(m=><div key={m.id}><span>{t(m.task==="document"?"documentUnderstanding":m.task==="reasoning"?"businessReasoning":"multilingualModel")}</span><strong>{m.provider}</strong><small>{m.mode.toUpperCase()}</small></div>)}</div></details></>;}

