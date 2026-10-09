"use client";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { Route } from "@/lib/types";
import { useApp } from "./app-provider";
import { Overview } from "./dashboard/overview";
import { DocumentsPage } from "./documents/documents-page";
import { InvoicesPage } from "./invoices/invoices-page";
import { PaymentsPage } from "./payments/payments-page";
import { PeoplePage } from "./customers/people-page";
import { InventoryPage } from "./inventory/inventory-page";
import { ExpensesPage } from "./expenses/expenses-page";
import { InsightsPage } from "./insights/insights-page";
import { AssistantPage } from "./assistant/assistant-page";
import { SettingsPage } from "./settings/settings-page";
import { Button, EmptyState } from "./ui";
export function PageView({route}:{route:Route}){const {data,t,demoState,setDemoState,reload}=useApp();if(demoState==="error")return <div className="state-page"><AlertCircle size={32}/><h1>{t("loadError")}</h1><p>{t("loadErrorText")}</p><Button onClick={reload}><RefreshCw size={16}/>{t("retry")}</Button></div>;if(!data||demoState==="loading")return <div className="loading-state" role="status"><div className="loading-label"><RefreshCw size={20}/>{t("loading")}</div><div className="skeleton heading"/><div className="skeleton priorities"/><div className="skeleton metrics"/><div className="skeleton chart"/></div>;if(demoState==="empty")return <EmptyState title={t("emptyTitle")} description={t("emptyText")}><Link className="button primary" href="/documents" onClick={()=>setDemoState("normal")}>{t("upload")}</Link><Button onClick={()=>setDemoState("normal")}>{t("backToDemo")}</Button></EmptyState>;switch(route){case"overview":return <Overview/>;case"documents":return <DocumentsPage/>;case"invoices":return <InvoicesPage/>;case"payments":return <PaymentsPage/>;case"customers":return <PeoplePage/>;case"vendors":return <PeoplePage vendor/>;case"inventory":return <InventoryPage/>;case"expenses":return <ExpensesPage/>;case"insights":return <InsightsPage/>;case"assistant":return <AssistantPage/>;case"settings":return <SettingsPage/>;}}
