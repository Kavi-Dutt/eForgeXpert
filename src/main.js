const { app, BrowserWindow, Menu, ipcMain, } = require('electron')

const path = require('path')
const fs = require('fs');
const EventEmitter = require('events');
const { exec } = require('child_process');

let edetailWindowMenuTemplate = require('./modules/edetailWindowMenu');

const isDev = require('electron-is-dev');
// const colors = require('colors')

const { MainWindow } = require('./app-window/mainWindow')
const { EdetailWindow } = require('./app-window/edetailWin');
const HtmlDirectory = require('./modules/OCE_fileToShow');
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

const htmlDir = new HtmlDirectory();

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

// creating json file for  each presentation path's data
mainWindow.readMultichannelFiles = async function (presentationsPath) {
    let i = 0;
    for await (const presentationPath of presentationsPath) {
        const result = await htmlDir.getProjectFiles(presentationPath, mainWindow.slectedSharedPath)
        if (i === 0) {
            const fileName = `edetailerData.json`
            htmlDir.getFilesInSequences(result, fileName);
            mainWindow.presentationDataFiles.push(fileName);
        } else {
            const fileName = `edetailerData-${i}.json`;
            htmlDir.getFilesInSequences(result, fileName);
            mainWindow.presentationDataFiles.push(fileName);
            if (mainWindow.slectedSharedPath) {
                await placeShared.putShared(mainWindow.window, htmlDir.getEdetailerData(`edetailerData-${i}.json`), mainWindow.slectedSharedPath);
            };
        }
        i++;
    }
}

// opening and initializing multichannnle presentation in app
mainWindow.openMultiChannelPresentation = async function (recentData) {
    try {
        if (recentData.isMultichannel) {
            mainWindow.selectedHTMLPath = recentData.presentations.presentationsPath[0];
            htmlDir.edetailer.persentations = recentData.presentations;
            mainWindow.presentations = recentData.presentations;
            recentData.path = mainWindow.selectedHTMLPath;

            if (appSettings.get('settings.crm') === 'veeva') {
                if (!(appSettings.get('settings.buildWith') === 'dspTool') && recentData.hasShared) {
                    mainWindow.slectedSharedPath = await placeShared.openDialog(mainWindow.window);
                }
                recentData.sharedPath = mainWindow.slectedSharedPath;
                veevaRecents.addProject(recentData);
            }

            const presentationsPath = recentData.presentations.presentationsPath;
            await this.readMultichannelFiles(presentationsPath);
            mainWindow.emitter.emit('filesLoaded');
        }
    } catch (err) {
        console.log(`error occured in handling multichannel prsentation => ${err}`)
    }
}

// initializing project start with project  path selection
mainWindow.openDialog = async function (recentData) {
    // closeing edetailWindow before adding anothers project
    if (!edetailWindow?.window?.isDestroyed()) {
        if (edetailWindow?.window)
            edetailWindow?.window.close();
    }

    try {

        mainWindow.selectedHTMLPath = await htmlDir.openDialog(mainWindow.window);

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

        htmlDir.getProjectFiles(mainWindow.selectedHTMLPath, mainWindow.slectedSharedPath).then(async (result) => {
            htmlDir.getFilesInSequences(result);
            // await htmlDir.writeEdetailerDataFile();
            mainWindow.emitter.emit('filesLoaded');
        }).catch((err) => console.log(err));
    }
    catch (err) {
        console.log(err);
    }
}

mainWindow.openRecentProject = async (projectId) => {
    if (!edetailWindow?.window?.isDestroyed()) {
        if (edetailWindow?.window)
            edetailWindow?.window.close();
    }

    let veevaProject;
    if (appSettings.get('settings.crm') === 'veeva') {
        veevaProject = veevaRecents.getProject(projectId);
        veevaRecents.addProject(veevaProject);
        mainWindow.selectedHTMLPath = veevaProject.path;
        mainWindow.scriptPdfPath = veevaProject.scriptPdfPath;
        if (veevaProject.hasShared) {
            mainWindow.slectedSharedPath = veevaProject.sharedPath;
        }

    } else if (appSettings.get('settings.crm') === 'oce') {
        const project = oceRecents.getProject(projectId);
        oceRecents.addProject(project);
        mainWindow.selectedHTMLPath = project.path;
        mainWindow.scriptPdfPath = project.scriptPdfPath;
    }

    try {
        if (appSettings.get('settings.crm') === 'veeva' && veevaProject.isMultichannel) {
            const presentationsPath = veevaProject.presentations.presentationsPath;
            await mainWindow.readMultichannelFiles(presentationsPath);
        } else {
            const result = await htmlDir.getProjectFiles(mainWindow.selectedHTMLPath, mainWindow.slectedSharedPath);
            htmlDir.getFilesInSequences(result);
        }
        mainWindow.emitter.emit('filesLoaded');
    } catch (err) {
        console.log(err)
    }
}

