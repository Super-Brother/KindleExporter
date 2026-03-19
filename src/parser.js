/**
 * Kindle My Clippings.txt 解析器
 */

/**
 * 解析单条笔记
 * @param {string} block - 单条笔记文本块
 * @returns {Object|null} - 解析后的笔记对象
 */
function parseClippingBlock(block) {
  const lines = block.trim().split('\n');

  if (lines.length < 2) {
    return null;
  }

  // 第一行：书名 (作者)
  const titleLine = lines[0].trim();
  let title = '';
  let author = 'Unknown';

  const authorMatch = titleLine.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (authorMatch) {
    title = authorMatch[1].trim();
    author = authorMatch[2].trim();
  } else {
    title = titleLine;
  }

  // 第二行：元信息
  const metaLine = lines[1].trim();

  // 解析类型：标注、书签
  let type = 'unknown';
  if (metaLine.includes('标注')) {
    type = 'highlight';
  } else if (metaLine.includes('书签')) {
    type = 'bookmark';
  } else if (metaLine.includes('笔记')) {
    type = 'note';
  }

  // 解析位置/页码
  let location = '';
  const locationMatch = metaLine.match(/位置\s*#?(\d+-?\d*)|第\s*(\w+-?\w*)\s*页/);
  if (locationMatch) {
    location = locationMatch[1] || locationMatch[2];
  }

  // 解析时间
  let datetime = '';
  const dateMatch = metaLine.match(/添加于\s*(.+)$/);
  if (dateMatch) {
    datetime = dateMatch[1].trim();
  }

  // 第三行之后是内容（跳过空行）
  const contentLines = [];
  let started = false;
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!started && line.trim() === '') {
      continue;
    }
    started = true;
    contentLines.push(line);
  }
  const content = contentLines.join('\n').trim();

  return {
    title,
    author,
    type,
    location,
    datetime,
    content
  };
}

/**
 * 解析整个 My Clippings.txt 文件
 * @param {string} content - 文件内容
 * @returns {Object} - 按书名分组的笔记
 */
function parseClippings(content) {
  const blocks = content.split('==========');
  const books = {};

  for (const block of blocks) {
    const clipping = parseClippingBlock(block);
    if (!clipping || !clipping.title) {
      continue;
    }

    const bookKey = `${clipping.title} (${clipping.author})`;

    if (!books[bookKey]) {
      books[bookKey] = {
        title: clipping.title,
        author: clipping.author,
        clippings: []
      };
    }

    // 只添加有内容的笔记（书签可能没有内容）
    if (clipping.content || clipping.type === 'bookmark') {
      books[bookKey].clippings.push(clipping);
    }
  }

  // 为每本书按时间排序笔记
  for (const bookKey in books) {
    books[bookKey].clippings.sort((a, b) => {
      // 简单按原始顺序排列
      return 0;
    });
  }

  return books;
}

/**
 * 获取书籍列表
 * @param {Object} books - 解析后的书籍对象
 * @returns {Array} - 书籍列表
 */
function getBookList(books) {
  return Object.keys(books).map(key => ({
    key,
    title: books[key].title,
    author: books[key].author,
    count: books[key].clippings.length
  }));
}