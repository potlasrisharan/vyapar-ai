import { expenses } from "./seed";
export const previousExpenses = {inventory:94000,electricity:19758,rent:30000,transport:7500,salaries:40000,marketing:7000,other:4120};
export async function getExpenses() { return expenses; }
