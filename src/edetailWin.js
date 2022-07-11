const { app, BrowserWindow, screen, ipcMain, Menu, MenuItem } = require('electron')
const windowStateKeeper = require('electron-window-state')
const path = require('path')
const fs = require('fs');

const EventEmitter = require('events');

const { opendir, readdir } = require('fs/promises');
// const colors = require('colors')
const handleSequnce = require('./fileToShow');
let edetailWindow;
let edetailWindowMenu = Menu.buildFromTemplate(require('./edetailWindowMenu'))

function creatEdetailWindow(dataForWindow) {

  let edetailerData = dataForWindow;

  let state = windowStateKeeper({
    defaultWidth: 600, defaultHeight: 400
  })

  edetailWindow = new BrowserWindow({
    x: state.x, y: state.y,
    // skipTaskbar:false,
    backgroundColor: '#000',
    // darkTheme:true,
    width: state.width, height: state.height,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'edetailPreload.js')
    }
  })

  getHtmlFile = (sequanceName) => {
    return edetailerData.filesInSequence[sequanceName].filter((html) => html.match(/.*\.(html?)/ig))[0]
  }

  // edetailURLPath = path.join(edetailerData.htmlPath, edetailerData.sequences[0], getHtmlFile(edetailerData.sequences[0]) );



  edetailWindow.on('close', () => {
    // removeing folders from devtols worksapce
    if (!edetailWindow?.isDevToolsOpened()) edetailWindow.openDevTools()
    edetailWindow.webContents.removeWorkSpace(edetailerData.htmlPath)
  });

  function removeWorkSpace(){
    if (!edetailWindow?.isDevToolsOpened()) {edetailWindow.openDevTools()}
    edetailWindow.webContents.removeWorkSpace(edetailerData.htmlPath)
  }

  edetailWindow.on('closed', () => {
    edetailWindow = null
  });

  let counterIndex = 0;


  // chageing title of window on page change
  function changeTitle(title) {
    edetailWindow.webContents.on('did-finish-load', () => {
      edetailWindow.setTitle(title)
    })
  }

  function edetailURLPath(currentSequanceIndex) {
    let currentSequanceName = edetailerData.sequences.at(currentSequanceIndex)
    changeTitle(currentSequanceName)
    // console.log(currentSequanceName)
    return path.join(edetailerData.htmlPath, currentSequanceName, getHtmlFile(currentSequanceName));
  }



  // adding current porject to workspace 
  

  function addWorkSpace(){
    if (!edetailWindow?.isDevToolsOpened()){
       edetailWindow.openDevTools()
       edetailWindow.webContents.addWorkSpace(edetailerData.htmlPath)
      }
    else{
      edetailWindow.closeDevTools()
      edetailWindow.openDevTools()
      edetailWindow.webContents.addWorkSpace(edetailerData.htmlPath)
    }
    // edetailWindow.closeDevTools()
  }


  edetailWindow.loadURL(`file:///${edetailURLPath(counterIndex)}`);


  // brings edetail window in focus when clicked on fullscreen btn in rederer
  ipcMain.on('focus-on-edetailWindow', (e, args) => {
    if (edetailWindow) {
      changeTitle(args)
      counterIndex = edetailerData.sequences.indexOf(args)
      edetailWindow.loadURL(`file:///${edetailURLPath(counterIndex)}`);
      edetailWindow.focus()
      return counterIndex
    }
    else {
      creatEdetailWindow(edetailerData);
    }

  })
  // console.log.log(counterIndex)

  // function for going to next slide
  function goNextSequence() {
    if (counterIndex < edetailerData.sequences.length - 1) {
      counterIndex++;
      edetailWindow.loadURL(`file:///${edetailURLPath(counterIndex)}`);
      // console.log.log(counterIndex)
    }
  }

  // function for going pervious slide
  function goPreviousSequence() {
    if (counterIndex > 0) {
      counterIndex--;
      edetailWindow.loadURL(`file:///${edetailURLPath(counterIndex)}`);
      // console.log.log(counterIndex)
    }
  }

  // going to next slide from menu
  edetailWindowMenu.getMenuItemById('nextSlideBtn').click = () => goNextSequence();

  // going to previous slide from menu
  edetailWindowMenu.getMenuItemById('prevSlideBtn').click = () => goPreviousSequence();


  //  going to given slide in gotSlide method form any sequence button
  ipcMain.on('gotoSlide', (e, args) => {
    if (edetailerData.sequences.includes(args)) {
      changeTitle(args)
      counterIndex = edetailerData.sequences.indexOf(args)
      edetailWindow.loadURL(`file:///${edetailURLPath(counterIndex)}`);
      // console.log.log(colors.cyan(args))
      // console.log.log(colors.green(counterIndex))
      return counterIndex
    }
    else {
      e.sender.send('gotoSlideReply', 'not a valid link')
      // console.log.log('not valid sequence name'.red)
    }

  })

  // going to next slide from in sequence button
  ipcMain.on('goNextSequence', (e) => goNextSequence())

  // going to prev slide from in sequence button
  ipcMain.on('goPreviousSequence', (e) => goPreviousSequence())

  // going to next slide on right key perssed
  ipcMain.on('edetailWin/ArrowRight', (e) => {
    goNextSequence();
  })

  // going to prev slide on left key perssed
  ipcMain.on('edetailWin/ArrowLeft', (e) => {
    goPreviousSequence();
  })


  // adding and removeing file from workspace
  let enableDevToolEdit = edetailWindowMenu.getMenuItemById('enableDevToolEdit');

  let disableDevToolEdit = edetailWindowMenu.getMenuItemById('disableDevToolEdit')

  enableDevToolEdit.click = function() {
    addWorkSpace()
    this.visible=false;
    disableDevToolEdit.visible= true;
     console.log('live edit')
   }
  disableDevToolEdit.click = function() {
    removeWorkSpace();
    this.visible=false;
    enableDevToolEdit.visible= true;
     console.log('live.. edit')
   }
  


  state.manage(edetailWindow);
  edetailWindow.setMenu(edetailWindowMenu)
  return edetailWindow
}



exports.creatEdetailWindow = creatEdetailWindow;
