const { ipcMain, app, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const Store = require('../utils/store/setting');

const { pdfHandler } = require('../utils/file-io/handle-pdf');
const capturePage = require('../utils/image-utils/capturePage');
const createImg = require('../utils/image-utils/createImg');
const { createDirectory, deleteFilesFromDirectory } = require('../utils/file-io/fileSystemUtils');

const userDataPath = app.getPath('userData');

const { settings } = Store.get('user-settings');
let appSettings = settings;
Store.on('change',()=>{
    const { settings } = Store.get('user-settings');
    appSettings = settings;
    console.log(appSettings.proofingLevel);
})
const init = async function () {
    const tem_dir = await createDirectory(userDataPath, 'tem_dir');
    const pdfInfo = pdfHandler.getPdfPath()? await pdfHandler.getPdfInfo(): null;
     
    ipcMain.on('mainwindow/req/proofing', async (e, data) => {
        if(pdfInfo){
            
        if (data.pageNumber <= pdfInfo.pages) {
            await generateSlideImage({ url: data.slidePath, width: 1024, height: 768 }, tem_dir);

            await pdfHandler.getImage({
                format: 'png',
                outputPath: tem_dir,
                fileName: 'script-temp',
                page: data.pageNumber,
            })
            
            const proofing_dir = await createDirectory(path.normalize(data.slidePath + '/../../..'), 'proofing');
            const scriptImg = path.resolve(tem_dir,`script-temp-${data.pageNumber<10? '0' + data.pageNumber: data.pageNumber}.png`);

            const slideImg = path.resolve(tem_dir, 'slide-temp.png');

            const outputPath = path.resolve(proofing_dir, `${path.basename(path.dirname(data.slidePath))}.png`);
            console.log(data.pageNumber<10? '0' + data.pageNumber: data.pageNumber);
            initProofing({scriptImg, slideImg, outputPath});
            try{
               shell.openPath(outputPath);
            }catch(err){

            }
            deleteFilesFromDirectory(tem_dir);
        };
        console.log(data);
        } else{
            e.sender.send('proffing/message', 'no pdf ');
        }
    })

}

const generateSlideImage = function (options, path) {
    return new Promise((resolve) => {
        capturePage(options, ({ screenshot }) => {
            const img = createImg.toPNG(screenshot, { imgWidth: options.width, imgHeight: options.height });
            createImg.saveImg({
                data: img,
                fileName: 'slide-temp',
                ext: 'png',
                saveToPath: path,
            });
            resolve();
        })
    })
}

const initProofing = function (options) {
    const img1 = PNG.sync.read(fs.readFileSync(options.scriptImg));
    const img2 = PNG.sync.read(fs.readFileSync(options.slideImg));
    const { width, height } = img1;
    const diff = new PNG({ width, height });

    pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: appSettings.proofingLevel, diffColorAlt: [0,0,255] } );

    fs.writeFileSync(options.outputPath, PNG.sync.write(diff));
}

module.exports.proofing = {
    init,
}