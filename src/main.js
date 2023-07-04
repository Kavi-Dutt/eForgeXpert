const { app, BrowserWindow, Menu,  ipcMain, } = require('electron')

const path = require('path')
const fs = require('fs');
const EventEmitter = require('events');
const { exec } = require('child_process');

let edetailWindowMenuTemplate = require('./modules/edetailWindowMenu');

const isDev = require('electron-is-dev');
// const colors = require('colors')

const { MainWindow } = require('./app-window/mainWindow')
const { EdetailWindow } = require('./app-window/edetailWin');
const { htmlDirectory } = require('./modules/OCE_fileToShow');
const compressFile = require('./utils/zip/compressFiles');
const sequanceDataOp = require('./modules/sequanceDataOp');
const capturePage = require('./utils/image-utils/capturePage');
const { oceConverter } = require('./utils/file-io/oce-converter');
const Store = require('./utils/store/setting');
const { placeShared } = require('./utils/file-io/place-shared');
const fileSystemUtils = require('./utils/file-io/fileSystemUtils');
const { Recent } = require('./utils/store/recent-projects');
const { pdfHandler } = require('./utils/file-io/handle-pdf');
const { proofing } = require('./modules/proofing');

const userDataPath = app.getPath('userData');

let edetailerData;

const mainWindow = new MainWindow();

let edetailWindow;

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

// recent folders added
const veevaRecents = new Recent({ fileName: 'veevaRecent' });
const oceRecents = new Recent({ fileName: 'oceRecent' });



mainWindow.sequanceContextMenu = Menu.buildFromTemplate([
    {
        label: 'open in VS code',
        id: 'vscode',

    }
]);

