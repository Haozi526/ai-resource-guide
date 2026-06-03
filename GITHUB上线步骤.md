# GitHub Pages 上线步骤

这个项目已经生成了公开发布包：

- 发布目录：`github-pages-public`
- 压缩包：`github-pages-public.zip`

注意：主页不会展示编辑后台入口。`editor.html` 可以作为隐藏站长入口使用，但 GitHub Pages 是静态公开网站，前端登录只能防止普通访客误入，不能替代真正的后端权限系统。

## 第一次上线

1. 打开 GitHub，登录你的账号。
2. 新建仓库，建议仓库名使用 `ai-resource-guide`。
3. 仓库建好后，进入仓库首页，选择上传文件。
4. 不要只上传 `github-pages-public.zip`。要先解压它，然后上传里面的所有内容：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `community.js`
   - `creator-platform.js`
   - `cloudbase-config.js`
   - `content-data.js`
   - `editor.html`
   - `editor.css`
   - `editor.js`
   - `CNAME`
   - `assets`
   - `.nojekyll`
5. 上传完成后，进入仓库的 `Settings`。
6. 左侧找到 `Pages`。
7. `Build and deployment` 选择 `Deploy from a branch`。
8. 分支选择 `main`，目录选择 `/ (root)`，然后保存。

## 三条解析域名绑定

腾讯云当前只有三条解析额度，所以使用 `www` 作为主站地址。

- 主站中文域名：`www.耗子ai学习资源库.com`
- 主站 Punycode：`www.xn--ai-422cl32chdr5tu07apk3ar1y.com`
- 根域名：`耗子ai学习资源库.com`
- 根域名 Punycode：`xn--ai-422cl32chdr5tu07apk3ar1y.com`

### 1. 删除旧 A 记录

如果腾讯云 DNSPod 里已经添加过下面这些记录，请先删除：

```text
@  A  185.199.108.153
@  A  185.199.109.153
@  A  185.199.110.153
@  A  185.199.111.153
```

### 2. 腾讯云 DNSPod 添加解析

只需要添加下面 2 条，第三条可以留空：

| 主机记录 | 类型 | 记录值 |
|---|---|---|
| `www` | `CNAME` | `Haozi526.github.io` |
| `@` | `显性URL转发` | `https://www.xn--ai-422cl32chdr5tu07apk3ar1y.com` |

注意：

- `www` 的 CNAME 只填 `Haozi526.github.io`。
- 不要在 CNAME 里写仓库名。
- 不要在 CNAME 里写 `/ai-resource-guide`。
- 如果腾讯云当前套餐不支持“显性URL转发”，先只配置 `www` 的 CNAME，根域名暂时不启用。

### 3. GitHub Pages 填自定义域名

GitHub Pages 后台 `Custom domain` 填：

```text
www.xn--ai-422cl32chdr5tu07apk3ar1y.com
```

DNS 检测通过后，勾选 `Enforce HTTPS`。

### 4. CNAME 文件

发布文件里必须包含 `CNAME` 文件，内容为：

```text
www.xn--ai-422cl32chdr5tu07apk3ar1y.com
```

本项目已经在以下位置加入了 `CNAME`：

- 项目根目录
- `github-pages-public`
- `github-pages-upload-text`
- `github-pages-public.zip`

### 5. 检查命令

```powershell
Resolve-DnsName www.xn--ai-422cl32chdr5tu07apk3ar1y.com -Type CNAME
```

浏览器访问：

- `https://www.耗子ai学习资源库.com`
- `https://耗子ai学习资源库.com`

预期结果：

- `www.耗子ai学习资源库.com` 打开网站。
- `耗子ai学习资源库.com` 跳转到 `www.耗子ai学习资源库.com`。

DNS 解析可能需要几分钟到 24 小时。

## 后续更新

1. 打开 `editor.html`，用管理员账号登录后修改内容。
2. 点击“保存到本机预览”，先看前台效果。
3. 确认没问题后，导出或更新公开文件。
4. 重新生成公开发布包，再把变更文件上传到 GitHub。

## 重要提醒

GitHub Pages 是公开网站。不要把收款密钥、真实用户数据、个人隐私文件上传到发布目录。前端管理员登录不适合保护高价值敏感数据。

后续如果迁移到腾讯云 CloudBase 静态托管，再把 DNS 改成 CloudBase 控制台提供的解析值。CloudBase 正式绑定生产域名时，可能需要备案和自定义域名校验。
