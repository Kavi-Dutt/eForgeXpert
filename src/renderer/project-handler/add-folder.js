const { ipcRenderer } = require('electron');
const { getAppSettings } = require('../utils/getSettings');
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
    const addPdfButton = document.querySelector('#add-pdf_btn');

    let projectId = projectIdInput.value;
    let hasShared = hasSharedCheckbox?.checked;

    projectIdInput.addEventListener('input', checkInputs);

    // send message to main process for adding project folder
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

    // send message to main process for adding a pdf script
    addPdfButton.addEventListener('click',function(){
        ipcRenderer.send(('add/script-pdf'));
    })

    function checkInputs() {
        if (projectIdInput.value !== '') {
            addProjectButton.classList.remove('disable');
        }
        else {
            addProjectButton.classList.add('disable');
        }
    }
})

// sents message to main process for adding project folder 
function openDilog(options) {
    ipcRenderer.send('open-dialog-trigerd', options)
    ipcRenderer.invoke('open-dialog').then((result) => console.log(result))
}

