const { app, ipcRenderer, contextBridge } = require('electron')
let edetailerData = {};
let appSettings;

// getting sequance data
(async function () {
    appSettings = await ipcRenderer.invoke('get/settings');
    virtulaizeAPI();
    let data = await ipcRenderer.invoke("preload/request/sequanceData");
    edetailerData = data;
    let seqArray = [null, ...edetailerData.sequences];
    contextBridge.exposeInMainWorld('seqArray', seqArray);
})()


function virtulaizeAPI() {
    if (appSettings.crm === 'veeva') {
        const com = { veeva: { clm: {} } };
        com.veeva.clm.gotoSlide = function (slideName, presentation) {
            ipcRenderer.send('gotoSlide', {slideName, presentation});
        }
        
        com.veeva.clm.runAPIRequest = function (request) {
            const matches = request.match(/veeva:gotoSlide\(([^,]+)(?:,\s*([^)]+))?\)/);
            if (matches && matches.length >= 2) {
              const slideName = matches[1].trim().replace('.zip', '');
              const presentation = matches[2] ? matches[2].trim() : '';
              com.veeva.clm.gotoSlide(slideName, presentation);
            } else {
              console.log(`Invalid API request: ${request}`);
            }
          }
        contextBridge.exposeInMainWorld('com', com);
        
    } 
    else if (appSettings.crm == 'oce') {
        const CLMPlayer = {
            defineNoSwipeRegion: (regionId, x, y, width, height) => {
                return null
            },
            destroyNoSwipeRegion: (regionId) => {
                return null
            },
            gotoSlide: (slideName) => {
                ipcRenderer.send('gotoSlide', {slideName});
            },
            goNextSequence: () => {
                ipcRenderer.send('goNextSequence')
            },
            goPreviousSequence: () => {
                ipcRenderer.send('goPreviousSequence')
            },
            registerEventListener: (iOS_event, myCustomPlayerHandler) => {
                return null
            }

        }
        contextBridge.exposeInMainWorld('CLMPlayer', CLMPlayer)
    }
}


//______tracking error in gotoslide
ipcRenderer.on('gotoSlideReply', (e, args) => {
    console.error(args)
})


// ______going next and previous on left and right arrow key
window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case "ArrowRight":
            ipcRenderer.send('edetailWin/ArrowRight');
            break;
        case "ArrowLeft":
            ipcRenderer.send('edetailWin/ArrowLeft');
            break;
    }
})



