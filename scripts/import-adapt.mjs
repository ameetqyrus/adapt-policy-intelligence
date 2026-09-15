import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { parse } from 'csv-parse/sync';
import { geoAlbersUsa, geoPath } from 'd3-geo';
const source=process.argv[2];
if(!source) throw new Error('Supply the adapt-viz data directory.');
const read=name=>fs.readFileSync(path.join(source,name));
const num=v=>v===''||!Number.isFinite(Number(v))?null:Math.round(Number(v)*1000)/1000;
const histories={},industries={},occupations={};
for(const r of parse(read('county_all_vars_long.csv'),{columns:true,skip_empty_lines:true})){
 (histories[Number(r.countyid)]??=[]).push({year:Number(r.year),wage:num(r.star_median),employment:num(r.star_emp_rate),collegeWage:num(r.college_median),collegeEmployment:num(r.college_emp_rate),manufacturingShare:num(r.mfgsh),workers:num(r.total_workers)});
}
for(const [file,key,target] of [['2022_industry_county_summary.csv.gz','industry',industries],['2022_occupation_county_summary.csv.gz','occupation',occupations]]){
 for(const r of parse(gunzipSync(read(file)),{columns:true,skip_empty_lines:true})){
  if(Number(r.employed_workers)<=0||r[key]==='NIU')continue;
  (target[Number(r.county_fips)]??=[]).push({name:r[key],workers:num(r.employed_workers),noncollege:num(r.employed_noncollege),commonIndustries:r.common_industries||undefined});
 }
 for(const rows of Object.values(target))rows.sort((a,b)=>key==='occupation'?b.noncollege-a.noncollege:b.workers-a.workers);
}
const geo=JSON.parse(read('geojson-counties-fips.json'));
const draw=geoPath(geoAlbersUsa().scale(1150).translate([500,310])).digits(1);
const paths=geo.features.map(f=>({id:Number(f.id||f.properties.STATE+f.properties.COUNTY),path:draw(f)})).filter(f=>f.path);
fs.mkdirSync('public/data/details',{recursive:true});
for(const id of new Set([...Object.keys(histories),...Object.keys(industries)]))fs.writeFileSync('public/data/details/'+id+'.json',JSON.stringify({history:(histories[id]||[]).sort((a,b)=>a.year-b.year),industries:industries[id]||[],occupations:occupations[id]||[]}));
fs.writeFileSync('public/data/map-paths.json',JSON.stringify(paths));
console.log('Imported '+paths.length+' county shapes and '+Object.keys(histories).length+' county histories.');

