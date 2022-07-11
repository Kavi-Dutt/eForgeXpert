const path = require('path');
const fs = require('fs');
const { doesNotMatch } = require('assert');
// const {creatEdetailWindow} = require('./edetailWin')




module.exports = [
    {
        id: 'for-spave_1',
        label: '',

    },
    {
        id: 'prevSlideBtn',
        label: '<< Prev',
    },
    {
        id: '',
        label: '',

    },
    {
        id: 'nextSlideBtn',
        label: 'Next >>',
    },
    {
        id: '',
        label: '',

    },
    {
        id: '',
        label: '',

    },
    {
        id:'toggleDevTool',
        role:'toggleDevTools',
    },
    {
        id: '',
        label: '',

    },
    {
        id: '',
        label: '',

    },
    {
        id: 'edetailWin-setting',
        label: 'setting',
        submenu: [
            {
                label: "Enable DevTool Editing",
                id: 'enableDevToolEdit',
            },
            {
                label: "Disable DevTool Editing",
                id: 'disableDevToolEdit',
                visible:false,
            }
        ]

    },


]