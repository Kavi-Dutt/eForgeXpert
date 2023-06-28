const { ipcRenderer } = require('electron');
const{getAppSettings} = require('../utils/getSettings');
let appSettings;
(async () => {
    appSettings = await getAppSettings();
})();

ipcRenderer.on('settings/updated', async (e) => {
    appSettings = await getAppSettings();
});

// async function getAppSettings() {
//     const settingPath = await ipcRenderer.invoke('get/settingsPath');
//     const { settings } = JSON.parse(fs.readFileSync(settingPath));
//     return settings;
// }
document.addEventListener('DOMContentLoaded', () => {
    // add folder setting
    const projectIdInput = document.querySelector('#projectID-input');
    const hasSharedCheckbox = document.querySelector('#has-shared-checkbox');
    const addProjectButton = document.querySelector('#add-project_btn');

    let projectId = projectIdInput.value;
    let hasShared = hasSharedCheckbox?.checked;

    projectIdInput.addEventListener('input', checkInputs);
    // hasSharedCheckbox?.addEventListener('change', checkInputs);

    // sending ipc message on click of add project btn (currently in navigation bar)
    addProjectButton.addEventListener('click', function () {
        if (appSettings.crm === 'veeva') {
            const projectId = projectIdInput.value;
            const hasShared = hasSharedCheckbox.checked;
            openDilog({ projectId, hasShared });
        } else if (appSettings.crm === 'oce') {
            const projectId = projectIdInput.value;
            openDilog({ projectId });
        }

    });


    function checkInputs() {
        if (projectIdInput.value !== '') {
            addProjectButton.classList.remove('disable');
        }
        else {
            addProjectButton.classList.add('disable');
        }
    }
})

function openDilog(options) {
    ipcRenderer.send('open-dialog-trigerd', options)
    ipcRenderer.invoke('open-dialog').then((result) => console.log(result))
}