mainWindow.openInVsCode = function (sequancePath) {
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

mainWindow.openDialog = async function (recentData) {
    console.log(recentData)
    // closeing edetailWindow before adding anothers project
    if (!edetailWindow?.window?.isDestroyed()) {
        if (edetailWindow?.window)
            edetailWindow?.window.close();
    }

    try {
        mainWindow.selectedHTMLPath = await htmlDirectory.openDialog(mainWindow.window);

        recentData.path = mainWindow.selectedHTMLPath;

        if (appSettings.get('settings.crm') === 'veeva') {
            if (!(appSettings.get('settings.buildWith') === 'dspTool') && recentData.hasShared) {
                mainWindow.slectedSharedPath = await placeShared.openDialog(mainWindow.window)
            }
            recentData.sharedPath = mainWindow.slectedSharedPath;
            veevaRecents.addProject(recentData);

        } else if (appSettings.get('settings.crm') === 'oce') {
            oceRecents.addProject(recentData);
        }

        htmlDirectory.getProjectFiles(mainWindow.selectedHTMLPath, mainWindow.slectedSharedPath).then((result) => {
            htmlDirectory.getFilesInSequnecs(result);
            mainWindow.emitter.emit('filesLoaded');
        }).catch((err) => console.log(err));
    }
    catch (err) {
        console.log(err);
    }
}

mainWindow.openRecentProject = (projectId) => {
    if (!edetailWindow?.window?.isDestroyed()) {
        if (edetailWindow?.window)
            edetailWindow?.window.close();
    }

    if (appSettings.get('settings.crm') === 'veeva') {
        const project = veevaRecents.getProject(projectId);
        veevaRecents.addProject(project);
        mainWindow.selectedHTMLPath = project.path;
        mainWindow.scriptPdfPath = project.scriptPdfPath;
        if (project.hasShared) {
            mainWindow.slectedSharedPath = project.sharedPath
        }

    } else if (appSettings.get('settings.crm') === 'oce') {
        const project = oceRecents.getProject(projectId);
        oceRecents.addProject(project);
        mainWindow.selectedHTMLPath = project.path;
        mainWindow.scriptPdfPath = project.scriptPdfPath;
    }

    htmlDirectory.getProjectFiles(mainWindow.selectedHTMLPath, mainWindow.slectedSharedPath).then((result) => {
        htmlDirectory.getFilesInSequnecs(result);
        mainWindow.emitter.emit('filesLoaded');
    }).catch((err) => console.log(err));
}

mainWindow.addScriptPdf = async (e) => {
    mainWindow.scriptPdfPath = await pdfHandler.openDialog();

    e.sender.send('script-pdf-selected', mainWindow.scriptPdfPath);

    if (appSettings.get('settings.crm') === 'veeva') {
        const project = veevaRecents.readData()[0];
        project.scriptPdfPath = mainWindow.scriptPdfPath;
        veevaRecents.addProject(project);
    } else if (appSettings.get('settings.crm') === 'oce') {
        const project = oceRecents.readData()[0];
        project.scriptPdfPath = mainWindow.scriptPdfPath;
        oceRecents.addProject(project);
    }
}

mainWindow.openEdetailWindow = async () => {
    if (!edetailWindow?.window?.isDestroyed()) {
        if (edetailWindow?.window)
            edetailWindow?.window.close();
    }
    try {
        edetailerData = fs.readFileSync(path.join(userDataPath, 'oce-data', 'edetailerData.json'));
        edetailerData = JSON.parse(edetailerData);
        if (appSettings.get('settings.crm') === 'veeva' && !(appSettings.get('settings.buildWith') === 'dspTool')) {
            await placeShared.putShared(mainWindow.window, edetailerData, edetailerData.sharedPath);
        }
        if (mainWindow.window.webContents.isLoading()) {
            mainWindow.window.webContents.on('dom-ready', () => {
                mainWindow.window.webContents.send('data-from-main', edetailerData);
                pdfHandler.sendPdfPath(mainWindow.window);
            })
        }
        else {
            mainWindow.window.webContents.send('data-from-main', edetailerData);
            pdfHandler.sendPdfPath(mainWindow.window);
        }


    } catch (err) {
        // console.log.log(err)
    }

    setEdetailWindow(edetailerData);
    edetailWindow_initializeEvents();
}
mainWindow.initEvents = mainWindow_initializeEvents;

mainWindow.afterFinishLoad = () => {
    mainWindow.window.webContents.on('did-finish-load', () => {

        // listens request for add project from main window
        ipcMain.on('open-dialog-trigerd', async (e, recentData) => {
            console.log(recentData)
            mainWindow.openDialog(recentData);
        })

        // listens request for opening a recent project
        ipcMain.on('open/recent-project', async (e, projectId) => {
            mainWindow.openRecentProject(projectId);
        })

        // listens request for add a pdf script
        ipcMain.on('add/script-pdf', async (e, args) => {
            mainWindow.addScriptPdf(e);
        })
    })
}


app.on('ready', function () {
    mainWindow.createWindow();
    mainWindow.afterFinishLoad();
    mainWindow.initEvents();
    pdfHandler.init();
    proofing.init();
    fs.access(path.join(userDataPath, 'oce-data', 'edetailerData.json'), fs.constants.F_OK, (err) => {
        if (err) {
            console.log("doesnot exist");
        }
        else {
            mainWindow.openEdetailWindow();
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') app.quit()
})


// for mac os
app.on('activate', () => {
    if (mainWindow.window === null) {
        mainWindow.createWindow();
        mainWindow.afterFinishLoad();
    };
})

function setEdetailWindow(dataForWindow) {
    edetailWindow = new EdetailWindow(dataForWindow);

    // Build the menu from the modified template
    const edetailWindowMenu = Menu.buildFromTemplate(edetailWindowMenuTemplate);

    const edetailWin_nextBtn = edetailWindowMenu.getMenuItemById('nextSlideBtn')
    const edetailWin_prevBtn = edetailWindowMenu.getMenuItemById('prevSlideBtn')
    const edetailWin_enableLiveEdit = edetailWindowMenu.getMenuItemById('enableDevToolEdit');
    const edetailWin_disableLiveEdit = edetailWindowMenu.getMenuItemById('disableDevToolEdit');

    edetailWin_nextBtn.click = () => { edetailWindow.handleGoNextSequence() };
    edetailWin_prevBtn.click = () => { edetailWindow.handleGoPreviousSequence() };
    edetailWin_enableLiveEdit.click = function () {
        edetailWindow.enableDevToolEdit();
        this.visible = false;
        edetailWin_disableLiveEdit.visible = true;
    }
    edetailWin_disableLiveEdit.click = function () {
        edetailWindow.disableDevToolEdit();
        this.visible = false;
        edetailWin_enableLiveEdit.visible = true;
    }

    edetailWindow?.window.setMenu(edetailWindowMenu);
}

function mainWindow_initializeEvents() {

    mainWindow.emitter.on('filesLoaded', (e) => {
        mainWindow.openEdetailWindow();
    });


    // minimizing main window 
    ipcMain.on('app/minimize', e => {
        mainWindow.minimizeApp()
    })
    // close main Window
    ipcMain.on('app/close', e => {
        mainWindow.closeApp();
    })
    // toggleFullscreen main Window
    ipcMain.on('app/toggleFullscreen', e => {
        mainWindow.toggleFullscreen();
    })

    ipcMain.on('sequancesDataHolder/contextmenu', (e, args) => {
        mainWindow.sequanceContextMenu.popup();
        mainWindow.sequanceContextMenu.getMenuItemById('vscode').click = () => mainWindow.openInVsCode(args);
    })

    ipcMain.handle('get/userDataPath', () => userDataPath);

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


        // if crm changed then re-rendring content for respective crm 
        if (value.crm !== currentCrm) {
            if (!edetailWindow?.window?.isDestroyed()) {
                if (edetailWindow?.window)
                    edetailWindow?.window.close();
            }

            if (appSettings.get('settings.crm') === 'veeva') {
                const project = veevaRecents.readData()[0];
                mainWindow.selectedHTMLPath = project.path;
                mainWindow.scriptPdfPath = project.scriptPdfPath;
                if (project.hasShared) {
                    mainWindow.slectedSharedPath = project.sharedPath;
                }

            } else if (appSettings.get('settings.crm') === 'oce') {
                const project = oceRecents.readData()[0];
                mainWindow.selectedHTMLPath = project.path;
                mainWindow.scriptPdfPath = project.scriptPdfPath;
            }

            htmlDirectory.getProjectFiles(mainWindow.selectedHTMLPath, mainWindow.slectedSharedPath).then((result) => {
                htmlDirectory.getFilesInSequnecs(result);
                mainWindow.emitter.emit('filesLoaded');
            }).catch((err) => console.log(err));

        }
    });


    // handling sequance data request from preload.js
    ipcMain.handle("preload/request/sequanceData", (e) => {
        return edetailerData;
    })

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


    ipcMain.handle('oce-conversion/request', async (e, args) => {
        try {
            await oceConverter.openDialog(mainWindow.window)
            e.sender.send('oce-converter/files-slected')
            await oceConverter.convert(mainWindow.window);
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

    ipcMain.on('request-for-screenshot', (e, args) => {
        capturePage(args, screenshot => {
            e.sender.send('response-for-screenshot', screenshot)
        })

    })
    
}

function edetailWindow_initializeEvents(){
    ipcMain.on('focus-on-edetailWindow', (e, args) => {
       const window = edetailWindow.handleFocusOnwindow(args);
        if(!window){
            setEdetailWindow(edetailerData);
        }
      });

      ipcMain.on('gotoSlide', (e, args) => {
       edetailWindow.handleGotoSlide(args, e);
      })
    
      ipcMain.on('goNextSequence', edetailWindow.handleGoNextSequence);

      ipcMain.on('goPreviousSequence', edetailWindow.handleGoPreviousSequence);

      // going to next slide on right key perssed
      ipcMain.on('edetailWin/ArrowRight', ()=>{edetailWindow.handleArrowRight()});
    
      // going to prev slide on left key perssed
      ipcMain.on('edetailWin/ArrowLeft', ()=>{edetailWindow.handleArrowLeft()});
}



