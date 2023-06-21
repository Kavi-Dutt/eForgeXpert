const fs = require('fs');
const path = require('path');

/**
 * Creates a directory with the specified folder name inside the given path.
 * @param {string} parentPath - The path where the directory will be created.
 * @param {string} folderName - The name of the folder to create.
 * @returns {Promise} A Promise that resolves when the directory is created successfully or rejects if an error occurs.
 */
function createDirectory(dirPath, folderName) {
    const fullPath = path.join(dirPath, folderName);
  
    return new Promise((resolve, reject) => {
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            fs.mkdir(fullPath, { recursive: true }, (mkdirErr) => {
              if (mkdirErr) {
                reject(new Error(`Failed to create directory "${fullPath}". Error: ${mkdirErr.message}`));
              } else {
                resolve(fullPath);
              }
            });
          } else {
            reject(new Error(`Error accessing directory "${fullPath}". Error: ${err.message}`));
          }
        } else {
          resolve(fullPath);
        }
      });
    });
  }
module.exports = {
    createDirectory,
}