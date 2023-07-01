const{ ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const{getAppSettings} = require('../utils/getSettings');
let userDataPath;
let appSettings;
let projects={
    veeva:{},
    oce:{},
};

const recentProjectsContainer = document.querySelector('.recent-projects > .container');

ipcRenderer.on('settings/updated', async (e) => {
    appSettings = await getAppSettings();
    if(appSettings.crm==='veeva'){
        generateView({projectsIds: projects.veeva.allIds});
        updateTopBar(projects.veeva.data[0]);
    } else if(appSettings.crm ==='oce'){
        generateView({projectsIds: projects.oce.allIds});
        updateTopBar(projects.oce.data[0]);
    }
});

(async () => {
    userDataPath = await ipcRenderer.invoke('get/userDataPath');

    projects.veeva.data = JSON.parse( fs.readFileSync( path.join( userDataPath, 'veevaRecent.json' ), 'utf-8' ) );

    projects.veeva.allIds = projects.veeva.data.map(project=>project.projectId);

    projects.oce.data = JSON.parse(fs.readFileSync( path.join( userDataPath, 'oceRecent.json' ), 'utf-8' ) );

    projects.oce.allIds = projects.oce.data.map(project=>project.projectId);

    appSettings = await getAppSettings();

    if(appSettings.crm==='veeva'){
        generateView({projectsIds: projects.veeva.allIds});
        updateTopBar(projects.veeva.data[0]);
    } else if(appSettings.crm ==='oce'){
        generateView({projectsIds: projects.oce.allIds});
        updateTopBar(projects.oce.data[0]);
    }

    ipcRenderer.on('settings/updated', async (e) => {
        appSettings = await getAppSettings();
    });
    // console.log(veevaRecentProjects);
})();

function createElement(el, elClass){
    let element = document.createElement(el)
     element.classList.add(elClass)
     return element
 }

function generateView(data){
    recentProjectsContainer.innerHTML='';
    data.projectsIds.forEach((projectId, i )=> {
        const projectIdWrapper = createElement('div', 'projectId-wrapper');
        projectIdWrapper.dataset.projectId = projectId;
        projectIdWrapper.addEventListener('click', function(){
            openProject(projectId)
            if(appSettings.crm==='veeva'){
                updateTopBar(projects.veeva.data[i]);
            } else if(appSettings.crm ==='oce'){
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
function updateTopBar(project){
    const projectIdText = document.querySelector('.project-id');
    const projectLocationText = document.querySelector('.project-location');
    projectIdText.innerText= project.projectId;
    projectLocationText.value = project.path;
}

function openProject(projectId){
    ipcRenderer.send('open/recent-project', projectId);
}