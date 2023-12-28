import { CRTSimulator } from './lib/CRTSimulator';

let targetCanvas: HTMLCanvasElement | null = null;
let videoElement: HTMLVideoElement | null = null;
const bufferCanvas = document.createElement('canvas');
let scanline: CRTSimulator | null = null;

let isEnabled = true;
let brightness = 0.125;

function loadSetting() {
    chrome.storage.sync.get(['enable', 'brightness'], (result) => {
       isEnabled = !!result.enable;
       brightness = result.brightness || 0.125;

       if (targetCanvas && targetCanvas.parentElement) {
           targetCanvas.parentElement.style.display = isEnabled ? 'block' : 'none';
       }
       const brightnessSlider = document.querySelector('input#slider-brightness') as HTMLInputElement | null;
       if (brightnessSlider) {
           brightnessSlider.value = String(brightness);
       }
    });
}

function setSetting(enable: boolean, brightness: number) {
    chrome.storage.sync.set({ enable, brightness }, () => {
        loadSetting();
    });
}

function getYoutubeVideoElement() {
    const elem = document.querySelector('video.html5-main-video');
    return elem as (HTMLVideoElement | null);
}

function initializeElements() {
    if (!videoElement) {
        return;
    }
    const container = videoElement.parentElement;
    if (!container) {
        return;
    }

    const canvas = document.createElement('canvas');
    targetCanvas = canvas;
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.transform = 'translateX(-50%)';
    div.style.left = '50%';
    div.style.zIndex = '10';
    div.style.background = 'black';
    div.style.pointerEvents = 'none';
    div.appendChild(canvas);
    container.parentElement?.appendChild(div);
    canvas.style.cssText = videoElement.style.cssText;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.pointerEvents = 'none';

    createToggleButton();
    createBrightnessSlider();

    scanline = new CRTSimulator(canvas);
}

function createToggleButton() {
    const toggleButton = document.createElement('button');
    const crtUrl = chrome.runtime.getURL('assets/crt.svg');
    toggleButton.classList.add('ytp-button');
    toggleButton.id = 'btn-toggle-crt';
    toggleButton.setAttribute('area-keyshortcuts', 'c');
    toggleButton.style.cssText = `
        mask-image: url('${crtUrl}');
        mask-repeat: no-repeat;
        mask-size: 36px 36px;
        mask-position: center center;
        background-color: white;
    `;
    toggleButton.addEventListener('click', () => {
       setSetting(!isEnabled, brightness);
    });

    const fullScreenBtn = document.querySelector('button.ytp-fullscreen-button');
    if (fullScreenBtn) {
        fullScreenBtn.parentElement!.insertBefore(toggleButton, fullScreenBtn);
    }
    return toggleButton;
}

function createBrightnessSlider() {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = 'any';
    slider.value = String(brightness);
    slider.id = 'slider-brightness';
    slider.style.height = '48px';
    slider.style.width = '96px';

    slider.addEventListener('input', (e) => {
       brightness = Number((e.target as HTMLInputElement).value) || 0;
    });
    slider.addEventListener('change', (e) => {
        brightness = Number((e.target as HTMLInputElement).value) || 0;
        setSetting(isEnabled, brightness);
    });

    const fullScreenBtn = document.querySelector('button.ytp-fullscreen-button');
    if (fullScreenBtn) {
        fullScreenBtn.parentElement!.insertBefore(slider, fullScreenBtn);
    }
}

function drawVideoToBuffer() {
    if (targetCanvas && bufferCanvas && videoElement) {
        bufferCanvas.width = Math.round(targetCanvas.width / 3);
        bufferCanvas.height = Math.round(targetCanvas.height / 3);
        const ctx = bufferCanvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(videoElement, 0, 0, bufferCanvas.width, bufferCanvas.height);
        } else {
            console.error('buffer context not found');
        }
    }
}

function render() {
    if (isEnabled && bufferCanvas && targetCanvas && videoElement) {
        try {
            drawVideoToBuffer();
            if (scanline) {
                scanline.render(bufferCanvas, { brightBlur: brightness });
            }
        } catch (e) {
            console.error(e);
            // do nothing
        }
    }

    requestAnimationFrame(render);
}

function attachResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
        if (!videoElement) return;
        const canvas = targetCanvas!;
        canvas.style.cssText = videoElement.style.cssText;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        canvas.style.pointerEvents = 'none';
    });
    if (videoElement) {
        resizeObserver.observe(videoElement);
    }
}

function tryToInit() {
    const elem = getYoutubeVideoElement();
    if (elem) {
        videoElement = elem;
        videoElement.crossOrigin = 'anonymous';
        initializeElements();
        attachResizeObserver();
        render();
    } else {
        setTimeout(tryToInit, 100);
    }
}

function main() {
    loadSetting();
    tryToInit();
}

main();

