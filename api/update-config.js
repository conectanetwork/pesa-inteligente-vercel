// Variable global SOLO para configuración del cliente
if (!global.currentConfig) {
  global.currentConfig = null; // NO valores por defecto
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { clientCode, scaleCode, empty_weight, full_weight } = req.body;
      
      console.log('⚙️ [UPDATE-CONFIG] === CONFIGURACIÓN DEL CLIENTE ===');
      console.log('⚙️ [UPDATE-CONFIG] Configuración anterior:', global.currentConfig);
      console.log('⚙️ [UPDATE-CONFIG] Nueva configuración del cliente:', { empty_weight, full_weight });
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      if (!empty_weight || !full_weight || empty_weight >= full_weight) {
        return res.status(400).json({
          success: false,
          error: 'Pesos inválidos. El peso lleno debe ser mayor que el peso vacío.'
        });
      }
      
      // GUARDAR CONFIGURACIÓN DEL CLIENTE
      global.currentConfig = {
        empty_weight: parseFloat(empty_weight),
        full_weight: parseFloat(full_weight),
        configured_at: new Date().toISOString(),
        configured_by: 'CLIENT'
      };
      
      console.log('✅ [UPDATE-CONFIG] Configuración del CLIENTE guardada:', global.currentConfig);
      console.log('✅ [UPDATE-CONFIG] Ahora weight-data.js usará SOLO estos valores del cliente');
      
      return res.status(200).json({
        success: true,
        message: 'Configuración del cliente guardada correctamente',
        config: {
          empty_weight: parseFloat(empty_weight),
          full_weight: parseFloat(full_weight),
          capacity: parseFloat(full_weight) - parseFloat(empty_weight)
        },
        timestamp: new Date().toISOString(),
        note: 'Los cálculos ahora usarán únicamente esta configuración del cliente'
      });
      
    } catch (error) {
      console.error('❌ [UPDATE-CONFIG] Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
