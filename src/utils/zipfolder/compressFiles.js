const{ipcMain,dialog} = require('electron')
const{exec, execSync} = require('child_process')
const path = require('path')
const fs = require('fs');
const archiver = require('archiver');
// const colors = require('colors')

/**
 * Compresses the specified slides by excluding symbolic links for the shared folder.
 * @param {string|string[]} sequences - The name of the slide sequence(s) to compress, or an array of slide names.
 * @param {string} htmlPath - The path to the HTML folder containing the slides.
 * @param {string} outputPath - The output path for the compressed ZIP file.
 * @returns {Promise} A Promise that resolves when the zipping is completed successfully or rejects if an error occurs.
 */
function compress(directoryPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${__dirname}folder.zip`)
    output.on('close', resolve)
    output.on('end', resolve)

    const archive = archiver('zip')
    archive.on('error', reject)
    archive.on('warning', reject)
    archive.pipe(output)

    archive
      .directory(__dirname, false)
      .finalize()
  })
}






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

// commenting below function as it's replaced by archiver package
// compress = function(sequanceName, htmlPath){
//     return new Promise ((resolve, reject)=>{
//       sequanceName = replaceCharacters(sequanceName)
//       let sequancePath = path.join(htmlPath,sequanceName,)
//       let deliverablesPath = path.join(htmlPath, '..');
//       let zipedFileName = `${sequanceName}.zip`;
//       let destinationPath = path.join(htmlPath, zipedFileName );
//      let execCompress = exec(`Compress-Archive -Path ${sequancePath}\\* -DestinationPath ${destinationPath} -Force`,{'shell':'powershell.exe'}, (err, stdout, stderr) => {
//           if (err) {
//               reject(err)
//             // console.log.error(`exec error: ${err}`);
//             return;
//           }
//         // console.log.log('file compressed')
//         });
//         execCompress.on('exit',()=>{
//             resolve(execCompress)
//         })
//     })
    
// }




// compressing  all files
compressAllFiles = async function(sequanceArray, htmlPath){
  return new Promise (async (resolve, reject)=>{
    let replacedCharSequanceArray= []
    let execCompress = await new Promise (resolve=>{
      let childProcess = exec(`
      $htmlPath ="${htmlPath}"
      $arr = @(Get-ChildItem -Path $htmlPath  -Name)
foreach ($item in $arr) {
    Write-Host " $i : $item"
    Compress-Archive -Path $htmlPath\\$item\\* -DestinationPath $htmlPath\\"$item".zip -Force
}`,{'shell':'powershell.exe'}, (err, stdout, stderr) => {
        if (err) {
            reject(err)
          // console.log.error(`exec error: ${err}`);
          return;
        }
      // console.log.log('file compressed')
    });
    
    childProcess.on('exit',()=>{
      mainWindow.webContents.send('on-compressing-all','done')
      resolve('compressed')
    })
     
    })
  // }
  resolve('compressed all')
})

  
}


module.exports = {
  compress,
  compressAllFiles,
  replaceCharacters
}