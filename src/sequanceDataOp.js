const{ipcMain,dialog} = require('electron')
const path = require('path')
const { opendir, readdir, stat } = require('fs/promises');
const fs =require('fs')

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')

// //const colors = require('colors');

let imgDirPath;
exports.ittrateAllImages= async function(sequanceData, sequanceName, htmlPath){
     imgDirPath = path.join(htmlPath, sequanceName, 'images' );
    let sequanceImages={};
    if(sequanceData.includes('images')){
        try {
           let  sequanceImgFiles = await readdir(imgDirPath);
           for (image of sequanceImgFiles){
                let sequanceImgPath = path.join(imgDirPath, image);
                let sequanceImgStat = await stat(sequanceImgPath);
               if(sequanceImgStat.isFile){
                let imgSize = Math.ceil(sequanceImgStat.size/1024)
                sequanceImages[image]= imgSize+"kb"
               }
                // // console.log(colors.bgGreen.red(sequanceImgStat));
            }
            // console.log(colors.bgGreen.red(sequanceImages))
            return sequanceImages;
            
          } catch (err) {
            // console.log.error(err);
          }
          
    }
    else{
        // console.log('no image folder found')
    }
   

    
}

exports.compressImg =  async function(imgName,htmlPath){
  let imgSrcPath = path.join(imgDirPath, imgName)
  imgSrcPath= imgSrcPath.replace(/\\/g, '/');
//   imgSrcPath= path.normalize(imgSrcPath)
  let distPath = path.join(imgDirPath, '..').replace('/\\/g', '/')
   distPath = distPath.replace(/\\/g, '/')
  console.log(imgSrcPath)

//  try{
    const files = await imagemin([imgSrcPath], {
        destination: distPath,
        plugins: [
            imageminJpegtran(),
            imageminPngquant({
                quality: [0.6, 0.9]
            },{verbose: true})
        ]
    });
    return files
//  }catch(err){
//      return err
//  }
 
    
    

  
}