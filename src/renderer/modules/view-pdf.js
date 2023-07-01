const { ipcRenderer} = require('electron')

const pdfContainer = document.querySelector('.pdf-display');

const pdf = {
    src: '',
    pageNumber: 9,
    zoomValue: 25,
    toolbar: 1,
    navpanes: 0,
    scrollbar: 0,
    _container:null,

    set parentElement(container){
        this._container= container;
    },

    get url() {
        return `file://${this.src}#page=${this.pageNumber}&zoom=${this.zoomValue}&toolbar=${this.toolbar}&navpanes=${this.navpanes}&scrollbar=${this.scrollbar}`;
    },

    createPDFViewer(pageNumber) {
        pageNumber? this.pageNumber= pageNumber : '';
        const embed = document.createElement('embed');
        embed.src = this.url;
        embed.type = 'application/pdf';
        this._container.innerHTML = '';
        pdfContainer.appendChild(embed);
    }
};

pdf.parentElement = pdfContainer;

module.exports = {
    pdf,
}
// pdf.createPDFViewer();

// Delayed update
// let x=1;
// setInterval(() => {

//     pdf.pageNumber = x++;
//     pdf.createPDFViewer();
// }, 5000);
