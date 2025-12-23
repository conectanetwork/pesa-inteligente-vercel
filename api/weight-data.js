export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    try {
      const { clientCode, scaleCode } = req.query;
      
      console.log('🔥 [WEIGHT-DATA] === CONSULTA ===');
      console.log('🔥 [WEIGHT-DATA] global.latestESP32Data:', !!global.latestESP32Data);
      console.log('🔥 [WEIGHT-DATA] global.currentConfig:', !!global.currentConfig);
      
      if (global.latestESP32Data) {
        console.log('🔥 [WEIGHT-DATA] ESP32 peso:', global.latestESP32Data.weight);
      }
      
      if (global.currentConfig) {
        console.log('🔥 [WEIGHT-DATA] Config:', global.currentConfig);
      }
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      // Verificar configuración
      if (!global.currentConfig) {
        console.log('🔥 [WEIGHT-DATA] ❌ NO HAY CONFIGURACIÓN');
        return res.status(200).json({
          success: true,
          data: {
            current: {
              weight: 0,
              empty_weight: 0,
              full_weight: 0,
              net_weight: 0,
              gas_percentage: 0,
              timestamp: new Date().toISOString()
            },
            has_real_data: false,
            data_source: 'NO_CONFIG',
            needs_configuration: true,
            message: 'Configure los pesos del cilindro vacío y lleno primero'
          }
        });
      }
      
      // Verificar datos ESP32
      if (!global.latestESP32Data) {
        console.log('🔥 [WEIGHT-DATA] ❌ NO HAY DATOS ESP32');
        return res.status(200).json({
          success: true,
          data: {
            current: {
              weight: 0,
              empty_weight: global.currentConfig.empty_weight,
              full_weight: global.currentConfig.full_weight,
              net_weight: 0,
              gas_percentage: 0,
              timestamp: new Date().toISOString()
            },
            has_real_data: false,
            data_source: 'NO_ESP32_DATA',
            needs_esp32_data: true,
            message: 'Esperando datos del ESP32'
          }
        });
      }
      
      // CALCULAR con datos reales
      const totalWeight = global.latestESP32Data.weight;
      const emptyWeight = global.currentConfig.empty_weight;
      const fullWeight = global.currentConfig.full_weight;
      const netWeight = Math.max(0, totalWeight - emptyWeight);
      const capacity = fullWeight - emptyWeight;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🔥 [WEIGHT-DATA] === CÁLCULO FINAL ===');
      console.log('🔥 [WEIGHT-DATA] Total:', totalWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Vacío:', emptyWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Neto:', netWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Porcentaje:', gasPercentage, '%');
      
      return res.status(200).json({
        success: true,
        data: {
          current: {
            weight: totalWeight,
            empty_weight: emptyWeight,
            full_weight: fullWeight,
            net_weight: netWeight,
            gas_percentage: gasPercentage,
            timestamp: global.latestESP32Data.timestamp
          },
          esp32_timestamp: global.latestESP32Data.timestamp,
          has_real_data: true,
          data_source: 'ESP32_REAL_WITH_CLIENT_CONFIG',
          historical: []
        },
        debug: {
          esp32_weight: totalWeight,
          config_empty: emptyWeight,
          config_full: fullWeight,
          calculated_net: netWeight,
          calculated_percentage: gasPercentage
        }
      });
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA] ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
