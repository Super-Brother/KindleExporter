// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  exportDocx: (data) => ipcRenderer.invoke('export-docx', data),
  exportPdf: (data) => ipcRenderer.invoke('export-pdf', data)
});