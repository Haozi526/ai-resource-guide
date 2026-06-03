(function () {
  const data = loadEditorPreviewData() || window.AI_RESOURCE_DATA;

  const state = {
    category: "all",
    role: "all",
    tutorialType: "all",
    query: ""
  };

  function loadEditorPreviewData() {
    try {
      const raw = localStorage.getItem("aiResourceEditorData");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  const els = {
    search: document.getElementById("global-search"),
    clearSearch: document.getElementById("clear-search"),
    categoryFilters: document.getElementById("category-filters"),
    roleFilters: document.getElementById("role-filters"),
    tutorialFilters: document.getElementById("tutorial-filters"),
    toolGrid: document.getElementById("tool-grid"),
    courseGrid: document.getElementById("course-grid"),
    routeGrid: document.getElementById("route-grid"),
    industryGrid: document.getElementById("industry-grid"),
    comparisonBody: document.getElementById("comparison-body"),
    toolCount: document.getElementById("tool-count"),
    industryCount: document.getElementById("industry-count"),
    tutorialCount: document.getElementById("tutorial-count"),
    statTools: document.getElementById("stat-tools"),
    statRoutes: document.getElementById("stat-routes"),
    statTutorials: document.getElementById("stat-tutorials"),
    goalTools: document.getElementById("goal-tools"),
    goalRoutes: document.getElementById("goal-routes"),
    goalTutorials: document.getElementById("goal-tutorials"),
    modal: document.getElementById("tool-modal"),
    modalContent: document.getElementById("modal-content"),
    downloadCsv: document.getElementById("download-csv"),
    copyTemplate: document.getElementById("copy-template"),
    actionStatus: document.getElementById("action-status")
  };

  const categoryMap = new Map(data.categories.map((item) => [item.id, item]));
  const roleMap = new Map(data.roles.map((item) => [item.id, item]));

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function createButton(label, active, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${active ? " is-active" : ""}`;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", onClick);
    return button;
  }

  function renderFilters() {
    els.categoryFilters.innerHTML = "";
    els.categoryFilters.appendChild(
      createButton("全部用途", state.category === "all", () => {
        state.category = "all";
        renderAll();
      })
    );

    data.categories.forEach((category) => {
      els.categoryFilters.appendChild(
        createButton(category.name, state.category === category.id, () => {
          state.category = category.id;
          renderAll();
        })
      );
    });

    els.roleFilters.innerHTML = "";
    els.roleFilters.appendChild(
      createButton("全部岗位", state.role === "all", () => {
        state.role = "all";
        renderAll();
      })
    );

    data.roles.forEach((role) => {
      els.roleFilters.appendChild(
        createButton(role.name, state.role === role.id, () => {
          state.role = role.id;
          renderAll();
        })
      );
    });

    const tutorialTypes = Array.from(new Set(data.tutorials.map((item) => item.type)));
    els.tutorialFilters.innerHTML = "";
    els.tutorialFilters.appendChild(
      createButton("全部类型", state.tutorialType === "all", () => {
        state.tutorialType = "all";
        renderAll();
      })
    );
    tutorialTypes.forEach((type) => {
      els.tutorialFilters.appendChild(
        createButton(type, state.tutorialType === type, () => {
          state.tutorialType = type;
          renderAll();
        })
      );
    });
  }

  function toolMatches(tool) {
    const query = normalize(state.query);
    const category = categoryMap.get(tool.category);
    const roleNames = tool.roles.map((role) => roleMap.get(role)?.name || role);
    const haystack = normalize([
      tool.name,
      tool.vendor,
      category?.name,
      tool.summary,
      tool.signup,
      tool.pricing,
      tool.scenes.join(" "),
      tool.pros.join(" "),
      tool.cons.join(" "),
      tool.alternatives.join(" "),
      roleNames.join(" ")
    ].join(" "));

    return (
      (state.category === "all" || tool.category === state.category) &&
      (state.role === "all" || tool.roles.includes(state.role)) &&
      (!query || haystack.includes(query))
    );
  }

  function tutorialMatches(tutorial) {
    const query = normalize(state.query);
    const audienceNames = tutorial.audience.map((role) => roleMap.get(role)?.name || role);
    const haystack = normalize([
      tutorial.title,
      tutorial.type,
      tutorial.level,
      tutorial.summary,
      tutorial.tools.join(" "),
      tutorial.steps.join(" "),
      audienceNames.join(" ")
    ].join(" "));

    return (
      (state.tutorialType === "all" || tutorial.type === state.tutorialType) &&
      (!query || haystack.includes(query))
    );
  }

  function routeMatches(route) {
    const query = normalize(state.query);
    const haystack = normalize([
      route.title,
      route.audience,
      route.goal,
      route.tools.join(" "),
      route.steps.join(" "),
      route.output
    ].join(" "));
    return !query || haystack.includes(query);
  }

  function industryMatches(industry) {
    const query = normalize(state.query);
    const haystack = normalize([
      industry.name,
      industry.keywords.join(" "),
      industry.audience,
      industry.goal,
      industry.tools.join(" "),
      industry.scenarios.join(" "),
      industry.prompts.join(" "),
      industry.risks.join(" ")
    ].join(" "));
    return !query || haystack.includes(query);
  }

  function renderTools() {
    const tools = data.tools.filter(toolMatches);
    els.toolGrid.innerHTML = tools.length
      ? tools.map(renderToolCard).join("")
      : '<div class="empty-state">没有找到匹配的工具。可以换个关键词，或者切换用途和岗位筛选。</div>';
    els.toolCount.textContent = `当前显示 ${tools.length} / ${data.tools.length} 个工具`;

    els.toolGrid.querySelectorAll("[data-tool-id]").forEach((button) => {
      button.addEventListener("click", () => openToolModal(button.dataset.toolId));
    });
    els.toolGrid.querySelectorAll("[data-install-id]").forEach((button) => {
      button.addEventListener("click", () => openInstallGuideModal(button.dataset.installId));
    });
  }

  function renderToolCard(tool) {
    const category = categoryMap.get(tool.category);
    const roles = tool.roles
      .map((role) => `<span>${escapeHtml(roleMap.get(role)?.name || role)}</span>`)
      .join("");

    return `
      <article class="tool-card">
        <div class="card-topline">
          <span class="category-pill">${escapeHtml(category?.name || tool.category)}</span>
          <span class="level-pill">${escapeHtml(tool.pricing.includes("免费") ? "含免费入口" : "需核验")}</span>
        </div>
        <h3>${escapeHtml(tool.name)}</h3>
        <p>${escapeHtml(tool.summary)}</p>
        <div class="role-tags">${roles}</div>
        <div class="card-actions">
          <button class="detail-button" type="button" data-tool-id="${escapeHtml(tool.id)}">查看详情</button>
          <a class="source-link" href="${escapeHtml(tool.url)}" target="_blank" rel="noreferrer">官网</a>
          <button class="source-link" type="button" data-install-id="${escapeHtml(tool.id)}">安装教程</button>
        </div>
      </article>
    `;
  }

  function renderCourses() {
    const tutorials = data.tutorials.filter(tutorialMatches);
    els.courseGrid.innerHTML = tutorials.length
      ? tutorials.map(renderCourseCard).join("")
      : '<div class="empty-state">没有找到匹配的课程。建议切换课程类型或减少关键词。</div>';
    els.tutorialCount.textContent = `当前显示 ${tutorials.length} / ${data.tutorials.length} 篇教程模板`;

    els.courseGrid.querySelectorAll("[data-course-id]").forEach((card) => {
      card.addEventListener("click", () => openCourseModal(card.dataset.courseId));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCourseModal(card.dataset.courseId);
        }
      });
    });
  }

  function renderCourseCard(tutorial) {
    return `
      <article class="course-card course-card-link" role="button" tabindex="0" data-course-id="${escapeHtml(tutorial.id)}">
        <div class="course-meta">
          <span class="type-pill">${escapeHtml(tutorial.type)}</span>
          <span class="level-pill">${escapeHtml(tutorial.level)}</span>
        </div>
        <h3>${escapeHtml(tutorial.title)}</h3>
        <p>${escapeHtml(tutorial.summary)}</p>
        <ul>
          <li>工具：${escapeHtml(tutorial.tools.join("、"))}</li>
          <li>时长：${escapeHtml(tutorial.duration)}</li>
          <li>产出：${escapeHtml(tutorial.steps[tutorial.steps.length - 1])}</li>
        </ul>
        <span class="course-enter">进入学习视频</span>
      </article>
    `;
  }

  function renderRoutes() {
    const routes = data.routes.filter((route) => {
      return (state.role === "all" || route.id === state.role) && routeMatches(route);
    });

    els.routeGrid.innerHTML = routes.length
      ? routes.map(renderRouteCard).join("")
      : '<div class="empty-state">没有找到匹配的岗位路线。可以先清空岗位筛选再看全部路线。</div>';
  }

  function renderRouteCard(route) {
    return `
      <article class="route-card">
        <span class="category-pill">${escapeHtml(route.audience)}</span>
        <h3>${escapeHtml(route.title)}</h3>
        <p>${escapeHtml(route.goal)}</p>
        <ul>
          ${route.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ul>
        <p><strong>推荐工具：</strong>${escapeHtml(route.tools.join("、"))}</p>
        <p><strong>最终产出：</strong>${escapeHtml(route.output)}</p>
      </article>
    `;
  }

  function renderIndustries() {
    const industries = data.industries.filter(industryMatches);
    els.industryGrid.innerHTML = industries.length
      ? industries.map(renderIndustryCard).join("")
      : '<div class="empty-state">没有找到匹配的专业行业。可以试试“电气”“机械”“自动化”“建筑”“财税”等关键词。</div>';
    els.industryCount.textContent = `当前显示 ${industries.length} / ${data.industries.length} 个专业行业场景`;
  }

  function renderIndustryCard(industry) {
    return `
      <article class="industry-card">
        <div class="card-topline">
          <span class="category-pill">${escapeHtml(industry.name)}</span>
          <span class="level-pill">专业核验</span>
        </div>
        <h3>${escapeHtml(industry.audience)}</h3>
        <p>${escapeHtml(industry.goal)}</p>
        <div class="role-tags">
          ${industry.scenarios.slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
        <p><strong>推荐工具：</strong>${escapeHtml(industry.tools.join("、"))}</p>
        <div class="risk-box">
          <strong>必须注意</strong>
          <p>${escapeHtml(industry.risks[0])}</p>
        </div>
      </article>
    `;
  }

  function renderComparisons() {
    els.comparisonBody.innerHTML = data.comparisons
      .map((item) => `
        <tr>
          <td><strong>${escapeHtml(item.title)}</strong></td>
          <td>${escapeHtml(item.keyword)}</td>
          <td>${escapeHtml(item.conclusion)}</td>
        </tr>
      `)
      .join("");
  }

  function openToolModal(toolId) {
    const tool = data.tools.find((item) => item.id === toolId);
    if (!tool) return;

    const category = categoryMap.get(tool.category);
    const roleNames = tool.roles.map((role) => roleMap.get(role)?.name || role);

    els.modalContent.innerHTML = `
      <div class="modal-body">
        <span class="category-pill">${escapeHtml(category?.name || tool.category)}</span>
        <h2 id="modal-title">${escapeHtml(tool.name)}</h2>
        <p class="modal-summary">${escapeHtml(tool.summary)}</p>

        <div class="detail-grid">
          <div>
            <span>官网</span>
            <strong><a href="${escapeHtml(tool.url)}" target="_blank" rel="noreferrer">${escapeHtml(tool.vendor)}</a></strong>
          </div>
          <div>
            <span>是否免费</span>
            <strong>${escapeHtml(tool.pricing)}</strong>
          </div>
          <div>
            <span>注册方式</span>
            <strong>${escapeHtml(tool.signup)}</strong>
          </div>
          <div>
            <span>最后更新</span>
            <strong>${escapeHtml(tool.updatedAt)} · ${escapeHtml(tool.sourceName)}</strong>
          </div>
        </div>

        ${renderDetailSection("适合岗位", roleNames)}
        ${renderDetailSection("使用场景", tool.scenes)}
        ${renderDetailSection("优点", tool.pros)}
        ${renderDetailSection("限制", tool.cons)}
        ${renderDetailSection("替代工具", tool.alternatives)}
      </div>
    `;

    els.modal.hidden = false;
    document.body.classList.add("modal-open");
    els.modal.querySelector(".modal-close").focus();
  }

  function openInstallGuideModal(toolId) {
    const tool = data.tools.find((item) => item.id === toolId);
    if (!tool) return;

    els.modalContent.innerHTML = `
      <div class="modal-body">
        <span class="category-pill">安装教程</span>
        <h2 id="modal-title">${escapeHtml(tool.name)} 安装与注册</h2>
        <p class="modal-summary">按图文步骤先完成账号注册、打开方式和第一次使用。具体按钮名称以官网最新页面为准。</p>
        ${renderInstallGuide(tool)}
      </div>
    `;

    els.modal.hidden = false;
    document.body.classList.add("modal-open");
    els.modal.querySelector(".modal-close").focus();
  }

  function openCourseModal(tutorialId) {
    const tutorial = data.tutorials.find((item) => item.id === tutorialId);
    if (!tutorial) return;

    const audienceNames = tutorial.audience.map((role) => roleMap.get(role)?.name || role);
    els.modalContent.innerHTML = `
      <div class="modal-body course-learning-page">
        <span class="category-pill">学习视频</span>
        <h2 id="modal-title">${escapeHtml(tutorial.title)}</h2>
        <p class="modal-summary">${escapeHtml(tutorial.summary)}</p>

        <div class="course-learning-layout">
          ${renderCourseVideo(tutorial)}
          <aside class="course-study-card">
            <h3>学习信息</h3>
            <dl class="course-info-list">
              <div>
                <dt>课程类型</dt>
                <dd>${escapeHtml(tutorial.type)} · ${escapeHtml(tutorial.level)}</dd>
              </div>
              <div>
                <dt>预计时长</dt>
                <dd>${escapeHtml(tutorial.duration)}</dd>
              </div>
              <div>
                <dt>适合人群</dt>
                <dd>${escapeHtml(audienceNames.join("、"))}</dd>
              </div>
              <div>
                <dt>使用工具</dt>
                <dd>${escapeHtml(tutorial.tools.join("、"))}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section class="course-steps-panel">
          <div class="section-heading compact-heading">
            <div>
              <p class="eyebrow">学习路径</p>
              <h3>跟着视频完成这几步</h3>
            </div>
            <span class="level-pill">更新：${escapeHtml(tutorial.updatedAt)}</span>
          </div>
          <ol class="course-step-list">
            ${tutorial.steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(step)}</p></li>`).join("")}
          </ol>
        </section>
      </div>
    `;

    els.modal.hidden = false;
    document.body.classList.add("modal-open");
    initializeCoursePlayer(tutorial);
    els.modal.querySelector(".modal-close").focus();
  }

  function renderCourseVideo(tutorial) {
    const videoUrl = tutorial.videoUrl || tutorial.localVideoUrl || "";
    const playerId = `course-player-${escapeHtml(tutorial.id)}`;

    if (videoUrl || tutorial.videoFileId) {
      return `
        <div class="course-video-frame has-video">
          <div class="course-player-wrap">
            <video id="${playerId}" class="course-player" controls playsinline preload="metadata" ${tutorial.coverImage ? `poster="${escapeHtml(tutorial.coverImage)}"` : ""}></video>
            <div class="course-player-fallback" id="${playerId}-fallback">
              <strong>${escapeHtml(tutorial.title)}</strong>
              <p>${tutorial.videoFileId ? "正在准备腾讯云点播播放器。" : "已配置学习视频，可直接播放或打开观看。"}</p>
              ${videoUrl ? `<a class="secondary-action" href="${escapeHtml(videoUrl)}" target="_blank" rel="noreferrer">新窗口打开</a>` : ""}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="course-video-frame">
        <div>
          <span class="play-mark" aria-hidden="true">▶</span>
          <strong>${escapeHtml(tutorial.title)}</strong>
          <p>这里预留给创作者视频。后续可在后台给本课程添加真实视频链接，也可以接入创作者投稿审核后的视频。</p>
          <a class="secondary-action" href="#creator-center" data-close-modal>去创作者中心</a>
        </div>
      </div>
    `;
  }

  function initializeCoursePlayer(tutorial) {
    const player = document.getElementById(`course-player-${tutorial.id}`);
    if (!player) return;

    const videoUrl = tutorial.videoUrl || tutorial.localVideoUrl || "";
    const fallback = document.getElementById(`course-player-${tutorial.id}-fallback`);

    if (videoUrl) {
      player.src = videoUrl;
      if (fallback) fallback.hidden = true;
      return;
    }

    if (tutorial.videoFileId && tutorial.videoAppId && window.TCPlayer) {
      const config = window.AI_RESOURCE_CLOUD_CONFIG || {};
      window.TCPlayer(player.id, {
        fileID: tutorial.videoFileId,
        appID: tutorial.videoAppId,
        licenseUrl: config.vod?.playerLicenseUrl || undefined
      });
      if (fallback) fallback.hidden = true;
      return;
    }

    if (fallback) {
      fallback.hidden = false;
      fallback.innerHTML = `
        <strong>${escapeHtml(tutorial.title)}</strong>
        <p>已保存腾讯云点播 FileId：${escapeHtml(tutorial.videoFileId || "未配置")}。配置 TCPlayer 后即可在线播放。</p>
      `;
    }
  }

  function renderInstallGuide(tool) {
    const access = getAccessMethod(tool);
    const firstTask = getFirstTask(tool);
    const safety = getSafetyNote(tool);

    return `
      <section class="install-guide-section" id="install-guide-${escapeHtml(tool.id)}">
        <div class="section-heading compact-heading">
          <div>
            <p class="eyebrow">安装教程</p>
            <h3>${escapeHtml(tool.name)} 新手四步</h3>
          </div>
        </div>
        <div class="modal-guide-grid">
          <article class="modal-guide-card">
            <img src="assets/guide-register.png" alt="${escapeHtml(tool.name)} 注册教程">
            <div>
              <span class="type-pill">01 注册</span>
              <h4>账号注册</h4>
              <p>${escapeHtml(tool.signup)}</p>
            </div>
          </article>
          <article class="modal-guide-card">
            <img src="assets/guide-install.png" alt="${escapeHtml(tool.name)} 安装或打开教程">
            <div>
              <span class="type-pill">02 打开</span>
              <h4>安装或访问</h4>
              <p>${escapeHtml(access)}</p>
            </div>
          </article>
          <article class="modal-guide-card">
            <img src="assets/guide-use.png" alt="${escapeHtml(tool.name)} 使用教程">
            <div>
              <span class="type-pill">03 使用</span>
              <h4>第一次使用</h4>
              <p>${escapeHtml(firstTask)}</p>
            </div>
          </article>
          <article class="modal-guide-card">
            <img src="assets/guide-remote-help.png" alt="${escapeHtml(tool.name)} 远程帮助">
            <div>
              <span class="type-pill">04 帮助</span>
              <h4>远程协助</h4>
              <p>${escapeHtml(safety)}</p>
            </div>
          </article>
        </div>
      </section>
    `;
  }

  function getAccessMethod(tool) {
    const category = tool.category;
    if (category === "coding") return "按官网下载安装桌面客户端或编辑器插件，登录后先打开一个测试项目。";
    if (category === "video" || category === "image" || category === "audio") return "优先使用官网网页版；如果官网提供客户端或App，再按系统选择安装。";
    if (category === "automation") return "先用官网网页版创建工作区，后续再连接表格、知识库或业务工具。";
    return "优先打开官网网页版完成登录；需要插件或客户端时，再按官网提示安装。";
  }

  function getFirstTask(tool) {
    const scene = tool.scenes[0] || "输入一个简单任务，观察输出结果";
    return `先用“${scene}”做一次测试，再保存好可复用提示词模板。`;
  }

  function getSafetyNote(tool) {
    if (tool.category === "coding") return "不会配置环境或运行报错时，可在社区发帖，后续接入远程协助带你检查项目。";
    if (tool.category === "automation") return "连接账号和业务数据前先做测试流程，后续远程帮助可协助检查权限和触发条件。";
    return "如果注册、付费、安装或页面找不到入口，可先到社区提问，后续可预约远程帮助。";
  }

  function renderDetailSection(title, items) {
    return `
      <section class="detail-section">
        <h3>${escapeHtml(title)}</h3>
        <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function renderStats() {
    els.statTools.textContent = data.tools.length;
    els.statRoutes.textContent = data.routes.length;
    els.statTutorials.textContent = data.tutorials.length;
    els.goalTools.textContent = `${data.tools.length} / ${data.goals.tools}`;
    els.goalRoutes.textContent = `${data.routes.length} / ${data.goals.routes}`;
    els.goalTutorials.textContent = `${data.tutorials.length} / ${data.goals.tutorials}`;
  }

  function renderAll() {
    renderFilters();
    renderTools();
    renderCourses();
    renderRoutes();
    renderIndustries();
  }

  function toCsvValue(value) {
    const safe = String(value || "").replace(/"/g, '""');
    return `"${safe}"`;
  }

  function downloadToolsCsv() {
    const headers = [
      "工具名称",
      "官网链接",
      "注册方式",
      "是否免费",
      "适合岗位",
      "主要场景",
      "优点",
      "限制",
      "替代工具",
      "最后更新时间",
      "信息来源"
    ];

    const rows = data.tools.map((tool) => [
      tool.name,
      tool.url,
      tool.signup,
      tool.pricing,
      tool.roles.map((role) => roleMap.get(role)?.name || role).join("、"),
      tool.scenes.join("、"),
      tool.pros.join("、"),
      tool.cons.join("、"),
      tool.alternatives.join("、"),
      tool.updatedAt,
      tool.sourceName
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AI工具资源表.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("已生成工具表格，可继续补充字段和截图。");
  }

  async function copyUpdateTemplate() {
    try {
      await navigator.clipboard.writeText(data.updateTemplate);
      setStatus("已复制更新模板。");
    } catch (error) {
      setStatus("浏览器未开放剪贴板权限，模板在维护说明里也有。");
    }
  }

  function setStatus(message) {
    els.actionStatus.textContent = message;
    window.setTimeout(() => {
      if (els.actionStatus.textContent === message) {
        els.actionStatus.textContent = "";
      }
    }, 3600);
  }

  function bindEvents() {
    els.search.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderAll();
    });

    els.clearSearch.addEventListener("click", () => {
      state.query = "";
      els.search.value = "";
      renderAll();
      els.search.focus();
    });

    els.modal.addEventListener("click", (event) => {
      if (event.target.matches("[data-close-modal]")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.modal.hidden) {
        closeModal();
      }
    });

    els.downloadCsv.addEventListener("click", downloadToolsCsv);
    els.copyTemplate.addEventListener("click", copyUpdateTemplate);
  }

  renderStats();
  renderComparisons();
  bindEvents();
  renderAll();
})();
