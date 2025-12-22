// Variable global para configuración
if (!global.currentConfig) {
  global.currentConfig = {
    empty_weight: 5.0,
    full_weight: 15.0
  };
}

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    try {
      const { clientCode, scaleCode } = req.query;
      
      console.log('📊 [WEIGHT-DATA] Solicitud de datos recibida');
      console.log('📊 [WEIGHT-DATA] Configuración actual:', global.currentConfig);
      console.log('📊 [WEIGHT-DATA] Datos ESP32 disponibles:', global.latestESP32Data);
      
      // Verificar autenticación
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // OBTENER DATOS REALES DEL ESP32
      let currentWeight = 4.95; // Valor por defecto basado en logs
      let esp32Timestamp = new Date().toISOString();
      let hasRealData = false;
      
      if (global.latestESP32Data && global.latestESP32Data.weight) {
        currentWeight = global.latestESP32Data.weight;
        esp32Timestamp = global.latestESP32Data.timestamp;
        hasRealData = true;
        console.log('✅ [WEIGHT-DATA] Usando datos REALES del ESP32:', currentWeight, 'kg');
      } else {
        console.log('⚠️ [WEIGHT-DATA] No hay datos del ESP32, usando valor por defecto:', currentWeight, 'kg');
      }
      
      // USAR CONFIGURACIÓN DINÁMICA
      const emptyWeight = global.currentConfig.empty_weight;
      const fullWeight = global.currentConfig.full_weight;
      
      // Calcular valores derivados
      const netWeight = Math.max(0, currentWeight - emptyWeight);
      const capacity = fullWeight - emptyWeight;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🧮 [WEIGHT-DATA] Cálculos con configuración dinámica:', {
        currentWeight: currentWeight.toFixed(3),
        emptyWeight: emptyWeight.toFixed(1),
        fullWeight: fullWeight.toFixed(1),
        netWeight: netWeight.toFixed(3),
        gasPercentage: gasPercentage.toFixed(1),
        hasRealData: hasRealData
      });
      
      const responseData = {
        success: true,
        data: {
          current: {
            weight: currentWeight,
            empty_weight: emptyWeight,
            full_weight: fullWeight,
            net_weight: netWeight,
            gas_percentage: gasPercentage,
            timestamp: esp32Timestamp
          },
          esp32_timestamp: esp32Timestamp,
          has_real_data: hasRealData,
          data_source: hasRealData ? 'ESP32_REAL' : 'DEFAULT',
          historical: []
        },
        timestamp: new Date().toISOString(),
        debug: {
          global_data_available: !!global.latestESP32Data,
          esp32_weight: global.latestESP32Data ? global.latestESP32Data.weight : 'N/A',
          config_empty: emptyWeight,
          config_full: fullWeight,
          calculated_net: netWeight.toFixed(3),
          calculated_percentage: gasPercentage.toFixed(1)
        }
      };
      
      console.log('📤 [WEIGHT-DATA] Enviando respuesta:', responseData);
      
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA] Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ 
    error: 'Método no permitido. Use GET para obtener datos de peso.' 
  });
}
