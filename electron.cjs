const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // 开发模式下打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理文件选择对话框
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// 处理保存文件对话框
ipcMain.handle('save-file', async (event, { defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePath;
});

// 读取文件内容
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 写入文件内容
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 导出 Word 文档
ipcMain.handle('export-docx', async (event, { book, filePath }) => {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

    const children = [
      new Paragraph({
        text: book.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: `作者: ${book.author}`,
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: `导出时间: ${new Date().toLocaleString('zh-CN')}`,
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({ text: '' })
    ];

    book.clippings.forEach((clipping, index) => {
      const typeLabels = {
        highlight: '标注',
        bookmark: '书签',
        note: '笔记',
        unknown: '未知'
      };
      const typeLabel = typeLabels[clipping.type] || clipping.type;

      children.push(
        new Paragraph({
          text: `${index + 1}. ${typeLabel}`,
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '位置: ', bold: true }),
            new TextRun(clipping.location || '未知'),
            new TextRun({ text: '  时间: ', bold: true }),
            new TextRun(clipping.datetime || '未知')
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: clipping.content,
          indent: { left: 720 }
        }),
        new Paragraph({ text: '' })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 导出 PDF 文档
ipcMain.handle('export-pdf', async (event, { htmlContent, filePath }) => {
  try {
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 1000,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    pdfWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    await new Promise(resolve => {
      pdfWindow.webContents.on('did-finish-load', resolve);
    });

    const pdfData = await pdfWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true
    });

    fs.writeFileSync(filePath, pdfData);
    pdfWindow.close();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});