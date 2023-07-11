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

function createElement(el, elClass) {
    let element = document.createElement(el)
    element.classList.add(elClass)
    return element
}

document.addEventListener('DOMContentLoaded', () => {
    // add folder setting
    const projectIdInput = document.querySelector('#projectID-input');
    const hasSharedCheckbox = document.querySelector('#has-shared-checkbox');
    const isMultiChannel_checkbox = document.querySelector('#is-multichannel');
    const presentationId_block = document.querySelector('#presentationId-block');
    const presentationId_container = document.querySelector('#presentationId-container');
    const PresentationId_input = document.querySelector('#presentationId-input');
    // const presentation_folderInput = document.querySelector('#presentation-folderInput');
    const addPresentation_button = document.querySelector('#add-presentationButton');

    const addProjectButton = document.querySelector('#add-project_btn');
    const addPdfButton = document.querySelector('#add-pdf_btn');

    isMultiChannel_checkbox.checked ? presentationId_block.classList.remove('d-none') : presentationId_block.classList.add('d-none');

    isMultiChannel_checkbox.addEventListener('change', function () {
        this.checked ? presentationId_block.classList.remove('d-none') : presentationId_block.classList.add('d-none');
    })

    PresentationId_input.addEventListener('input', function () {
        checkPersntationId_input();
    })

    const presentations = {
        presentationsId: [],
        presentationsPath: []
      };
      
    addPresentation_button.addEventListener('click', async function (e) {
        e.preventDefault();
        const selectedPath = await ipcRenderer.invoke('req/selectPresentation', PresentationId_input.value);
        console.log(selectedPath);
        addToSelection(PresentationId_input.value, selectedPath);
        console.dir(presentations);
        showPresentationId();
        PresentationId_input.value = "";
    })


    let projectId = projectIdInput.value;
    let hasShared = hasSharedCheckbox?.checked;

    projectIdInput.addEventListener('input', checkInputs);

    // send message to main process for adding project folder
    addProjectButton.addEventListener('click', function () {
        if (appSettings.crm === 'veeva') {
            const projectId = projectIdInput.value;
            const hasShared = hasSharedCheckbox.checked;
            if(isMultiChannel_checkbox.checked && presentations.presentationsPath.length > 0){
                const isMultichannel = isMultiChannel_checkbox.checked;
                ipcRenderer.send('req/open-multichannel-presentation',{projectId, hasShared, isMultichannel, presentations});
                presentations.presentationsId= [];
                presentations.presentationsPath= [];
            }else{
                openDilog({ projectId, hasShared });
            }

        } else if (appSettings.crm === 'oce') {
            const projectId = projectIdInput.value;
            openDilog({ projectId });
        }

    });

    // send message to main process for adding a pdf script
    addPdfButton.addEventListener('click', function () {
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

    function checkPersntationId_input() {
        if (PresentationId_input.value !== '') {
            addPresentation_button.classList.remove('disable');
        }
        else {
            addPresentation_button.classList.add('disable');
        }
    }

    function showPresentationId() {
        const presentationId_text = createElement('p', 'presentationId_text');
        presentationId_text.innerText = PresentationId_input.value;
        presentationId_container.append(presentationId_text);
    }

    function addToSelection(persntId, persentPath) {
        presentations.presentationsId.push(encodeURIComponent(persntId));
        presentations.presentationsPath.push(persentPath);
      }

})

// sents message to main process for adding project folder 
function openDilog(options) {
    ipcRenderer.send('open-dialog-trigerd', options)
    // ipcRenderer.invoke('open-dialog').then((result) => console.log(result))
}

