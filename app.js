const APP_CONFIG = {
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxpfGFWwk742MysJntyqIxVjiNowgRGt0-TE-Kcy5w0lexPPfzJ_imSB_TzYWrdXlD1sA/exec",
    RANGES: {
        sys: Array.from({length: 151}, (_, i) => i + 70),  
        dia: Array.from({length: 101}, (_, i) => i + 40),   
        pulse: Array.from({length: 121}, (_, i) => i + 40)  
    }
};

class BPTracker {
    constructor() {
        this.data = this.loadCache();
        this.initUI();
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

        document.getElementById('save-btn').addEventListener('click', () => this.sendData());
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
            }
        });
    }

    async sendData() {
        const btn = document.getElementById('save-btn');
        const status = document.getElementById('status');
        
        btn.disabled = true;
        btn.innerText = "Saving...";
        
        this.saveCache();

        try {
            await fetch(APP_CONFIG.SCRIPT_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "text/plain" }, 
                body: JSON.stringify(this.data)
            });

            status.style.display = "block";
            setTimeout(() => status.style.display = "none", 3000);
        } catch (error) {
            alert("Error saving data.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Save to Sheets";
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    }
}

window.onload = () => new BPTracker();