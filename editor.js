(function () {
  const platform = window.AI_CREATOR_PLATFORM;
  const storageKey = "aiResourceEditorData";
  const adminSessionKey = "aiResourceAdminSession";
  const communityVideoStorageKey = "aiResourceCommunityVideos";
  const adminUser = "admin";
  const adminPasswordHash = "dd4fa27e";

  const collectionLabels = {
    tools: "AI工具",
    industries: "专业行业",
    tutorials: "课程教程",
    videoSubmissions: "视频审核",
    routes: "岗位路线",
    comparisons: "工具对比"
  };

  const schemas = {
    tools: [
      ["id", "唯一ID", "text"],
      ["name", "工具名称", "text"],
      ["vendor", "厂商/平台", "text"],
      ["category", "用途分类", "category"],
      ["url", "官网链接", "url"],
      ["pricing", "是否免费/价格", "text"],
      ["signup", "注册方式", "textarea"],
      ["roles", "适合岗位", "roles"],
      ["summary", "一句话介绍", "textarea"],
      ["scenes", "使用场景", "list"],
      ["pros", "优点", "list"],
      ["cons", "限制", "list"],
      ["alternatives", "替代工具", "list"],
      ["updatedAt", "最后更新", "date"],
      ["sourceName", "信息来源", "text"]
    ],
    industries: [
      ["id", "唯一ID", "text"],
      ["name", "行业名称", "text"],
      ["keywords", "搜索关键词", "list"],
      ["audience", "适合人群", "textarea"],
      ["goal", "AI使用目标", "textarea"],
      ["tools", "推荐工具", "list"],
      ["scenarios", "典型场景", "list"],
      ["prompts", "提示词方向", "list"],
      ["risks", "风险提醒", "list"]
    ],
    tutorials: [
      ["id", "唯一ID", "text"],
      ["type", "教程类型", "text"],
      ["level", "难度", "text"],
      ["title", "教程标题", "text"],
      ["audience", "适合岗位", "roles"],
      ["tools", "涉及工具", "list"],
      ["duration", "预计时长", "text"],
      ["videoUrl", "学习视频链接", "url"],
      ["summary", "教程简介", "textarea"],
      ["steps", "步骤", "list"],
      ["updatedAt", "最后更新", "date"]
    ],
    videoSubmissions: [
      ["id", "投稿ID", "text"],
      ["title", "视频标题", "text"],
      ["creator", "创作者", "text"],
      ["creatorPhone", "手机号", "text"],
      ["audience", "适合人群", "text"],
      ["tool", "使用工具", "text"],
      ["tags", "分类标签", "list"],
      ["description", "视频简介", "textarea"],
      ["videoFileId", "腾讯云VOD FileId", "text"],
      ["videoAppId", "腾讯云VOD AppId", "text"],
      ["videoUrl", "视频播放地址", "url"],
      ["coverImage", "封面图", "url"],
      ["status", "审核状态", "text"],
      ["reviewNote", "审核备注", "textarea"],
      ["createdAt", "投稿日期", "date"]
    ],
    routes: [
      ["id", "唯一ID", "text"],
      ["title", "路线标题", "text"],
      ["audience", "适合人群", "text"],
      ["goal", "路线目标", "textarea"],
      ["tools", "推荐工具", "list"],
      ["steps", "步骤", "list"],
      ["output", "最终产出", "textarea"]
    ],
    comparisons: [
      ["title", "对比主题", "text"],
      ["keyword", "适合搜索词", "textarea"],
      ["conclusion", "结论方向", "textarea"]
    ]
  };

  const state = {
    data: prepareEditorData(loadPreviewData() || structuredClone(window.AI_RESOURCE_DATA)),
    collection: "tools",
    selectedIndex: 0,
    query: ""
  };

  const els = {
    collectionSelect: document.getElementById("collection-select"),
    list: document.getElementById("editor-list"),
    search: document.getElementById("editor-search"),
    form: document.getElementById("item-form"),
    formTitle: document.getElementById("form-title"),
    formEyebrow: document.getElementById("form-eyebrow"),
    status: document.getElementById("editor-status"),
    loginPanel: document.getElementById("admin-login-panel"),
    editorApp: document.getElementById("editor-app"),
    loginForm: document.getElementById("admin-login-form"),
    loginStatus: document.getElementById("admin-login-status"),
    logout: document.getElementById("admin-logout"),
    addItem: document.getElementById("add-item"),
    duplicateItem: document.getElementById("duplicate-item"),
    deleteItem: document.getElementById("delete-item"),
    savePreview: document.getElementById("save-preview"),
    exportData: document.getElementById("export-data"),
    clearPreview: document.getElementById("clear-preview")
  };

  function loadPreviewData() {
    try {
      const raw = storageGet(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function prepareEditorData(data) {
    const next = data || {};
    const communityVideos = loadCommunityVideos();
    next.videoSubmissions = Array.isArray(next.videoSubmissions)
      ? mergeVideoSubmissions(next.videoSubmissions, communityVideos)
      : communityVideos;
    return next;
  }

  function loadCommunityVideos() {
    try {
      const raw = storageGet(communityVideoStorageKey);
      const items = raw ? JSON.parse(raw) : window.AI_RESOURCE_DATA?.videoSubmissions;
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function mergeVideoSubmissions(primary, secondary) {
    const merged = [...primary];
    const ids = new Set(merged.map((item) => item.id));
    secondary.forEach((item) => {
      if (item?.id && !ids.has(item.id)) {
        merged.push(item);
        ids.add(item.id);
      }
    });
    return merged;
  }

  function syncVideoSubmissions() {
    storageSet(communityVideoStorageKey, JSON.stringify(state.data.videoSubmissions || []));
  }

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function storageGet(key) {
    return getStorage()?.getItem(key) || null;
  }

  function storageSet(key, value) {
    getStorage()?.setItem(key, value);
  }

  function storageRemove(key) {
    getStorage()?.removeItem(key);
  }

  function isAdminLoggedIn() {
    return storageGet(adminSessionKey) === "active";
  }

  function showEditor() {
    els.loginPanel.hidden = true;
    els.editorApp.hidden = false;
    els.logout.hidden = false;
  }

  function showLogin(message = "") {
    els.loginPanel.hidden = false;
    els.editorApp.hidden = true;
    els.logout.hidden = true;
    if (els.loginStatus) els.loginStatus.textContent = message;
  }

  function hashPassword(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(els.loginForm);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (username !== adminUser) {
      showLogin("账号或密码不正确。");
      return;
    }

    if (hashPassword(password) !== adminPasswordHash) {
      showLogin("账号或密码不正确。");
      return;
    }

    storageSet(adminSessionKey, "active");
    els.loginForm.reset();
    showEditor();
    renderAll();
    setStatus("已进入管理员后台。");
  }

  function handleLogout() {
    storageRemove(adminSessionKey);
    showLogin("已退出管理员后台。");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value) {
    return String(value || "new-item")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || `item-${Date.now()}`;
  }

  function currentItems() {
    return state.data[state.collection] || [];
  }

  function currentItem() {
    return currentItems()[state.selectedIndex];
  }

  function itemTitle(item) {
    return item?.name || item?.title || item?.audience || item?.id || "未命名";
  }

  function itemSubtitle(item) {
    if (!item) return "";
    return item.summary || item.goal || item.keyword || item.vendor || item.type || item.updatedAt || "";
  }

  function parseList(value) {
    return String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function listValue(value) {
    return Array.isArray(value) ? value.join("\n") : String(value || "");
  }

  function setStatus(message) {
    els.status.textContent = message;
    window.setTimeout(() => {
      if (els.status.textContent === message) els.status.textContent = "";
    }, 3600);
  }

  function renderList() {
    const query = state.query.trim().toLowerCase();
    const items = currentItems();
    const matches = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const haystack = JSON.stringify(item).toLowerCase();
        return !query || haystack.includes(query);
      });

    els.list.innerHTML = matches.length
      ? matches.map(({ item, index }) => `
          <button type="button" class="${index === state.selectedIndex ? "is-active" : ""}" data-index="${index}">
            ${escapeHtml(itemTitle(item))}
            <span>${escapeHtml(itemSubtitle(item)).slice(0, 56)}</span>
          </button>
        `).join("")
      : `<div class="empty-state">没有找到匹配内容。</div>`;

    els.list.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        saveFormToState();
        state.selectedIndex = Number(button.dataset.index);
        renderAll();
      });
    });
  }

  function renderForm() {
    const item = currentItem();
    const schema = schemas[state.collection];

    els.formEyebrow.textContent = collectionLabels[state.collection];
    els.formTitle.textContent = item ? itemTitle(item) : "暂无内容";

    if (!item) {
      els.form.innerHTML = `<div class="empty-state">当前分类还没有内容，点击左侧“新增”。</div>`;
      return;
    }

    els.form.innerHTML = [
      state.collection === "videoSubmissions" ? renderVideoReviewPanel(item) : "",
      schema.map(([key, label, type]) => renderField(item, key, label, type)).join("")
    ].join("");

    els.form.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", () => {
        saveFormToState();
        renderList();
        els.formTitle.textContent = itemTitle(currentItem());
      });
      field.addEventListener("change", () => {
        saveFormToState();
        renderList();
      });
    });

    bindVideoReviewActions();
  }

  function renderVideoReviewPanel(item) {
    const status = item.status || "待审核";
    const hasPlayableVideo = item.videoUrl || item.localVideoUrl;
    return `
      <div class="video-review-panel is-wide">
        <div>
          <p class="eyebrow">视频审核</p>
          <h3>${escapeHtml(item.title || "未命名视频")}</h3>
          <p>当前状态：<strong>${escapeHtml(status)}</strong>。通过后会自动生成课程，并出现在课程合集。</p>
        </div>
        ${hasPlayableVideo ? `
          <video class="review-video" src="${escapeHtml(item.videoUrl || item.localVideoUrl)}" controls preload="metadata"></video>
        ` : `
          <div class="empty-state">当前投稿没有可直接播放的视频地址。若已上传到腾讯云点播，请填写 FileId / AppId 或播放地址。</div>
        `}
        <div class="editor-review-actions">
          <button class="primary-action" type="button" data-review-action="approve">通过并生成课程</button>
          <button class="secondary-action" type="button" data-review-action="reject">驳回修改</button>
          <button class="secondary-action danger-action" type="button" data-review-action="offline">下架</button>
        </div>
      </div>
    `;
  }

  function bindVideoReviewActions() {
    if (state.collection !== "videoSubmissions") return;
    els.form.querySelectorAll("[data-review-action]").forEach((button) => {
      button.addEventListener("click", () => handleVideoReview(button.dataset.reviewAction));
    });
  }

  function renderField(item, key, label, type) {
    const value = item[key];
    const fieldId = `field-${key}`;
    const isWide = ["textarea", "list", "roles"].includes(type);
    const hint = type === "list" || type === "roles" ? "<small>每行一个，适合后续批量维护。</small>" : "";

    if (type === "category") {
      return `
        <div class="editor-field">
          <label for="${fieldId}">${escapeHtml(label)}</label>
          <select id="${fieldId}" name="${escapeHtml(key)}" data-type="${type}">
            ${state.data.categories.map((category) => `
              <option value="${escapeHtml(category.id)}" ${category.id === value ? "selected" : ""}>${escapeHtml(category.name)}</option>
            `).join("")}
          </select>
        </div>
      `;
    }

    if (type === "roles") {
      return `
        <div class="editor-field is-wide">
          <label for="${fieldId}">${escapeHtml(label)}</label>
          <textarea class="tall-textarea" id="${fieldId}" name="${escapeHtml(key)}" data-type="${type}">${escapeHtml(listValue(value))}</textarea>
          ${hint}
        </div>
      `;
    }

    if (type === "textarea" || type === "list") {
      return `
        <div class="editor-field ${isWide ? "is-wide" : ""}">
          <label for="${fieldId}">${escapeHtml(label)}</label>
          <textarea class="${type === "list" ? "tall-textarea" : ""}" id="${fieldId}" name="${escapeHtml(key)}" data-type="${type}">${escapeHtml(type === "list" ? listValue(value) : value)}</textarea>
          ${hint}
        </div>
      `;
    }

    return `
      <div class="editor-field">
        <label for="${fieldId}">${escapeHtml(label)}</label>
        <input id="${fieldId}" name="${escapeHtml(key)}" data-type="${type}" type="${type === "url" ? "url" : type === "date" ? "date" : "text"}" value="${escapeHtml(value)}">
      </div>
    `;
  }

  function saveFormToState() {
    const item = currentItem();
    if (!item) return;

    els.form.querySelectorAll("[name]").forEach((field) => {
      const key = field.name;
      const type = field.dataset.type;
      item[key] = type === "list" || type === "roles" ? parseList(field.value) : field.value.trim();
    });
  }

  function handleVideoReview(action) {
    if (!platform) {
      setStatus("缺少创作者平台模块，无法审核视频。");
      return;
    }

    saveFormToState();
    const item = currentItem();
    if (!item) return;

    if (action === "approve") {
      const approved = platform.approveVideoSubmission(item, {
        reviewer: "admin",
        note: item.reviewNote || "审核通过"
      });
      replaceCurrentItem(approved);
      addTutorialFromVideo(approved);
      persistEditorState();
      setStatus("视频已通过审核，并已加入课程合集。");
      renderAll();
      return;
    }

    if (action === "reject") {
      const note = window.prompt("请输入驳回原因", item.reviewNote || "请补充更清晰的标题、封面或课程说明。");
      if (note === null) return;
      replaceCurrentItem(platform.rejectVideoSubmission(item, { reviewer: "admin", note }));
      persistEditorState();
      setStatus("已驳回视频，创作者可在创作者中心看到备注。");
      renderAll();
      return;
    }

    if (action === "offline") {
      const note = window.prompt("请输入下架原因", item.reviewNote || "内容已下架。");
      if (note === null) return;
      replaceCurrentItem(platform.offlineVideoSubmission(item, { reviewer: "admin", note }));
      persistEditorState();
      setStatus("视频已下架，不会继续公开展示。");
      renderAll();
    }
  }

  function replaceCurrentItem(nextItem) {
    currentItems()[state.selectedIndex] = nextItem;
  }

  function addTutorialFromVideo(video) {
    const tutorials = state.data.tutorials || [];
    const exists = tutorials.some((item) => {
      return (video.videoFileId && item.videoFileId === video.videoFileId) || item.sourceVideoId === video.id;
    });
    if (exists) return;

    const tutorial = platform.createTutorialFromApprovedVideo(video);
    tutorial.sourceVideoId = video.id;
    tutorials.unshift(tutorial);
    state.data.tutorials = tutorials;
  }

  function persistEditorState() {
    state.data.updatedAt = new Date().toISOString().slice(0, 10);
    syncVideoSubmissions();
    storageSet(storageKey, JSON.stringify(state.data));
  }

  function createBlankItem() {
    const today = new Date().toISOString().slice(0, 10);
    const role = state.data.roles?.[0]?.id || "student";
    const category = state.data.categories?.[0]?.id || "chat";

    if (state.collection === "tools") {
      return {
        id: `new-tool-${Date.now()}`,
        name: "新AI工具",
        vendor: "平台名称",
        category,
        url: "https://example.com/",
        pricing: "以官网为准",
        signup: "按官网流程注册",
        roles: [role],
        summary: "一句话说明这个工具适合做什么。",
        scenes: ["场景1"],
        pros: ["优点1"],
        cons: ["限制1"],
        alternatives: [],
        updatedAt: today,
        sourceName: "官方主页"
      };
    }

    if (state.collection === "videoSubmissions") {
      return {
        id: `video-${Date.now()}`,
        title: "新的创作者视频",
        creatorId: "manual-creator",
        creator: "创作者",
        creatorPhone: "",
        audience: "通用",
        tool: "AI工具",
        tags: ["教程"],
        description: "填写课程简介、适合人群和可以学到的内容。",
        videoFileId: "",
        videoAppId: "",
        videoUrl: "",
        coverImage: "",
        status: "待审核",
        reviewNote: "",
        createdAt: today,
        views: 0,
        tips: 0,
        likes: 0
      };
    }

    if (state.collection === "industries") {
      return {
        id: `new-industry-${Date.now()}`,
        name: "新专业行业",
        keywords: ["关键词"],
        audience: "适合人群",
        goal: "AI使用目标",
        tools: ["ChatGPT"],
        scenarios: ["典型场景"],
        prompts: ["提示词方向"],
        risks: ["风险提醒"]
      };
    }

    if (state.collection === "tutorials") {
      return {
        id: `new-tutorial-${Date.now()}`,
        type: "入门",
        level: "新手",
        title: "新教程",
        audience: [role],
        tools: ["ChatGPT"],
        duration: "30分钟",
        videoUrl: "",
        summary: "教程简介",
        steps: ["步骤1"],
        updatedAt: today
      };
    }

    if (state.collection === "routes") {
      return {
        id: `new-route-${Date.now()}`,
        title: "新岗位路线",
        audience: "适合人群",
        goal: "路线目标",
        tools: ["ChatGPT"],
        steps: ["步骤1"],
        output: "最终产出"
      };
    }

    return {
      title: "新对比主题",
      keyword: "适合搜索词",
      conclusion: "结论方向"
    };
  }

  function addItem() {
    saveFormToState();
    currentItems().unshift(createBlankItem());
    state.selectedIndex = 0;
    state.query = "";
    els.search.value = "";
    renderAll();
    setStatus("已新增一条内容。");
  }

  function duplicateItem() {
    saveFormToState();
    const item = currentItem();
    if (!item) return;
    const copy = structuredClone(item);
    if (copy.id) copy.id = `${slugify(copy.id)}-copy-${Date.now()}`;
    if (copy.name) copy.name = `${copy.name} 副本`;
    if (copy.title) copy.title = `${copy.title} 副本`;
    currentItems().splice(state.selectedIndex + 1, 0, copy);
    state.selectedIndex += 1;
    renderAll();
    setStatus("已复制当前内容。");
  }

  function deleteItem() {
    const items = currentItems();
    if (!items.length) return;
    const title = itemTitle(currentItem());
    const ok = window.confirm(`确定删除“${title}”吗？`);
    if (!ok) return;
    items.splice(state.selectedIndex, 1);
    state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    renderAll();
    setStatus("已删除。");
  }

  function savePreview() {
    saveFormToState();
    persistEditorState();
    setStatus("已保存到本机预览，返回前台即可查看。");
  }

  function exportData() {
    saveFormToState();
    syncVideoSubmissions();
    const content = `window.AI_RESOURCE_DATA = ${JSON.stringify(state.data, null, 2)};\n`;
    const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "content-data.js";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("已导出新版 content-data.js。");
  }

  function clearPreview() {
    const ok = window.confirm("确定清除本机预览数据，恢复读取原始内容吗？");
    if (!ok) return;
    storageRemove(storageKey);
    state.data = prepareEditorData(structuredClone(window.AI_RESOURCE_DATA));
    state.selectedIndex = 0;
    renderAll();
    setStatus("已清除本机预览。");
  }

  function bindEvents() {
    els.loginForm.addEventListener("submit", handleLogin);
    els.logout.addEventListener("click", handleLogout);

    els.collectionSelect.addEventListener("change", () => {
      saveFormToState();
      state.collection = els.collectionSelect.value;
      state.selectedIndex = 0;
      state.query = "";
      els.search.value = "";
      renderAll();
    });

    els.search.addEventListener("input", () => {
      state.query = els.search.value;
      renderList();
    });

    els.addItem.addEventListener("click", addItem);
    els.duplicateItem.addEventListener("click", duplicateItem);
    els.deleteItem.addEventListener("click", deleteItem);
    els.savePreview.addEventListener("click", savePreview);
    els.exportData.addEventListener("click", exportData);
    els.clearPreview.addEventListener("click", clearPreview);
  }

  function renderAll() {
    els.collectionSelect.value = state.collection;
    renderList();
    renderForm();
  }

  bindEvents();
  if (isAdminLoggedIn()) {
    showEditor();
    renderAll();
  } else {
    showLogin();
  }
})();
