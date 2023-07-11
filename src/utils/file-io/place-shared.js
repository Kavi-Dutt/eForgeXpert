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
//   const htmlPath = edetailerData.htmlPath;
//   try {
//     if (edetailerData && sharedPath) {
//       for (const sequence of edetailerData.sequences) {
//         const sequencePath = path.join(htmlPath, sequence);
//         const currentFolder = path.basename(sequencePath);

//         const newShared = path.join(sequencePath, 'shared');

//         try {
//           const stats = await fsPromises.lstat(newShared);
//           if (stats.isSymbolicLink() || stats.isDirectory()) {
//             console.log(`Shared symlink or "shared" folder already exists in ${sequencePath}`);
//             continue; 
//           }
//         } catch (error) {
//           await fsPromises.symlink(sharedPath, newShared, 'dir');
//           console.log(`Shared successfully placed inside ${sequencePath}`);
//         }

//         browserWindow.webContents.send('oce-conversion/added-shared', {
//           folderName: currentFolder,
//           messageType: 'addedShared',
//         });
//       }

//       return 'Successfully converted all the files';
//     }
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

async function putShared(browserWindow, edetailerData, sharedPath) {
  const htmlPath = edetailerData.htmlPath;
  try {
    if (edetailerData && sharedPath) {
      for (const sequence of edetailerData.sequences) {
        const sequencePath = path.join(htmlPath, sequence);
        const currentFolder = path.basename(sequencePath);

        const newShared = path.join(sequencePath, 'shared');

        try {
          await fsPromises.access(newShared, fs.constants.R_OK);
          console.log(`Shared symlink or "shared" folder already exists in ${sequencePath}`);
          continue;
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error(`Error accessing ${newShared}: ${error.message}`);
            continue;
          }
        }

        try {
          await fsPromises.symlink(sharedPath, newShared, 'dir');
          console.log(`Shared successfully placed inside ${sequencePath}`);
        } catch (error) {
          console.error(`Error creating symlink in ${sequencePath}: ${error.message}`);
          continue;
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


async function deleteSharedSymLinks(edetailerData) {
  try {
    const htmlPath = edetailerData.htmlPath;
    if (edetailerData && htmlPath) {
      for (const sequence of edetailerData.sequences) {
        const sequencePath = path.join(htmlPath, sequence);
        const sharedPath = path.join(sequencePath, 'shared');

        try {
          const stats = await fsPromises.lstat(sharedPath);
          if (stats.isSymbolicLink()) {
            await fsPromises.unlink(sharedPath);
            console.log(`Shared symlink deleted from ${sequencePath}`);
          }
        } catch (error) {
          // Ignore if the symlink doesn't exist
        }
      }
    }
    return 'Successfully deleted all the symlinks';
  } catch (error) {
    console.error(error);
    throw error;
  }
}

  

exports.placeShared = {putShared, openDialog, deleteSharedSymLinks};