const{ ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
let  userDataPath;
const recentProjectsContainer = document.querySelector('.recent-projects>container');
(async () => {
    userDataPath = await ipcRenderer.invoke('get/userDataPath');
    const oceRecentsPath= path.join(userDataPath, 'oceRecent.json')
    const veevaRecentsPath= path.join(userDataPath, 'veevaRecent.json')
    const veevaRecents = JSON.parse(fs.readFileSync(veevaRecentsPath, 'utf-8'));
    const veevaRecentProjects = veevaRecents.map(project=>project.projectId);
    console.log(veevaRecentProjects);
})();

function createElement(el, elClass){
    let element = document.createElement(el)
     element.classList.add(elClass)
     return element
 }

// function generateView(data){
//     data.veevaRecentProjects.array.forEach(projectId => {
//         const projectIdWrapper
//     });
// }