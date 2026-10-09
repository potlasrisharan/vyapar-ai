"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, FileText, IndianRupee, MessageSquare, Package, Receipt, CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { businessTotals } from "@/lib/mock/business";
import { invoiceStatus } from "@/lib/mock/invoices";
import { money, date } from "@/lib/utils/format";
import { InsightCard } from "@/components/insights/insight-card";
import { Badge, Card, MetricCard, SectionHeading } from "@/components/ui";
import { RevenueChart } from "./revenue-chart";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HI_WEEKDAYS = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
const HI_MONTHS = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

export function Overview(){
  const {data,t,lang,status,open}=useApp();
  const [activity,setActivity]=useState("all");
  const [calendarOpen,setCalendarOpen]=useState(false);
  const [selectedPeriod,setSelectedPeriod]=useState<string>("October 2026");
  const [calDate,setCalDate]=useState({year:2026,month:9}); // 9 = October
  const [selectedDay,setSelectedDay]=useState<number>(9);
  const [selectedMonth,setSelectedMonth]=useState<number>(9);
  const [selectedYear,setSelectedYear]=useState<number>(2026);
  const eyebrowRef=useRef<HTMLButtonElement>(null);
  const calendarRef=useRef<HTMLDivElement>(null);
  const router=useRouter();

  useEffect(()=>{
    const handleOutsideClick=(e:MouseEvent)=>{
      const target=e.target as Node;
      if(
        calendarRef.current&&!calendarRef.current.contains(target)&&
        !eyebrowRef.current?.contains(target)
      ){
        setCalendarOpen(false);
      }
    };
    if(calendarOpen){
      document.addEventListener("mousedown",handleOutsideClick);
    }
    return()=>document.removeEventListener("mousedown",handleOutsideClick);
  },[calendarOpen]);

  if(!data)return null;
  const totals=businessTotals(data);
  const priorities=data.insights.slice(0,3).filter(i=>status(i.id)==="open");

  const prevMonth=()=>{
    setCalDate(c=>c.month===0?{year:c.year-1,month:11}:{year:c.year,month:c.month-1});
  };
  const nextMonth=()=>{
    setCalDate(c=>c.month===11?{year:c.year+1,month:0}:{year:c.year,month:c.month+1});
  };

  const daysInMonth=new Date(calDate.year,calDate.month+1,0).getDate();
  const firstDayIndex=new Date(calDate.year,calDate.month,1).getDay();

  const handleSelectDay=(day:number)=>{
    setSelectedDay(day);
    setSelectedMonth(calDate.month);
    setSelectedYear(calDate.year);
    setSelectedPeriod(`${day} ${MONTH_NAMES[calDate.month].slice(0,3)} ${calDate.year}`);
    setCalendarOpen(false);
  };

  const handleSelectPreset=(preset:string)=>{
    setSelectedPeriod(preset);
    if(preset==="Today (9 Oct 2026)"||preset==="October 2026"){
      setCalDate({year:2026,month:9});
      setSelectedMonth(9);
      setSelectedYear(2026);
      setSelectedDay(9);
    }else if(preset==="September 2026"){
      setCalDate({year:2026,month:8});
      setSelectedMonth(8);
      setSelectedYear(2026);
      setSelectedDay(30);
    }else if(preset==="Last 30 Days"){
      setCalDate({year:2026,month:9});
      setSelectedMonth(9);
      setSelectedYear(2026);
      setSelectedDay(9);
    }else if(preset==="Q3 2026"){
      setCalDate({year:2026,month:8});
      setSelectedMonth(8);
      setSelectedYear(2026);
      setSelectedDay(30);
    }else if(preset==="FY 2026-27"){
      setCalDate({year:2026,month:9});
      setSelectedMonth(9);
      setSelectedYear(2026);
      setSelectedDay(9);
    }
    setCalendarOpen(false);
  };

  const currDateObj=new Date(selectedYear,selectedMonth,selectedDay);
  const formattedEyebrowDate=lang==="hi"
    ?`${HI_WEEKDAYS[currDateObj.getDay()]}, ${selectedDay} ${HI_MONTHS[selectedMonth]} ${selectedYear}`
    :`${WEEKDAY_NAMES[currDateObj.getDay()]}, ${selectedDay} ${MONTH_NAMES[selectedMonth].slice(0,3)} ${selectedYear}`;

  return <>
    <div className="overview-heading">
      <div>
        <div className="eyebrow">
          <button 
            type="button" 
            ref={eyebrowRef}
            className={`eyebrow-date-btn ${calendarOpen?"active":""}`} 
            onClick={()=>setCalendarOpen(o=>!o)} 
            title="Open calendar date picker"
            aria-expanded={calendarOpen}
          >
            <CalendarDays size={14}/>
            <span>{formattedEyebrowDate}</span>
          </button>
        </div>
        <h1>{t("greeting")} <span>{t("owner")}</span></h1>
        <p>{t("attention")}</p>
      </div>
      <div className="period-chip-container" ref={calendarRef}>
        <button 
          className="period-chip interactive" 
          type="button" 
          onClick={()=>setCalendarOpen(o=>!o)} 
          aria-expanded={calendarOpen}
          aria-label="Select reporting calendar date"
        >
          <CalendarDays size={15}/>
          <span>{selectedPeriod}</span>
          <ChevronRight size={13} style={{transform:calendarOpen?"rotate(90deg)":"none",transition:"transform 0.15s ease"}}/>
        </button>
        {calendarOpen&&(
          <div className="calendar-popover" role="dialog" aria-label="Calendar date picker">
            <div className="cal-popover-header">
              <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={14}/></button>
              <strong>{MONTH_NAMES[calDate.month]} {calDate.year}</strong>
              <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Next month"><ChevronRight size={14}/></button>
            </div>
            <div className="cal-days-header">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><span key={d}>{d}</span>)}
            </div>
            <div className="cal-grid">
              {Array.from({length:firstDayIndex}).map((_,i)=><span key={`empty-${i}`} className="cal-empty-cell"/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1;
                const isSelected=day===selectedDay&&calDate.month===selectedMonth&&calDate.year===selectedYear;
                return <button key={day} type="button" className={`cal-day-cell ${isSelected?"active":""}`} onClick={()=>handleSelectDay(day)}>{day}</button>;
              })}
            </div>
            <div className="cal-presets">
              <button type="button" className="cal-preset-btn today-preset" onClick={()=>handleSelectPreset("Today (9 Oct 2026)")}>Today (9 Oct)</button>
              <button type="button" className="cal-preset-btn" onClick={()=>handleSelectPreset("September 2026")}>September 2026</button>
              <button type="button" className="cal-preset-btn" onClick={()=>handleSelectPreset("October 2026")}>October 2026</button>
              <button type="button" className="cal-preset-btn" onClick={()=>handleSelectPreset("Last 30 Days")}>Last 30 Days</button>
              <button type="button" className="cal-preset-btn" onClick={()=>handleSelectPreset("Q3 2026")}>Q3 2026</button>
              <button type="button" className="cal-preset-btn" onClick={()=>handleSelectPreset("FY 2026-27")}>FY 2026-27</button>
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="msme-briefing-card" role="region" aria-label="Daily Shopkeeper Briefing">
      <div className="msme-briefing-content">
        <div className="msme-briefing-badge">
          <span className="msme-live-dot" aria-hidden="true"/>
          <span className="msme-badge-label">{lang==="hi"?"दुकान की आज की स्थिति":lang==="hinglish"?"Dukaan Ki Aaj Ki Sthiti":"Daily Shop Briefing"}</span>
        </div>
        <h2 className="msme-briefing-title">{lang==="hi"?`बाज़ार में ${money(totals.outstanding,true)} उधारी बाकी है और ${totals.lowStock} सामान का स्टॉक कम है`:lang==="hinglish"?`Market me ${money(totals.outstanding,true)} udhari baaki hai aur ${totals.lowStock} items low stock hain`:`${money(totals.outstanding,true)} market balance pending; ${totals.lowStock} products need reorder`}</h2>
        <p className="msme-briefing-desc">{lang==="hi"?"समय पर तगादा भेजकर उधारी वसूल करें और ज़रूरत का सामान तुरंत मंगवाएं।":lang==="hinglish"?"Samay par reminder bhejkar udhari vasool karein aur zaroori samaan mangwayein.":"Send payment reminders to collect pending balance faster and maintain stock."}</p>
      </div>
      <div className="msme-briefing-actions">
        <button className="button primary msme-reminder-btn" onClick={()=>open({kind:"action",id:priorities[0]?.id||"insight-1"})}>
          <CheckCircle2 size={16}/><span>{lang==="hi"?"उधारी तगादा भेजें":lang==="hinglish"?"Udhari Reminder Bhejein":"Send Due Reminder"}</span>
        </button>
      </div>
    </div>
    <div className="simple-actions-grid two-cards" role="region" aria-label="Quick Actions">
      <button className="simple-card-btn highlight-hero amber" onClick={()=>router.push("/documents")}>
        <span className="simple-card-icon"><FileText size={26}/></span>
        <div className="simple-card-info">
          <div className="simple-card-header">
            <strong>{t("upload")}</strong>
            <span className="hero-pill amber-pill">{lang==="hi"?"स्मार्ट OCR":"Instant OCR"}</span>
          </div>
          <small>{lang==="hi"?"कागज़ी बिल या फोटो स्कैन करें":lang==="hinglish"?"Kagazi bill ya photo scan karein":"Scan paper bill or PDF"}</small>
        </div>
        <span className="simple-card-arrow"><ArrowRight size={20}/></span>
      </button>
      <div className="ai-actions-col">
        <button className="simple-card-btn highlight-hero purple" onClick={()=>router.push("/assistant")}>
          <span className="simple-card-icon"><MessageSquare size={26}/></span>
          <div className="simple-card-info">
            <div className="simple-card-header">
              <strong>{t("askCopilot")}</strong>
              <span className="hero-pill purple-pill">{lang==="hi"?"आवाज़ और AI":"Voice & AI"}</span>
            </div>
            <small>{lang==="hi"?"बोलकर या लिखकर सवाल पूछें":lang==="hinglish"?"Bolkar ya likhkar sawal poochein":"Ask in voice or text"}</small>
          </div>
          <span className="simple-card-arrow"><ArrowUpRight size={20}/></span>
        </button>
        <button className="simple-card-btn highlight-hero blue record-payment-below-ai" onClick={()=>open({kind:"recordPayment"})}>
          <span className="simple-card-icon"><IndianRupee size={22}/></span>
          <div className="simple-card-info">
            <div className="simple-card-header">
              <strong>{t("recordPayment")}</strong>
              <span className="hero-pill blue-pill">{lang==="hi"?"भुगतान एंट्री":"UPI / Cash"}</span>
            </div>
            <small>{lang==="hi"?"पैसा आने पर तुरंत एंट्री करें":lang==="hinglish"?"Payment aane par turant entry karein":"Record money received"}</small>
          </div>
          <span className="simple-card-arrow"><ArrowUpRight size={20}/></span>
        </button>
      </div>
    </div>
    <section className="today-panel">
      <div className="today-heading">
        <div className="today-title">
          <span className="sparkle-box"><CheckCircle2 size={19}/></span>
          <div>
            <h2>{t("todayTitle")}</h2>
            <p>{t("todayDescription")}</p>
          </div>
        </div>
        <Link href="/insights" className="text-link">{t("viewInsights")}<ArrowRight size={14}/></Link>
      </div>
      {priorities.length?<div className="priority-grid">{priorities.map((insight,i)=><InsightCard key={insight.id} insight={insight} compact index={i}/>)}</div>:<div className="caught-up"><Badge status="completed"/>{t("noOpenInsights")}</div>}
    </section>
    <div className="metrics-strip">
      <MetricCard label={t("revenue")} value={money(totals.revenue,true)} trend="12.4%" detail={t("vsLastMonth")} icon={TrendingUp}/>
      <MetricCard label={t("outstanding")} value={money(totals.outstanding,true)} detail={t("awaitingPayment")} icon={Wallet}/>
      <MetricCard label={t("expenses")} value={money(totals.expenses,true)} detail={t("billed")} icon={Receipt}/>
      <MetricCard label={t("lowStock")} value={<>{totals.lowStock}<small> {t("products")}</small></>} detail={t("needsAttention")} icon={Package}/>
      <MetricCard label={t("overdue")} value={<>{data.invoices.filter(i=>invoiceStatus(i)==="overdue").length}<small> {t("invoiceCount")}</small></>} detail={t("needsAttention")} icon={IndianRupee}/>
    </div>
    <div className="overview-charts">
      <RevenueChart/>
      <Card className="health-card">
        <SectionHeading title={t("health")} action={<span className="health-info" title={t("healthExplanation")}><CircleHelp size={16}/></span>}/>
        <div className="health-score">
          <div className="score-ring" role="meter" aria-label={t("healthScore")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={82}>
            <div><strong>82</strong><span>/ 100</span></div>
          </div>
          <div><Badge status="active">{t("healthGood")}</Badge><p>{t("healthNote")}</p></div>
        </div>
        <div className="health-bars">{([["financial",84],["inventory",76],["receivables",68],["operations",91]] as const).map(([key,value])=><div key={key}><div><span>{t(key)}</span><strong>{value}</strong></div><div className="track"><span style={{width:`${value}%`}} className={value<70?"amber":""}/></div></div>)}</div>
        <details className="health-method"><summary>{t("healthMethod")}</summary><p>{t("healthExplanation")}</p></details>
      </Card>
    </div>
    <Card className="activity-card">
      <SectionHeading title={t("recentActivity")} description={t("activityNote")} action={<div className="segmented" role="group" aria-label={t("recentActivity")}>{["all","invoices","documents"].map(key=><button key={key} className={activity===key?"active":""} onClick={()=>setActivity(key)}>{t(key as "all"|"invoices"|"documents")}</button>)}</div>}/>
      <div className="activity-list">{activity!=="documents"&&<><button className="activity-row" onClick={()=>open({kind:"invoice",id:"INV-1040"})}><span className="activity-icon teal"><IndianRupee size={17}/></span><span><strong>{t("paymentReceived")}</strong><small>{data.customers.find(c=>c.id===data.invoices[39].customerId)?.name} · INV-1040</small></span><span><strong>+ {money(7000)}</strong><small>{date("2026-09-29",lang)}</small></span><ChevronRight size={16}/></button><button className="activity-row" onClick={()=>open({kind:"invoice",id:"INV-1039"})}><span className="activity-icon blue"><Receipt size={17}/></span><span><strong>{t("invoiceAdded")}</strong><small>INV-1039 · {data.customers.find(c=>c.id===data.invoices[38].customerId)?.name}</small></span><span><strong>{money(10000)}</strong><small>{date(data.invoices[38].date,lang)}</small></span><ChevronRight size={16}/></button></>}{activity!=="invoices"&&<button className="activity-row" onClick={()=>open({kind:"document",id:"DOC-INVENTORY"})}><span className="activity-icon amber"><FileText size={17}/></span><span><strong>{t("documentAdded")}</strong><small>Inventory_September.xlsx</small></span><span><Badge status="completed"/><small>{date("2026-09-30",lang)}</small></span><ChevronRight size={16}/></button>}</div>
    </Card>
    <div className="copilot-footer-section">
      <button className="copilot-strip" onClick={()=>router.push("/assistant")}>
        <span className="copilot-strip-icon"><MessageSquare size={20}/></span>
        <span><strong>{t("askCopilot")}</strong><small>{t("askPlaceholder")}</small></span>
        <span className="copilot-strip-arrow"><ArrowUpRight size={19}/></span>
      </button>
      <div className="below-ai-strip-action">
        <button className="simple-card-btn highlight-hero blue bottom-record-btn" onClick={()=>open({kind:"recordPayment"})}>
          <span className="simple-card-icon"><IndianRupee size={20}/></span>
          <div className="simple-card-info">
            <div className="simple-card-header">
              <strong>{t("recordPayment")}</strong>
              <span className="hero-pill blue-pill">{lang==="hi"?"भुगतान एंट्री":"Record Payment"}</span>
            </div>
            <small>{lang==="hi"?"ग्राहक से आया पैसा दर्ज करें":lang==="hinglish"?"Customer se aaya payment record karein":"Quick record money received"}</small>
          </div>
          <span className="simple-card-arrow"><ArrowUpRight size={18}/></span>
        </button>
      </div>
    </div>
  </>;
}

