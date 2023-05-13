const{app, ipcMain,dialog} = require('electron')
const path = require('path')
const { opendir, readdir} = require('fs/promises');
const fs =require('fs')

//const colors = require('colors');
const { get } = require('http');

 const pathToDDrive = path.join('D:\\')

 
 let projectFolders, sequancePath;
  let edetailer ={
    drive:'',
    htmlPath: null,
    sequences: [],
    firstSequence: '', 
   filesInSequence:{}

}

async function  getProjectFiles(windowName) {
   return new Promise ((resolve, reject)=>{
    ipcMain.handle('open-dialog', async () => {
        let dialogReturn = await dialog.showOpenDialog(windowName,{
           properties: ['openDirectory']
       })
       let selectedPath = dialogReturn.filePaths[0]
       
       // console.log.log(colors.bgMagenta(selectedPath))
       projectFolders= selectedPath.split('\\');
       let drive=projectFolders.shift()

    //    adding drvie name to edetailer object
       edetailer.drive= drive
        let lastFolder = projectFolders[projectFolders.length-1]
        // console.log.log(colors.magenta(projectFolders))
        if(lastFolder==='HTML'){
            edetailer.htmlPath = selectedPath;
            edetailer.sequences= []
            const dir = await opendir(selectedPath)
            for await (const dirent of dir) {edetailer.sequences.push(dirent.name)}
            //  // console.log.log(colors.cyan(edetailer.sequences))

            // sorting sequneces 
            edetailer.sequences.sort(new Intl.Collator('en',{numeric:true, sensitivity:'accent'}).compare)

            resolve(edetailer)
        }
        else{
            reject(new Error('please select a vaild path'.bgRed))
        }
        ipcMain.removeHandler('open-dialog')
   })
   })
   
}

function getFilesInSequnecs (result){
    edetailer = result
    edetailer.filesInSequence={};
    let sequenceList =edetailer.sequences;
    sequenceList.forEach( sequanceName=>{
        // // console.log.log(colors.bold(sequanceName))
         sequancePath = path.join(edetailer.htmlPath, sequanceName)
       try{
        let filenames= fs.readdirSync(sequancePath)
        edetailer.filesInSequence[sequanceName]= filenames
      
       }
       catch(err){
        // console.log.log(err.message)
       }

    })
    let edetailerData= JSON.stringify(edetailer)
    let userDataPath = app.getPath('userData')
    
    try{
        fs.writeFileSync(path.join(userDataPath,'edetailerData.json'), edetailerData);
    }catch(err){
        // console.log.log(err)
    }
    
    // // console.log.log(colors.magenta(edetailerData))
    // // console.log.log(colors.bgCyan(edetailer.filesInSequence))
    // console.log.log(colors.brightYellow(edetailer))
    // // console.log.log(edetailer.filesInSequence[sequanceName].filter((html)=>html.match(/.*\.(html?)/ig)))
}




exports.htmlDirectory = {
    getProjectFiles: getProjectFiles,
    getFilesInSequnecs: getFilesInSequnecs,
    pathToDDrive: pathToDDrive,
}

exports.edetailer = edetailer


// async function ls(path) {
//     const dir = await fs.promises.opendir(path)
//     for await (const dirent of dir) {
//         // console.log.log(dirent.name)
//     }
// }