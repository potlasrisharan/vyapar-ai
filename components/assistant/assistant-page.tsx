"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowUpRight, FileText, Lightbulb, Package, Plus, Wallet, Zap, MessageSquare, Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { assistantService } from "@/lib/services";
import { promptKeys,responseText } from "@/lib/mock/assistant";
import type { Conversation, PromptId } from "@/lib/types";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import { money } from "@/lib/utils/format";
const prompts=Object.keys(promptKeys) as (keyof typeof promptKeys)[];
const icons={today:Lightbulb,owes:Wallet,expenses:Zap,stock:Package,summary:FileText};

export function AssistantPage(){
  const {data,local,t,lang,open,saveConversation}=useApp();
  const [conversation,setConversation]=useState<Conversation>(()=>local.conversations[0]??{id:crypto.randomUUID(),messages:[]});
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const [recording,setRecording]=useState(false);
  const [playingId,setPlayingId]=useState<string|null>(null);
  const mediaRecorder=useRef<MediaRecorder|null>(null);
  const audioChunks=useRef<Blob[]>([]);
  const end=useRef<HTMLDivElement>(null);
  const generation=useRef(0);
  const active=useRef(true);

  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  useEffect(()=>{end.current?.scrollIntoView({behavior:"instant",block:"nearest"});},[conversation.messages.length,busy]);

  async function toggleRecording(){
    if(recording){
      mediaRecorder.current?.stop();
      setRecording(false);
      return;
    }
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const recorder=new MediaRecorder(stream);
      audioChunks.current=[];
      recorder.ondataavailable=(e)=>{if(e.data.size>0)audioChunks.current.push(e.data);};
      recorder.onstop=async()=>{
        const audioBlob=new Blob(audioChunks.current,{type:"audio/wav"});
        const formData=new FormData();
        formData.append("file",audioBlob,"recording.wav");
        formData.append("language_code",lang==="hi"?"hi-IN":"en-IN");
        setBusy(true);
        try{
          const res=await fetch("/api/ai/voice/stt",{method:"POST",body:formData});
          if(res.ok){
            const json=await res.json();
            if(json.transcript){
              setInput(json.transcript);
              void ask(json.transcript);
            }
          }
        }catch(e){
          console.error("STT error:",e);
        }finally{
          setBusy(false);
        }
      };
      mediaRecorder.current=recorder;
      recorder.start();
      setRecording(true);
    }catch(err){
      console.warn("Microphone not allowed or unavailable",err);
    }
  }

  async function playVoice(id:string,text:string){
    if(playingId===id){setPlayingId(null);return;}
    setPlayingId(id);
    try{
      const res=await fetch("/api/ai/voice/tts",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text:text.slice(0,350),languageCode:lang==="hi"?"hi-IN":"en-IN"}),
      });
      if(res.ok){
        const json=await res.json();
        if(json.audio){
          const audio=new Audio(`data:audio/wav;base64,${json.audio}`);
          audio.onended=()=>setPlayingId(null);
          audio.onerror=()=>setPlayingId(null);
          await audio.play();
          return;
        }
      }
    }catch(err){
      console.error("TTS error:",err);
    }
    setPlayingId(null);
  }

  if(!data)return null;

  async function ask(question:string,id?:PromptId){
    if(!question.trim()||busy)return;
    const run=++generation.current;
    const user={id:crypto.randomUUID(),role:"user" as const,text:question.trim(),promptId:id,evidenceIds:[],createdAt:new Date().toISOString()};
    const next={...conversation,messages:[...conversation.messages,user]};
    setConversation(next);
    setInput("");
    setBusy(true);
    setFailed(false);
    try{
      const reply=await assistantService.ask(question,lang,id);
      if(!active.current||run!==generation.current)return;
      const result={...next,messages:[...next.messages,reply]};
      setConversation(result);
      saveConversation(result);
    }catch{
      setFailed(true);
    }finally{
      if(active.current&&run===generation.current)setBusy(false);
    }
  }

  function newChat(){
    generation.current++;
    setBusy(false);
    setFailed(false);
    setConversation({id:crypto.randomUUID(),messages:[]});
    setInput("");
  }

  return <>
    <PageHeading title="VyaparAI" subtitle={t("assistantSubtitle")}>
      <Button onClick={newChat}><Plus size={16}/>{t("newConversation")}</Button>
    </PageHeading>
    <div className="assistant-layout">
      <div className="conversation-card">
        <div className="conversation-scroll">
          {!conversation.messages.length ? (
            <div className="assistant-welcome">
              <div className="assistant-emblem"><MessageSquare size={28}/></div>
              <span className="eyebrow">{t("copilot")}</span>
              <h2>{t("copilotIntro")}</h2>
              <p>{t("copilotDescription")}</p>
              <span className="suggested-label">{t("suggested")}</span>
              <div className="prompt-grid">
                {prompts.map(id=>{
                  const Icon=icons[id];
                  return <button key={id} disabled={busy} onClick={()=>void ask(t(promptKeys[id]),id)}><Icon size={19}/><span>{t(promptKeys[id])}</span><ArrowUpRight size={16}/></button>;
                })}
              </div>
            </div>
          ) : (
            <div className="messages">
              {conversation.messages.map(m=>{
                const displayText = m.role==="assistant" && m.promptId && m.promptId!=="unknown" && (promptKeys as Record<string, string>)[m.promptId] ? responseText(m.promptId,lang) : m.text;
                return (
                  <article className={`message ${m.role}`} key={m.id}>
                    <div className="message-label" style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                        {m.role==="assistant"?<MessageSquare size={16}/>:<span className="avatar tiny">RS</span>}
                        <strong>{m.role==="assistant"?"VyaparAI (Sarvam 105B)":t("yourQuestion")}</strong>
                      </div>
                      {m.role==="assistant" && (
                        <button
                          type="button"
                          className={`voice-play-btn ${playingId===m.id?"playing":""}`}
                          onClick={()=>void playVoice(m.id, displayText)}
                          aria-label="Listen via Sarvam Voice"
                          title="Listen with Sarvam Bulbul TTS"
                        >
                          {playingId===m.id ? <Loader2 size={13} className="spin"/> : <Volume2 size={13}/>}
                          <span>{playingId===m.id ? "Playing…" : "Listen"}</span>
                        </button>
                      )}
                    </div>
                    <div className="message-text">{displayText}</div>
                    {m.evidenceIds.length>0&&<div className="message-evidence"><span>{t("sources")}</span>{m.evidenceIds.map(id=><button key={id} onClick={()=>open({kind:"evidence",id})}><FileText size={13}/>{data.evidence.find(e=>e.id===id)?.label}<ArrowUpRight size={12}/></button>)}</div>}
                    {m.role==="assistant"&&<>
                      <small className="message-disclaimer">{t("mockResponse")}</small>
                      {m.promptId==="today"||m.promptId==="owes"?<Button onClick={()=>open({kind:"action",id:"INS-1"})}>{t("followup")}<ArrowUpRight size={14}/></Button>:null}
                    </>}
                  </article>
                );
              })}
              {busy&&<div className="thinking" role="status"><span className="loading-dot"/>{t("thinking")}</div>}
              {failed&&<EmptyState title={t("loadError")} description={t("retry")}><Button onClick={()=>void ask(conversation.messages.at(-1)?.text??t("promptToday"))}>{t("retry")}</Button></EmptyState>}
              <div ref={end}/>
            </div>
          )}
        </div>
        <form className="composer" onSubmit={e=>{e.preventDefault();void ask(input);}}>
          <label className="sr-only" htmlFor="assistant-input">{t("askPlaceholder")}</label>
          <textarea id="assistant-input" placeholder={t("askPlaceholder")} value={input} rows={2} maxLength={1000} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void ask(input);}}}/>
          <div className="composer-bottom">
            <span>
              {recording ? (
                <span className="recording-status">
                  <span className="rec-dot"/>
                  Recording… (Saaras STT)
                </span>
              ) : (
                <>
                  <span className="status-dot"/>
                  {t("sampleData")}
                </>
              )}
            </span>
            <div className="composer-actions">
              <button
                type="button"
                className={`voice-record-btn ${recording?"recording":""}`}
                onClick={()=>void toggleRecording()}
                title={recording?"Stop recording":"Voice input (Sarvam Saaras STT)"}
                aria-label={recording?"Stop recording":"Record voice query"}
              >
                {recording ? <MicOff size={15}/> : <Mic size={15}/>}
                <span>{recording ? "Stop" : "Speak"}</span>
              </button>
              <Button variant="primary" type="submit" aria-label={t("send")} disabled={busy||!input.trim()}><ArrowUp size={19}/></Button>
            </div>
          </div>
        </form>
        <p className="assistant-footnote">{t("assistantNote")}</p>
      </div>
      <aside className="assistant-context">
        <Card>
          <span className="eyebrow">{t("copilotContext")}</span>
          <h3>{t("business")}</h3>
          <p>{t("location")}</p>
          <div className="context-summary">
            <div><span>{t("revenue")}</span><strong>{money(482000)}</strong></div>
            <div><span>{t("outstanding")}</span><strong>{money(82000)}</strong></div>
            <div><span>{t("lowStock")}</span><strong>5 {t("products")}</strong></div>
          </div>
          <span className="context-period">{t("aboutMonth")}</span>
        </Card>
        <Card>
          <span className="eyebrow">{t("records")}</span>
          <div className="connected-record"><FileText size={17}/><span>40 {t("invoices")}</span><span className="status-dot"/></div>
          <div className="connected-record"><Package size={17}/><span>30 {t("products")}</span><span className="status-dot"/></div>
          <div className="connected-record"><Wallet size={17}/><span>11 {t("expenses")}</span><span className="status-dot"/></div>
        </Card>
        {conversation.messages.length>0&&<Card><span className="eyebrow">{t("suggested")}</span>{prompts.map(id=><button className="context-prompt" key={id} disabled={busy} onClick={()=>void ask(t(promptKeys[id]),id)}><MessageSquare size={14}/>{t(promptKeys[id])}</button>)}</Card>}
        {local.conversations.length>0&&<Card><span className="eyebrow">{t("history")}</span>{local.conversations.slice(0,4).map(c=><button className="history-item" key={c.id} onClick={()=>{generation.current++;setBusy(false);setConversation(c);}}>{c.messages[0]?.promptId&&c.messages[0].promptId!=="unknown"?t(promptKeys[c.messages[0].promptId]):c.messages[0]?.text}</button>)}</Card>}
      </aside>
    </div>
  </>;
}

