const {BrowserWindow,ipcRenderer, nativeImage}= require('electron')
const fs = require('fs')
// let colors = require('colors');
let offScreenWindow;

module.exports = (url,callback)=>{
    offScreenWindow= new BrowserWindow({
        width:1024,
        height:768,
        show:false,
        frame:false,
        webPreferences:{
            offscreenf:true
        }
    })
    
    offScreenWindow.setAspectRatio(4/3)
    offScreenWindow.loadURL(`file:///${url}`);

    offScreenWindow.setContentSize(1024,768)
    offScreenWindow.webContents.on('did-stop-loading', e => {
    setTimeout(async() => {
      let image = await offScreenWindow.webContents.capturePage()
      let screenshot = image
      
       // console.log.log(colors.bgYellow.green(screenshot))
      // Execute callback with screenshot
      callback({screenshot})
        
      // Clean up.
      if(offScreenWindow.webContents.isBeingCaptured()) return
      offScreenWindow.close()
      offScreenWindow = null
    }, 2000);


      

      })
}