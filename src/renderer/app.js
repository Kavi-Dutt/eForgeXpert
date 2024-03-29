const{ipcRenderer, nativeImage,shell} = require('electron')
const path = require('path')
const fs = require('fs');
const EventEmitter = require('events');

const createImg = require('../utils/image-utils/createImg');
const { pdf } = require('./modules/view-pdf.js');
const proofing = require ('./modules/proofing/proofing')

const emitter = new EventEmitter();

const webview = document.querySelector('#seqance-view');
const sequancesDataViewer = document.querySelector('.sequances-data-viewer');
const searchSequance =document.querySelector('.search-sequance');
const totalSlidesText = document.querySelector('.slides-number');
let edetailerData = {},
    sequanceImg_table, 
    thumbImgId, 
    currentSequanceInWebview;

 // geting settings when those are updated

//  const settingPath = (async ()=> { return await ipcRenderer.invoke('get/settingsPath')})();
let appSettings;
(async () => {
    appSettings = await getAppSettings();
  })();
  
 ipcRenderer.on('settings/updated',async (e)=>{
    appSettings = await getAppSettings();
 });

 async function getAppSettings(){
    const settingPath =  await ipcRenderer.invoke('get/settingsPath');
    const {settings} = JSON.parse(fs.readFileSync(settingPath));
    return settings;
 }
 
// now below two functions are temproray to be updated when thumbnail image setting pannel is ready

 function getThumnailName(){
    // const thumbnailName = (appSettings.crm === 'oce' ? 'thumb': '01_thumbnail') + '.' +  getThumbnailFormat();
    const thumbnailName = (appSettings.thumbnailName ? appSettings.thumbnailName : 'thumb')+'.'+(appSettings.thumbnailFormat ? appSettings.thumbnailFormat : 'png');
    return thumbnailName;
 }

 function generateThumnail(args){
    const width = appSettings.thumbnailWidth ? Number(appSettings.thumbnailWidth) : 1024;
    const height = appSettings.thumbnailHeight ? Number(appSettings.thumbnailHeight) : 768;
    if(appSettings.thumbnailFormat === 'png'){
        return createImg.toPNG(args.screenshot, {imgWidth:width, imgHeight:height});
    }
    else if(appSettings.thumbnailFormat === 'jpg'){
        return createImg.toJPEG(args.screenshot, {imgWidth:width, imgHeight:height});
    }
 }


function delay(ms=0) {
    return new Promise((resolve)=>{
        setTimeout(resolve, ms);
    })
}


function edetailURLPath(currentSequanceName) {
    return path.join(edetailerData.htmlPath, currentSequanceName, getHtmlFile(currentSequanceName));
}

function sequanceURL(sequanceName){
    return path.join(edetailerData.htmlPath, sequanceName);
}

function removeClass(element,className){
    element.classList.remove(className)
    }
    
getHtmlFile = (sequanceName) => {
    return edetailerData.filesInSequence[sequanceName].filter((html) => html.match(/.*\.(html?)/ig))[0]
}

function changeWebviewSrc(sequanceName) {
    currentSequanceInWebview = sequanceName;
    const sequancePath = edetailURLPath(sequanceName);
    webview.dataset.sequancePath= sequancePath;
    webview.src = `file:///${sequancePath}`;
}

function createElement(el, elClass){
    let element = document.createElement(el)
     element.classList.add(elClass)
     return element
 }
