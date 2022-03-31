const{ipcMain,dialog} = require('electron')
const{exec, execSync} = require('child_process')
const path = require('path')
const fs = require('fs');
// const colors = require('colors')

// escaping chracters in fileNames
 function replaceCharacters(string){
  const characters = [
    {
    " ":"` "
    },
   {
    "&":"`&"
    },
   {
    "'":"`'"
    },
   {
    "$":"`$"
    },
]
  for (const [i, each] of characters.entries()) {
    const previousChar = Object.keys(each);
    const newChar = Object.values(each);

    string = string.replaceAll(previousChar, newChar);
  }  
  
return string
}

// compressing single file
exports.compress = function(sequanceName, htmlPath){
    return new Promise ((resolve, reject)=>{
      sequanceName = replaceCharacters(sequanceName)
      let sequancePath = path.join(htmlPath,sequanceName,)
      let deliverablesPath = path.join(htmlPath, '..');
      let zipedFileName = `${sequanceName}.zip`;
      let destinationPath = path.join(htmlPath, zipedFileName );

      // console.log.log(sequanceName);
      // console.log.log(colors.bgCyan(sequanceName));

     let execCompress = exec(`Compress-Archive -Path ${sequancePath}\\* -DestinationPath ${destinationPath} -Force`,{'shell':'powershell.exe'}, (err, stdout, stderr) => {
          if (err) {
              reject(err)
            // console.log.error(`exec error: ${err}`);
            return;
          }
        // console.log.log('file compressed')
        });
        execCompress.on('exit',()=>{
            resolve(execCompress)
        })
    })
    
}

// compressing  all files
exports.compressAllFiles = async function(sequanceArray, htmlPath){
  return new Promise (async (resolve, reject)=>{
  for(i=0; i<sequanceArray.length; i++ ){
     sequanceName = replaceCharacters(sequanceArray[i])
    let sequancePath = path.join(htmlPath,sequanceName)
    let zipedFileName = `${sequanceName}.zip`;
    let deliverablesPath = path.join(htmlPath, '..')
    let destinationPath = path.join(htmlPath, zipedFileName );
   
    console.log(sequanceName);

    let execCompress = await new Promise (resolve=>{
      let childProcess = exec(`Compress-Archive -Path ${sequancePath}\\* -DestinationPath ${destinationPath} -Force`,{'shell':'powershell.exe'}, (err, stdout, stderr) => {
        if (err) {
            reject(err)
          // console.log.error(`exec error: ${err}`);
          return;
        }
      // console.log.log('file compressed')
    });
    
    childProcess.on('exit',()=>{
      mainWindow.webContents.send('on-compressing-all',sequanceArray[i])
      resolve('compressed')
    })
     
    })
  }
  resolve('compressed all')
})

  
}


exports.replaceCharacters = replaceCharacters;