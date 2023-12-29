const SETTING_KEYS = ['enabled', 'brightness', 'pixelSize'] as const;
interface Constructor {
    <T>(v?: T): any;
}

export type Setting = {
    enabled: boolean;
    brightness: number;
    pixelSize: number;
};

export class SettingEvent extends Event {
   constructor(public data: Setting) {
       super('settingUpdated');
   }
}

const DefaultSetting = {
    enabled: true,
    brightness: 0.125,
    pixelSize: 1,
}

class SettingStore extends EventTarget {
    private _values: Setting = {...DefaultSetting};

    public get values(): Readonly<Setting> {
        return this._values;
    }
    constructor() {
        super();
        this.loadSettings();
    }

    private loadSettings() {
        chrome.storage.sync.get([...SETTING_KEYS], (result) => {
            this._values.enabled = result['enabled'] ?? DefaultSetting['enabled'];
            this._values.brightness = result['brightness'] ?? DefaultSetting['brightness'];
            this._values.pixelSize = result['pixelSize'] ?? DefaultSetting['pixelSize'];
            this.dispatchEvent(new SettingEvent({...this._values}));
        });
    }

    public setValue<K extends keyof Setting>(key: K, value: Setting[K]) {
        this._values[key] = value;
        chrome.storage.sync.set({...this._values}, () => {
            this.loadSettings();
        });
    }

    public setValues(options: Setting) {
        chrome.storage.sync.set({...options}, () => {
            this.loadSettings();
        });
    }

    public getValue<K extends keyof Setting>(key: K): Setting[K] {
        return this._values[key];
    }
}

export default new SettingStore();
