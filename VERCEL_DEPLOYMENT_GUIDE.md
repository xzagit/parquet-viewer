# Parquet 查看器 (Next.js 重构版) - Vercel 部署指南

## 概述

本项目是一个使用 Next.js (App Router) 构建的 Parquet 文件查看器，支持文件上传、后端解析和前端表格展示。为了方便您将其部署到 Vercel，请遵循以下步骤。

## 前提条件

1.  **Vercel 账户**：您需要一个 Vercel 账户。如果没有，可以在 [vercel.com](https://vercel.com) 免费注册。
2.  **Git 提供商账户**：例如 GitHub, GitLab, 或 Bitbucket。本项目代码需要托管在这些平台上，Vercel 才能进行自动部署。

## 部署步骤

1.  **准备项目代码**：
    *   您将收到一个包含本项目所有源代码的 `.zip` 压缩包 (`parquet-viewer-rebuilt.zip`)。
    *   解压此压缩包到您的本地计算机。

2.  **将代码推送到 Git 仓库**：
    *   在您的 Git 提供商（如 GitHub）上创建一个新的空仓库。
    *   在本地解压后的项目根目录 (`parquet-viewer-rebuilt`) 中初始化 Git (如果尚未初始化)，并将其连接到您新创建的远程仓库。
        ```bash
        cd path/to/parquet-viewer-rebuilt
        git init -b main
        git add .
        git commit -m "Initial commit of Parquet Viewer (Rebuilt)"
        git remote add origin <YOUR_NEW_GIT_REPOSITORY_URL>
        git push -u origin main
        ```
        请将 `<YOUR_NEW_GIT_REPOSITORY_URL>` 替换为您实际的 Git 仓库 URL。

3.  **在 Vercel 上导入项目**：
    *   登录到您的 Vercel 账户。
    *   在 Dashboard 页面，点击 "Add New..." -> "Project"。
    *   选择 "Continue with Git" 并选择您之前使用的 Git 提供商 (例如 GitHub)。
    *   授权 Vercel 访问您的仓库（如果尚未授权）。
    *   从仓库列表中选择您刚刚创建并推送了代码的仓库 (例如 `parquet-viewer-rebuilt`)，然后点击 "Import"。

4.  **配置项目 (通常 Vercel 会自动检测 Next.js 项目)**：
    *   **Framework Preset**：Vercel 通常会自动检测到这是一个 Next.js 项目，并选择正确的预设。
    *   **Build and Output Settings**：通常也无需修改，Vercel 会使用 Next.js 的默认构建命令 (`next build`) 和输出目录 (`.next`)。
    *   **Environment Variables**：本项目目前不需要特定的环境变量即可运行核心功能。如果后续添加了需要 API 密钥等敏感信息的功能，可以在此配置。

5.  **部署**：
    *   点击 "Deploy" 按钮。
    *   Vercel 将开始构建和部署您的项目。您可以在 Vercel 的部署日志中查看进度。

6.  **访问您的应用**：
    *   部署成功后，Vercel 会为您提供一个或多个公共 URL (例如 `your-project-name.vercel.app`)。
    *   通过这些 URL 即可访问您部署的 Parquet 查看器。

## 项目结构说明 (parquet-viewer-rebuilt)

*   `src/app/page.tsx`: 前端主页面，包含文件上传和数据显示逻辑。
*   `src/app/api/upload/route.ts`: 后端 API 路由，处理 Parquet 文件上传和解析。
*   `vercel.json`: Vercel 部署配置文件，已包含基础配置。
*   `package.json`: 项目依赖和脚本。
*   `next.config.mjs`: Next.js 配置文件。
*   `tailwind.config.ts`: Tailwind CSS 配置文件。

## 注意事项

*   **Node.js 版本**：Vercel 会根据项目中的 `package.json` 或 Next.js 版本自动选择合适的 Node.js 运行时。当前项目基于较新的 Next.js 版本，兼容性良好。
*   **依赖项**：所有必要的依赖项已在 `package.json` 中声明，Vercel 在构建时会自动安装它们。
*   **后续更新**：当您向 Git 仓库的主分支推送新的提交时，Vercel 会自动触发新的构建和部署，实现持续集成/持续部署 (CI/CD)。

如果您在部署过程中遇到任何问题，可以查阅 Vercel 的官方文档或联系其支持团队。

希望这份指南能帮助您顺利部署 Parquet 查看器！

