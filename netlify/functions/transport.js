// Server-side transport proxy scaffold. Add provider-specific calls here and
// store credentials in Netlify environment variables. Do not expose API keys in React.
exports.handler = async (event) => {
  return { statusCode: 501, headers:{'content-type':'application/json'}, body:JSON.stringify({
    ok:false,
    message:'No live transport provider is configured yet. connectUk is running in simulation mode.',
    supportedModes:['bus','train','plane','boat']
  })};
};
