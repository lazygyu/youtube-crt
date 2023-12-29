import {CRTSimulator} from './lib/CRTSimulator';
import setting, {SettingEvent} from './lib/settings';
import {SettingUI} from './lib/settingUi';

export class App {
    private settings = setting;
    private targetCanvas: HTMLCanvasElement | null = null;
    private videoElement: HTMLVideoElement | null = null;

    private bufferCanvas: HTMLCanvasElement;
    private crt!: CRTSimulator;

    private brightnessSlider: HTMLInputElement | null = null;
    private toggleButton: HTMLButtonElement | null = null;

    private brightness = 0.125;
    private settingPopup = new SettingUI();

    constructor() {
        this.bufferCanvas = document.createElement('canvas');
        this.settings.addEventListener('settingUpdated', this.handleSettingUpdated.bind(this));
        this.init();
    }

    private init() {
        this.getYoutubeVideoElement();
        if (this.videoElement) {
            this.settingPopup.init();
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
            this.settingPopup.open();
        });

        const fullScreenBtn = document.querySelector('button.ytp-fullscreen-button');
        if (fullScreenBtn) {
            fullScreenBtn.parentElement!.insertBefore(toggleButton, fullScreenBtn);
        }
        this.toggleButton = toggleButton;
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
        if (this.settings.values.enabled && this.bufferCanvas && this.targetCanvas && this.videoElement) {
            try {
                this.drawVideoToBuffer();
                if (this.crt) {
                    this.crt.render(this.bufferCanvas, {brightBlur: this.brightness, pixelSize: this.settings.values.pixelSize});
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
            const size = this.settings.values.pixelSize * 3;
            this.bufferCanvas.width = Math.round(this.targetCanvas.width / size);
            this.bufferCanvas.height = Math.round(this.targetCanvas.height / size);
            const ctx = this.bufferCanvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(this.videoElement, 0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            } else {
                console.error('buffer context not found');
            }
        }
    }

    private handleSettingUpdated(e: Event) {
        const values = (e as SettingEvent).data;
        this.brightness = values.brightness;
        if (this.targetCanvas && this.targetCanvas.parentElement) {
            this.targetCanvas.parentElement.style.display = values.enabled ? 'block' : 'none';
        }
        if (this.brightnessSlider) {
            this.brightnessSlider.value = String(values.brightness);
            this.brightnessSlider.disabled = !values.enabled;
        }
    }
}
