const path = require('path');
const fs =require('fs')
// const {creatEdetailWindow} = require('./edetailWin')




module.exports = [{
        id:'prevSlideBtn',
        label: '<',
    },
    {
        id:'nextSlideBtn',
        label: '>',
    },
    {
        label: 'Sequence',
        submenu: [{
                label: 'file-1',
                role: 'toggleDevTools'
            },
            {
                label: 'file-2',
                role: 'toggleDevTools'
            }
        ]
    },
    {
        label: 'vs code',
        submenu: [{
                label: 'one',
                submenu: [{
                        label: 'one-a',
                        click:()=>{
                            // console.log.log('hello')
                        }
                    },
                    {
                        label: 'one-b'
                    },
                    {
                        label: 'one-c'
                    },
                    {
                        label: 'one-d'
                    },
                ]
            },
            {
                label: 'two'
            },
            {
                label: 'three'
            },
            {
                label: 'four'
            },
        ],
    }

]