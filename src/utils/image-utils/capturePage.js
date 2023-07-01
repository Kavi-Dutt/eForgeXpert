const { BrowserWindow, ipcRenderer, nativeImage } = require('electron')
const fs = require('fs')
// let colors = require('colors');
let offScreenWindow;

module.exports = (options, callback) => {
  offScreenWindow = new BrowserWindow({
    width: options.width,
    height: options.height,
    show: false,
    frame: false,
    webPreferences: {
      offscreenf: true
    }
  })

  offScreenWindow.setAspectRatio(4 / 3);
  offScreenWindow.loadURL(`file:///${options.url}`);

  offScreenWindow.setContentSize(options.width, options.height)
  offScreenWindow.webContents.on('did-stop-loading', e => {
    setTimeout(async () => {
      let image = await offScreenWindow.webContents.capturePage();
      let screenshot = image;

      // console.log.log(colors.bgYellow.green(screenshot))
      // Execute callback with screenshot
      callback({ screenshot })

      // Clean up.
      if (offScreenWindow.webContents.isBeingCaptured()) return
      offScreenWindow.close()
      offScreenWindow = null
    }, 2000);




  })
}