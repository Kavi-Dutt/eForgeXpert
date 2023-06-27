const { app, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const { readFile, readdir,mkdir, rename, writeFile, cp, unlink } = require('fs/promises')
const fs = require('fs')
// const colors = require('colors');
exports.oceConverter = {
    isFoldersSelected: false,
    sequenceFolders: null,
    sharedFolder: null,
    openDialog: openDialog,
    convert: convert,
    resestConverter: function(){
        this.isFoldersSelected = false;
        this.sequenceFolders= null;
        this.sharedFolder = null;
    }

};

function openDialog(browserWindow) {
    return new Promise((resolve, reject) => {
        (async function () {
            let folderSlectionReturn;
            let sharedSelectionReturn;

            folderSlectionReturn = await dialog.showOpenDialog(browserWindow, {
                title: 'Select Folders For Conversion',
                properties: ['openDirectory', 'multiSelections'],
            })

            this.sequenceFolders = folderSlectionReturn.filePaths;

            if (!folderSlectionReturn.canceled) {
                sharedSelectionReturn = await dialog.showOpenDialog(browserWindow, {
                    title: 'Select Shared',
                    properties: ['openDirectory'],
                })
                !sharedSelectionReturn.canceled ? this.sharedFolder = sharedSelectionReturn.filePaths : '';
                if (!sharedSelectionReturn.canceled) {
                    this.sharedFolder = sharedSelectionReturn.filePaths[0];
                    this.isFoldersSelected = true;
                }
            }
            resolve('files for oce conversion');
        })()
    })
}

function convert(browserWindow) {
    return new Promise((resolve, reject) => {
        (async function () {
            this.sequenceFolders.forEach(async sequence => {
                let sequencePath = path.join(sequence);
                const currentFolder = path.basename(sequencePath);
                try {
                    const files = await readdir(sequencePath);
                    // console.log(colors.yellow(currentFolder));
                    browserWindow.webContents.send('oce-converter/current-folder',{
                        folderName: currentFolder,
                        messageType: 'info'
                    })
                    for (const file of files) {
                        // console.log(colors.green(` ${file}`));

                        if (path.extname(file) == '.html' || path.extname(file) == '.css' || path.extname(file) == '.js') {
                            try{
                                let x = await exports.replaceSharedPath(sequencePath, file);

                                browserWindow.webContents.send('oce-converter/replaced-content-file',{
                                    fileName:file,
                                    messageType: 'success',
                                })

                            }
                            catch(err){
                                browserWindow.webContents.send('oce-converter/error',{
                                    fileName:currentFolder,
                                    error: err,
                                    messageType: 'error',
                                })
                                console.log(err);
                            }
                            // console.log(path.join(sequencePath, file));

                            if (path.extname(file) == '.html') {

                                try{
                                    await addOCESrcipt(sequencePath,file);
                                    browserWindow.webContents.send('oce-converter/added-oce-script',{
                                        folderName: currentFolder,
                                        messageType: 'success',
                                    })
                                }

                                catch(err){
                                    browserWindow.webContents.send('oce-converter/error',{
                                        fileName:currentFolder,
                                        error: err,
                                        messageType: 'error',
                                    })
                                    console.log(`unable to add oce script ${err}`)
                                }

                                rename(path.join(sequencePath, file), path.join(sequencePath, `01_${currentFolder}${path.extname(file)}`));
                                browserWindow.webContents.send('oce-converter/renamed-html-file',{
                                    folderName: currentFolder,
                                    messageType: 'success',
                                })
                            }
                        }
                        else if (path.extname(file)== '.png'){
                            try{
                               await exports.convertPngToJpeg(sequencePath,file, '01_thumbnail');
                               browserWindow.webContents.send('oce-conversion/replaced-thumbnail',{
                                folderName: currentFolder,
                                messageType: 'success',
                            })

                            }
                            catch(err){
                                browserWindow.webContents.send('oce-converter/error',{
                                    fileName:currentFolder,
                                    error: err,
                                    messageType: 'error',
                                })
                                console.log(`error occured while creating thumbnail ${err}`)
                            }
                        }
                    }
                }
                catch (err) {
                    reject(err);
                    console.log('can not read files inside current sequance');
                    browserWindow.webContents.send('oce-converter/error',{
                        fileName:file,
                        messageType: 'error',
                    })
                }

                try{
                    await exports.placeShared(path.join(this.sharedFolder), sequencePath);
                    browserWindow.webContents.send('oce-conversion/added-shared',{
                        folderName:currentFolder,
                        messageType: 'addedShared',
                    })
                    resolve('successfully converted all the files')
                }
                catch(err){
                    reject(err);
                    console.log(err);
                    browserWindow.webContents.send('oce-converter/error',{
                        fileName:currentFolder,
                        error: err,
                        messageType: 'error',
                    })
                }

            })
            
        })()
    })


}

exports.replaceSharedPath = async function (sequencePath, file) {
    return new Promise(async (resolve, reject) => {
        const filePath = path.join(sequencePath, file);
        // console.log(filePath)
            try{
                const content = await readFile(filePath,{encoding:'utf-8'})
                const replacedContent = content.replace(/..\/shared\w*/g, ".\/shared");
                try{
                    await writeFile(filePath, replacedContent, {encoding:'utf8'})
                }
                catch(err){
                    reject(err);
                    return console.log(`unable to write file ${err}`);
                }
                resolve(filePath);
            }
            catch(err){
                reject(err);
                return console.log(`unable to read file ${err}`);
            }
            // fs.readFile(filePath, "utf8", async function (err, data) {
            //     if (err) {
            //         // reject(err);
            //         return console.log("Unable to read file: " + err);
            //     }

            //     const replacedData = data.replace(/..\/shared\w*/g, ".\/shared");

            //     fs.writeFile(filePath, replacedData, "utf8", function (err) {
            //         if (err) {
            //             // reject(err);
            //             return console.log("Unable to write file: " + err);
            //         }
            //         console.log(`Successfully replaced sahred path in ${filePath}`);
            //     });
            //     resolve(filePath);
            // });
        
    })
}

 async function addOCESrcipt (sequencePath, file){
    return new Promise(async (resolve, reject) => {
        const filePath = path.join(sequencePath, file);
        // console.log(filePath)
            try{
                const content = await readFile(filePath,{encoding:'utf-8'})
                const replacedContent = content.replace('</head>', ' <script>if (window.CLMPlayer) { window.oce = { config: {{{.}}} } }</script>\n</head>');
                try{
                    await writeFile(filePath, replacedContent, {encoding:'utf8'})
                }
                catch(err){
                    reject(err);
                    return console.log(`unable to write file ${err}`);
                }
                resolve(filePath);
            }
            catch(err){
                reject(err);
                return console.log(`unable to read file ${err}`);
            }
    })
 }

 exports.placeShared= function (sharedPath,sequencePath){
    return new Promise(async(resolve, reject) => {
        try{
            const newShared = path.join(sequencePath, 'shared');
            await exports.makeDirectory(newShared);
            await cp(sharedPath,newShared,{ recursive: true });
            console.log(`shared succesfully placed inside${sequencePath}`);
            resolve('succesfully copied shared');
        }
        catch(err){
            console.log(`error occured while copying ${sharedPath} to ${sequencePath}`);
            reject(err);
        }
    })
 }

 exports.makeDirectory = function(path){
    return new Promise(async (resolve, reject) => {
        try{
            const dirCreation= await mkdir(path, { recursive: true, });
            resolve(dirCreation)
        }
        catch(err){
            reject(err);
        }
    });
 }
 exports.convertPngToJpeg = function (folderPath, inputfile, imageName){
    return new Promise(async(resolve, reject) => {
        const pngPath = path.join(folderPath,inputfile);
        try{
            const image = nativeImage.createFromPath(pngPath);
            const jpegBuffer = image.toJPEG(60);
            unlink(pngPath);
            await writeFile(path.join(folderPath,`${imageName}.jpg`), jpegBuffer);
            resolve('replace thumbnail');
        }
        catch(err){
            reject(err)
        }
    })
 }