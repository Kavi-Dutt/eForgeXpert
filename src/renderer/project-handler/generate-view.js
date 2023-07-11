const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { getAppSettings } = require('../utils/getSettings');
const { Recent } = require('../../utils/store/recent-projects')
let userDataPath;
let appSettings;
let projects = {
    veeva: {},
    oce: {},
};

const recentProjectsContainer = document.querySelector('.recent-projects > .container');
const multichannelNav = document.querySelector('#multichannel-nav');

ipcRenderer.on('settings/updated', async (e) => {
    appSettings = await getAppSettings();
    if (appSettings.crm === 'veeva' && projects.veeva.allIds?.length > 0) {
        generateView({ projectsIds: projects.veeva.allIds });
        updateTopBar(projects.veeva.data[0]);
        if(projects.veeva.data[0].isMultichannel){
            generatePersenation_DropDown(projects.veeva.data[0]);
        }
    } else if (appSettings.crm === 'oce' && projects.oce.allIds?.length > 0) {
        generateView({ projectsIds: projects.oce.allIds });
        updateTopBar(projects.oce.data[0]);
    }
});

(async () => {
    userDataPath = await ipcRenderer.invoke('get/userDataPath');
    try {
        projects.veeva.data = getVeevaRecents();

        projects.veeva.allIds = projects.veeva.data.map(project => project?.projectId);

        projects.oce.data = getOceRecents();

        projects.oce.allIds = projects.oce.data.map(project => project?.projectId);
        appSettings = await getAppSettings();

        if (appSettings.crm === 'veeva' && projects.veeva.allIds?.length > 0) {
            generateView({ projectsIds: projects.veeva.allIds });
            updateTopBar(projects.veeva.data[0]);

            if(projects.veeva.data[0].isMultichannel){
                generatePersenation_DropDown(projects.veeva.data[0]);
            }

        } else if (appSettings.crm === 'oce' && projects.oce.allIds?.length > 0) {
            generateView({ projectsIds: projects.oce.allIds });
            updateTopBar(projects.oce.data[0]);
        }
    } catch (err) {
        console.log(err);
    }




    ipcRenderer.on('settings/updated', async (e) => {
        appSettings = await getAppSettings();
    });
    // console.log(veevaRecentProjects);
})();

function getVeevaRecents() {
    try {
        return JSON.parse(fs.readFileSync(path.join(userDataPath, 'veevaRecent.json'), 'utf-8'))
    } catch (err) {
        return [];
    }
}

function getOceRecents() {
    try {
        return JSON.parse(fs.readFileSync(path.join(userDataPath, 'oceRecent.json'), 'utf-8'))
    } catch (err) {
        return [];
    }
}

function createElement(el, elClass) {
    let element = document.createElement(el)
    element.classList.add(elClass)
    return element
}

function generateView(data) {
    recentProjectsContainer.innerHTML = '';
    data.projectsIds.forEach((projectId, i) => {
        const projectIdWrapper = createElement('div', 'projectId-wrapper');
        projectIdWrapper.dataset.projectId = projectId;
        projectIdWrapper.addEventListener('click', function () {
            openProject(projectId)
            if (appSettings.crm === 'veeva') {
                updateTopBar(projects.veeva.data[i]);
            } else if (appSettings.crm === 'oce') {
                updateTopBar(projects.oce.data[i]);
            }
            ;

        })
        const projectIdText = createElement('p', 'projectId-text');
        projectIdText.innerText = projectId;
        projectIdWrapper.append(projectIdText);
        recentProjectsContainer.append(projectIdWrapper);
    });
}

//  update top menu
function updateTopBar(project) {
    const projectIdText = document.querySelector('.project-id');
    const projectLocationText = document.querySelector('.project-location');
    projectIdText.innerText = project?.projectId ? project.projectId : '';
    projectLocationText.value = project?.path ? project.path : '';
}

function generatePersenation_DropDown(recentProject){
    multichannelNav.innerHTML = '';
    const currentPresentation_text = createElement('p', 'current-presentation');
    const multichannelDropdown = createElement('div', 'multichannel-dropdown');
    multichannelDropdown.classList.add('d-none');
    currentPresentation_text.addEventListener('click', function(){
        multichannelDropdown.classList.toggle('d-none');
    })
    currentPresentation_text.innerText = decodeURIComponent(recentProject.presentations.presentationsId[0]);

    recentProject.presentations.presentationsId.forEach(presentationsId=>{

        const presentaionId_text = createElement('p', 'presentaionId-text');
        presentaionId_text.innerText = decodeURIComponent(presentationsId);
        presentaionId_text.dataset.presentationId = presentationsId;

        presentaionId_text.addEventListener('click', function(e){
            const clickedPresentationId = e.target.textContent;
            currentPresentation_text.textContent = clickedPresentationId;
            ipcRenderer.send('req/change-presentation', presentationsId);
            multichannelDropdown.classList.add('d-none');
        })

        multichannelDropdown.append(presentaionId_text);

    })

    multichannelNav.append(...[currentPresentation_text, multichannelDropdown])

}
function openProject(projectId) {
    ipcRenderer.send('open/recent-project', projectId);
}