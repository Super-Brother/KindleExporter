// renderer.js - 渲染进程主逻辑

// 全局状态
let allBooks = {};
let currentBookKey = null;

// DOM 元素
const emptyState = document.getElementById('emptyState');
const contentArea = document.getElementById('contentArea');
const bookList = document.getElementById('bookList');
const bookCount = document.getElementById('bookCount');
const noteHeader = document.getElementById('noteHeader');
const noteContent = document.getElementById('noteContent');
const currentBookTitle = document.getElementById('currentBookTitle');
const currentBookAuthor = document.getElementById('currentBookAuthor');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
});

// 初始化事件监听
function initEventListeners() {
  // 导入按钮
  document.getElementById('importBtn').addEventListener('click', importFile);

  // 拖拽上传
  document.body.addEventListener('dragover', handleDragOver);
  document.body.addEventListener('dragleave', handleDragLeave);
  document.body.addEventListener('drop', handleDrop);
}

// 导入文件
async function importFile() {
  try {
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      loadFile(filePath);
    }
  } catch (error) {
    console.error('导入文件失败:', error);
    alert('导入文件失败: ' + error.message);
  }
}

// 加载文件
async function loadFile(filePath) {
  try {
    const result = await window.electronAPI.readFile(filePath);
    if (result.success) {
      allBooks = parseClippings(result.content);
      renderBookList();
      showContentArea();
    } else {
      alert('读取文件失败: ' + result.error);
    }
  } catch (error) {
    console.error('读取文件失败:', error);
    alert('读取文件失败: ' + error.message);
  }
}

// 渲染书籍列表
function renderBookList() {
  const books = getBookList(allBooks);
  bookCount.textContent = books.length;

  bookList.innerHTML = books.map(book => `
    <li class="book-item" data-key="${escapeHtml(book.key)}">
      <div class="book-item-title">${escapeHtml(book.title)}</div>
      <div class="book-item-author">
        <span>${escapeHtml(book.author)}</span>
        <span>${book.count} 条笔记</span>
      </div>
    </li>
  `).join('');

  // 绑定点击事件
  bookList.querySelectorAll('.book-item').forEach(item => {
    item.addEventListener('click', () => {
      selectBook(item.dataset.key);
    });
  });

  // 默认选中第一本书
  if (books.length > 0) {
    selectBook(books[0].key);
  }
}

// 选择书籍
function selectBook(bookKey) {
  currentBookKey = bookKey;
  const book = allBooks[bookKey];

  if (!book) return;

  // 更新选中状态
  bookList.querySelectorAll('.book-item').forEach(item => {
    item.classList.toggle('active', item.dataset.key === bookKey);
  });

  // 更新标题
  currentBookTitle.textContent = book.title;
  currentBookAuthor.textContent = `作者: ${book.author} · ${book.clippings.length} 条笔记`;

  // 渲染笔记
  renderNotes(book.clippings);

  // 显示笔记头部
  noteHeader.classList.remove('hidden');
}

// 渲染笔记列表
function renderNotes(clippings) {
  noteContent.innerHTML = clippings.map((clipping, index) => `
    <div class="clipping-item">
      <div class="clipping-meta">
        <span class="clipping-type ${clipping.type}">${getTypeLabel(clipping.type)}</span>
        <span class="clipping-location">位置: ${escapeHtml(clipping.location || '未知')}</span>
        <span class="clipping-datetime">${escapeHtml(clipping.datetime || '未知时间')}</span>
      </div>
      <div class="clipping-text">${escapeHtml(clipping.content)}</div>
    </div>
  `).join('');
}

// 获取类型标签
function getTypeLabel(type) {
  const labels = {
    highlight: '标注',
    bookmark: '书签',
    note: '笔记',
    unknown: '未知'
  };
  return labels[type] || type;
}

// 显示内容区域
function showContentArea() {
  emptyState.classList.add('hidden');
  contentArea.classList.remove('hidden');
}

// 拖拽处理
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.name.endsWith('.txt')) {
      loadFile(file.path);
    } else {
      alert('请上传 .txt 格式的文件');
    }
  }
}

