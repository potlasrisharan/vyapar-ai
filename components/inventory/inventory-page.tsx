"use client";
import { useState } from "react";
import { Package, PackageX, TriangleAlert, Box, ChevronRight, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Badge, Button, Card, DataTable, EmptyState, MetricCard, PageHeading, SearchField } from "@/components/ui";
import { stockStatus } from "@/lib/mock/inventory";

export function InventoryPage(){
  const {data,t,lang,open,deleteProduct}=useApp();
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");

  if(!data)return null;

  const totalProducts=data.products.length;
  const lowStockCount=data.products.filter(p=>p.stock>0&&p.stock<=p.reorderLevel).length;
  const criticalCount=data.products.filter(p=>p.stock>0&&p.stock<=5).length;
  const outOfStockCount=data.products.filter(p=>p.stock===0).length;

  const rows=data.products.filter(p=>
    `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())&&(
      filter==="all"||(filter==="lowStock"?p.stock<=p.reorderLevel:stockStatus(p)===filter)
    )
  );

  return <>
    <PageHeading title={t("inventory")} subtitle={t("inventorySubtitle")}>
      <Button variant="primary" onClick={()=>open({kind:"createProduct"})}>
        <Plus size={16}/>{t("addProduct")}
      </Button>
    </PageHeading>
    <div className="metrics-strip four">
      <MetricCard label={t("totalProducts")} value={totalProducts} icon={Package}/>
      <MetricCard label={t("lowStock")} value={lowStockCount} detail={t("needsAttention")} icon={Box}/>
      <MetricCard label={t("critical")} value={criticalCount} icon={TriangleAlert}/>
      <MetricCard label={t("outOfStock")} value={outOfStockCount} icon={PackageX}/>
    </div>
    <div className="inline-notice">
      <Package size={19}/>
      <p>{data.insights[1].title[lang]} · {data.insights[1].summary[lang]}</p>
      <Button onClick={()=>open({kind:"action",id:"INS-2"})}>
        {t("purchase")}<ChevronRight size={14}/>
      </Button>
    </div>
    <Card>
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder={t("inventorySearch")}/>
        <select value={filter} aria-label={t("status")} onChange={e=>setFilter(e.target.value)}>
          {(["all","inStock","lowStock","critical","outOfStock"] as const).map(s=>(
            <option key={s} value={s}>{t(s)}</option>
          ))}
        </select>
      </div>
      {rows.length ? (
        <DataTable headers={[t("product"),t("sku"),t("currentStock"),t("reorderLevel"),t("status"),t("velocity"),t("actions")]}>
          {rows.map(p=>(
            <InventoryRow key={p.id} p={p} onOpen={open} onDelete={deleteProduct} t={t}/>
          ))}
        </DataTable>
      ) : (
        <EmptyState title={t("noResults")} description={t("trySearch")}>
          <Button onClick={()=>{setQuery("");setFilter("all");}}>{t("clearFilters")}</Button>
        </EmptyState>
      )}
    </Card>
    <p className="page-footnote">{t("inventoryNote")}</p>
  </>;
}

function InventoryRow({p,onOpen,onDelete,t}:{
  p:import("@/lib/types").Product;
  onOpen:(panel:Parameters<ReturnType<typeof useApp>["open"]>[0])=>void;
  onDelete:(id:string)=>void;
  t:ReturnType<typeof useApp>["t"];
}){
  const [confirming,setConfirming]=useState(false);
  return (
    <tr>
      <td>
        <button className="product-cell" onClick={()=>onOpen({kind:"product",id:p.id})}>
          <span className="product-icon"><Package size={19}/></span>
          <strong>{p.name}</strong>
        </button>
      </td>
      <td className="mono muted">{p.sku}</td>
      <td>
        <strong className={p.stock<=p.reorderLevel?"danger-text":""}>{p.stock}</strong>{" "}
        <span className="muted">{t("units")}</span>
      </td>
      <td className="muted">{p.reorderLevel}</td>
      <td><Badge status={stockStatus(p)}/></td>
      <td className="muted">{p.dailySales} {t("perDay")}</td>
      <td>
        {confirming ? (
          <div className="table-actions-group" style={{gap:4}}>
            <AlertTriangle size={13} style={{color:"var(--red)",flexShrink:0}}/>
            <Button variant="danger" style={{padding:"2px 8px",fontSize:"0.75rem"}} onClick={()=>{onDelete(p.id);setConfirming(false);}}>
              {t("deleteProduct")}
            </Button>
            <Button style={{padding:"2px 8px",fontSize:"0.75rem"}} onClick={()=>setConfirming(false)}>
              {t("cancel")}
            </Button>
          </div>
        ) : (
          <div className="table-actions-group">
            <button
              type="button"
              className="icon-action-btn edit"
              onClick={(e)=>{e.stopPropagation();onOpen({kind:"editProduct",productId:p.id});}}
              title={t("editProduct")}
              aria-label={`${t("editProduct")}: ${p.name}`}
            >
              <Pencil size={14}/>
            </button>
            <button
              type="button"
              className="icon-action-btn delete"
              onClick={(e)=>{e.stopPropagation();setConfirming(true);}}
              title={t("deleteProduct")}
              aria-label={`${t("deleteProduct")}: ${p.name}`}
            >
              <Trash2 size={14}/>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

