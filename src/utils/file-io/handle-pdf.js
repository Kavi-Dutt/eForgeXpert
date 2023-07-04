const { dialog, app, ipcRenderer } = require('electron');
const pdfPoopler = require('pdf-poppler');
const path = require('path');
const Store = require('../store/setting');
const { Recent } = require('../store/recent-projects');
const userDataPath = app.getPath('userData');

let appSettings;

const init = function (window) {
    const { settings } = Store.get('user-settings');
    appSettings = settings;
    Store.on('change', function (key, val, old) {
        const { settings } = Store.get('user-settings')
        appSettings = settings;

    })

}

const openDialog = function (browserWindow) {
    return new Promise(async (resolve, reject) => {
        let selectionReturn = await dialog.showOpenDialog(browserWindow, {
            title: 'Select Script PDF',
            buttonLabel: 'select pdf',
            message: ' select script pdf for project',
            filters: [
                { name: 'pdf', extensions: ['pdf'] }
            ],
            properties: ['openFile'],
        });

        if (!selectionReturn.canceled) {
            resolve(selectionReturn.filePaths[0]);
        }
        else {
            reject('script not selected');
        }
    })
}

const getPdfInfo = function (pdfPath) {
    if (!pdfPath) {
        pdfPath = getPdfPath();
    }
    if (pdfPath) {
        return pdfPoopler.info(pdfPath)
            .then(pdfinfo => {
                return pdfinfo;
            });
    } else {
        return null;
    }

}

const getPdfPath = function () {
    if (appSettings.crm === 'veeva') {
        const veevaRecents = Recent.get('veevaRecent');
        const scriptPdfPath = veevaRecents[0].scriptPdfPath;
        return scriptPdfPath;
    } else if (appSettings.crm === 'oce') {
        const oceRecents = Recent.get('oceRecent');
        const scriptPdfPath = oceRecents[0].scriptPdfPath;
        return scriptPdfPath;
    }
}

const getImage = function (options, pdfPath) {
    if (!pdfPath) {
        pdfPath = getPdfPath();
    }
    const opts = {
        format: options.format ? options.format : 'png',
        out_dir: options.outputPath ? options.outputPath : path.dirname(file),
        out_prefix: options.fileName ? options.fileName : path.baseName(file, path.extname(file)),
        page: options.page ? options.page : null,
    }
    if (pdfPath) {
        return pdfPoopler.convert(pdfPath, opts)
            .then(res => {
                return res;
            })
            .catch(error => {
                console.error(error);
            })
    } else {
        return null
    }
};

const sendPdfPath = function (window, pdfPath) {
    if (pdfPath) {
        window.webContents.send('script-pdf-selected', pdfPath);
    }
    else {
        window.webContents.send('script-pdf-selected', getPdfPath());
    }
}

module.exports.pdfHandler = {
    init,
    openDialog,
    getPdfPath,
    getPdfInfo,
    getImage,
    sendPdfPath,
}