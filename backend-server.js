import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json({limit:'10mb'}));

app.get('/api/health', (req,res)=>res.json({ok:true, app:'Rolling Wrench Diesel BA001', scope:'shop-tools-only-no-chat-dashboard'}));
app.post('/api/vin/decode', (req,res)=>{
  const vin=String(req.body?.vin||'').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,'');
  const years={A:2010,B:2011,C:2012,D:2013,E:2014,F:2015,G:2016,H:2017,J:2018,K:2019,L:2020,M:2021,N:2022,P:2023,R:2024,S:2025,T:2026,V:2027,W:2028,X:2029,Y:2030,1:2001,2:2002,3:2003,4:2004,5:2005,6:2006,7:2007,8:2008,9:2009};
  res.json({vin, valid:vin.length===17, year:years[vin[9]]||null, wmi:vin.slice(0,3), serial:vin.slice(11), note:'Connect paid/OEM VIN provider here for full build sheet.'});
});
app.post('/api/ocr/extract', (req,res)=>{
  const text=String(req.body?.text||'').toUpperCase();
  const vins=[...text.matchAll(/\b[A-HJ-NPR-Z0-9]{17}\b/g)].map(m=>m[0]);
  const parts=[...text.matchAll(/\b[A-Z0-9][A-Z0-9\-]{4,24}\b/g)].map(m=>m[0]).filter(x=>!vins.includes(x)).slice(0,30);
  const prices=[...text.matchAll(/\$?\b\d{1,5}\.\d{2}\b/g)].map(m=>m[0]).slice(0,30);
  res.json({vins,parts,prices});
});
app.post('/api/parts/search', (req,res)=>res.json({ok:true, query:req.body||{}, checklist:['Confirm VIN/ESN','Match OEM number','Check supersession','Verify quantity','Save to quote/work order'], results:[]}));
const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`BA001 backend running on ${port}`));
