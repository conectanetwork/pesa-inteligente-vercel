// Variables globales
if (!global.latestESP32Data) {
  global.latestESP32Data = null;
}

if (!global.currentConfig) {
  global.currentConfig = null; // NO valores por defecto
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
      
      console.log('📊 [WEIGHT-DATA] === CONSULTA DE DATOS ===');
      console.log('📊 [WEIGHT-DATA] Configuración disponible:', global.currentConfig);
      console.log('📊 [WEIGHT-DATA] Datos ESP32 disponibles:', global.latestESP32Data);
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      // VERIFICAR SI HAY CONFIGURACIÓN DEL CLIENTE
      if (!global.currentConfig) {
        console.log('⚠️ [WEIGHT-DATA] NO HAY CONFIGURACIÓN - Cliente debe configurar primero');
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
      
      // OBTENER PESO TOTAL DEL ESP32
      let totalWeight = 0;
      let esp32Timestamp = new Date().toISOString();
      let hasRealData = false;
      
      if (global.latestESP32Data && global.latestESP32Data.weight) {
        totalWeight = global.latestESP32Data.weight;
        esp32Timestamp = global.latestESP32Data.timestamp;
        hasRealData = true;
        console.log('✅ [WEIGHT-DATA] PESO TOTAL del ESP32:', totalWeight, 'kg');
      } else {
        console.log('⚠️ [WEIGHT-DATA] Sin datos del ESP32');
        return res.status(200).json({
          success: true,
          data: {
            current: {
              weight: 0,
              empty_weight: global.currentConfig.empty_weight,
              full_weight: global.currentConfig.full_weight,
              net_weight: 0,
              gas_percentage: 0,
              timestamp: esp32Timestamp
            },
            esp32_timestamp: esp32Timestamp,
            has_real_data: false,
            data_source: 'NO_ESP32_DATA',
            config_source: 'CLIENT_SET',
            needs_esp32_data: true,
            message: 'Esperando datos del ESP32'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // USAR CONFIGURACIÓN DEL CLIENTE (NO VALORES FIJOS)
      const emptyWeight = global.currentConfig.empty_weight;
      const fullWeight = global.currentConfig.full_weight;
      
      // CÁLCULOS CORRECTOS
      const netWeight = Math.max(0, totalWeight - emptyWeight);
      const capacity = fullWeight - emptyWeight;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🧮 [WEIGHT-DATA] === CÁLCULOS CON CONFIGURACIÓN DEL CLIENTE ===');
      console.log('🧮 [WEIGHT-DATA] Peso TOTAL (ESP32):', totalWeight.toFixed(3), 'kg');
      console.log('🧮 [WEIGHT-DATA] Peso cilindro VACÍO (cliente):', emptyWeight.toFixed(3), 'kg');
      console.log('🧮 [WEIGHT-DATA] Peso cilindro LLENO (cliente):', fullWeight.toFixed(3), 'kg');
      console.log('🧮 [WEIGHT-DATA] Peso NETO (gas):', netWeight.toFixed(3), 'kg');
      console.log('🧮 [WEIGHT-DATA] Porcentaje gas:', gasPercentage.toFixed(1), '%');
      console.log('🧮 [WEIGHT-DATA] Fórmula: ', totalWeight.toFixed(3), '-', emptyWeight.toFixed(3), '=', netWeight.toFixed(3));
      
      const responseData = {
        success: true,
        data: {
          current: {
            weight: totalWeight,             // PESO TOTAL DEL ESP32
            empty_weight: emptyWeight,       // CONFIGURADO POR EL CLIENTE
            full_weight: fullWeight,         // CONFIGURADO POR EL CLIENTE
            net_weight: netWeight,           // CALCULADO: total - vacío
            gas_percentage: gasPercentage,   // CALCULADO: (neto/capacidad)*100
            timestamp: esp32Timestamp
          },
          esp32_timestamp: esp32Timestamp,
          has_real_data: hasRealData,
          data_source: 'ESP32_REAL_WITH_CLIENT_CONFIG',
          config_source: 'CLIENT_SET',
          historical: []
        },
        timestamp: new Date().toISOString(),
        debug: {
          esp32_total_weight: totalWeight,
          client_empty_weight: emptyWeight,
          client_full_weight: fullWeight,
          calculated_net_weight: netWeight.toFixed(3),
          calculated_gas_percentage: gasPercentage.toFixed(1),
          formula: `${totalWeight.toFixed(3)} - ${emptyWeight.toFixed(3)} = ${netWeight.toFixed(3)} kg`
        }
      };
      
      console.log('📤 [WEIGHT-DATA] === RESPUESTA FINAL ===');
      console.log('📤 [WEIGHT-DATA] Peso total ESP32:', responseData.data.current.weight, 'kg');
      console.log('📤 [WEIGHT-DATA] Peso neto calculado:', responseData.data.current.net_weight, 'kg');
      console.log('📤 [WEIGHT-DATA] Porcentaje gas:', responseData.data.current.gas_percentage, '%');
      
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA] Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
