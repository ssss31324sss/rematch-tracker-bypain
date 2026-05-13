// preload.js (исправленная версия)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  getAppConfig: () => ipcRenderer.invoke('get-app-config')
});

window.addEventListener('DOMContentLoaded', () => {
  // Создаём фоновые элементы с низким z-index
  let bgImgElem = document.getElementById('bgImage');
  if (!bgImgElem) {
    bgImgElem = document.createElement('img');
    bgImgElem.id = 'bgImage';
    bgImgElem.src = 'background.jpg';
    bgImgElem.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;filter:brightness(0.65)saturate(1.15)contrast(1.05);opacity:1;transition:opacity 0.4s ease;pointer-events:none;';
    document.body.appendChild(bgImgElem);
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
    bgVidElem.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;filter:brightness(0.65)saturate(1.15)contrast(1.05);opacity:0;transition:opacity 0.4s ease;display:none;pointer-events:none;';
    document.body.appendChild(bgVidElem);
  }

  const toggle = document.getElementById('backgroundToggle');
  if (!toggle) return;

  const saved = localStorage.getItem('animatedBackground');
  const isAnimated = saved === 'true';
  toggle.checked = isAnimated;

  function showImage() {
    bgVidElem.style.opacity = '0';
    bgVidElem.style.display = 'none';
    bgVidElem.pause();
    bgImgElem.style.opacity = '1';
  }

  function showVideo() {
    bgImgElem.style.opacity = '0';
    bgVidElem.style.display = 'block';
    bgVidElem.style.opacity = '1';
    bgVidElem.play().catch(() => {
      showImage();
      toggle.checked = false;
      localStorage.setItem('animatedBackground', 'false');
    });
  }

  if (isAnimated) {
    showVideo();
  } else {
    showImage();
  }

  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      showVideo();
      localStorage.setItem('animatedBackground', 'true');
    } else {
      showImage();
      localStorage.setItem('animatedBackground', 'false');
    }
  });
});