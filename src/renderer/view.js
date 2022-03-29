// document.addEventListener('sequanceTableCreated',function(){
//     const sequanceHolderContextmenu= document.querySelector('.sequance-holder_contextmenu')
//     let sequancesDataHolder =document.querySelectorAll('.sequances-data_holder')
//     let sequanceId = sequancesDataHolder.dataset.sequanceId;
//     let sequancePath = sequanceURL(sequanceId)
//     sequancesDataHolder.forEach(el=>{
//         el.addEventListener('contextmenu',function(e){
//             const{clientX:mouseX, clientY:mouseY} =e;
//             sequanceHolderContextmenu.style.top= `${mouseY}px`;
//             sequanceHolderContextmenu.style.left = `${mouseX}px`;
//             sequanceHolderContextmenu.classList.add('d-block')
//             console.log('context menu')
//         })
//     })
//     sequanceHolderContextmenu.querySelector('ul li#vs-code').addEventListener('click',function(){
//         ipcRenderer.invoke('sequanceHolderContextmenu/vsCode',).then()
//     })
//     console.log('custom event trigered')
// })