function pendingStageBtn(element){
element.classList.add('pending');
element.style.cursor= 'wait';
}
function successBtn(element){
    element.classList.remove('pending');
    element.classList.add('done');
    element.style.cursor= 'pointer';
}
function createDataTable(edetailerData) {
    if (sequancesDataViewer) sequancesDataViewer.innerHTML = ''
    edetailerData.sequences.forEach(slideName => {
        if (slideName) {
            let itemContainer1 = createElement('div','item-container-1')
            let sequancesDataHolder = createElement('div', 'sequances-data_holder')
            sequancesDataHolder.dataset.sequanceId=slideName;

            // thumb image
            let thumbImgContainer = createElement('div','thumb-img-container')
            let thumbImg = createElement('img','thumb-img')
            thumbImg.src =`${sequanceURL(slideName)}\\${getThumnailName()}`

            // thumbImg.src= imgSrc


            let sequanceNameContainer = createElement('div','sequance-name_container')
            let sequanceNamePara = createElement('p', 'sequance-name_text')
            sequanceNamePara.innerText =slideName;
            sequanceNamePara.setAttribute('contenteditable', '');
            sequanceNamePara.id= slideName;

            let btnContainer =createElement('div','btn-container')

            // zip btn
            let zipBtn = createElement('button','btn-type-3')
            zipBtn.dataset.sequanceId = slideName;
            zipBtn.innerText="ZIP";
            zipBtn.dataset.tooltip="create zip file";
            zipBtn.classList.add('zip-btn')
            zipBtn.addEventListener('click', function (e) {
                e.stopPropagation()
                let sequanceId = this.dataset.sequanceId;
                console.log(sequanceId)
                this.innerText='Zipping...';
                pendingStageBtn(this)
                ipcRenderer.invoke('request-for-compress', sequanceId).then((result) => {
                    this.innerHTML = result;
                    successBtn(this)
                })
            })

            // update thumb image btn
            let thumbImgBtn = createElement('button','btn-type-3');
            thumbImgBtn.dataset.sequanceId= slideName;
            thumbImgBtn.innerText="Update Thumb Image";
            thumbImgBtn.dataset.tooltip="Update or create Thumb Image";
            thumbImgBtn.classList.add('thumbimg-btn');
            thumbImgBtn.addEventListener('click',function(e){
                e.stopPropagation();
                this.innerText ="Updating..."
                pendingStageBtn(this);
                // document.querySelector("").style.cursor="progress";
                let all_thumbImgBtns =document.querySelectorAll(".thumbimg-btn");
                all_thumbImgBtns.forEach(function(btn){
                    btn.style.pointerEvents ="none";
                })
                document.querySelector(".all-sequances").style.cursor="progress"
                thumbImgId = this.dataset.sequanceId;
                console.log(thumbImgId);
                changeWebviewSrc(thumbImgId);
                ipcRenderer.send('request-for-screenshot', {url:edetailURLPath(thumbImgId), width:1024, height:768});
                // reciveing response of request-for-screenshot
                ipcRenderer.on('response-for-screenshot',(e,args)=>{

                    // createing thumb image
                let thumbnailImg = generateThumnail(args);

                //    saveing jpeg thumbimage
                    createImg.saveImg({
                        data: thumbnailImg,
                        fileName: appSettings.thumbnailName ? appSettings.thumbnailName : 'thumb',
                        ext: appSettings.thumbnailFormat ? appSettings.thumbnailFormat : 'png',
                        saveToPath: sequanceURL(thumbImgId)
                    })
                    this.innerText ="Done"
                    successBtn(this);
                    all_thumbImgBtns.forEach(function(btn){
                        btn.style.pointerEvents ="auto";
                    })
                    document.querySelector(".all-sequances").style.cursor="auto";
                    // console.log(thumbnailImg)
                })

                
            })


            // sequance-img_container <div>
            let sequanceImgContainer = createElement('div','sequance-img_container')

            // sequance-images <div>
            let sequanceImages = createElement('div','sequances-images')
            sequanceImages.innerText=''
            // see images btn
            let  seeImgBtn = createElement('button','btn-type-1')
            seeImgBtn.dataset.sequanceId= slideName;
            seeImgBtn.classList.add('see-images-btn','accordian');
            seeImgBtn.innerText='Images';
            seeImgBtn.addEventListener('click',function(){
                this.classList.toggle('active')
                
                if(sequanceImages.style.maxHeight){
                    sequanceImages.style.maxHeight=null
                }
                else{
                    sequanceImages.style.maxHeight= 300+"px"
                }
                console.log('accordion')
            })



            sequancesDataHolder.append(...[thumbImgContainer,sequanceNameContainer])
            thumbImgContainer.appendChild(thumbImg)

            sequanceNameContainer.append(...[sequanceNamePara,btnContainer])

            btnContainer.append(...[zipBtn,thumbImgBtn,seeImgBtn])

            sequanceImgContainer.append(...[sequanceImages])

            itemContainer1.append(...[sequancesDataHolder,sequanceImgContainer])

            sequancesDataViewer.appendChild(itemContainer1)

            sequancesDataHolder.addEventListener('click', function () {
                var sequanceName = this.dataset.sequanceId;
                
                
                if(!this.classList.contains('active')){
                    changeWebviewSrc(sequanceName);

                    // console.log(pdf.src);

                     // sending message to main of a click on sequance( here for images)
                    ipcRenderer.send('request-for-sequenceData', sequanceName)

                    document.querySelectorAll('.sequances-data_holder').forEach(el=>el.classList.remove('active'))
                }else{

                }
               

                // reciveing data after request-for-sequence Data event
                ipcRenderer.on('images-from-main',(e,args)=>{
                    let imgsOfSequance = createImgsTable(args,slideName)
                    sequanceImages.appendChild(imgsOfSequance)
                    })

                    this.classList.add('active')
            });

            sequancesDataHolder.addEventListener('dblclick', function () {
                shell.showItemInFolder(sequanceURL(slideName))
                console.log('double click jon seequance holder')
            })

            

            
            
        }
    })

    ipcRenderer.on('script-pdf-selected',(e, path)=>{
        pdf.src= path;
        pdf.createPDFViewer(1);
     })

// creating event on creation of table
const sequanceTableCreatedEvent = new Event('sequanceTableCreated');
    document.dispatchEvent(sequanceTableCreatedEvent)
}


