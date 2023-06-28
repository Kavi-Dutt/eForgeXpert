const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', async () => {
  // General Settings
  const saveSettingButton = document.querySelectorAll('.save-setting');

  const veevaRadio = document.querySelector('#veeva-radio');
  const oceRadio = document.querySelector('#oce-radio');
  const selectBuildWith = document.querySelector('#select_build-with');
  const crmSpecficsetting = document.querySelector('.crm-specfic-setting');

  // Thumbnail Settings
  const thumbnailFormatJpg = document.querySelector('#thumbnail-format-jpg');
  const thumbnailFormatPng = document.querySelector('#thumbnail-format-png');
  const thumbnailWidthInput = document.querySelector('#thumbnail-width');
  const thumbnailHeightInput = document.querySelector('#thumbnail-height');
  const thumbnailNameInput = document.querySelector('#thumbnail-name');

  const settingPath = await ipcRenderer.invoke('get/settingsPath');
  const { settings } = JSON.parse(fs.readFileSync(settingPath));

  // General Settings
  if (settings.crm === 'veeva') {
    veevaRadio.checked = true;
  } else {
    oceRadio.checked = true;
  }

  selectBuildWith.value = settings.buildWith ? settings.buildWith : 'beSpoke';

  if (settings.crm === 'veeva') {
    crmSpecficsetting.classList.add('d-block');
  } else {
    crmSpecficsetting.classList.remove('d-block');
  }

  // Thumbnail Settings
  if (settings.thumbnailFormat === 'jpg') {
    thumbnailFormatJpg.checked = true;
  } else {
    thumbnailFormatPng.checked = true;
  }

  thumbnailNameInput.value = settings.thumbnailName ? settings.thumbnailName : 'thumb';
  thumbnailWidthInput.value = settings.thumbnailWidth ? settings.thumbnailWidth : 1024;
  thumbnailHeightInput.value = settings.thumbnailHeight ? settings.thumbnailHeight : 768;


  saveSettingButton.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      let _settings = {};

      if (veevaRadio.checked) {
        _settings.crm = 'veeva';
      } else {
        _settings.crm = 'oce';
      }

      _settings.buildWith = selectBuildWith.value;

      if (thumbnailFormatJpg.checked) {
        _settings.thumbnailFormat = 'jpg';
      } else {
        _settings.thumbnailFormat = 'png';
      }

      _settings.thumbnailName = thumbnailNameInput.value;
      _settings.thumbnailWidth = thumbnailWidthInput.value;
      _settings.thumbnailHeight = thumbnailHeightInput.value;

      const setSettingResponse = await ipcRenderer.invoke('set/settings', _settings);
    });
  })
});

