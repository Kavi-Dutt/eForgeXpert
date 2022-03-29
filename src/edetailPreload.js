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
ipcRenderer.on('gotoSlideReply',(e,args)=>{
    console.error(args)
})

contextBridge.exposeInMainWorld('CLMPlayer', CLMPlayer)

