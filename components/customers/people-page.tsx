"use client";
import { useState } from "react";
import { ArrowUpRight, Users, Wallet, ShoppingBag, CircleHelp, Plus, Star } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Badge, Button, Card, DataTable, EmptyState, MetricCard, PageHeading, SearchField } from "@/components/ui";
import { customerSummary } from "@/lib/mock/customers";
import { calculateVendorRating } from "@/lib/mock/business";
import { date, initials, money } from "@/lib/utils/format";

export function PeoplePage({vendor=false}:{vendor?:boolean}){
  const {data,t,lang,open}=useApp();
  const [query,setQuery]=useState("");
  if(!data)return null;

  const people=(vendor?data.vendors:data.customers).filter(p=>p.name.toLowerCase().includes(query.toLowerCase()));
  const stats=(id:string)=>{
    if(!vendor)return customerSummary(id);
    const bills=data.purchaseBills.filter(b=>b.vendorId===id);
    return {
      purchases:bills.reduce((s,b)=>s+b.total,0),
      outstanding:bills.reduce((s,b)=>s+b.total-b.paid,0),
      lastPurchase:bills.map(b=>b.date).sort().at(-1)
    };
  };
  const all=(vendor?data.vendors:data.customers).map(p=>stats(p.id));

  const headers=vendor
    ? [t("vendor"), t("totalPurchases"), t("outstanding"), t("lastTransaction"), t("vendorRating"), t("status")]
    : [t("customer"), t("totalPurchases"), t("outstanding"), t("lastPurchase"), t("status")];

  return <>
    <PageHeading title={t(vendor?"vendors":"customers")} subtitle={t(vendor?"vendorsSubtitle":"customersSubtitle")}>
      {!vendor&&<Button variant="primary" onClick={()=>open({kind:"createCustomer"})}><Plus size={16}/>{t("addCustomer")}</Button>}
    </PageHeading>
    <div className="metrics-strip three">
      <MetricCard label={t(vendor?"vendors":"customers")} value={vendor?data.vendors.length:data.customers.length} detail={t("active")} icon={Users}/>
      <MetricCard label={t("totalPurchases")} value={money(all.reduce((s,p)=>s+p.purchases,0))} detail={t("reporting")} icon={ShoppingBag}/>
      <MetricCard label={t("outstanding")} value={money(all.reduce((s,p)=>s+p.outstanding,0))} detail={t("needsAttention")} icon={Wallet}/>
    </div>
    <div className="inline-notice">
      <CircleHelp size={18}/>
      <p>{t(vendor?"vendorNote":"largestOutstanding")}</p>
      {!vendor&&<button onClick={()=>open({kind:"customer",id:"CUS-1001"})} aria-label={t("viewRecord")}><ArrowUpRight size={18}/></button>}
    </div>
    <Card>
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder={t(vendor?"vendorSearch":"customerSearch")}/>
        <span className="muted">{people.length} {t(vendor?"vendors":"customers")}</span>
      </div>
      {people.length ? (
        <DataTable headers={headers}>
          {people.map(p=>{
            const s=stats(p.id);
            const vRating=vendor ? calculateVendorRating(p.id, data) : null;
            return <tr key={p.id}>
              <td>
                <button className="person-cell" onClick={()=>open({kind:vendor?"vendor":"customer",id:p.id})}>
                  <span className={`avatar square tint-${p.id.slice(-1)}`}>{initials(p.name)}</span>
                  <span><strong>{p.name}</strong><small>{p.city}</small></span>
                </button>
              </td>
              <td className="numeric">{money(s.purchases)}</td>
              <td className={`numeric ${s.outstanding?"danger-text":"muted"}`}>{money(s.outstanding)}</td>
              <td className="muted">{s.lastPurchase?date(s.lastPurchase,lang):"—"}</td>
              {vendor && vRating && (
                <td>
                  <span className="vendor-rating-chip" title={`${vRating.stars} stars - ${vRating.badge[lang]}`}>
                    <Star size={13} fill="#eab308" color="#eab308"/>
                    <strong>{vRating.stars.toFixed(1)}</strong>
                    <small className="muted">/ 5</small>
                  </span>
                </td>
              )}
              <td>
                <Badge status={s.outstanding?"pending":"paid"}>
                  {vendor && vRating ? vRating.badge[lang] : t(s.outstanding?"needsFollowup":"balanceClear")}
                </Badge>
              </td>
            </tr>;
          })}
        </DataTable>
      ) : (
        <EmptyState title={t("noResults")} description={t("trySearch")}>
          <Button onClick={()=>setQuery("")}>{t("clearFilters")}</Button>
        </EmptyState>
      )}
    </Card>
  </>;
}

