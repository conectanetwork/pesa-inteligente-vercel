import { readFileSync, existsSync } from 'fs';

const DATA_FILE = '/tmp/esp32-data.json';

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
      
      console.log('🔥 [WEIGHT-DATA] Consultando datos del archivo...');
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      // Leer datos del archivo
      let allData = { esp32: null, config: null };
      if (existsSync(DATA_FILE)) {
        try {
          const fileContent = readFileSync(DATA_FILE, 'utf8');
          allData = JSON.parse(fileContent);
          console.log('🔥 [WEIGHT-DATA] Datos leídos del archivo:', allData);
        } catch (e) {
          console.log('🔥 [WEIGHT-DATA] Error leyendo archivo:', e.message);
        }
      } else {
        console.log('🔥 [WEIGHT-DATA] Archivo no existe');
      }
      
      // Verificar configuración
      if (!allData.config) {
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
      if (!allData.esp32) {
        return res.status(200).json({
          success: true,
          data: {
            current: {
              weight: 0,
              empty_weight: allData.config.empty_weight,
              full_weight: allData.config.full_weight,
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
      const totalWeight = allData.esp32.weight;
      const emptyWeight = allData.config.empty_weight;
      const fullWeight = allData.config.full_weight;
      const netWeight = Math.max(0, totalWeight - emptyWeight);
      const capacity = fullWeight - emptyWeight;
      const gasPercentage = capacity > 0 ? Math.min(100, Math.max(0, (netWeight / capacity) * 100)) : 0;
      
      console.log('🔥 [WEIGHT-DATA] CÁLCULO:', totalWeight, '-', emptyWeight, '=', netWeight, 'kg');
      console.log('🔥 [WEIGHT-DATA] PORCENTAJE:', gasPercentage, '%');
      
      return res.status(200).json({
        success: true,
        data: {
          current: {
            weight: totalWeight,
            empty_weight: emptyWeight,
            full_weight: fullWeight,
            net_weight: netWeight,
            gas_percentage: gasPercentage,
            timestamp: allData.esp32.timestamp
          },
          esp32_timestamp: allData.esp32.timestamp,
          has_real_data: true,
          data_source: 'ESP32_REAL_WITH_CLIENT_CONFIG',
          historical: []
        },
        debug: {
          esp32_weight: totalWeight,
          config_empty: emptyWeight,
          config_full: fullWeight,
          calculated_net: netWeight,
          calculated_percentage: gasPercentage,
          formula: `${totalWeight} - ${emptyWeight} = ${netWeight} kg`
        }
      });
      
    } catch (error) {
      console.error('❌ [WEIGHT-DATA] ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
