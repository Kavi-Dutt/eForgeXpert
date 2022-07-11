const {ipcRenderer, contextBridge} = require('electron')


const CLMPlayer ={
    defineNoSwipeRegion:(regionId, x, y, width, height)=>{
        return null
    },
    destroyNoSwipeRegion:(regionId)=>{
        return null
    },
    gotoSlide: (sequanceName)=>{
        ipcRenderer.send('gotoSlide', sequanceName)
    },
    goNextSequence:()=>{
        ipcRenderer.send('goNextSequence')
    },
    goPreviousSequence:()=>{
        ipcRenderer.send('goPreviousSequence')
    },
    registerEventListener:(iOS_event, myCustomPlayerHandler)=>{
        return null
    }

}

//______tracking error in gotoslide
ipcRenderer.on('gotoSlideReply',(e,args)=>{
    console.error(args)
})


// ______going next and previous on left and right arrow key
window.addEventListener('keyup',(e)=>{
    switch(e.key){
        case "ArrowRight":
            ipcRenderer.send('edetailWin/ArrowRight');
            break;
        case "ArrowLeft":
            ipcRenderer.send('edetailWin/ArrowLeft');
            break;
    }
})

contextBridge.exposeInMainWorld('CLMPlayer', CLMPlayer)

