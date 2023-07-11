const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const { opendir } = require('fs/promises');
const { promises: fsPromises } = require('fs');
const fs = require('fs');

const {deleteFilesFromDirectory} = require('../utils/file-io/fileSystemUtils')

class HtmlDirectory {
    constructor() {
        this.pathToDDrive = path.join('D:\\');
        this.edetailer = {
            drive: '',
            htmlPath: null,
            sequences: [],
            firstSequence: '',
            filesInSequence: {}
        };
        this.edetailerDataFolder = path.join(app.getPath('userData'), 'edetailer-data');
        this.edetailerDataPath = path.join(this.edetailerDataFolder, 'edetailerData.json');
    }

    setEdetailerProperty(property, value) {
        this.edetailer[property] = value;
        return this.writeEdetailerDataFile();
    }

    // async openDialog(windowName) {
    //     return new Promise((resolve, reject) => {
    //         ipcMain.handle('open-dialog', async () => {
    //             try {
    //                 const dialogReturn = await dialog.showOpenDialog(windowName, {
    //                     properties: ['openDirectory']
    //                 });

    //                 if (!dialogReturn.canceled && dialogReturn.filePaths) {
    //                     resolve(dialogReturn.filePaths[0]);
    //                 } else {
    //                     reject('no selection');
    //                 }
    //             } catch (error) {
    //                 reject(error);
    //             }

    //             ipcMain.removeHandler('open-dialog');
    //             return 'dialog opened';
    //         });
    //     });
    // }

    async openDialog(windowName) {
        return new Promise( async (resolve, reject) => {
                try {
                    const dialogReturn = await dialog.showOpenDialog(windowName, {
                        properties: ['openDirectory']
                    });

                    if (!dialogReturn.canceled && dialogReturn.filePaths) {
                        resolve(dialogReturn.filePaths[0]);
                    } else {
                        reject('no selection');
                    }
                } catch (error) {
                    reject(error);
                }
                return 'dialog opened';
        });
    }


    // async getProjectFiles(selectedPath, sharedPath) {
    //     return new Promise(async (resolve, reject) => {
    //         const projectFolders = selectedPath.split('\\');
    //         const drive = projectFolders.shift();

    //         if (sharedPath) {
    //             this.edetailer.sharedPath = sharedPath;
    //         }

    //         this.edetailer.drive = drive;
    //         const lastFolder = projectFolders[projectFolders.length - 1];

    //         try {
    //             // if (lastFolder === 'HTML') {
    //                 this.edetailer.htmlPath = selectedPath;
    //                 this.edetailer.sequences = [];
    //                 const dir = await opendir(selectedPath);

    //                 for await (const dirent of dir) {
    //                     this.edetailer.sequences.push(dirent.name);
    //                 }

    //                 this.edetailer.sequences.sort(new Intl.Collator('en', {
    //                     numeric: true,
    //                     sensitivity: 'accent'
    //                 }).compare);

    //                 resolve(this.edetailer);
    //             // } else {
    //             //     reject(new Error('Please select a valid path.'));
    //             // }
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // }

    async getProjectFiles(selectedPath, sharedPath) {
        return new Promise(async (resolve, reject) => {
          const projectFolders = selectedPath.split('\\');
          const drive = projectFolders.shift();
      
          if (sharedPath) {
            this.edetailer.sharedPath = sharedPath;
          }
      
          this.edetailer.drive = drive;
          const lastFolder = projectFolders[projectFolders.length - 1];
      
          try {
            this.edetailer.htmlPath = selectedPath;
            this.edetailer.sequences = [];
            const dir = await opendir(selectedPath);
      
            for await (const dirent of dir) {
              const itemPath = path.join(selectedPath, dirent.name);
              const itemStats = await fsPromises.stat(itemPath);
      
              if (itemStats.isDirectory() && !dirent.name.endsWith('.zip')) {
                const sequenceFiles = await fsPromises.readdir(itemPath);
      
                if (sequenceFiles.some(file => file.endsWith('.html'))) {
                  this.edetailer.sequences.push(dirent.name);
                }
              }
            }
      
            this.edetailer.sequences.sort(new Intl.Collator('en', {
              numeric: true,
              sensitivity: 'accent'
            }).compare);
      
            resolve(this.edetailer);
          } catch (error) {
            reject(error);
          }
        });
      }
      
    getFilesInSequences( result, fileName = 'edetailerData.json' ) {
        this.edetailer = result;
        this.edetailer.filesInSequence = {};
        const sequenceList = this.edetailer.sequences;

        sequenceList.forEach((sequenceName) => {
            const sequencePath = path.join(this.edetailer.htmlPath, sequenceName);

            try {
                const filenames = fs.readdirSync(sequencePath);
                this.edetailer.filesInSequence[sequenceName] = filenames;
            } catch (error) {
                // Handle error if needed
            }
        });

        this.writeEdetailerDataFile(fileName);
    }

    writeEdetailerDataFile(fileName = 'edetailerData.json') {
        try {
            fs.mkdirSync(this.edetailerDataFolder, {
                recursive: true
            });
            const edetailerData = JSON.stringify(this.edetailer);
            fs.writeFileSync(path.join(this.edetailerDataFolder, fileName), edetailerData);
        } catch (error) {
            console.log(error);
        }
    }

     getEdetailerData(fileName = 'edetailerData.json') {
        
        try {
            const data = fs.readFileSync(path.join(this.edetailerDataFolder, fileName), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Error reading edetailerData.json: ${error}`);
        }
    }

    deleteEdetailerDataFile() {
        // return new Promise((resolve, reject) => {
        //     fs.unlink(this.edetailerDataPath, (err) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             resolve();
        //         }
        //     });
        // });

        deleteFilesFromDirectory(this.edetailerDataFolder);
    }
}

module.exports = HtmlDirectory;
