const APP_CONFIG = {
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxpfGFWwk742MysJntyqIxVjiNowgRGt0-TE-Kcy5w0lexPPfzJ_imSB_TzYWrdXlD1sA/exec",
    
    RANGES: {
        sys: Array.from({length: 151}, (_, i) => i + 70),  
        dia: Array.from({length: 101}, (_, i) => i + 40),   
        pulse: Array.from({length: 121}, (_, i) => i + 40)  
    }
};

class TreatmentSchema {
    constructor(data) {
        this.schemaID = String(data.SchemaID || '').trim();
        this.timeOfDay = String(data.TimeOfDay || 'Scheduled').trim();
        this.medicine = String(data.Medicine || '').trim();
        this.amount = String(data.Amount || '').trim();
        this.conditions = String(data.Conditions || '').trim();
        this.other = String(data.Other || '').trim();
    }
}

class GoogleSheetsService {
    constructor(scriptUrl) {
        this.scriptUrl = scriptUrl;
        this.schemas = [];
    }

    async fetchSchemas() {
        try {
            const response = await fetch(`${this.scriptUrl}?action=getSchedules`);
            const data = await response.json();
            this.schemas = data.map(item => new TreatmentSchema(item));
            console.log("Loaded raw data:", this.schemas);
            return this.schemas;
        } catch (error) {
            console.error("Failed to fetch schemas:", error);
            return [];
        }
    }

    getUniqueSchemaIDs() {
        const ids = new Set();
        this.schemas.forEach(s => {
            if (s.schemaID) ids.add(s.schemaID);
        });
        return Array.from(ids).sort();
    }

    /**
     * Nested grouping: TimeOfDay -> Medicine -> Array of {Amount, Conditions, Other}
     */
    getGroupedData(schemaID) {
        const filtered = this.schemas.filter(s => s.schemaID === schemaID);
        const grouped = {};
        
        filtered.forEach(item => {
            const period = item.timeOfDay;
            if (!grouped[period]) {
                grouped[period] = {};
            }
            
            const med = item.medicine;
            if (!grouped[period][med]) {
                grouped[period][med] = {
                    other: item.other,
                    variants: []
                };
            }
            
            grouped[period][med].variants.push({
                amount: item.amount,
                conditions: item.conditions
            });
        });
        
        return grouped;
    }
}

class BPTracker {
    constructor() {
        this.data = this.loadCache();
        this.chart = null;
        this.sheetsService = new GoogleSheetsService(APP_CONFIG.SCRIPT_URL);
        this.initUI();
        this.loadHistory();
        this.loadSchedules();
        this.registerServiceWorker();
    }

    loadCache() {
        return {
            sys: localStorage.getItem('bp_sys') || 120,
            dia: localStorage.getItem('bp_dia') || 80,
            pulse: localStorage.getItem('bp_pulse') || 70
        };
    }

    saveCache() {
        localStorage.setItem('bp_sys', this.data.sys);
        localStorage.setItem('bp_dia', this.data.dia);
        localStorage.setItem('bp_pulse', this.data.pulse);
    }

    initUI() {
        this.createPicker('#sys-trigger', APP_CONFIG.RANGES.sys, this.data.sys, 'sys');
        this.createPicker('#dia-trigger', APP_CONFIG.RANGES.dia, this.data.dia, 'dia');
        this.createPicker('#pulse-trigger', APP_CONFIG.RANGES.pulse, this.data.pulse, 'pulse');
        
        document.getElementById('info-btn').onclick = () => this.toggleModal(true);
        document.getElementById('close-modal').onclick = () => this.toggleModal(false);
        document.getElementById('schema-selector').onchange = (e) => this.setActiveSchema(e.target.value);
        
        window.onclick = (event) => {
            if (event.target == document.getElementById('info-modal')) this.toggleModal(false);
        };
        
        document.getElementById('save-btn').addEventListener('click', () => this.sendData());
    }

