import settingStore from './settings';

export class SettingUI extends EventTarget {
    private container: HTMLDivElement;
    private isOpened = false;
    private checkClose: (e: MouseEvent) => void;
    constructor() {
        super();
        this.container = document.createElement('div');
        this.container.classList.add('ytp-popup', 'setting-popup');
        settingStore.addEventListener('settingUpdated', () => {
            this.render();
        })

        const styleTag = document.createElement('style');
        styleTag.appendChild(document.createTextNode(`
            .setting-popup {
                width: 256px;
                height: 140px;
                display: none;
                z-index: 70;
                bottom: 61px;
                right: 12px;
            }
            
            .ytp-big-mode .setting-popup {
                width: 298px;
                height: 180px;
            }
        `));
        document.head.appendChild(styleTag);
        this.checkClose = this._checkClose.bind(this);
    }

    init() {
        console.log('try to init the setting ui');
        const ytpSettingPopup = document.querySelector('div.ytp-settings-menu');
        if (ytpSettingPopup) {
            console.log('setting popup has been found.');
            ytpSettingPopup.parentElement?.insertBefore(this.container, ytpSettingPopup);
        } else {
            setTimeout(() => {
                this.init();
            }, 500);
        }
    }

    open() {
        if (!this.isOpened) {
            this.isOpened = true;
            this.container.style.display = 'block';
            setTimeout(() => {
                document.addEventListener('click', this.checkClose);
            });
            this.render();
        } else {
            this.isOpened = false;
            this.container.style.display = 'none';
        }
    }

    private _checkClose(e: MouseEvent) {
        let elem: HTMLElement | null = e.target as HTMLElement;
        while(elem && elem !== this.container) {
            elem = elem.parentElement;
        }
        if (elem === null) {
            this.isOpened = false;
            this.container.style.display = 'none';
            document.removeEventListener('click', this.checkClose);
        }
    }

    render() {
        const setting = settingStore.values;
        this.container.innerHTML = `
        <div class="ytp-panel">
          <div class='ytp-panel-menu' style='height: 140px'>
              <div class="ytp-menuitem enable-checkbox" role="menuitemcheckbox" aria-checked="${setting.enabled ? 'true' : 'false'}">
                <div class="ytp-menuitem-icon"></div>
                <div class="ytp-menuitem-label">Enabled</div>
                <div class="ytp-menuitem-content">
                    <div class="ytp-menuitem-toggle-checkbox"></div>
                </div>
              </div>
              <div class="ytp-menuitem">
                <div class="ytp-menuitem-icon"></div>
                <div class="ytp-menuitem-label">Brightness</div>
                <div class="ytp-menuitem-content">
                    <input class="brightness-checkbox" type="range" min="0" max="1" step="any" value="${setting.brightness.toString()}" />
                </div>
              </div>
              <div class="ytp-menuitem" role="menuitem">
                <div class="ytp-menuitem-icon"></div>
                <div class="ytp-menuitem-label">Pixel size</div>
                <div class="ytp-menuitem-content">
                    <div class="pixelsize-selector" style="display: flex; justify-content: space-evenly;">
                        <span data-size="1" style="color: ${setting.pixelSize === 1 ? 'white': '#999'}">1x</span>
                        <span data-size="2" style="color: ${setting.pixelSize === 2 ? 'white': '#999'}">2x</span>
                        <span data-size="3" style="color: ${setting.pixelSize === 3 ? 'white': '#999'}">3x</span>
                    </div>    
                </div>
              </div>
          </div>
        </div>
      `;

        this.container.querySelector('div.enable-checkbox')?.addEventListener('click', () => {
            settingStore.setValue('enabled', !settingStore.values.enabled);
        });

        this.container.querySelector('.brightness-checkbox')?.addEventListener('change', (e) => {
           const input = e.target as HTMLInputElement;
           settingStore.setValue('brightness', Number(input.value) || 0);
        });

        this.container.querySelector('.pixelsize-selector')?.addEventListener('click', (e) => {
            const targetElement = e.target as HTMLElement;
            if (!('dataset' in targetElement) || !('size' in targetElement.dataset)) {
                return;
            }

            const pixelSize = Number(targetElement.dataset.size) || 1;
            settingStore.setValue('pixelSize', pixelSize);
        });


    }
}
