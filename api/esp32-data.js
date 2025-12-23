import { writeFileSync, readFileSync, existsSync } from 'fs';

const DATA_FILE = '/tmp/pesa-config.json';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const timestamp = new Date().toISOString();
      
      console.log('🔥 [ESP32-DATA] Peso recibido:', data.weight, 'kg');
      
      if (!data.weight || !data.clientCode || !data.scaleCode) {
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos'
        });
      }
      
      if (data.clientCode !== 'CLI3U0KM7I1' || data.scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      const esp32Data = {
        weight: parseFloat(data.weight),
        timestamp: timestamp,
        clientCode: data.clientCode,
        scaleCode: data.scaleCode,
        version: data.version || 'unknown',
        received_at: timestamp
      };
      
      // Guardar en variable global (fallback)
      global.latestESP32Data = esp32Data;
      
      // Leer datos existentes del archivo
      let allData = { esp32: null, config: null };
      if (existsSync(DATA_FILE)) {
        try {
          const fileContent = readFileSync(DATA_FILE, 'utf8');
          allData = JSON.parse(fileContent);
        } catch (e) {
          console.log('🔥 [ESP32-DATA] Creando nuevo archivo');
        }
      }
      
      // Actualizar datos ESP32
      allData.esp32 = esp32Data;
      
      // Guardar en archivo
      writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
      
      console.log('🔥 [ESP32-DATA] GUARDADO en archivo:', esp32Data.weight, 'kg');
      
      return res.status(200).json({
        success: true,
        message: 'Datos recibidos correctamente',
        data: esp32Data,
        debug: {
          stored_weight: esp32Data.weight,
          timestamp: timestamp,
          file_saved: true
        }
      });
      
    } catch (error) {
      console.error('❌ [ESP32-DATA] ERROR:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ 
    error: 'Método no permitido. Use POST.' 
  });
}