mainWindow.openPresentation = async (presentationId, options) => {
    const { reloadEdetailWin } = options || { reloadEdetailWin: true };
    try {
        if (appSettings.get('settings.crm') === 'veeva' && presentationId) {
            const presentaionId_index = mainWindow.presentations.presentationsId.indexOf(presentationId);
            const jsonDataFile = mainWindow.presentationDataFiles[presentaionId_index];
            const data = htmlDir.getEdetailerData(jsonDataFile);

            // open presentation if slected from dropdown
            if (reloadEdetailWin) {
                edetailerData = data;
                mainWindow.window.webContents.send('data-from-main', data);
                edetailWindow.edetailerData = data;
                edetailWindow.handleGotoSlide(data.sequences[0]);
            } else {
                // if goto slide trigered in edetail window,
                edetailWindow.edetailerData = data;
            }
        }
    } catch (err) {
        console.log(err)
    }

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


mainWindow.projectOnStart = () => {
    if (appSettings.get('settings.crm') === 'veeva' && fs.existsSync(path.join(userDataPath, 'veevaRecent.json'))) {
        if (veevaRecents.readData().length > 0) {
            const project = veevaRecents.readData()[0];
            mainWindow.presentations = project.presentations;
            mainWindow.openRecentProject(project?.projectId);
        }
    } else if (appSettings.get('settings.crm') === 'oce' && fs.existsSync(path.join(userDataPath, 'oceRecent.json'))) {
        if (oceRecents.readData().length > 0) {
            const project = oceRecents.readData()[0];
            mainWindow.openRecentProject(project.projectId);
        }
    }
}

mainWindow.openEdetailWindow = async () => {
    if (!edetailWindow?.window?.isDestroyed()) {
        if (edetailWindow?.window)
            edetailWindow?.window.close();
    }
    try {
        edetailerData = htmlDir.getEdetailerData();
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
}
mainWindow.initEvents = mainWindow_initializeEvents;

mainWindow.afterFinishLoad = () => {
    mainWindow.window.webContents.on('did-finish-load', () => {
        ipcMain.removeAllListeners('open-dialog-trigerd');
        ipcMain.removeAllListeners('open/recent-project');
        ipcMain.removeAllListeners('add/script-pdf');
        ipcMain.removeHandler('req/selectPresentation');
        ipcMain.removeAllListeners('req/open-multichannel-presentation');

        // listens request for add project from main window
        ipcMain.on('open-dialog-trigerd', async (e, recentData) => {
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

        // listing for persenation slection in mainWindow
        ipcMain.handle('req/selectPresentation', async (e, args) => {
            return await htmlDir.openDialog(mainWindow.window);
        });

        // listening for opening of project 
        ipcMain.on('req/open-multichannel-presentation', (e, recentData) => {
            mainWindow.openMultiChannelPresentation(recentData);
        });
    })
}


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
    edetailWindow_initializeEvents()
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

    ipcMain.handle('set/settings', async (e, value) => {
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

                if(project?.isMultichannel){
                    mainWindow.selectedHTMLPath = project.presentations.presentationsPath[0];
                    htmlDir.edetailer.persentations = project.presentations;
                    mainWindow.presentations = project.presentations;
                    const presentationsPath = project.presentations.presentationsPath;
                    await mainWindow.readMultichannelFiles(presentationsPath);
                }else{
                    mainWindow.selectedHTMLPath = project?.path;
                }

                mainWindow.scriptPdfPath = project?.scriptPdfPath;

                if (project?.hasShared) {
                    mainWindow.slectedSharedPath = project?.sharedPath;
                }
                if(project?.isMultichannel){
                    mainWindow.emitter.emit('filesLoaded');
                    return;
                }
            } else if (appSettings.get('settings.crm') === 'oce') {
                const project = oceRecents.readData()[0];
                mainWindow.selectedHTMLPath = project?.path;
                mainWindow.scriptPdfPath = project?.scriptPdfPath;
            }

            if (mainWindow.selectedHTMLPath) {
               try{
                const result = await htmlDir.getProjectFiles(mainWindow.selectedHTMLPath, mainWindow.slectedSharedPath);
                htmlDir.getFilesInSequences(result);
                mainWindow.emitter.emit('filesLoaded');
               }
               catch(err){
                console.log(err)
               }
            }
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

    ipcMain.on('req/remove-shared', function () {
        if (appSettings.get('settings.crm') === 'veeva') {
            placeShared.deleteSharedSymLinks(edetailerData);
        }
    });

    // listent for changing of presentation from dropdown
    ipcMain.on('req/change-presentation', (e, persentationId) => {
        mainWindow.openPresentation(persentationId);
    })

}

function edetailWindow_initializeEvents() {
    ipcMain.removeAllListeners('focus-on-edetailWindow');
    ipcMain.removeAllListeners('gotoSlide');
    ipcMain.removeAllListeners('goNextSequence');
    ipcMain.removeAllListeners('goPreviousSequence');
    ipcMain.removeAllListeners('edetailWin/ArrowRight');
    ipcMain.removeAllListeners('edetailWin/ArrowLeft');

    ipcMain.on('focus-on-edetailWindow', (e, args) => {
        const window = edetailWindow.handleFocusOnwindow(args);
        if (!window) {
            setEdetailWindow(edetailerData);
        }
    });

    ipcMain.on('gotoSlide', async (e, args) => {
        // console.log(args)
        if(appSettings.get('settings.crm') === 'veeva'){
            await mainWindow.openPresentation(encodeURIComponent(args.presentation), { reloadEdetailWin: false });
        }
        edetailWindow.handleGotoSlide(args.slideName, e);
    })

    ipcMain.on('goNextSequence', edetailWindow.handleGoNextSequence);

    ipcMain.on('goPreviousSequence', edetailWindow.handleGoPreviousSequence);

    // going to next slide on right key perssed
    ipcMain.on('edetailWin/ArrowRight', () => { edetailWindow.handleArrowRight() });

    // going to prev slide on left key perssed
    ipcMain.on('edetailWin/ArrowLeft', () => { edetailWindow.handleArrowLeft() });
}

app.on('ready', function () {
    mainWindow.createWindow();
    mainWindow.afterFinishLoad();
    mainWindow.initEvents();
    pdfHandler.init();
    proofing.init();
    mainWindow.projectOnStart();

})

app.on('window-all-closed', () => {
    htmlDir.deleteEdetailerDataFile();
    if (process.platform != 'darwin') app.quit();

})


// for mac os
app.on('activate', () => {
    if (mainWindow.window === null) {
        mainWindow.createWindow();
        mainWindow.afterFinishLoad();
    };
})

