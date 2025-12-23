export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    try {
      const { clientCode, scaleCode, empty_weight, full_weight } = req.query;
      
      console.log('🔥 [WEIGHT-DATA] === CONSULTA CON PARÁMETROS ===');
      console.log('🔥 [WEIGHT-DATA] Parámetros recibidos:', { empty_weight, full_weight });
      console.log('🔥 [WEIGHT-DATA] ESP32 data exists:', !!global.latestESP32Data);
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      // Verificar configuración desde parámetros
      if (!empty_weight || !full_weight) {
        console.log('🔥 [WEIGHT-DATA] ❌ NO HAY CONFIGURACIÓN EN PARÁMETROS');
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
            data_source: 'NO_PARAMS',
            message: 'Faltan parámetros empty_weight y full_weight en la URL'
          }
        });
      }
      
      // Usar datos del ESP32 o valor por defecto
      let totalWeight = 9.89; // Valor por defecto basado en tus logs
      let hasRealData = false;
      let timestamp = new Date().toISOString();
      
      if (global.latestESP32Data && global.latestESP32Data.weight) {
        totalWeight = global.latestESP32Data.weight;
        hasRealData = true;
        timestamp = global.latestESP32Data.timestamp;
        console.log('🔥 [WEIGHT-DATA] ✅ Usando datos REALES del ESP32:', totalWeight, 'kg');
      } else {
        console.log('🔥 [WEIGHT-DATA] ⚠️ Usando valor por DEFECTO:', totalWeight, 'kg');
      }
      
      // CALCULAR con configuración de parámetros
      const emptyWeightNum = parseFloat(empty_weight);
      const fullWeightNum = parseFloat(full_weight);
      const netWeight = Math.max(0, totalWeight - emptyWeightNum);
      const capacity = fullWeightNum - emptyWeightNum;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🔥 [WEIGHT-DATA] === CÁLCULO FINAL ===');
      console.log('🔥 [WEIGHT-DATA] Total:', totalWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Vacío (param):', emptyWeightNum, 'kg');
      console.log('🔥 [WEIGHT-DATA] Lleno (param):', fullWeightNum, 'kg');
      console.log('🔥 [WEIGHT-DATA] Neto calculado:', netWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Porcentaje gas:', gasPercentage, '%');
      
      return res.status(200).json({
        success: true,
        data: {
          current: {
            weight: totalWeight,
            empty_weight: emptyWeightNum,
            full_weight: fullWeightNum,
            net_weight: netWeight,
            gas_percentage: gasPercentage,
            timestamp: timestamp
          },
          esp32_timestamp: timestamp,
          has_real_data: hasRealData,
          data_source: hasRealData ? 'ESP32_REAL_WITH_PARAMS' : 'DEFAULT_WITH_PARAMS',
          historical: []
        },
        debug: {
          esp32_weight: totalWeight,
          config_empty: emptyWeightNum,
          config_full: fullWeightNum,
          calculated_net: netWeight,
          calculated_percentage: gasPercentage,
          config_source: 'URL_PARAMETERS',
          data_origin: hasRealData ? 'ESP32_REAL' : 'DEFAULT_VALUE'
        }
      });
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA] ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido. Use GET con parámetros.' });
}
