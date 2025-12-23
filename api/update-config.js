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
      
      console.log('⚙️ [UPDATE-CONFIG] Datos recibidos:', req.body);
      console.log('⚙️ [UPDATE-CONFIG] empty_weight:', empty_weight);
      console.log('⚙️ [UPDATE-CONFIG] full_weight:', full_weight);
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        console.log('⚙️ [UPDATE-CONFIG] ❌ Credenciales inválidas');
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      if (!empty_weight || !full_weight || empty_weight >= full_weight) {
        console.log('⚙️ [UPDATE-CONFIG] ❌ Pesos inválidos');
        return res.status(400).json({
          success: false,
          error: 'Pesos inválidos. El peso lleno debe ser mayor que el peso vacío.'
        });
      }
      
      // Forzar inicialización de variables globales
      if (!global.currentConfig) {
        global.currentConfig = {};
      }
      
      // Guardar configuración
      global.currentConfig = {
        empty_weight: parseFloat(empty_weight),
        full_weight: parseFloat(full_weight),
        configured_at: new Date().toISOString(),
        configured_by: 'CLIENT'
      };
      
      console.log('✅ [UPDATE-CONFIG] Configuración guardada:', global.currentConfig);
      
      return res.status(200).json({
        success: true,
        message: 'Configuración guardada correctamente',
        config: global.currentConfig,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [UPDATE-CONFIG] Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
