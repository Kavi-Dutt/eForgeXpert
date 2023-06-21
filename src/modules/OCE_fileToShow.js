const {
    app,
    ipcMain,
    dialog
} = require('electron')
const path = require('path')
const {
    opendir,
    readdir
} = require('fs/promises');
const fs = require('fs')

//const colors = require('colors');
const {
    get
} = require('http');
const pathToDDrive = path.join('D:\\');
const crmEnv = "veeva";


let projectFolders, sequancePath;
let edetailer = {
    drive: '',
    htmlPath: null,
    sequences: [],
    firstSequence: '',
    filesInSequence: {}

}

async function openDialog(windowName) {
    return new Promise((resolve, reject) => {
        ipcMain.handle('open-dialog', async () => {
            let dialogReturn = await dialog.showOpenDialog(windowName, {
                properties: ['openDirectory']
            })
            if (!dialogReturn.canceled && dialogReturn.filePaths) {
                resolve(dialogReturn.filePaths[0]);
            } else {
                reject('no slection');
            }
            ipcMain.removeHandler('open-dialog');
        })
    })
}

// async
async function getProjectFiles(selectedPath) {
    if (crmEnv === "veeva") {
        return new Promise(async (resolve, reject) => {
            // console.log.log(colors.bgMagenta(selectedPath))
            projectFolders = selectedPath.split('\\');
            let drive = projectFolders.shift()
            //    adding drvie name to edetailer object
            edetailer.drive = drive;
            let lastFolder = projectFolders[projectFolders.length - 1]
            // console.log.log(colors.magenta(projectFolders))
            // if (lastFolder === 'HTML') {
                edetailer.htmlPath = selectedPath;
                edetailer.sequences = []
                const dir = await opendir(selectedPath)
                for await (const dirent of dir) {
                    edetailer.sequences.push(dirent.name)
                }
                //  // console.log.log(colors.cyan(edetailer.sequences))

                // sorting sequneces 
                edetailer.sequences.sort(new Intl.Collator('en', {
                    numeric: true,
                    sensitivity: 'accent'
                }).compare)

                resolve(edetailer)
            // } else {
            //     reject(new Error('please select a vaild path'.bgRed))
            // }
        })

    }
}

function getFilesInSequnecs(result) {
    edetailer = result
    edetailer.filesInSequence = {};
    let sequenceList = edetailer.sequences;
    sequenceList.forEach(sequanceName => {
        // // console.log.log(colors.bold(sequanceName))
        sequancePath = path.join(edetailer.htmlPath, sequanceName)
        try {
            let filenames = fs.readdirSync(sequancePath)
            edetailer.filesInSequence[sequanceName] = filenames

        } catch (err) {
            // console.log.log(err.message)
        }

    })
    let edetailerData = JSON.stringify(edetailer);

    const userDataPath = app.getPath('userData');

    const oceDataFolder = path.join(userDataPath, "oce-data");

    fs.mkdirSync(oceDataFolder, {
        recursive: true
    });

    const edetailerData_JsonPath = path.join(oceDataFolder, 'edetailerData.json');

    try {
        fs.writeFileSync(edetailerData_JsonPath, edetailerData);
    } catch (err) {
        // console.log.log(err)
    }

    // // console.log.log(colors.magenta(edetailerData))
    // // console.log.log(colors.bgCyan(edetailer.filesInSequence))
    // console.log.log(colors.brightYellow(edetailer))
    // // console.log.log(edetailer.filesInSequence[sequanceName].filter((html)=>html.match(/.*\.(html?)/ig)))
}




exports.htmlDirectory = {
    openDialog: openDialog,
    getProjectFiles: getProjectFiles,
    getFilesInSequnecs: getFilesInSequnecs,
    pathToDDrive: pathToDDrive,
}

exports.edetailer = edetailer