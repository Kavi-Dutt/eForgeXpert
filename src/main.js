const {app, BrowserWindow, Menu, MenuItem , screen, ipcMain, dialog, nativeImage} = require('electron')

const windowStateKeeper = require('electron-window-state')
const path = require('path')
const fs = require('fs');
const EventEmitter = require('events');
const { exec } = require('child_process');
const { opendir, readdir} = require('fs/promises');



// const colors = require('colors')

const mainMenu = require('./mainMenu')
const {htmlDirectory} = require('./fileToShow')
const {creatEdetailWindow} = require('./edetailWin')
const compressFile= require('./compressFiles');
const sequanceDataOp = require('./sequanceDataOp');
const capturePage = require('./capturePage')

const emitter = new EventEmitter();

let edetailer,
    edetailerData={},
    edetailWindow

// let mainMenu = Menu.buildFromTemplate(require('./mainMenu'))

function createWindow() {
    const display = screen.getAllDisplays()
    const screenWidth = display[0].size.width
    const screenHeight = display[0].size.height
    const screenWidhtPercent = screenWidth / 100
    const screenHeightPercent = screenHeight / 100
    let state = windowStateKeeper({
        defaultWidth: 800, defaultHeight: 600,
        
      })

   global.mainWindow = new BrowserWindow({
    x: 0, y:0,
    width: state.width, height: state.height,
    // width: 800, height: 600,
    frame:false,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: true,
    // titleBarOverlay: {
    //     color: '#ff0000',
    //     symbolColor: '#74b1be'
    //   },
    webPreferences: {
        devTools:false,
        contextIsolation: false,
        nodeIntegration: true,
        webviewTag:true,
    }
    })

    // function for opening a folder in vs code
    function openInVsCode(sequancePath){
         sequancePath=compressFile.replaceCharacters(sequancePath)
        let openVScode=  exec(`cd ${sequancePath}; code . `,{'shell':'powershell.exe'}, (err, stdout, stderr) => {
            if (err) {
                // console.log.log(`error: ${err.message}`);
                return;
            }
            if (stderr) {
                // console.log.log(`stderr: ${stderr}`);
                return;
            }
          console.log(`stdout ${stdout}`)
          });
    }
    
    // context menu for sequance data holder area in renderer
    let contextMenuSequanceDataHolder = Menu.buildFromTemplate([
        {
            label:'open in VS code',
            id:'vscode',
            
        }
    ])
   
mainWindow.loadFile('renderer/main.html')

ipcMain.on('sequancesDataHolder/contextmenu',(e,args)=>{
    contextMenuSequanceDataHolder.popup()
    contextMenuSequanceDataHolder.getMenuItemById('vscode').click=()=>openInVsCode(args)
})

let userDataPath = app.getPath('userData');
// console.log(userDataPath)


// loading and storing files in HTML folder
mainWindow.webContents.on('did-finish-load',()=>{
ipcMain.on('open-dialog-trigerd',(e,args)=>{

    // closeing edetailWindow before adding anothers project
    if ( !edetailWindow?.isDestroyed()){
        if(edetailWindow)
            edetailWindow.close();
    }

    htmlDirectory.getProjectFiles(mainWindow).then((result)=>{
        htmlDirectory.getFilesInSequnecs(result)
        emitter.emit('filesLoaded')
   }).catch((err)=>console.log(err))
})
})

// parsing and sending data to renderer and open edetail window function
function openEdetailWindow(){
    try{
        edetailerData = fs.readFileSync(path.join(userDataPath,'edetailerData.json'));
        edetailerData = JSON.parse(edetailerData);
        // console.log(colors.red(edetailerData))
        if(mainWindow.webContents.isLoading()){
            mainWindow.webContents.on('dom-ready',()=>{
                mainWindow.webContents.send('data-from-main', edetailerData);
            })
        }
        else{
            mainWindow.webContents.send('data-from-main', edetailerData);
        }
        
        
    }catch(err){
        // console.log.log(err)
    }
    
   edetailWindow = creatEdetailWindow(edetailerData);
}

// checking for last added project if already exist then open it
fs.access(path.join(userDataPath,'edetailerData.json'),fs.constants.F_OK, (err) => {
    if(err){
        console.log("doesnot exist");
    }
    else{
        openEdetailWindow();
        console.log("esist");
    }
  })

//   ____open edetatil window on click of add btn
emitter.on('filesLoaded', (e)=>{
    openEdetailWindow();
    
})


// minimizing main window 
ipcMain.on('app/minimize', e=>{
    mainWindow.minimize()
})
// close main Window
ipcMain.on('app/close', e=>{
    mainWindow.close()
})
// toggleFullscreen main Window
ipcMain.on('app/toggleFullscreen', e=>{
    if(mainWindow.isMaximized()){
        mainWindow.restore()
    }
    else{
        mainWindow.maximize()
    }
    // // console.log.log('fullScreen')
})


mainWindow.on('maximize',()=>{
    mainWindow.webContents.send('isMaximized')
})

mainWindow.on('unmaximize',()=>{
    mainWindow.webContents.send('isRestored')
})

// hadling compress all request
ipcMain.handle('request-for-compress', async (e,args)=>{
        let execCompress = await compressFile.compress(args, edetailerData.htmlPath)
        // console.log.log('done')
        return ('Done')
})

// handling request for compressing all files
ipcMain.handle('request-for-compressAll',async(e,args)=>{
    let compressAllFiles = await compressFile.compressAllFiles(edetailerData.sequences, edetailerData.htmlPath)
    return compressAllFiles
})

ipcMain.on('request-for-sequenceData',async (e,args)=>{
    let sequanceData = edetailerData.filesInSequence[args]
    // console.log.log(colors.bgGreen.yellow(sequanceData))
   let sequanceImages = await sequanceDataOp.ittrateAllImages(sequanceData,args, edetailerData.htmlPath)
    e.sender.send('images-from-main', sequanceImages)
    // console.log.log(colors.bgRed(sequanceImages))
})

ipcMain.handle('compress-img-request',(e,args)=>{
    // console.log.log(args)
   return (sequanceDataOp.compressImg(args,edetailerData.htmlPath))
})

ipcMain.on('request-for-screenshot',(e,args)=>{
    capturePage(args, screenshot=>{
        // console.log.log(screenshot)
    e.sender.send('response-for-screenshot', screenshot)
   })
    
})



// Manage new window state
state.manage(mainWindow)
    // Open DevTools - Remove for PRODUCTION!
    // mainWindow.webContents.openDevTools();
    // Menu.setApplicationMenu(mainMenu)
    // Listen for window being closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        // app.quit()
    })
    console.log('app resatarted'.rainbow)

}

// app is ready
app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') app.quit()
})


// for mac os
app.on('activate', () => {
    if (mainWindow === null) createWindow()
})