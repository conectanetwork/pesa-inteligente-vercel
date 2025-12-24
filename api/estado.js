// API de diagnóstico del sistema
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const response = {
    success: true,
    message: "Sistema funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "estado-v1.0",
    node_version: process.version,
    vercel_region: process.env.VERCEL_REGION || 'unknown',
    global_status: {
      has_esp32_data: !!global.latestESP32Data,
      esp32_data: global.latestESP32Data || null,
      data_age: global.latestESP32Data ? 
        Math.floor((Date.now() - global.latestESP32Data.received_at) / 1000) : null
    },
    test_calculation: {
      empty_weight: 5,
      full_weight: 15,
      test_total: 10.085,
      test_net: 5.085,
      test_percentage: 50.9
    }
  };
  
  return res.status(200).json(response);
}