// HTML 转义
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 导出笔记
async function exportNotes(format) {
  if (!currentBookKey || !allBooks[currentBookKey]) {
    alert('请先选择一本书');
    return;
  }

  const book = allBooks[currentBookKey];
  const fileName = `${book.title}_笔记`;

  // 复制到剪贴板
  if (format === 'clipboard') {
    try {
      const content = generateTxtContent(book);
      await navigator.clipboard.writeText(content);
      alert('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败: ' + error.message);
    }
    return;
  }

  try {
    const filePath = await window.electronAPI.saveFile({
      defaultName: fileName,
      filters: getExportFilters(format)
    });

    if (!filePath) return;

    let result;

    switch (format) {
      case 'txt':
        const txtContent = generateTxtContent(book);
        result = await window.electronAPI.writeFile(filePath, txtContent);
        break;
      case 'md':
        const mdContent = generateMdContent(book);
        result = await window.electronAPI.writeFile(filePath, mdContent);
        break;
      case 'docx':
        result = await window.electronAPI.exportDocx({ book, filePath });
        break;
      case 'pdf':
        const htmlContent = generatePdfHtml(book);
        result = await window.electronAPI.exportPdf({ htmlContent, filePath });
        break;
    }

    if (result && result.success) {
      alert(`导出成功: ${filePath}`);
    } else if (result && result.error) {
      alert('导出失败: ' + result.error);
    }
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
}

// 获取导出过滤器
function getExportFilters(format) {
  const filters = {
    txt: [{ name: 'Text Files', extensions: ['txt'] }],
    md: [{ name: 'Markdown Files', extensions: ['md'] }],
    docx: [{ name: 'Word Documents', extensions: ['docx'] }],
    pdf: [{ name: 'PDF Files', extensions: ['pdf'] }]
  };
  return filters[format];
}

// 生成 TXT 内容
function generateTxtContent(book) {
  let content = `${book.title}\n`;
  content += `作者: ${book.author}\n`;
  content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
  content += `${'='.repeat(50)}\n\n`;

  book.clippings.forEach((clipping, index) => {
    content += `【${index + 1}】${getTypeLabel(clipping.type)}\n`;
    content += `位置: ${clipping.location || '未知'}\n`;
    content += `时间: ${clipping.datetime || '未知'}\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `${clipping.content}\n\n`;
  });

  return content;
}

// 生成 Markdown 内容
function generateMdContent(book) {
  let content = `---\n`;
  content += `title: "${book.title}"\n`;
  content += `author: "${book.author}"\n`;
  content += `date: "${new Date().toISOString()}"\n`;
  content += `---\n\n`;
  content += `# ${book.title}\n\n`;
  content += `**作者**: ${book.author}\n\n`;
  content += `> 共 ${book.clippings.length} 条笔记\n\n`;
  content += `---\n\n`;

  book.clippings.forEach((clipping, index) => {
    content += `## ${index + 1}. ${getTypeLabel(clipping.type)}\n\n`;
    content += `- **位置**: ${clipping.location || '未知'}\n`;
    content += `- **时间**: ${clipping.datetime || '未知'}\n\n`;
    content += `> ${clipping.content.replace(/\n/g, '\n> ')}\n\n`;
    content += `---\n\n`;
  });

  return content;
}

// 生成 PDF HTML 内容
function generatePdfHtml(book) {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
          padding: 40px;
          line-height: 1.8;
          color: #333;
        }
        h1 {
          text-align: center;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .meta {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
        }
        .clipping {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px dashed #ddd;
        }
        .clipping-header {
          color: #888;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .clipping-type {
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .clipping-content {
          font-size: 15px;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(book.title)}</h1>
      <div class="meta">
        作者: ${escapeHtml(book.author)} · ${book.clippings.length} 条笔记
      </div>
  `;

  book.clippings.forEach((clipping, index) => {
    html += `
      <div class="clipping">
        <div class="clipping-header">
          <span class="clipping-type">${getTypeLabel(clipping.type)}</span>
          位置: ${escapeHtml(clipping.location || '未知')} ·
          时间: ${escapeHtml(clipping.datetime || '未知')}
        </div>
        <div class="clipping-content">${escapeHtml(clipping.content)}</div>
      </div>
    `;
  });

  html += '</body></html>';
  return html;
}

// 暴露到全局
window.exportNotes = exportNotes;