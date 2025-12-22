class VercelUnificadoDashboard {
    constructor() {
        this.config = { empty_weight: 5.0, full_weight: 15.0 };
        this.currentData = { weight: 0, net_weight: 0, gas_percentage: 0 };
        
        console.log('🚀 Dashboard Vercel Unificado inicializado');
        console.log('🌐 URL: ' + window.location.origin);
        console.log('💰 Costo total: $0 USD');
        
        this.init();
    }
    
    async init() {
        await this.loadInitialData();
        this.startDataUpdates();
    }
    
    async loadInitialData() {
        try {
            const response = await fetch('/api/weight-data?clientCode=CLI3U0KM7I1&scaleCode=BSCWSBNSJBD');
            const data = await response.json();
            
            if (data.success && data.data.current) {
                this.updateCurrentData(data.data.current);
                console.log('✅ Datos iniciales cargados:', data.data.current);
            }
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }
    
    startDataUpdates() {
        setInterval(async () => {
            await this.fetchLatestData();
        }, 15000);
    }
    
    async fetchLatestData() {
        try {
            const response = await fetch('/api/weight-data?clientCode=CLI3U0KM7I1&scaleCode=BSCWSBNSJBD');
            const data = await response.json();
            
            if (data.success && data.data.current) {
                this.updateCurrentData(data.data.current);
            }
        } catch (error) {
            console.error('❌ Error actualizando datos:', error);
        }
    }
    
    updateCurrentData(data) {
        this.currentData = {
            weight: parseFloat(data.weight) || 0,
            net_weight: parseFloat(data.net_weight) || 0,
            gas_percentage: parseFloat(data.gas_percentage) || 0
        };
        
        this.updateUI();
    }
    
    updateUI() {
        const { weight, net_weight, gas_percentage } = this.currentData;
        
        // Actualizar gauge
        this.updateGauge(gas_percentage);
        
        // Actualizar valores
        document.getElementById('gasPercentage').textContent = gas_percentage.toFixed(1) + '%';
        document.getElementById('totalWeight').textContent = weight.toFixed(2) + ' kg';
        document.getElementById('netWeight').textContent = net_weight.toFixed(2) + ' kg';
        document.getElementById('digitalWeight').textContent = net_weight.toFixed(2);
        document.getElementById('detailTotal').textContent = weight.toFixed(2) + ' kg';
        document.getElementById('detailEmpty').textContent = this.config.empty_weight.toFixed(2) + ' kg';
    }
    
    updateGauge(percentage) {
        const gaugeProgress = document.getElementById('gaugeProgress');
        const circumference = 251.2;
        const offset = circumference - (percentage / 100) * circumference;
        
        gaugeProgress.style.strokeDasharray = `${circumference} ${circumference}`;
        gaugeProgress.style.strokeDashoffset = offset;
        
        let color = '#10b981';
        if (percentage <= 10) color = '#ef4444';
        else if (percentage <= 25) color = '#f97316';
        else if (percentage <= 50) color = '#f59e0b';
        
        gaugeProgress.style.stroke = color;
        document.getElementById('gasPercentage').style.color = color;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new VercelUnificadoDashboard();
});
