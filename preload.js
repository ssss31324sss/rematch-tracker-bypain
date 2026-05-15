// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url)
});

window.addEventListener('DOMContentLoaded', () => {
  // ================================
  // BACKGROUND: background.jpg / background.mp4
  // ================================

  let bgImgElem = document.getElementById('bgImage');
  if (!bgImgElem) {
    bgImgElem = document.createElement('img');
    bgImgElem.id = 'bgImage';
    bgImgElem.src = 'background.jpg';
    bgImgElem.alt = '';
    bgImgElem.style.cssText = [
      'position:fixed',
      'inset:0',
      'width:100%',
      'height:100%',
      'object-fit:cover',
      'z-index:0',
      'filter:brightness(0.65) saturate(1.15) contrast(1.05)',
      'opacity:1',
      'transition:opacity 0.4s ease',
      'pointer-events:none',
      'user-select:none'
    ].join(';') + ';';

    document.body.prepend(bgImgElem);
  }

  let bgVidElem = document.getElementById('bgVideo');
  if (!bgVidElem) {
    bgVidElem = document.createElement('video');
    bgVidElem.id = 'bgVideo';
    bgVidElem.src = 'background.mp4';
    bgVidElem.loop = true;
    bgVidElem.muted = true;
    bgVidElem.autoplay = false;
    bgVidElem.playsInline = true;
    bgVidElem.setAttribute('playsinline', '');
    bgVidElem.setAttribute('muted', '');

    bgVidElem.style.cssText = [
      'position:fixed',
      'inset:0',
      'width:100%',
      'height:100%',
      'object-fit:cover',
      'z-index:0',
      'filter:brightness(0.65) saturate(1.15) contrast(1.05)',
      'opacity:0',
      'transition:opacity 0.4s ease',
      'display:none',
      'pointer-events:none',
      'user-select:none'
    ].join(';') + ';';

    document.body.prepend(bgVidElem);
  }

  const toggle = document.getElementById('backgroundToggle');

  function showImage() {
    bgVidElem.style.opacity = '0';
    bgVidElem.pause();

    setTimeout(() => {
      bgVidElem.style.display = 'none';
    }, 250);

    bgImgElem.style.display = 'block';
    bgImgElem.style.opacity = '1';
  }

  function showVideo() {
    bgImgElem.style.opacity = '0';

    bgVidElem.style.display = 'block';
    bgVidElem.style.opacity = '1';

    bgVidElem.play().catch(() => {
      showImage();

      if (toggle) {
        toggle.checked = false;
      }

      localStorage.setItem('animatedBackground', 'false');
    });
  }

  const saved = localStorage.getItem('animatedBackground');
  const isAnimated = saved === 'true';

  if (toggle) {
    toggle.checked = isAnimated;

    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        localStorage.setItem('animatedBackground', 'true');
        showVideo();
      } else {
        localStorage.setItem('animatedBackground', 'false');
        showImage();
      }
    });
  }

  if (isAnimated) {
    showVideo();
  } else {
    showImage();
  }
});