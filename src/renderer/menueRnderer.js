const { ipcRenderer } = require("electron")

const minimizeBtn = document.querySelector('#minimize')
const closeBtn = document.querySelector('#close')
const toggleFullScreenBtn = document.querySelector('#toggle-fullscreen')
const toggleFullScreenBtn_backRect =document.querySelector('#toggle-fullscreen #back-rect')

minimizeBtn.addEventListener('click',minimizeApp)
closeBtn.addEventListener('click',closeApp)
toggleFullScreenBtn.addEventListener('click',toggleFullscreen)

function minimizeApp(){
    ipcRenderer.send('app/minimize')
}
function closeApp(){
    ipcRenderer.send('app/close')
}

function toggleFullscreen(){
    ipcRenderer.send('app/toggleFullscreen')
}


function changeToggleFullScreenBtn (isAppMaximized){
    if(isAppMaximized){
        toggleFullScreenBtn.title = 'Restore';
        toggleFullScreenBtn_backRect.classList.remove('d-none')
    }
    else{
        toggleFullScreenBtn.title = 'Maximize';
        toggleFullScreenBtn_backRect.classList.add('d-none')
    }
}


ipcRenderer.on('isMaximized',e=> changeToggleFullScreenBtn(true))
ipcRenderer.on('isRestored',e=> changeToggleFullScreenBtn(false))