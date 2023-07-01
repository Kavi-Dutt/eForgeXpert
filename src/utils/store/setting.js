const {app, ipcMain, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');
const { settings } = require('cluster');
const { EventEmitter } = require('events');

class Store {
    constructor(options){
        const userDataPath = app.getPath('userData');
        this.path  = path.join(userDataPath, options.confingName + '.json');
        this.data = parseDataFile(this.path, options.defaults);
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
    
    static get(configName){
        const userDataPath = app.getPath('userData');
        const configPath  = path.join(userDataPath, configName + '.json');
        return parseDataFile(configPath);
    }
    
    get(key) {
        const keys = key.split('.');
        let value = this.data;
      
        for (const k of keys) {
          value = value[k];
          if (value === undefined) {
            break;
          }
        }
      
        return value;
      }
    
    set(key, val){
        const oldValue = this.get(key);
        this.data[key]= val;
        fs.writeFileSync(this.path, JSON.stringify(this.data));
        this.constructor.eventEmitter.emit('change', key, val, oldValue);
    }
}
Store.eventEmitter = new EventEmitter();
Store.on = function (event, listener) {
    Store.eventEmitter.on(event, listener);
  };
function parseDataFile(filePath, defaults){
    try{
        return JSON.parse(fs.readFileSync(filePath));
    }
    catch(err){
        return defaults;
    }
}

module.exports = Store;