import { products } from "./seed";
import type { Product } from "@/lib/types";
export function stockStatus(p: Product) { return p.stock===0?"outOfStock":p.stock<=5?"critical":p.stock<=p.reorderLevel?"lowStock":"inStock"; }
export async function getInventory() { return products; }