    async loadSchedules() {
        await this.sheetsService.fetchSchemas();
        const ids = this.sheetsService.getUniqueSchemaIDs();
        const selector = document.getElementById('schema-selector');
        
        selector.innerHTML = '<option value="">Choose schema...</option>';
        ids.forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id;
            selector.appendChild(opt);
        });

        if (ids.length > 0) {
            selector.value = ids[0];
            this.setActiveSchema(ids[0]);
        }
    }

    setActiveSchema(schemaID) {
        const container = document.getElementById('schema-content');
        if (!schemaID) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Choose a schema to view details</p>';
            return;
        }
        
        const grouped = this.sheetsService.getGroupedData(schemaID);
        this.renderSchemaUI(grouped);
    }

    renderSchemaUI(grouped) {
        const container = document.getElementById('schema-content');
        container.innerHTML = '';
        
        const periods = Object.keys(grouped);
        if (periods.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">No data found for this schema.</p>';
            return;
        }

        periods.forEach(period => {
            const periodSection = document.createElement('div');
            periodSection.className = 'period-section';
            periodSection.innerHTML = `<h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px; color: #007bff; text-align: left;">${period}</h3>`;
            
            const meds = Object.keys(grouped[period]);
            meds.forEach(medName => {
                const medData = grouped[period][medName];
                const medDiv = document.createElement('div');
                medDiv.style.marginBottom = '15px';
                medDiv.style.textAlign = 'left';

                // Medicine header
                let headerHtml = `<div style="font-weight: bold; font-size: 1.1em; color: #333;">${medName}</div>`;
                
                // General description (Other)
                if (medData.other) {
                    headerHtml += `<div style="font-size: 0.9em; color: #666; font-style: italic; margin-bottom: 5px;">${medData.other}</div>`;
                }
                
                medDiv.innerHTML = headerHtml;

                // Variants list (Conditions & Amount)
                const variantsList = document.createElement('ul');
                variantsList.style.margin = '5px 0 0 20px';
                variantsList.style.padding = '0';
                variantsList.style.listStyleType = 'disc';

                medData.variants.forEach(variant => {
                    const li = document.createElement('li');
                    li.style.fontSize = '0.95em';
                    li.style.color = '#444';
                    li.style.marginBottom = '3px';

                    let variantText = '';
                    if (variant.conditions) {
                        variantText += `<strong>${variant.conditions}</strong>`;
                    }
                    if (variant.amount) {
                        variantText += (variantText ? ': ' : '') + variant.amount;
                    }

                    if (variantText) {
                        li.innerHTML = variantText;
                        variantsList.appendChild(li);
                    }
                });

                if (variantsList.children.length > 0) {
                    medDiv.appendChild(variantsList);
                }
                
                periodSection.appendChild(medDiv);
            });
            
            container.appendChild(periodSection);
        });
    }

    toggleModal(show) {
        const modal = document.getElementById('info-modal');
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    }

    createPicker(selector, dataArr, defaultVal, key) {
        document.querySelector(selector).innerText = defaultVal;
        new MobileSelect({
            trigger: selector,
            wheels: [{ data: dataArr }],
            cancelBtnText: 'Cancel',
            ensureBtnText: 'OK',
            position: [dataArr.indexOf(Number(defaultVal)) >= 0 ? dataArr.indexOf(Number(defaultVal)) : 0],
            callback: (indexArr, data) => {
                this.data[key] = data[0];
                this.saveCache();
            }
        });
    }

    async loadHistory() {
        try {
            const response = await fetch(APP_CONFIG.SCRIPT_URL);
            const history = await response.json();
            this.renderChart(history);
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    }

    renderChart(history) {
        const ctx = document.getElementById('bpChart').getContext('2d');
        const labels = history.map(entry => new Date(entry.date).toLocaleDateString());
        const sysData = history.map(entry => entry.sys);
        const diaData = history.map(entry => entry.dia);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'SYS',
                        data: sysData,
                        borderColor: '#ff4757',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        tension: 0.3
                    },
                    {
                        label: 'DIA',
                        data: diaData,
                        borderColor: '#2f3542',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { min: 40, max: 200 }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    async sendData() {
        const btn = document.getElementById('save-btn');
        btn.disabled = true;
        
        try {
            await fetch(APP_CONFIG.SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify(this.data)
            });
            
            setTimeout(() => this.loadHistory(), 1000); 
            alert("Saved!");
        } catch (error) {
            alert("Error saving data.");
        } finally {
            btn.disabled = false;
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    }
}

window.onload = () => new BPTracker();
