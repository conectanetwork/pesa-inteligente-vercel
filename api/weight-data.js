// Variables globales
if (!global.latestESP32Data) {
  global.latestESP32Data = null;
  console.log('🔥 [WEIGHT-DATA] Variable ESP32 inicializada');
}

if (!global.currentConfig) {
  global.currentConfig = null;
  console.log('🔥 [WEIGHT-DATA] Variable config inicializada');
}

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
      
      console.log('🔥 [WEIGHT-DATA] ===== CONSULTA DE DATOS =====');
      console.log('🔥 [WEIGHT-DATA] global.latestESP32Data existe:', !!global.latestESP32Data);
      console.log('🔥 [WEIGHT-DATA] global.currentConfig existe:', !!global.currentConfig);
      
      if (global.latestESP32Data) {
        console.log('🔥 [WEIGHT-DATA] Peso en global:', global.latestESP32Data.weight, 'kg');
        console.log('🔥 [WEIGHT-DATA] Timestamp en global:', global.latestESP32Data.timestamp);
      } else {
        console.log('🔥 [WEIGHT-DATA] ❌ NO HAY DATOS DEL ESP32 EN GLOBAL');
      }
      
      if (global.currentConfig) {
        console.log('🔥 [WEIGHT-DATA] Config en global:', global.currentConfig);
      } else {
        console.log('🔥 [WEIGHT-DATA] ❌ NO HAY CONFIGURACIÓN EN GLOBAL');
      }
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      // VERIFICAR CONFIGURACIÓN
      if (!global.currentConfig) {
        console.log('🔥 [WEIGHT-DATA] ❌ SIN CONFIGURACIÓN - NECESITA SETUP');
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
            esp32_timestamp: new Date().toISOString(),
            has_real_data: false,
            data_source: 'NO_CONFIG',
            config_source: 'MISSING',
            needs_configuration: true,
            message: 'Configure los pesos del cilindro vacío y lleno primero'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // VERIFICAR DATOS ESP32
      if (!global.latestESP32Data) {
        console.log('🔥 [WEIGHT-DATA] ❌ SIN DATOS ESP32');
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
            esp32_timestamp: new Date().toISOString(),
            has_real_data: false,
            data_source: 'NO_ESP32_DATA',
            config_source: 'CLIENT_SET',
            needs_esp32_data: true,
            message: 'Esperando datos del ESP32'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // CALCULAR CON DATOS REALES
      const totalWeight = global.latestESP32Data.weight;
      const emptyWeight = global.currentConfig.empty_weight;
      const fullWeight = global.currentConfig.full_weight;
      const netWeight = Math.max(0, totalWeight - emptyWeight);
      const capacity = fullWeight - emptyWeight;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🔥 [WEIGHT-DATA] ===== CÁLCULOS FINALES =====');
      console.log('🔥 [WEIGHT-DATA] Peso total ESP32:', totalWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Peso vacío config:', emptyWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Peso lleno config:', fullWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Peso neto calculado:', netWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] Porcentaje gas:', gasPercentage, '%');
      
      const responseData = {
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
          config_source: 'CLIENT_SET',
          historical: []
        },
        timestamp: new Date().toISOString(),
        debug: {
          esp32_weight: totalWeight,
          config_empty: emptyWeight,
          config_full: fullWeight,
          calculated_net: netWeight,
          calculated_percentage: gasPercentage,
          formula: `${totalWeight} - ${emptyWeight} = ${netWeight} kg`
        }
      };
      
      console.log('🔥 [WEIGHT-DATA] ===== RESPUESTA ENVIADA =====');
      console.log('🔥 [WEIGHT-DATA] Respuesta:', JSON.stringify(responseData, null, 2));
      
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA] ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
