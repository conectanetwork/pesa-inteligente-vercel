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
      
      console.log('🔥 [WEIGHT-DATA-FIXED] === NUEVA VERSIÓN ===');
      console.log('🔥 [WEIGHT-DATA-FIXED] Parámetros:', { empty_weight, full_weight });
      console.log('🔥 [WEIGHT-DATA-FIXED] ESP32 data exists:', !!global.latestESP32Data);
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      // Verificar parámetros
      if (!empty_weight || !full_weight) {
        console.log('🔥 [WEIGHT-DATA-FIXED] ❌ FALTAN PARÁMETROS');
        return res.status(200).json({
          success: true,
          message: 'NUEVA VERSIÓN - Faltan parámetros empty_weight y full_weight',
          received_params: { empty_weight, full_weight },
          version: 'FIXED'
        });
      }
      
      // Usar datos del ESP32 o valor por defecto
      let totalWeight = 9.86; // Valor por defecto
      let hasRealData = false;
      let timestamp = new Date().toISOString();
      
      if (global.latestESP32Data && global.latestESP32Data.weight) {
        totalWeight = global.latestESP32Data.weight;
        hasRealData = true;
        timestamp = global.latestESP32Data.timestamp;
        console.log('🔥 [WEIGHT-DATA-FIXED] ✅ DATOS REALES:', totalWeight, 'kg');
      } else {
        console.log('🔥 [WEIGHT-DATA-FIXED] ⚠️ DATOS POR DEFECTO:', totalWeight, 'kg');
      }
      
      // CALCULAR
      const emptyWeightNum = parseFloat(empty_weight);
      const fullWeightNum = parseFloat(full_weight);
      const netWeight = Math.max(0, totalWeight - emptyWeightNum);
      const capacity = fullWeightNum - emptyWeightNum;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🔥 [WEIGHT-DATA-FIXED] CÁLCULO:', {
        total: totalWeight,
        empty: emptyWeightNum,
        full: fullWeightNum,
        neto: netWeight,
        porcentaje: gasPercentage
      });
      
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
          data_source: hasRealData ? 'ESP32_REAL_FIXED' : 'DEFAULT_FIXED',
          version: 'FIXED'
        }
      });
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA-FIXED] ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido - FIXED VERSION' });
}
