import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Activity,Airplane,Anchor,Bus,ChevronDown,Crosshair,Info,Layers,Minus,Navigation,Pause,Play,Plus,Radio,Search,Ship,Train,Wifi,ZoomIn,ZoomOut} from 'lucide-react';
import './styles.css';

const COLORS={bus:'#ff4fd8',train:'#42a5ff',plane:'#ffd84a',boat:'#3fffd2'};
const TYPES=['bus','train','plane','boat'];
const TYPE_LABEL={bus:'BUS',train:'RAIL',plane:'AIR',boat:'MARINE'};
const MAP_STYLE='https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const UK=[[-6.2,49.8],[1.8,49.8],[2.2,55.8],[-1.5,59.0],[-8.5,58.6],[-6.2,49.8]];
const COUNTRIES={England:{center:[-1.6,52.5],zoom:6},Scotland:{center:[-4.2,56.7],zoom:6},Wales:{center:[-3.8,52.3],zoom:7},'Northern Ireland':{center:[-6.7,54.6],zoom:7}};

function rand(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function interpolate(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
function routeFor(type){
 const routes={
  bus:[[-0.12,51.50],[-0.10,51.53],[-0.16,51.56],[-0.25,51.55],[-0.31,51.52]],
  train:[[-0.12,51.50],[-0.46,51.54],[-1.46,52.48],[-2.24,53.48],[-2.59,51.45]],
  plane:[[-0.46,51.47],[-1.2,52.0],[-2.6,53.3],[-3.8,55.2],[-4.4,57.0]],
  boat:[[-0.10,50.80],[-0.35,50.65],[-0.95,50.70],[-1.5,50.75],[-2.0,50.95]]
 };
 const base=routes[type];
 if(Math.random()<.35)return [...base].reverse();
 return base;
}
function makeVehicle(i,type){
 const route=routeFor(type), phase=Math.random();
 return {id:`${type}-${i+1}`,type,route,phase,speed:rand(.0009,.0023),heading:0,label:`${TYPE_LABEL[type]}-${String(i+1).padStart(3,'0')}`,operator:pick(type==='bus'?['Metroline','Stagecoach','Arriva','First Bus','Go-Ahead']:type==='train'?['Avanti West Coast','LNER','GWR','ScotRail','Transport for Wales']:type==='plane'?['British Airways','easyJet','Ryanair','Jet2','Loganair']:['DFDS','Stena Line','CalMac','P&O Ferries'])};
}
function initialVehicles(){let v=[];TYPES.forEach(t=>{const n=t==='bus'?42:t==='train'?22:t==='plane'?18:12;for(let i=0;i<n;i++)v.push(makeVehicle(i,t))});return v}
function pointOnRoute(route,p){const segs=route.length-1;const x=(p%1)*segs;const i=Math.min(segs-1,Math.floor(x));return interpolate(route[i],route[i+1],x-i)}

function App(){
 const mapRef=useRef(null), mapEl=useRef(null), markerLayer=useRef(new Map());
 const [vehicles,setVehicles]=useState(initialVehicles); const [running,setRunning]=useState(true); const [speed,setSpeed]=useState(1);
 const [enabled,setEnabled]=useState(Object.fromEntries(TYPES.map(x=>[x,true]))); const [selected,setSelected]=useState(null); const [country,setCountry]=useState('United Kingdom'); const [query,setQuery]=useState(''); const [geoNode,setGeoNode]=useState(false);
 const [lastTick,setLastTick]=useState(Date.now());
 const visible=useMemo(()=>vehicles.filter(v=>enabled[v.type] && (!query || `${v.label} ${v.operator}`.toLowerCase().includes(query.toLowerCase()))),[vehicles,enabled,query]);
 useEffect(()=>{const m=new maplibregl.Map({container:mapEl.current,style:MAP_STYLE,center:[-2.8,54.7],zoom:5.2,attributionControl:false}); mapRef.current=m; m.addControl(new maplibregl.NavigationControl({showCompass:true}), 'bottom-right');
   m.on('load',()=>{
    const wms=import.meta.env.VITE_GEONODE_WMS_URL;
    if(wms){m.addSource('geonode-raster',{type:'raster',tiles:[`${wms}?service=WMS&version=1.1.1&request=GetMap&layers=${import.meta.env.VITE_GEONODE_BOUNDARY_LAYER||'connectuk:uk_boundaries'}&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`],tileSize:256});m.addLayer({id:'geonode-raster',type:'raster',source:'geonode-raster',paint:{'raster-opacity':.22}});}
    m.addSource('uk-outline',{type:'geojson',data:{type:'Feature',geometry:{type:'Polygon',coordinates:[UK]}}});m.addLayer({id:'uk-glow',type:'line',source:'uk-outline',paint:{'line-color':'#35f5ff','line-width':2,'line-opacity':.7,'line-blur':2}});m.addLayer({id:'uk-line',type:'line',source:'uk-outline',paint:{'line-color':'#35f5ff','line-width':.7,'line-opacity':.65}});});
   return ()=>m.remove()},[]);
 useEffect(()=>{const id=setInterval(()=>{if(!running)return; setVehicles(prev=>prev.map(v=>{const phase=(v.phase+v.speed*speed)%1;const p=pointOnRoute(v.route,phase);return {...v,phase,position:p}}));setLastTick(Date.now())}),40);return()=>clearInterval(id)},[running,speed]);
 useEffect(()=>{const m=mapRef.current;if(!m||!m.isStyleLoaded())return; const seen=new Set(); visible.forEach(v=>{seen.add(v.id);let mk=markerLayer.current.get(v.id);const pos=v.position||pointOnRoute(v.route,v.phase); if(!mk){const el=document.createElement('button');el.className=`vehicle-marker ${v.type}`;el.style.setProperty('--c',COLORS[v.type]);el.innerHTML=v.type==='bus'?'▣':v.type==='train'?'━':v.type==='plane'?'✦':'◆';el.title=v.label;el.onclick=()=>setSelected(v);mk=new maplibregl.Marker({element:el,rotationAlignment:'map'}).setLngLat(pos).addTo(m);markerLayer.current.set(v.id,mk)}else mk.setLngLat(pos);});markerLayer.current.forEach((mk,id)=>{if(!seen.has(id)){mk.remove();markerLayer.current.delete(id)}})},[visible,lastTick]);
 function fly(c,z){mapRef.current?.flyTo({center:c,zoom:z,duration:1400})}
 function home(){fly([-2.8,54.7],5.2);setCountry('United Kingdom')}
 function toggle(t){setEnabled(x=>({...x,[t]:!x[t]}))}
 return <div className="app">
  <header className="topbar"><div className="brand"><div className="brandmark"><span></span><span></span><span></span></div><div><b>connect<span>Uk</span></b><small>UK TRANSPORT INTELLIGENCE</small></div></div><div className="status"><span className="pulse"></span> LIVE SIMULATION <i>•</i> {new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div><div className="top-actions"><button className="icon-btn"><Radio size={17}/></button><button className="icon-btn"><Info size={17}/></button></div></header>
  <aside className="sidebar left">
   <div className="panel-title"><span>NETWORK</span><span className="live-dot">●</span></div>
   <div className="metric-grid"><Metric n={visible.length} l="TRACKED"/><Metric n="94.2%" l="SIGNAL"/><Metric n="UK" l="REGION"/></div>
   <div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search vehicle / operator"/></div>
   <div className="section-label">TRANSPORT LAYERS</div>
   {TYPES.map(t=><Layer key={t} type={t} enabled={enabled[t]} toggle={()=>toggle(t)} count={vehicles.filter(v=>v.type===t).length}/>) }
   <div className="section-label">UK COUNTRIES</div>
   <div className="country-list">{['United Kingdom',...Object.keys(COUNTRIES)].map(c=><button className={country===c?'active':''} key={c} onClick={()=>{setCountry(c);c==='United Kingdom'?home():fly(COUNTRIES[c].center,COUNTRIES[c].zoom)}}><span className="country-icon">⌖</span>{c}<ChevronDown size={13}/></button>)}</div>
   <div className="geonode-card"><div><span className="geo-badge">GN</span><div><b>GeoNode layers</b><small>{geoNode?'CONNECTED':'CONFIGURABLE'}</small></div></div><button onClick={()=>setGeoNode(x=>!x)}>{geoNode?'ON':'DEMO'}</button></div>
  </aside>
  <main className="map-wrap"><div ref={mapEl} className="map"></div><div className="map-vignette"></div>
   <div className="map-head"><div><span className="eyebrow">LIVE GEOSPATIAL FEED</span><h1>{country}</h1><p>Movement field · transport telemetry · {visible.length} active objects</p></div><button className="locate" onClick={home}><Crosshair size={17}/> RESET VIEW</button></div>
   <div className="map-tools"><button onClick={()=>mapRef.current?.zoomIn()}><Plus/></button><button onClick={()=>mapRef.current?.zoomOut()}><Minus/></button></div>
   <div className="timebar"><div className="time-controls"><button onClick={()=>setRunning(x=>!x)}>{running?<Pause size={15}/>:<Play size={15}/>}</button><select value={speed} onChange={e=>setSpeed(+e.target.value)}><option value="0.5">0.5×</option><option value="1">1× REALTIME</option><option value="2">2×</option><option value="5">5×</option></select></div><div className="timeline"><span>NOW</span><div className="track"><div className="track-fill"></div><div className="scrubber"></div></div><span>SIM</span></div></div>
   <div className="legend"><div><span className="legend-dot bus"></span>BUS</div><div><span className="legend-dot train"></span>RAIL</div><div><span className="legend-dot plane"></span>AIR</div><div><span className="legend-dot boat"></span>MARINE</div></div>
  </main>
  <aside className="sidebar right">{selected?<Detail v={selected} close={()=>setSelected(null)}/>:<><div className="panel-title"><span>LIVE FEED</span><span className="feed-state"><Wifi size={12}/> STREAMING</span></div><div className="feed-list">{visible.slice(0,9).map(v=><button className="feed-row" key={v.id} onClick={()=>{setSelected(v);mapRef.current?.flyTo({center:v.position||pointOnRoute(v.route,v.phase),zoom:8,duration:1000})}}><span className={`feed-icon ${v.type}`}>{v.type==='bus'?<Bus/>:v.type==='train'?<Train/>:v.type==='plane'?<Airplane/>:<Ship/>}</span><span><b>{v.label}</b><small>{v.operator}</small></span><em>{Math.round(24+Math.random()*36)} km/h</em></button>)}</div><div className="system"><div className="panel-title"><span>SYSTEM</span></div><div className="sysrow"><span>MAP ENGINE</span><b>MAPLIBRE GL</b></div><div className="sysrow"><span>GEOSPATIAL</span><b>{geoNode?'GEONODE':'DEMO DATA'}</b></div><div className="sysrow"><span>TELEMETRY</span><b className="ok">NOMINAL</b></div></div></>}</aside>
  {selected&&<div className="mobile-close" onClick={()=>setSelected(null)}>×</div>}
 </div>
}
function Metric({n,l}){return <div className="metric"><strong>{n}</strong><small>{l}</small></div>}
function Layer({type,enabled,toggle,count}){const I=type==='bus'?Bus:type==='train'?Train:type==='plane'?Airplane:Ship;return <button className={`layer ${enabled?'on':''}`} onClick={toggle}><span className={`layer-icon ${type}`}><I size={16}/></span><span><b>{TYPE_LABEL[type]}</b><small>{type==='bus'?'ROAD NETWORK':type==='train'?'RAIL NETWORK':type==='plane'?'FLIGHT PATHS':'SEA LANES'}</small></span><em>{count}</em><span className="switch"></span></button>}
function Detail({v,close}){const p=v.position||pointOnRoute(v.route,v.phase);return <div className="detail"><button className="back" onClick={close}>← BACK TO FEED</button><div className={`detail-hero ${v.type}`}><span>{v.type==='bus'?<Bus/>:v.type==='train'?<Train/>:v.type==='plane'?<Airplane/>:<Ship/>}</span><div><small>{TYPE_LABEL[v.type]} VEHICLE</small><h2>{v.label}</h2></div></div><div className="coords"><span>LONGITUDE <b>{p[0].toFixed(5)}°</b></span><span>LATITUDE <b>{p[1].toFixed(5)}°</b></span></div><div className="detail-grid"><InfoCell l="OPERATOR" v={v.operator}/><InfoCell l="STATUS" v="IN TRANSIT"/><InfoCell l="VELOCITY" v={`${Math.round(30+v.speed*30000)} km/h`}/><InfoCell l="TRACK ID" v={v.id.toUpperCase()}/></div><div className="route-card"><span className="section-label">TRACK VECTOR</span><div className="route-line"><span></span><i></i><b></b><i></i><span></span></div><div className="route-names"><span>ORIGIN</span><span>LIVE VECTOR</span><span>DESTINATION</span></div></div></div>}
function InfoCell({l,v}){return <div className="info-cell"><small>{l}</small><b>{v}</b></div>}
createRoot(document.getElementById('root')).render(<App/>);
