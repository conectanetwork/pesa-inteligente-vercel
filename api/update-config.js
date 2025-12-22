// Variable global para configuración (compartida con weight-data.js)
if (!global.currentConfig) {
  global.currentConfig = {
    empty_weight: 5.0,
    full_weight: 15.0
  };
}

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { clientCode, scaleCode, empty_weight, full_weight } = req.body;
      
      console.log('⚙️ [UPDATE-CONFIG] Solicitud de actualización:', { empty_weight, full_weight });
      
      // Verificar autenticación
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // Validar datos
      if (!empty_weight || !full_weight || empty_weight >= full_weight) {
        return res.status(400).json({
          success: false,
          error: 'Pesos inválidos. El peso lleno debe ser mayor que el peso vacío.'
        });
      }
      
      // ACTUALIZAR CONFIGURACIÓN GLOBAL
      global.currentConfig = {
        empty_weight: parseFloat(empty_weight),
        full_weight: parseFloat(full_weight)
      };
      
      console.log('✅ [UPDATE-CONFIG] Configuración actualizada globalmente:', global.currentConfig);
      
      return res.status(200).json({
        success: true,
        message: 'Configuración actualizada correctamente',
        config: {
          empty_weight: parseFloat(empty_weight),
          full_weight: parseFloat(full_weight),
          capacity: parseFloat(full_weight) - parseFloat(empty_weight)
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [UPDATE-CONFIG] Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ 
    error: 'Método no permitido. Use POST para actualizar configuración.' 
  });
}
