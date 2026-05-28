class FPSOverlay {
    constructor() {
        this.fpsArray = [];
        this.cpuArray = [];
        this.gpuArray = [];
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.currentFPS = 0;
        this.maxDataPoints = 60;

        // Mock data (in real app, would use native bindings)
        this.mockCPU = 0;
        this.mockGPU = 0;
        this.mockCPUTemp = 0;
        this.mockGPUTemp = 0;

        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.settings = {
            showGraph: true,
            showTemp: true,
            showMemory: true,
            showFrameTime: true,
            opacity: 0.9,
            updateRate: 16,
            colorTheme: 'default'
        };

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadSettings();
        this.startMonitoring();
        this.setupDragging();
    }

    setupDOM() {
        this.overlay = document.getElementById('overlay');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.graphSection = document.getElementById('graphSection');
        this.fpsValue = document.getElementById('fpsValue');
        this.cpuValue = document.getElementById('cpuValue');
        this.gpuValue = document.getElementById('gpuValue');
        this.memValue = document.getElementById('memValue');
        this.frameTimeValue = document.getElementById('frameTimeValue');
        this.cpuTemp = document.getElementById('cpuTemp');
        this.gpuTemp = document.getElementById('gpuTemp');
        this.canvas = document.getElementById('fpsChart');
        this.ctx = this.canvas.getContext('2d');

        this.setupCanvasSize();
    }

    setupCanvasSize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    setupEventListeners() {
        document.getElementById('toggleBtn').addEventListener('click', () => this.toggleGraph());
        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.toggleSettings());

        // Settings
        document.getElementById('showGraph').addEventListener('change', (e) => {
            this.settings.showGraph = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('showTemp').addEventListener('change', (e) => {
            this.settings.showTemp = e.target.checked;
            this.updateDisplay();
            this.saveSettings();
        });

        document.getElementById('showMemory').addEventListener('change', (e) => {
            this.settings.showMemory = e.target.checked;
            this.updateDisplay();
            this.saveSettings();
        });

        document.getElementById('showFrameTime').addEventListener('change', (e) => {
            this.settings.showFrameTime = e.target.checked;
            this.updateDisplay();
            this.saveSettings();
        });

        document.getElementById('opacitySlider').addEventListener('change', (e) => {
            this.settings.opacity = parseFloat(e.target.value);
            this.applyOpacity();
            this.saveSettings();
        });

        document.getElementById('updateRate').addEventListener('change', (e) => {
            this.settings.updateRate = parseInt(e.target.value);
            this.saveSettings();
        });

        document.getElementById('colorTheme').addEventListener('change', (e) => {
            this.settings.colorTheme = e.target.value;
            this.applyTheme();
            this.saveSettings();
        });
    }

    setupDragging() {
        this.overlay.addEventListener('mousedown', (e) => {
            if (e.target.closest('.header-controls')) return;
            this.isDragging = true;
            const rect = this.overlay.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            this.overlay.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const container = this.overlay.parentElement;
            container.style.left = (e.clientX - this.dragOffset.x) + 'px';
            container.style.right = 'auto';
            container.style.top = (e.clientY - this.dragOffset.y) + 'px';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.overlay.style.cursor = 'move';
        });

        this.overlay.addEventListener('mouseenter', () => {
            if (!this.isDragging) this.overlay.style.cursor = 'move';
        });

        this.overlay.addEventListener('mouseleave', () => {
            if (!this.isDragging) this.overlay.style.cursor = 'default';
        });
    }

    startMonitoring() {
        let lastUpdateTime = 0;

        const monitor = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.frameCount++;
            const frameTime = deltaTime;

            if (currentTime - lastUpdateTime >= this.settings.updateRate) {
                this.currentFPS = Math.round(1000 / (lastUpdateTime ? currentTime - lastUpdateTime : 16));
                this.updateMetrics(frameTime);
                lastUpdateTime = currentTime;
            }

            requestAnimationFrame(monitor);
        };

        requestAnimationFrame(monitor);
    }

    updateMetrics(frameTime) {
        // Update FPS
        this.fpsArray.push(this.currentFPS);
        if (this.fpsArray.length > this.maxDataPoints) this.fpsArray.shift();
        this.fpsValue.textContent = this.currentFPS;

        // Simulate CPU/GPU (replace with real data)
        this.mockCPU = 30 + Math.random() * 40;
        this.mockGPU = 25 + Math.random() * 50;
        this.mockCPUTemp = 45 + this.mockCPU * 0.3 + (Math.random() - 0.5) * 5;
        this.mockGPUTemp = 50 + this.mockGPU * 0.4 + (Math.random() - 0.5) * 8;

        this.cpuArray.push(this.mockCPU);
        if (this.cpuArray.length > this.maxDataPoints) this.cpuArray.shift();

        this.gpuArray.push(this.mockGPU);
        if (this.gpuArray.length > this.maxDataPoints) this.gpuArray.shift();

        // Update display values
        this.cpuValue.textContent = Math.round(this.mockCPU);
        this.gpuValue.textContent = Math.round(this.mockGPU);
        this.cpuTemp.textContent = Math.round(this.mockCPUTemp) + '°C';
        this.gpuTemp.textContent = Math.round(this.mockGPUTemp) + '°C';
        this.frameTimeValue.textContent = frameTime.toFixed(1);

        // Memory
        if (performance.memory) {
            const usedMemory = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            this.memValue.textContent = usedMemory;
        }

        this.drawGraph();
        this.updateDisplay();
        this.checkHighActivity();
    }

    updateDisplay() {
        // Show/hide elements based on settings
        document.querySelector('.memory-section').style.display = this.settings.showMemory ? 'flex' : 'none';
        document.querySelector('.frametime-section').style.display = this.settings.showFrameTime ? 'flex' : 'none';
        
        this.cpuTemp.style.display = this.settings.showTemp ? 'block' : 'none';
        this.gpuTemp.style.display = this.settings.showTemp ? 'block' : 'none';
    }

    drawGraph() {
        if (!this.settings.showGraph) return;

        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 20, 0, 0.5)';
        this.ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // Draw FPS graph
        this.drawLine(this.fpsArray, '#00ff00', width, height, 144);

        // Draw CPU graph with slight offset
        this.ctx.globalAlpha = 0.6;
        this.drawLine(this.cpuArray, '#ffaa00', width, height, 100);

        // Draw GPU graph
        this.ctx.globalAlpha = 0.4;
        this.drawLine(this.gpuArray, '#00aaff', width, height, 100);

        this.ctx.globalAlpha = 1;
    }

    drawLine(data, color, width, height, maxValue) {
        if (data.length < 2) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const step = width / (this.maxDataPoints - 1);

        for (let i = 0; i < data.length; i++) {
            const x = i * step;
            const y = height - (data[i] / maxValue) * height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    toggleGraph() {
        this.settings.showGraph = !this.settings.showGraph;
        this.graphSection.classList.toggle('show', this.settings.showGraph);
        document.getElementById('showGraph').checked = this.settings.showGraph;
        this.saveSettings();
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('show');
    }

    applyOpacity() {
        this.overlay.style.opacity = this.settings.opacity;
    }

    applyTheme() {
        this.overlay.classList.remove('cyan', 'orange', 'purple');
        if (this.settings.colorTheme !== 'default') {
            this.overlay.classList.add(this.settings.colorTheme);
        }
    }

    checkHighActivity() {
        if (this.currentFPS > 100 || this.mockCPU > 80 || this.mockGPU > 80) {
            this.overlay.classList.add('high-activity');
        } else {
            this.overlay.classList.remove('high-activity');
        }
    }

    saveSettings() {
        localStorage.setItem('fpsOverlaySettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('fpsOverlaySettings');
        if (saved) {
            this.settings = JSON.parse(saved);
            document.getElementById('showGraph').checked = this.settings.showGraph;
            document.getElementById('showTemp').checked = this.settings.showTemp;
            document.getElementById('showMemory').checked = this.settings.showMemory;
            document.getElementById('showFrameTime').checked = this.settings.showFrameTime;
            document.getElementById('opacitySlider').value = this.settings.opacity;
            document.getElementById('updateRate').value = this.settings.updateRate;
            document.getElementById('colorTheme').value = this.settings.colorTheme;

            this.applyOpacity();
            this.applyTheme();
            this.updateDisplay();
        }
        if (this.settings.showGraph) this.graphSection.classList.add('show');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new FPSOverlay();
});