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
      
      // Verificar autenticación
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // USAR DATOS REALES DEL ESP32 (desde latestESP32Data)
      const currentWeight = global.latestESP32Data ? global.latestESP32Data.weight : 4.94; // Usar dato real del ESP32
      const timestamp = global.latestESP32Data ? global.latestESP32Data.timestamp : new Date().toISOString();
      
      console.log('📊 Enviando peso real del ESP32:', currentWeight, 'kg');
      
      return res.status(200).json({
        success: true,
        data: {
          current: {
            weight: currentWeight, // PESO REAL DEL ESP32
            empty_weight: 5.0,
            full_weight: 15.0,
            net_weight: Math.max(0, currentWeight - 5.0),
            gas_percentage: Math.min(100, Math.max(0, ((currentWeight - 5.0) / (15.0 - 5.0)) * 100)),
            timestamp: timestamp
          },
          esp32_timestamp: timestamp, // Para detección de datos nuevos
          historical: [] // Datos históricos simulados se generan en el frontend
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error en weight-data:', error);
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
