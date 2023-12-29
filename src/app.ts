import {CRTSimulator} from './lib/CRTSimulator';

export class App {
    private targetCanvas: HTMLCanvasElement | null = null;
    private videoElement: HTMLVideoElement | null = null;

    private bufferCanvas: HTMLCanvasElement;
    private crt!: CRTSimulator;

    private isEnabled = true;
    private brightness = 0.125;

    private brightnessSlider: HTMLInputElement | null = null;
    private toggleButton: HTMLButtonElement | null = null;

    constructor() {
        this.bufferCanvas = document.createElement('canvas');
        this.loadSettings();
        this.init();
    }

    private init() {
        this.getYoutubeVideoElement();
        if (this.videoElement) {
            this.initializeElements();
            this.attachResizeObserver();
            this.render();
        } else {
            setTimeout(() => {
                this.init();
            }, 100);
        }
    }


    private getYoutubeVideoElement() {
        const elem = document.querySelector('video.html5-main-video');
        if (elem) {
            this.videoElement = elem as HTMLVideoElement;
            this.videoElement.crossOrigin = 'anonymous';
        } else {
            this.videoElement = null;
        }
    }

    private initializeElements() {
        this.createCanvas();
        this.createToggleButton();
        this.createBrightnessSlider();

        this.crt = new CRTSimulator(this.targetCanvas!);
    }

    private createCanvas() {
        if (!this.videoElement) {
            return;
        }

        const container = this.videoElement.parentElement;
        if (!container) {
            return;
        }

        const canvas = document.createElement('canvas');

        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            position: absolute;
            transform: translateX(-50%);
            left: 50%;
            z-index: 10;
            background: black;
            pointer-events: none;
        `;
        videoContainer.appendChild(canvas);

        container.parentElement?.appendChild(videoContainer);

        canvas.style.cssText = this.videoElement.style.cssText;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        this.targetCanvas = canvas;
    }

    private createToggleButton() {
        const toggleButton = document.createElement('button');
        const iconUrl = chrome.runtime.getURL('assets/crt.svg');
        toggleButton.classList.add('ytp-button');
        toggleButton.id = 'btn-toggle-crt';
        toggleButton.style.cssText = `
            mask-image: url('${iconUrl}');
            mask-repeat: no-repeat;
            mask-size: 36px 36px;
            mask-position: center center;
            background-color: white;
        `;
        toggleButton.addEventListener('click', () => {
            this.setSettings(!this.isEnabled, this.brightness);
        });

        const fullScreenBtn = document.querySelector('button.ytp-fullscreen-button');
        if (fullScreenBtn) {
            fullScreenBtn.parentElement!.insertBefore(toggleButton, fullScreenBtn);
        }
        this.toggleButton = toggleButton;
    }

    private createBrightnessSlider() {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = 'any';
        slider.value = String(this.brightness);
        slider.id = 'slider-brightness';
        slider.style.height = '48px';
        slider.style.width = '96px';

        slider.addEventListener('input', (e) => {
            this.brightness = Number((e.target as HTMLInputElement).value) || 0;
        });
        slider.addEventListener('change', (e) => {
            this.brightness = Number((e.target as HTMLInputElement).value) || 0;
            this.setSettings(this.isEnabled, this.brightness);
        });

        const fullScreenBtn = document.querySelector('button.ytp-fullscreen-button');
        if (fullScreenBtn) {
            fullScreenBtn.parentElement!.insertBefore(slider, fullScreenBtn);
        }

        this.brightnessSlider = slider;
    }

    private attachResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            if (!this.videoElement) return;
            const canvas = this.targetCanvas!;
            canvas.style.cssText = this.videoElement.style.cssText;
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            canvas.style.pointerEvents = 'none';
        });
        if (this.videoElement) {
            resizeObserver.observe(this.videoElement);
        }
    }


    private render() {
        if (this.isEnabled && this.bufferCanvas && this.targetCanvas && this.videoElement) {
            try {
                this.drawVideoToBuffer();
                if (this.crt) {
                    this.crt.render(this.bufferCanvas, {brightBlur: this.brightness});
                }
            } catch (e) {
                console.error(e);
            }
        }

        requestAnimationFrame(() => {
            this.render();
        });
    }


    private drawVideoToBuffer() {
        if (this.targetCanvas && this.bufferCanvas && this.videoElement) {
            this.bufferCanvas.width = Math.round(this.targetCanvas.width / 3);
            this.bufferCanvas.height = Math.round(this.targetCanvas.height / 3);
            const ctx = this.bufferCanvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(this.videoElement, 0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            } else {
                console.error('buffer context not found');
            }
        }
    }

    private loadSettings() {
        chrome.storage.sync.get(['enable', 'brightness'], (result) => {
            this.isEnabled = !!result.enable;
            this.brightness = result.brightness || 0.125;

            if (this.targetCanvas && this.targetCanvas.parentElement) {
                this.targetCanvas.parentElement.style.display = this.isEnabled ? 'block' : 'none';
            }
            if (this.brightnessSlider) {
                this.brightnessSlider.value = String(this.brightness);
                this.brightnessSlider.disabled = !this.isEnabled;
            }
            if (this.toggleButton) {
                this.toggleButton.style.backgroundColor = this.isEnabled ? 'white' : '#666';
            }
        });
    }

    private setSettings(isEnabled: boolean, brightness: number) {
        chrome.storage.sync.set({enable: isEnabled, brightness}, () => {
            this.loadSettings();
        });
    }
}
