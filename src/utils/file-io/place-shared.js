const { dialog } = require('electron');
const path = require('path');
// const { readFile, readdir,mkdir, rename, writeFile, cp, unlink } = require('fs/promises');
const fsPromises = require('fs').promises;
const fs = require('fs');

function openDialog(browserWindow) {
    return new Promise((resolve, reject) => {

        (async function () {
                let sharedSelectionReturn = await dialog.showOpenDialog(browserWindow, {
                    title: 'Select Shared',
                    properties: ['openDirectory'],
                });

                if (!sharedSelectionReturn.canceled) {
                    resolve(sharedSelectionReturn.filePaths[0]);
                }
                else{
                    reject('shared not selected');
                }
        })()
    })
}

// async function putShared(browserWindow, edetailerData, sharedPath) {
//     const htmlPath = edetailerData.htmlPath;
//     try {
//       for (const sequence of edetailerData.sequences) {
//         const sequencePath = path.join(htmlPath, sequence);
//         const currentFolder = path.basename(sequencePath);
  
//         const newShared = path.join(sequencePath, 'shared');
//         console.log(`sequancePath:${sequencePath}`);
//         await fsPromises.mkdir(newShared, {recursive:true});
//         await fsPromises.cp(sharedPath, newShared, {recursive:true});
  
//         console.log(`Shared successfully placed inside ${sequencePath}`);
//         browserWindow.webContents.send('oce-conversion/added-shared', {
//           folderName: currentFolder,
//           messageType: 'addedShared',
//         });
//       }
  
//       return 'Successfully converted all the files';
//     } catch (error) {
//       console.error(error);
//       throw error;
//     }
//   }


  async function putShared(browserWindow, edetailerData, sharedPath) {
    const htmlPath = edetailerData.htmlPath;
    try {
      if(edetailerData && sharedPath){
        for (const sequence of edetailerData.sequences) {
          const sequencePath = path.join(htmlPath, sequence);
          const currentFolder = path.basename(sequencePath);
      
          const newShared = path.join(sequencePath, 'shared');
      
          // Check if the symlink already exists
          try {
            await fsPromises.lstat(newShared);
            console.log(`Shared symlink already exists in ${sequencePath}`);
            continue; // Skip creating the symlink
          } catch (error) {
            // Symlink does not exist, proceed with creation
            // await fsPromises.mkdir(newShared, { recursive: true });
            await fsPromises.symlink(sharedPath, newShared, 'dir');
            console.log(`Shared successfully placed inside ${sequencePath}`);
          }
      
          browserWindow.webContents.send('oce-conversion/added-shared', {
            folderName: currentFolder,
            messageType: 'addedShared',
          });
        }
      
        return 'Successfully converted all the files';
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  

exports.placeShared = {putShared, openDialog};