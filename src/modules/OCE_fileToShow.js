const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const { opendir } = require('fs/promises');
const fs = require('fs');

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

    async openDialog(windowName) {
        return new Promise((resolve, reject) => {
            ipcMain.handle('open-dialog', async () => {
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

                ipcMain.removeHandler('open-dialog');
                return 'dialog opened';
            });
        });
    }

    async getProjectFiles(selectedPath, sharedPath) {
        
        this.edetailer = {
            drive: '',
            htmlPath: null,
            sequences: [],
            firstSequence: '',
            filesInSequence: {}
        };
        
        return new Promise(async (resolve, reject) => {
            const projectFolders = selectedPath.split('\\');
            const drive = projectFolders.shift();

            if (sharedPath) {
                this.edetailer.sharedPath = sharedPath;
            }

            this.edetailer.drive = drive;
            const lastFolder = projectFolders[projectFolders.length - 1];

            try {
                if (lastFolder === 'HTML') {
                    this.edetailer.htmlPath = selectedPath;
                    this.edetailer.sequences = [];
                    const dir = await opendir(selectedPath);

                    for await (const dirent of dir) {
                        this.edetailer.sequences.push(dirent.name);
                    }

                    this.edetailer.sequences.sort(new Intl.Collator('en', {
                        numeric: true,
                        sensitivity: 'accent'
                    }).compare);

                    resolve(this.edetailer);
                } else {
                    reject(new Error('Please select a valid path.'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    getFilesInSequences(result) {
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

        this.writeEdetailerDataFile();
    }

    writeEdetailerDataFile() {
        try {
            fs.mkdirSync(this.edetailerDataFolder, {
                recursive: true
            });
            const edetailerData = JSON.stringify(this.edetailer);
            // fs.writeFile(this.edetailerDataPath, edetailerData);
            fs.writeFileSync(this.edetailerDataPath, edetailerData);
        } catch (error) {
            console.log(error);
        }
    }

    get getEdetailerData() {
        try {
            const data = fs.readFileSync(this.edetailerDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Error reading edetailerData.json: ${error}`);
        }
    }

    deleteEdetailerDataFile() {
        return new Promise((resolve, reject) => {
            fs.unlink(this.edetailerDataPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = HtmlDirectory;
