const { app, BrowserWindow, screen, ipcMain, Menu, MenuItem } = require('electron')
const windowStateKeeper = require('electron-window-state')
const path = require('path')
const fs = require('fs');

class EdetailWindow {
  constructor(dataForWindow) {
    this.window= null;
    this.isDataLoaded = false;
    this.edetailerData = dataForWindow;
    this.counterIndex = 0;
    this.disableDevToolEdit_button = '';
    this.enableDevToolEdit_button = '';
    this.state = windowStateKeeper({
      defaultWidth: 600,
      defaultHeight: 400
    });

    this.window = new BrowserWindow({
      x: this.state.x,
      y: this.state.y,
      backgroundColor: '#000',
      width: this.state.width,
      height: this.state.height,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'edetailPreload.js')
      }
    });

    // Bind event handlers
    this.window.on('close', this.handleWindowClose.bind(this));
    this.window.on('closed', this.handleWindowClosed.bind(this));

    // Load initial URL
    this.loadURL(this.getEdetailURLPath());

    this.state.manage(this.window);
  }

  handleWindowClose() {
    if (!this.window?.isDevToolsOpened()) {
      this.window.openDevTools();
    }
    this.window.webContents.removeWorkSpace(this.edetailerData.htmlPath);
  }

  handleWindowClosed() {
    console.log('edetail close');
    this.window = null;
  }

  changeTitle(title) {
    const setTitle = () => {
      if (this.window) {
        this.window.setTitle(title);
        this.window.webContents.removeListener('did-finish-load', setTitle);
      }
    };

    if (this.window) {
      this.window.webContents.on('did-finish-load', setTitle);
    }
  }

  getHtmlFile(sequanceName) {
    return this.edetailerData.filesInSequence[sequanceName]?.filter((html) => html.match(/.*\.(html?)/ig))[0];
  }

  getEdetailURLPath(currentSequanceIndex = this.counterIndex) {
    const currentSequanceName = this.edetailerData.sequences.at(currentSequanceIndex);
    this.changeTitle(currentSequanceName);
    return path.join(this.edetailerData.htmlPath, currentSequanceName, this.getHtmlFile(currentSequanceName));
  }

  addWorkSpace() {
    if (!this.window?.isDevToolsOpened()) {
      this.window.openDevTools();
      this.window.webContents.addWorkSpace(this.edetailerData.htmlPath);
    } else {
      this.window.closeDevTools();
      this.window.openDevTools();
      this.window.webContents.addWorkSpace(this.edetailerData.htmlPath);
    }
  }

  removeWorkSpace() {
    if (!this.window?.isDevToolsOpened()) {
      this.window.openDevTools();
    }
    this.window.webContents.removeWorkSpace(this.edetailerData.htmlPath);
  }

  loadURL(url) {
    this.window.loadURL(`file:///${url}`);
  }

  goNextSequence() {
    if (this.counterIndex < this.edetailerData.sequences.length - 1) {
      this.counterIndex++;
      this.loadURL(this.getEdetailURLPath());
    }
  }

  goPreviousSequence() {
    if (this.counterIndex > 0) {
      this.counterIndex--;
      this.loadURL(this.getEdetailURLPath());
    }
  }

  enableDevToolEdit() {
    this.addWorkSpace();
    console.log('live edit');
  }

  disableDevToolEdit() {
    this.removeWorkSpace();
    console.log('live.. edit');
  }

  // Event handlers

  handleFocusOnwindow(args) {
    if (this.window) {
      this.changeTitle(args);
      this.counterIndex = this.edetailerData.sequences.indexOf(args);
      this.loadURL(this.getEdetailURLPath());
      this.window.focus();
      return this.window;
    } else {
      return this.window;
    }
  }

  handleGotoSlide(args, e) {
    if (this.edetailerData.sequences.includes(args)) {
      this.changeTitle(args);
      this.counterIndex = this.edetailerData.sequences.indexOf(args);
      this.loadURL(this.getEdetailURLPath());
      return this.counterIndex;
    } else {
      e ? e.sender.send('gotoSlideReply', 'slide not present in sequence or is invalid'):'';
    }
  }

  handleGoNextSequence() {
    this.goNextSequence();
  }

  handleGoPreviousSequence() {
    this.goPreviousSequence();
  }

  handleArrowRight() {
    this.goNextSequence();
  }

  handleArrowLeft() {
    this.goPreviousSequence();
  }
}


module.exports = {EdetailWindow}

