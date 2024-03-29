const { app, BrowserWindow, ipcMain, } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const isDev = require('electron-is-dev');
const EventEmitter = require('events');
class MainWindow {
  constructor() {
    this.window = null;
    this.edetailerData = {};
    this.selectedHTMLPath = '';
    this.slectedSharedPath = '';
    this.scriptPdfPath = '';
    this.presentations = {};
    this.presentationDataFiles = [];
    this.emitter = new EventEmitter();
  }

  createWindow() {
    const state = windowStateKeeper({
      defaultWidth: 800,
      defaultHeight: 600,
    });

    this.window = new BrowserWindow({
      x: 0,
      y: 0,
      width: state.width,
      height: state.height,
      frame: false,
      webPreferences: {
        devTools: isDev ? true: false,
        contextIsolation: false,
        nodeIntegration: true,
        webviewTag: true,
      },
    });

    if (isDev) {
      this.window.loadFile('renderer/main.html');
    } else {
      this.window.loadURL(`file://${path.join(__dirname,'..', 'renderer', 'main.html')}`);
    }


    this.window.on('maximize', () => {
      this.window.webContents.send('isMaximized');
    });

    this.window.on('unmaximize', () => {
      this.window.webContents.send('isRestored');
    });

    state.manage(this.window);

    if (isDev) {
        this.window.webContents.openDevTools({ mode: 'detach' })
    }

    this.window.on('closed', () => {
        this.window = null;
        // app.quit()
    })
    
    // ...
  }




  // minimizing main window
  minimizeApp() {
    this.window.minimize();
  }

  // close main Window
  closeApp() {
    this.window.close();
  }

  // toggleFullscreen main Window
  toggleFullscreen() {
    if (this.window.isMaximized()) {
      this.window.restore();
    } else {
      this.window.maximize();
    }
  }

}

module.exports = {
    MainWindow,
}