function createImgsTable(args,sequanceName){
    if(sequanceImg_table) sequanceImg_table.innerHTML=null
     sequanceImg_table = document.createElement('table');

    for( let key in args){
        let imgPath = path.join(sequanceURL(sequanceName),'images',key)
        const row = sequanceImg_table.insertRow()
        let imageNameTd =row.insertCell(0)
        imageNameTd.innerText = key; 
        row.addEventListener('click',()=>shell.openPath(imgPath))
        row.insertCell(1).innerText = args[key];
        // row.insertCell(2).innerHTML =  `<button data-img-id = "${key}" class ="compress-img-btn btn-type-3"> compress </button>`
        // console.log(key)
    }

    // sends compress image request to main
   /*  let allCompressImgBtns = document.querySelectorAll('.compress-img-btn')
    for(i=0; i < allCompressImgBtns.length; i++){
        let compressImgBtn = allCompressImgBtns[i]
        compressImgBtn.addEventListener('click',function(){
        let btnImgId = this.dataset.imgId
        ipcRenderer.invoke('compress-img-request',btnImgId).then((result)=>console.log(result))
        console.log(btnImgId)
        })
    } */
    
    return sequanceImg_table
}
// btn which will focus on edetailWindow
let fullscreenBtn=document.querySelector('.fullscreen-btn')
fullscreenBtn.addEventListener('click',function(){
    ipcRenderer.send('focus-on-edetailWindow',currentSequanceInWebview)
})



ipcRenderer.on('data-from-main', (e, args) => {
    edetailerData = args
    createDataTable(edetailerData);
    changeWebviewSrc(edetailerData.sequences[0]);
    totalSlidesText.innerText= edetailerData.sequences.length;
    handleRemoveSahredButton();
    console.log('data from main event trigired');
})

document.addEventListener('sequanceTableCreated',function(){
    let sequancesDataHolder =document.querySelectorAll('.sequances-data_holder'),
        zipBtns =document.querySelectorAll('.zip-btn');

    sequancesDataHolder.forEach(el=>{
        let sequanceId = el.dataset.sequanceId;
        let sequancePath = sequanceURL(sequanceId)
        el.addEventListener('contextmenu',function(e){
            ipcRenderer.send('sequancesDataHolder/contextmenu',sequancePath)
            console.log(sequancePath)
        })
    })

    // searching sequance
    searchSequance.addEventListener('keyup',function(e){
        sequancesDataHolder.forEach(el=>{
            searchValue = searchSequance.value.toLowerCase()
            let sequanceId = el.dataset.sequanceId;
           let hasMatch = sequanceId.toLowerCase().includes(searchValue);
           el.parentElement.style.display = hasMatch? "block": "none";
        })
    })

    // compressing all
    // sending request for ziping all files
    document.querySelector('.compress-all-btn').addEventListener('click', function () {
        console.log('compress all')
        this.innerText="Zipping.."
        pendingStageBtn(this)
        this.disabled = true;

        // changeing stage of all zip btns to pending stage
        zipBtns.forEach(el=>{
            pendingStageBtn(el)
            el.innerText='Zipping...'
        })

        
        ipcRenderer.invoke('request-for-compressAll').then((result)=>{
            this.innerText='Done'
            successBtn(this)
            this.disabled = false;
            zipBtns.forEach(el=>{
                el.innerText= "Done";
                successBtn(el)
            })
        })
    })

    // dupplicate arry for zipBtns
    let duplicateZipBtns = [...zipBtns]

    ipcRenderer.on('on-compressing-all',(e,args)=>{

        // for(let el of duplicateZipBtns){
        //     if (el.dataset.sequanceId == args){
        //         el.innerText= "Done";
        //         successBtn(el)
        //         duplicateZipBtns.shift()
        //         // console.log(...duplicateZipBtns)
        //         break
                
        //     }
        // }


    })

})




