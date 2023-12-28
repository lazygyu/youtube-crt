# Summary

This is a Chrome extension that simulates the CRT screen on YouTube.

# Install

Visit [Chrome Webstore](https://chromewebstore.google.com/detail/diaimpbedknjbpigcfehlbddmcikjnan?hl=ko)

# Development

After cloning this repository, run 
```bash
> npm install
```
to install dependencies.

Then go to the `chrome://extensions` (or `edge://extensions` if you are using Edge) in Chrome browser, enable the developer mode.

Then build the extension using the command below;

```bash
> npm run build
```

The `dist` folder must be created.

Then you can install this by click the `Load unpacked` from the extensions page and select the dist folder.
