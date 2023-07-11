const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', async () => {
  // General Settings
  const saveSettingButton = document.querySelectorAll('.save-setting');

  const veevaRadio = document.querySelector('#veeva-radio');
  const oceRadio = document.querySelector('#oce-radio');
  const selectBuildWith = document.querySelector('#select_build-with');
  const crmSpecficsetting = document.querySelector('.crm-specfic-setting');

  const allRanges = document.querySelectorAll(".range-wrap");
  const proofingLevelInput = document.querySelector('#proffing-level-input')

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

  // range slider for proffing level
  proofingLevelInput.value = settings.proofingLevel || settings.proofingLevel === 0  ? (10 - (settings.proofingLevel * 10)) : 8;
  allRanges.forEach(wrap => {
  const range = wrap.querySelector(".range");
  const bubble = wrap.querySelector(".bubble");

  range.addEventListener("input", () => {
    
    console.log((10-range.value)/10)
    setBubble(range, bubble);
  });
  setBubble(range, bubble);
});

function setBubble(range, bubble) {
  const val = range.value;
  const min = range.min ? range.min : 0;
  const max = range.max ? range.max : 9;
  const newVal = Number(((val - min) * 100) / (max - min));
  bubble.innerHTML = val;
  bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
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

      _settings.proofingLevel = (10 - proofingLevelInput.value)/10;

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