// const oceConverterPopup = document.querySelector('#oce-converter-popup');
// const conversionLogs = document.querySelector('#conversion-logs');

// function addConversionLogs(content,msg){
//     let para = createElement('p','conversion-log-txt');
//     para.innerText= content;
//     if(msg.messageType=='info'){
//         para.classList.add('info');
//     }
//     else if(msg.messageType=='success'){
//         para.classList.add('success');
//     }
//     else if(msg.messageType=='addedShared'){
//         para.classList.add('added-shared');
//     }
//     else if(msg.messageType=='error'){
//         para.classList.add('error');
//     }
//     else if(msg.messageType=='conversion-succed'){
//         para.classList.add('conversion-succed');
//     }
//     else if(msg.messageType=='conversion-failed'){
//         para.classList.add('conversion-failed');
//     }

//     conversionLogs.appendChild(para);
// }

// adding action on Oce converter btn
// document.querySelector('#OCE-converter_btn').addEventListener('click',function(){
//     console.log('clicked oce converter')
//     ipcRenderer.invoke('oce-conversion/request').then(result=>{
//         console.log(result)
//     }).catch(err=>{
//         console.error(err)
//     })
// })

// ipcRenderer.on('oce-converter/files-slected', function(){
//     oceConverterPopup.style.display='block';
// })

// ipcRenderer.on('oce-converter/current-folder',function(e,msg){
//     let content = msg.folderName;
//     addConversionLogs(content,msg)
// })


// ipcRenderer.on('oce-converter/replaced-content-file',function(e,msg){
//     let content = 'successfully replaced content for file ' + msg.fileName;
//     addConversionLogs(content,msg)
// })


// ipcRenderer.on('oce-converter/added-oce-script',function(e,msg){
//     let content = 'successfully added oce script in ' + msg.folderName;
//     addConversionLogs(content,msg)
// })

// ipcRenderer.on('oce-converter/renamed-html-file',function(e,msg){
//     let content = 'successfully renamed html file in ' + msg.folderName;
//     addConversionLogs(content,msg)
// })

// ipcRenderer.on('oce-conversion/replaced-thumbnail',function(e,msg){
//     let content = 'successfully replaced thumb image in ' + msg.folderName;
//     addConversionLogs(content,msg)
// })

// ipcRenderer.on('oce-conversion/added-shared',function(e,msg){
//     let content = 'successfully added shared in ' + msg.folderName;
//     addConversionLogs(content,msg)
// })

// ipcRenderer.on('oce-converter/conversion-succed',function(e,msg){
//     let content = 'successfully converted all files ';
//     addConversionLogs(content,msg);
//         oceConverterPopup.addEventListener('click',function(e){
//             if(e.target === e.currentTarget){
//                 this.style.display= 'none';
//                 conversionLogs.innerHTML= '';
//             }
//         })
// })
// ipcRenderer.on('oce-converter/conversion-failed',function(e,msg){
//     let content = 'failed to convert files';
//     addConversionLogs(content,msg)
// })

// ipcRenderer.on('oce-converter/error',function(e,msg){
//     let content = 'Error ---->' + msg.fileName +'\n' + msg.error ;
//     addConversionLogs(content,msg)
// })




// left side pannel script
const sideButtons = document.querySelectorAll('.left-side_interactions ul li');
const asideSettingsPannel = document.querySelector('aside .settings-pannel');
const settingsBlocks = document.querySelectorAll('.settings-pannel>div');

sideButtons.forEach((li, index) => {
    li.addEventListener('click', () => {
        settingsBlocks.forEach(block=> block.classList.remove('d-block'));
        asideSettingsPannel.classList.toggle('d-block');
        settingsBlocks[index].classList.toggle('d-block');
    })
})

// rmoving shared from all slides on click of remove shared button
// for now it's placed here temporary should be place in a proper module in future

const removeSharedButton = document.querySelector('#remove-shared-btn');

function handleRemoveSahredButton(){
    appSettings.crm ==="veeva"? removeSharedButton.classList.remove('d-none'):removeSharedButton.classList.add('d-none');
}
removeSharedButton.addEventListener('click', function(){
    ipcRenderer.send('req/remove-shared');
})