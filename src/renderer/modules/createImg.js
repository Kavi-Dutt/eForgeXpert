const{nativeImage}=require('electron')
const fs = require('fs')
const path = require('path')

exports.toJPEG= (nativeImage,{imgWidth, imgHeight})=>{
   nativeImage = nativeImage.resize({width:imgWidth, height:imgHeight})
   console.log(nativeImage.getSize())
   return nativeImage.toJPEG(100)
}
exports.toPNG= (nativeImage,{imgWidth, imgHeight})=>{
   nativeImage = nativeImage.resize({width:imgWidth, height:imgHeight})
   console.log(nativeImage.getSize())
   return nativeImage.toPNG()
}

exports.saveImg = ({data, fileName, ext, saveToPath })=>{
   let saveFile = path.join(saveToPath, `${fileName}.${ext}`)
   fs.writeFile(saveFile, data, (err)=>{
      if(err) console.log(err)
      else console.log('saved succesfully')
   } )
}