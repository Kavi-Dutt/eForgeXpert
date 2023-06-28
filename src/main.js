const { app, BrowserWindow, Menu, MenuItem, screen, ipcMain, dialog, nativeImage } = require('electron')

const windowStateKeeper = require('electron-window-state')
const path = require('path')
const fs = require('fs');
const EventEmitter = require('events');
const { exec } = require('child_process');
const { opendir, readdir } = require('fs/promises');


const isDev = require('electron-is-dev');
// const colors = require('colors')

const mainMenu = require('./modules/mainMenu');
const { htmlDirectory } = require('./modules/OCE_fileToShow');
const { creatEdetailWindow } = require('./modules/edetailWin');
const compressFile = require('./utils/zip/compressFiles');
const sequanceDataOp = require('./modules/sequanceDataOp');
const capturePage = require('./utils/image-utils/capturePage');
const { oceConverter } = require('./utils/file-io/oce-converter');
const Store = require('./utils/store/setting');
const { placeShared } = require('./utils/file-io/place-shared');
const fileSystemUtils = require('./utils/file-io/fileSystemUtils');
const { Recent } = require('./utils/store/recent-projects')
const emitter = new EventEmitter();

let edetailer,
    edetailerData = {},
    edetailWindow,
    slectedSharedPath

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
        x: 0, y: 0,
        width: state.width, height: state.height,
        // width: 800, height: 600,
        frame: false,
        // titleBarStyle: 'hidden',
        // titleBarOverlay: true,
        // titleBarOverlay: {
        //     color: '#ff0000',
        //     symbolColor: '#74b1be'
        //   },
        webPreferences: {
            devTools: true,
            contextIsolation: false,
            nodeIntegration: true,
            webviewTag: true,
        }
    })

    // function for opening a folder in vs code
    function openInVsCode(sequancePath) {
        sequancePath = compressFile.replaceCharacters(sequancePath)
        let openVScode = exec(`cd ${sequancePath}; code . `, { 'shell': 'powershell.exe' }, (err, stdout, stderr) => {
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
            label: 'open in VS code',
            id: 'vscode',

        }
    ])

    // mainWindow.loadFile('renderer/main.html')
    if (isDev) {
        // Development mode: Load the file directly from the file system
        mainWindow.loadFile('renderer/main.html');
    } else {
        // Production mode: Load the file from the packaged app
        mainWindow.loadURL(`file://${path.join(__dirname, 'renderer', 'main.html')}`);
    }
    ipcMain.on('sequancesDataHolder/contextmenu', (e, args) => {
        contextMenuSequanceDataHolder.popup()
        contextMenuSequanceDataHolder.getMenuItemById('vscode').click = () => openInVsCode(args)
    })

    const userDataPath = app.getPath('userData');
    ipcMain.handle('get/userDataPath',()=> userDataPath);

    // settings for app
    const appSettings = new Store({
        confingName: 'user-settings',
        defaults: {
            settings: {
                crm: 'oce',
                buildWith: 'beSpoke',
                thumbnailName: 'thumb',
                thumbnailFormat: 'png',
                thumbnailWidth: 1024,
                thumbnailHeight: 768,
            }
        }
    });

    //listening for get/setting request
    ipcMain.handle('get/settingsPath', () => {
        return appSettings.path;
    });
    ipcMain.handle('get/settings', () => {
        return appSettings.get('settings');
    });


    ipcMain.handle('set/settings', (e, value) => {
        const currentCrm = appSettings.get('settings.crm')
        appSettings.set('settings', value);
        BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('settings/updated');
        });
             
        if(value.crm !== currentCrm){
            // if crm changed then re rendring content for respective crm 
            if (!edetailWindow?.isDestroyed()) {
                if (edetailWindow)
                    edetailWindow.close();
            }

            if(appSettings.get('settings.crm') === 'veeva'){
                const project = veevaRecents.readData()[0];
                selectedHTMLPath = project.path
                if(project.hasShared){
                    slectedSharedPath = project.sharedPath
                }
                console.log('veeva project:', project);

            } else if(appSettings.get('settings.crm') === 'oce'){
                const project = oceRecents.readData()[0];
                selectedHTMLPath = project.path;
                console.log('oce project:', project);
            }
            htmlDirectory.getProjectFiles(selectedHTMLPath).then((result) => {
                htmlDirectory.getFilesInSequnecs(result, slectedSharedPath);
                emitter.emit('filesLoaded');
            }).catch((err) => console.log(err));
        }
    });


    // recent folders added
    const veevaRecents = new Recent({ fileName: 'veevaRecent' });
    const oceRecents = new Recent({ fileName: 'oceRecent' });

    // loading and storing files in HTML folder
    mainWindow.webContents.on('did-finish-load', () => {
        ipcMain.on('open-dialog-trigerd', async (e, recentData) => {
            console.log(recentData)
            // closeing edetailWindow before adding anothers project
            if (!edetailWindow?.isDestroyed()) {
                if (edetailWindow)
                    edetailWindow.close();
            }

            try {
                let selectedHTMLPath = await htmlDirectory.openDialog(mainWindow);

                recentData.path = selectedHTMLPath;

                if (appSettings.get('settings.crm') === 'veeva') {
                    if (!(appSettings.get('settings.buildWith') === 'dspTool') && recentData.hasShared) {
                        slectedSharedPath = await placeShared.openDialog(mainWindow);
                    }
                    recentData.sharedPath = slectedSharedPath
                    veevaRecents.addProject(recentData);

                } else if (appSettings.get('settings.crm') === 'oce') {
                    oceRecents.addProject(recentData);
                }

                htmlDirectory.getProjectFiles(selectedHTMLPath, slectedSharedPath).then((result) => {
                    htmlDirectory.getFilesInSequnecs(result);
                    emitter.emit('filesLoaded');
                }).catch((err) => console.log(err));
            }
            catch (err) {
                console.log(err);
            }

        })

        
        ipcMain.on('open/recent-project', async (e, projectId)=>{
            if (!edetailWindow?.isDestroyed()) {
                if (edetailWindow)
                    edetailWindow.close();
            }

            if(appSettings.get('settings.crm') === 'veeva'){
                const project = veevaRecents.getProject(projectId);
                veevaRecents.addProject(project);
                selectedHTMLPath = project.path
                if(project.hasShared){
                    slectedSharedPath = project.sharedPath
                }

            } else if(appSettings.get('settings.crm') === 'oce'){
                const project = oceRecents.getProject(projectId);
                oceRecents.addProject(project);
                selectedHTMLPath = project.path;
            }
            htmlDirectory.getProjectFiles(selectedHTMLPath).then((result) => {
                htmlDirectory.getFilesInSequnecs(result, slectedSharedPath);
                emitter.emit('filesLoaded');
            }).catch((err) => console.log(err));
        })
    })

    // parsing and sending data to renderer and open edetail window function
    async function openEdetailWindow() {
        // if (!edetailWindow?.isDestroyed()) {
        //     if (edetailWindow)
        //         edetailWindow.close();
        // }
        try {
            edetailerData = fs.readFileSync(path.join(userDataPath, 'oce-data', 'edetailerData.json'));
            edetailerData = JSON.parse(edetailerData);
            if (appSettings.get('settings.crm') === 'veeva' && !(appSettings.get('settings.buildWith') === 'dspTool')) {
                await placeShared.putShared(mainWindow, edetailerData, edetailerData.sharedPath);
            }
            if (mainWindow.webContents.isLoading()) {
                mainWindow.webContents.on('dom-ready', () => {
                    mainWindow.webContents.send('data-from-main', edetailerData);
                })
            }
            else {
                mainWindow.webContents.send('data-from-main', edetailerData);
            }


        } catch (err) {
            // console.log.log(err)
        }

        edetailWindow = creatEdetailWindow(edetailerData);
    }

    // checking for last added project if already exist then open it
    fs.access(path.join(userDataPath, 'oce-data', 'edetailerData.json'), fs.constants.F_OK, (err) => {
        if (err) {
            console.log("doesnot exist");
        }
        else {
            openEdetailWindow();
        }
    })

    //   ____open edetatil window on click of add btn
    emitter.on('filesLoaded', (e) => {
        openEdetailWindow();

    })
    // handling sequance data request from preload.js
    ipcMain.handle("preload/request/sequanceData", (e) => {
        return edetailerData;
    })

    // minimizing main window 
    ipcMain.on('app/minimize', e => {
        mainWindow.minimize()
    })
    // close main Window
    ipcMain.on('app/close', e => {
        mainWindow.close()
    })
    // toggleFullscreen main Window
    ipcMain.on('app/toggleFullscreen', e => {
        if (mainWindow.isMaximized()) {
            mainWindow.restore()
        }
        else {
            mainWindow.maximize()
        }
    })


    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('isMaximized')
    })

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('isRestored')
    })

    // hadling compress all request
    ipcMain.handle('request-for-compress', async (e, args) => {
        // creating a directory for storing compressed files

        let zipFolderPath = await fileSystemUtils.createDirectory(path.resolve(edetailerData.htmlPath, '..'), 'zips');
        let execCompress = await compressFile.compress(args, edetailerData.htmlPath, zipFolderPath);
        return ('Done')
    })

    // handling request for compressing all files
    ipcMain.handle('request-for-compressAll', async (e, args) => {
        let zipFolderPath = await fileSystemUtils.createDirectory(path.resolve(edetailerData.htmlPath, '..'), 'zips');
        let compressAllFiles = await compressFile.compress(edetailerData.sequences, edetailerData.htmlPath, zipFolderPath);
        return compressAllFiles
    })

    ipcMain.on('request-for-sequenceData', async (e, args) => {
        let sequanceData = edetailerData.filesInSequence[args]
        let sequanceImages = await sequanceDataOp.ittrateAllImages(sequanceData, args, edetailerData.htmlPath)
        e.sender.send('images-from-main', sequanceImages)
    })

    // handling reqest for oce conversion

    ipcMain.handle('oce-conversion/request', async (e, args) => {
        try {
            await oceConverter.openDialog(mainWindow);
            e.sender.send('oce-converter/files-slected')
            await oceConverter.convert(mainWindow);
            e.sender.send('oce-converter/conversion-succed', {
                messageType: 'conversion-succed',
            })
            oceConverter.resestConverter();

        }
        catch (err) {
            e.sender.send('oce-converter/conversion-failed', {
                messageType: 'conversion-failed',
            })
        }
    })


    /* 
     -> comenting below handler for compersing img
     -> not working in production.
    */

    /* ipcMain.handle('compress-img-request',(e,args)=>{
        // console.log.log(args)
       return (sequanceDataOp.compressImg(args,edetailerData.htmlPath))
    }) */

    ipcMain.on('request-for-screenshot', (e, args) => {
        capturePage(args, screenshot => {
            e.sender.send('response-for-screenshot', screenshot)
        })

    })

    // open devTools in devM
    if(isDev){
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    }

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
