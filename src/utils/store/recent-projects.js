const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

class Recent {
    constructor(options) {
        this.userDataPath = app.getPath('userData');
        this.path = path.join(this.userDataPath, options.fileName + '.json');
    }

    readData() {
        try {
            const data = fs.readFileSync(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }

    }

    get getAllProject() {
        const data = this.readData();
        return data.map(project => project.projectId);
    }

    getProject(projectId){
        const data = this.readData();
       return data.find(project => project.projectId === projectId);
    }

    writData(data) {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(this.path, jsonData, 'utf-8')
    }

addProject(projectData) {
    const projects = this.readData();

    const existingIndex = projects.findIndex(p => p['projectId'] === projectData['projectId']);

    if (existingIndex !== -1) {
      projects.splice(existingIndex, 1);
    }

    projects.unshift(projectData); 

    if (projects.length > 50) {
      projects.pop(); 
    }

    this.writData(projects);
  }

}

module.exports = { Recent };