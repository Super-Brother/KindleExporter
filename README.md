# Kindle 笔记导出工具

一款简洁优雅的 Mac 客户端工具，用于管理 Kindle 笔记和高亮内容。

![软件截图](img.png)

## 功能特性

- 📚 **智能解析** - 自动解析 Kindle `My Clippings.txt` 文件，按书名分组显示
- 📋 **多种导出格式** - 支持 TXT、Markdown、Word (docx)、PDF 四种格式
- 📎 **一键复制** - 快速复制笔记内容到剪贴板
- 🖱️ **拖拽导入** - 支持拖拽文件快速导入
- 🎨 **现代界面** - 简洁优雅的 macOS 原生风格界面

## 安装

### 方式一：下载 DMG 安装包

1. 下载 `dist/KindleExporter-1.0.0-arm64.dmg`
2. 双击打开 DMG 文件
3. 将应用拖入 Applications 文件夹

### 方式二：自行构建

```bash
# 克隆仓库
git clone https://github.com/Super-Brother/KindleExporter.git
cd KindleExporter

# 安装依赖
npm install

# 打包应用
npm run build
```

## 使用方法

1. **导入笔记**
   - 点击「导入文件」按钮选择 `My Clippings.txt`
   - 或直接拖拽文件到窗口

2. **浏览笔记**
   - 左侧显示书籍列表
   - 点击书名查看该书的全部笔记

3. **导出笔记**
   - 选择目标书籍
   - 点击对应的导出按钮：
     - **复制** - 复制到剪贴板
     - **TXT** - 导出为纯文本
     - **Markdown** - 导出为 Markdown 格式
     - **Word** - 导出为 docx 文档
     - **PDF** - 导出为 PDF 文档

## Kindle 笔记文件位置

Kindle 笔记文件 `My Clippings.txt` 通常位于 Kindle 设备的根目录下。连接 Kindle 到电脑后，可以在根目录找到该文件。

## 技术栈

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [docx](https://github.com/dolanmiu/docx) - Word 文档生成库

## 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm start

# 打包应用
npm run build
```

## License

MIT