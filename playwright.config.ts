import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./tests/e2e",fullyParallel:false,workers:1,timeout:30000,use:{baseURL:"http://127.0.0.1:3000",headless:true,channel:"chrome",viewport:{width:1440,height:1100},colorScheme:"light",screenshot:"only-on-failure",trace:"on-first-retry"},reporter:[["list"],["html",{open:"never"}]]});
