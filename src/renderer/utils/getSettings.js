const { ipcRenderer } = require('electron');
const fs = require('fs');
async function getAppSettings() {
    const settingPath = await ipcRenderer.invoke('get/settingsPath');
    const { settings } = JSON.parse(fs.readFileSync(settingPath));
    return settings;
}

module.exports = {getAppSettings};