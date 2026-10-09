import en, { type TranslationKey } from "./en";
import hi from "./hi";
import hinglish from "./hinglish";
import type { Language } from "@/lib/types";
export const dictionaries = { en, hi, hinglish };
export const languages: {id:Language;label:string}[]=[{id:"en",label:"English"},{id:"hi",label:"हिन्दी"},{id:"hinglish",label:"Hinglish"}];
export function translate(language:Language,key:TranslationKey,vars?:Record<string,string|number>):string { let value:string=dictionaries[language][key];for(const [name,text] of Object.entries(vars??{}))value=value.replaceAll(`{${name}}`,String(text));return value; }
export type { TranslationKey };
