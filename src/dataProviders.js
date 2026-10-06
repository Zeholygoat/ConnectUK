/**
 * Provider contracts for connectUk.
 * Keep API credentials on the server (Netlify Functions) rather than in the browser.
 */
export const providers = {
  geonode: { kind:'ogc', wms:import.meta.env.VITE_GEONODE_WMS_URL||'', wfs:import.meta.env.VITE_GEONODE_WFS_URL||'' },
  buses: { kind:'siri-vm', name:'UK Bus Open Data Service (England)', enabled:false },
  rail: { kind:'rail-realtime', name:'National/partner rail feed', enabled:false },
  aircraft: { kind:'ads-b', name:'Open aviation feed / provider', enabled:false },
  marine: { kind:'ais', name:'AIS provider', enabled:false }
};

export async function fetchGeoJson(url){
  const r=await fetch(url); if(!r.ok) throw new Error(`GeoJSON request failed: ${r.status}`); return r.json();
}
