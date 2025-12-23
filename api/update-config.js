import { writeFileSync, readFileSync, existsSync } from 'fs';

const DATA_FILE = '/tmp/esp32-data.json';

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
      
      console.log('⚙️ [UPDATE-CONFIG] Configuración recibida:', { empty_weight, full_weight });
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
      
      if (!empty_weight || !full_weight || empty_weight >= full_weight) {
        return res.status(400).json({
          success: false,
          error: 'Pesos inválidos. El peso lleno debe ser mayor que el peso vacío.'
        });
      }
      
      // Leer datos existentes
      let allData = { esp32: null, config: null };
      if (existsSync(DATA_FILE)) {
        try {
          const fileContent = readFileSync(DATA_FILE, 'utf8');
          allData = JSON.parse(fileContent);
        } catch (e) {
          console.log('⚙️ [UPDATE-CONFIG] Creando nuevo archivo');
        }
      }
      
      // Actualizar configuración
      allData.config = {
        empty_weight: parseFloat(empty_weight),
        full_weight: parseFloat(full_weight),
        configured_at: new Date().toISOString(),
        configured_by: 'CLIENT'
      };
      
      // Guardar en archivo
      writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
      
      console.log('✅ [UPDATE-CONFIG] Configuración guardada en archivo:', allData.config);
      
      return res.status(200).json({
        success: true,
        message: 'Configuración guardada correctamente',
        config: {
          empty_weight: parseFloat(empty_weight),
          full_weight: parseFloat(full_weight),
          capacity: parseFloat(full_weight) - parseFloat(empty_weight)
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [UPDATE-CONFIG] Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido.' });
}
