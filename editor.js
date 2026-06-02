(function () {
  const storageKey = "aiResourceEditorData";
  const adminSessionKey = "aiResourceAdminSession";
  const adminUser = "admin";
  const adminPasswordHash = "c0e9f9e6cdbdf960c50893c70a0f787c1dbbcf6753e622d15d80be417a083cb2";

  const collectionLabels = {
    tools: "AI工具",
    industries: "专业行业",
    tutorials: "课程教程",
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
      ["summary", "教程简介", "textarea"],
      ["steps", "步骤", "list"],
      ["updatedAt", "最后更新", "date"]
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
    data: loadPreviewData() || structuredClone(window.AI_RESOURCE_DATA),
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

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(els.loginForm);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (username !== adminUser) {
      showLogin("账号或密码不正确。");
      return;
    }

    try {
      const passwordHash = await sha256(password);
      if (passwordHash !== adminPasswordHash) {
        showLogin("账号或密码不正确。");
        return;
      }
    } catch (error) {
      showLogin("当前浏览器不支持安全校验，请用本地服务或 HTTPS 打开后台。");
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

    els.form.innerHTML = schema.map(([key, label, type]) => renderField(item, key, label, type)).join("");

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
    state.data.updatedAt = new Date().toISOString().slice(0, 10);
    storageSet(storageKey, JSON.stringify(state.data));
    setStatus("已保存到本机预览，返回前台即可查看。");
  }

  function exportData() {
    saveFormToState();
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
    state.data = structuredClone(window.AI_RESOURCE_DATA);
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
