export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    console.log('🔍 [DEBUG] Estado del sistema consultado');
    
    return res.status(200).json({
      success: true,
      debug: {
        esp32_data: global.latestESP32Data || null,
        current_config: global.currentConfig || null,
        esp32_data_exists: !!global.latestESP32Data,
        config_exists: !!global.currentConfig,
        timestamp: new Date().toISOString(),
        structure_check: {
          global_object_exists: typeof global !== 'undefined',
          esp32_weight: global.latestESP32Data ? global.latestESP32Data.weight : 'N/A',
          config_empty: global.currentConfig ? global.currentConfig.empty_weight : 'N/A',
          config_full: global.currentConfig ? global.currentConfig.full_weight : 'N/A'
        }
      }
    });
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
