const {ipcRenderer}  = require('electron');

const proofingInput = document.querySelector('#proofing-input');
const proffingButton = document.querySelector('#proffing-btn');
const webview = document.querySelector('#seqance-view');

proffingButton.addEventListener('click', initiateProofing)

function initiateProofing(){
    const pageNumber = parseInt(proofingInput.value);
    if(pageNumber>0){
        const slidePath = webview.dataset.sequancePath
        ipcRenderer.send('mainwindow/req/proofing', { pageNumber, slidePath } );
    }
}

