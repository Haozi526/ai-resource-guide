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
    els.modal.querySelector(".modal-close").focus();
  }

  function renderCourseVideo(tutorial) {
    const videoUrl = tutorial.videoUrl || "";
    if (videoUrl) {
      return `
        <div class="course-video-frame has-video">
          <div>
            <span class="play-mark" aria-hidden="true">▶</span>
            <strong>${escapeHtml(tutorial.title)}</strong>
            <p>已配置学习视频链接，点击下方按钮打开观看。</p>
            <a class="primary-action" href="${escapeHtml(videoUrl)}" target="_blank" rel="noreferrer">打开学习视频</a>
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
            <img src="data:image/png;base64,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l13R3LzuwJs56+mMjAQA6D8BXScGDhgQQljY+WrIjCGDh1x20cVvf374sGGjR7Wt+yTQ1ZWFkQAAUQR0yhK5DPN7dxi9+05j1/asvXfmY+nuyfqam5tbBmxkjVCxu7tzyZIQwk47tmdhJABAFGugc2zggJbtt97mkN32/NxHP9EUmi65fXph8R9D5t197z0rV60MIXx0whFZHgkAsFECOpc+f+Rxnz/yr/v++IvZT97w87t/t+DlkHnzFy644OJvhBC23Xqbs888K7MjAQA2xRKOXFpd7OpcvnTpqpU9PT0hhMN33+fvT5x8wPh1V7LLss4lnRNPO6VzSefAlpYbrrlu5IiR2RwJALAZZqBzafov75v+y/veuifIgHGjdvzkgYd96sDDvvuF8755x80zHrw/ZFLnks7jTp7Y8dKLLQNavn/15i4hl+5IAIDNMwOdb2+uXfv8/Jf/v1tv/N7PfhJC+OLHT9wyY1eyK1m9evUJkyc9P+eFt/r12mOOPCqbIwEA3pGArhM/efzBEMKgga3v23HnkD0XX37p7OeeDSFcednlHz/q6MyOBAB4RwK6TvT09pYedL/5ZsiYYrE447ZbQwgTPnzYySdMzOxIAID+ENA5s8WgwRt9/tgPHhJCWNNdLN2SMFMKC+aXrhx3+IcOy/JIAID+ENApm3XV9KjxB++6xw/O+drhe+xbumt3U1PTjiPefd5xnzn76E+VTi5ctaarNnvSf62traUHXe908790RwIA9IercOTPvrvsuu8uu/b29q7oWj24tXXgn++3d8tDD3z3p3eG7Bk9qm2roUOXLV/+0KOPTD37nMyOBADoDwGdM4/Nee7yO27+yAf2a9t25NZbbtXT01NY8sen53b8+LFfzX759yGTmpub587+XfZHAgD0h4DOmRVdq3/04P0/yurFngEA6p410Omr3uLj7OzDb558YsqXp157w/WlWydmdiQAwDsyA03VLV+x/MTJk0qXwhg6dOgpE0/K5kgAgP4wA50J6U5CV/vdly1fXurXEMKiRYsyOxIAoD8ENFXXtsOo88790tAth+6/z75nnDo5syMBAPqjqbu4KmTJ3AWF0oP2hdNChhXapoQQxo0Zn+Br7jV1cmOuwAYAaq9j3py8FFcIYezo9pAZZqAzpPYtq54BAGIJ6GypZdGqZwCAMghoAACIIKAzpzYTw6af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" alt="${escapeHtml(tool.name)} 注册教程">
            <div>
              <span class="type-pill">01 注册</span>
              <h4>账号注册</h4>
              <p>${escapeHtml(tool.signup)}</p>
            </div>
          </article>
          <article class="modal-guide-card">
            <img src="data:image/png;base64,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" alt="${escapeHtml(tool.name)} 安装或打开教程">
            <div>
              <span class="type-pill">02 打开</span>
              <h4>安装或访问</h4>
              <p>${escapeHtml(access)}</p>
            </div>
          </article>
          <article class="modal-guide-card">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAALQCAIAAADQFY7jAAAvEklEQVR4nO3dC5ScVYHg8duPdKcDTZKG8EjSHRIlQVzUMcNj8RVFR+Cgsw5CBhZ5HBBXZR1cHzuyo2B2NCIrzi4OrBFHPMPhEBRnXGYQPc5rGZwBjSC4QhpNTLohhNBNSCed7uqke08opycT8uhb9VXV/ap+v8M5VnduVX9pPtp/3b7f/ZrGCsMBAACYmuYpjgMAAAQ0AADEMQMNAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARWkMjWde/sdaHAABQnxbN7wmNoWmsMBzql2IGAKiJRfXb0/UZ0LoZACARi+qupOstoA+ezt1d7VU8FgCABtI3ONogGV0/AX2gdBbNAACJxPSiusjoegjo/aazbgYASLOkF+U8o3Mf0PvUs24GAEi/pBfluaHzvQ+0egYAyIXuf3spWq63fMjrDLR0BgDIo778T0XncgZaPQMA5FR3/qei8zcDvfd32YpnAIA6mIpelKt56JzNQKtnAID60L3XVHS+5qHzFNDqGQCgnnTns6FzE9DqGQCg/nTnsKFzE9CTrHsGAKgn3f/2ssL05SOgJ9+O5O77CwDAIU02Xi4moXMQ0Ln4PgIA0CDtl3pAW/oMANAIuvOzGDr1gJ5k8QYAQH3rzsli3aQDOvE3HwAANGAHJh3QuXs7AgBA3VdfugFt5w0AgAbUnfyOHOkGNAAAJCjRgE72DQcAAA3ehIkGdL7WwQAA0DgFmHpAAwBAUlIM6DTn6gEAqL4EyzDFgM7L7D0AAA3YgUkHNAAApEZAAwBABAENAAB5Dmg3IAQAICR8S8LkAhoAAFImoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIEJrzGD29fhV5/mmAAB5dPKqe2p9CHkloKOJZgCgzpJGTEcR0BGkMwBQx5Ejo6dIQE+JdAYA6p6MniIXER6aegYAGofyOSQz0E4gAID9NLQVHQdiBvqAvP0CABqZFjoQAb1/zhgAAEW0XwJ6P5wrAAC66EAE9L7UMwCAOjoIAQ0AABEE9L9h+hkA4OU00t4E9L9yZgAAHIhSmiSgAQAggoD+DW+qAAAOTi8VCWgAAIggoPfwdgoAYCoef+ku3w1OQAMAQAQBDQAAEQQ0AABEENCW8gAARHi84ZdBC2gAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACK0xg8neEa/+7Vm/veyIVy9t6zqmZcZhu3cMjT6/aXvvYwP/eP/2px6v76cDAORR01hhOKRkXf/G4oPurvbqfMXHrzov1MLM15w2/8KrD1t00oEGbPv5w+tu/Wzh+Wfr7+kAQK6dvOqe6nyhvsHR4oNF83tCMgR0DQK6aVrbgss+fvTbD/11dw1tfeL69+/sX1c3TwcA6sDJjR3QlnDUQPuRx+wdoGMvPL9j/ROF559tap024/jFe0/rtnbOWvxf/+Tx//Le8bFCfTwdACDvBHQt7ez7Vd+dN7/46IMT4+OTn5xx/JJFH7p+xoLFxQ/bj5539DsvePav7qizpwMA5JRdOGpm8/fv/vmnLt760wf2DtAQwvCv1z7x2atGNz89+Zmu099eZ08HAMgvAV0bm79314Y/u2HiAGsbdu8YeuYvvj754YyeE+rp6QAAuSaga2D0+Wc3fPN/HHzM0NpHJx83t09vbmuvj6cDAOSdNdA1MLFr7NCD9loaMT5WGC+M1sfTAQDyzgx0ojq6XzH5eOTp9Q31dACAlAnoRB35xrMnH29d80BDPR0AIGUCOkWdJy3tOu3M4uOJXWNb/u4vG+fpAACJE9DJaZ8z95V/sDI0NRU/7L/7f49u2dQgTwcASJ+ATsu0WUcu+W9fmTbryOKHLzz8t5v+zzcb5OkAALkgoBPSNnvOqz6zavpxC4ofDv1iza9u/qMwMdEITwcAyAvb2KWi/Zh5J/7Rre1Hzyt+OPTET9d+4Q+mvgFcrp8OAJAjAjoJbUcec+Knv9o+57jih4MP/c2vbv6jA93qr86eDgCQLwK69ppaWk74+P+YDNCBf/zeuj/9zMRe9yKp46cDAOSONdC1d9Rb3nXYopOKj4eefGTdLddFBWiunw4AkDsCuvb2vu3Ixm9+aWL37sZ5OgBA7gjo2uuYt7D4YNf2bTvWPdFQTwcAyB0BnZCJXWMN+3QAgLwQ0LVXGHyu+GDarCNbDz+ioZ4OAJA7Arr2hp746eTjI99wVkM9HQAgd5rGCsMhJev6NxYfdHe1V+crPn7VedX5QgAA9eHkVfdU5wv1Df7mvmyL5veEZJiBBgCACAIaAAAiCGgAAIjgVt5JmDaz64iTT921fWjbY/9Uwp38cv10AIB8EdC1d/gJJy/51M0th3UWN7V48o8/FLWncq6fDgCQO5Zw1F7PpR8rBmgIofNVr5/ztt9tnKcDAOSOgK69tqOO3fvD9jlzG+fpAAC5I6Brb+uaB/71g4mJrY882DhPBwDIHWuga6/vz7/c1Nw8+5S3jhdGnv7WV4d+saZxng4AkDvuROhOhAAAcU52J0IAAGCKrIEGAIAIAhoAACIIaAAAiCCgAQAggoAGAIAIAhoAACIIaAAAiCCgq7cTOABAHTi54dtJQAMAQITWmMFkpmXG4Ue//bzZp72tY/6iEMLo5v6BB+7bfP/q8bFC1QaUdmC1+usAACSiaawwHFKyrn9j8UF3V3vVvujjV50XqmvB5Z885qzl46M7dz6zoXXG4e3HzA8hbO/92RPXXTkxPl6dAaUdWK3+OgBAAy7h6BscLT5YNL8nJMMM9B4nr7qnyg09PlbYcPuNW374neIM68zXnHbCJ//k8MWvnX3q2wb/+YfVGVDagdXqrwMApODkhl8A7SLCmnn67ls3f++uyfUJLz720AsvZWJH9yuqNqC0A6vVXwcAIBEuIqzN26nxwm9+H/Gvmvb8uxh7cbBqA0o7sFr9dQCAmjP9XCSgk9B+zLzZp7xlfKyw9cd/X6sB1XxWhY4WAKAKBHTt31S1zZ6z5FM3N7d3/Pq2zxde2FKTAaUdWK3+OgBA9Zl+niSga3xmTJt91InXrZp+bM+Gb3zx+b+/tyYDSjuwWv11AIDqU897swtHLTW1tC7+5J9MP67n119f+dwPvl2TAaUdWK3+OgAANWcGupZvsGYtffNhi141+NDfHCgWqzCgms+q0NECABVl+nkfArqWZ0n70XNDCDueeryGA6r5rAodLQBQOer55QR0Lc+VwpZNe7Y6nv+KGg6o5rMqdLQAQIWo5/1yK++0bvENAJCIFOq5z628c3reyGgAoKGkkM4ps4SjludQS8eM46/4w/kXfDA0NdVqQDWfVaGjBQAypJ4PyTZ2tZyKPvJN5xz9O+eHEF587J+Gnny0JgNKO7Ba/XUAgMqRzlMkoGuZ0UP/b03h+Wd3DW8f7vtVrQZU81kVOloAoEzSOYqLCMtieTQAkFO5iOY+FxHWn1yceQAAZMhFhAAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBABAENAAARBDQAAEQQ0AAAEEFAAwBAhNaYwZSib3DUNw4AqKburnbf8MoR0JWimwGAmneIkq4EAV3xdF68cEkFvggAwAH1rl+7d5bI6GwJ6ArWs3QGAGqiGCF7Z7SGzpCArkg9S2cAIKmM1tAZEtAZ17N0BgDSzGgNnRXb2GVDPQMA6We0TQ4yIaAzoJ4BgPRp6KwI6HKpZwAgLzR0JgR0WfweBADIIw1TDgGdARcOAgB5oVvKJ6BL560bAJBfSqZkArpc3sYBAPmiXsokoAEAIIKALpHNNwCA/LIdRzkENAAARHAr77x6ePnSA/3RqavXVPdYAAAaiICuk2g+0DAxDQCQLQFdV+l8oCfKaACArAjouk3nl7+IjAYAKJ+LCOu/niv0agAAjUlAp6sSvauhAQDKZAlHiiqauZZzAACUwwx0cqozSWwqGgCgNAIaAAAiCOi0VHNi2CQ0AEAJBHRCql+0GhoAIJaATkWtWlZDAwBEEdAAABBBQCeh5GngppbW7ouvWfrNB2ry1aeiUCisuv3Pzj7vdxee/Kp5J77it5e94Zo//MQv1j6Z2kgAgClqGisMh5Ss699YfNDd1R4S1jc4GkJYvHBJJq9WWsLOfM3pCy77xPR5x4+P7vzJJW8s5wAqdJfvn/7s0Suv/uDG/r59Pt/a0vq5z1x/xSWXJTISABpQ7/q1eSmuEMKi+T0hGQK69gEdW8/N7R2zT1l2zNm/f/gr/13xM+UHdCUaemRkZNFrTyoUCrNnzXr3Oece39Pz3JYt9/3g+xv69rxHampq+s4dd73pjDfUfCQANCYBXTJ3Isyfuf/h8rm/d0UIYeyF5wcf+ptjzloekrR7fHehULjwvRd8ccXnOjo6ip/89Cc/9YFrrr73e/dNTEx8ZdWtxYSt7UgAgCjWQOfS2NaB/rtvfeyj79n284dDwi6/+JKbb7xpsl9DCG1tbV9eeWNz854Tb82jjyQyEgBg6gR0/my+/65H/tNZz9xz2+6daa1f30fH9I6V1694+ednzZw5f+68EMLOkZEURgIARBHQNVbC5YNjLw6GifEUjuTgmpubW1v2s0aoMDY2MDgYQljQ3ZPCSACAKAKaarv3vr/eMbwjhPDOM9+R8kgAgP0S0FRV39P91664LoRw5OyuD135/mRHAgAciICmegYGB5Zf9r6BwYFpra23feXWOUfNSXMkAMBBCGiqZGBw4D0XLe/95VOtLa1fu/lgW8jVdiQAwMEJaKph586d51968S/WPvlSv95y7llnpzkSAOCQBDTVsOKGzz/288dDCDetvOFdZ5+T7EgAgEMS0FRcoVC481t3hxDOfMuyi85fnuxIAICpENBU3Mb+vuLOcW9987KURwIATIWArrFTV68J9X4kbW1txQcjh7r5X21HAgBMhYCm4ubPnXdEZ2cI4YEfPZjySACAqdjPvY4hW83NzeseeyL9kQAAUyGg8+2FH//9w8uX1vooAAAaiCUctZfCMuhKH8NDP/nxhz92zS23rRofH095JADAIZmBpuKGtg9dcOnFxa0wOjs737f8wjRHAgBMhRnoJNR2ErrSX33b0FCxX0MImzZtSnYkAMBUCGgqbt5xcz/xkY92Ht55yuuXXnHJpcmOBACYiqaxwnBIybr+jcUH3V3tIWF9g6MhhMULl2T4mjW5HDCFFdgAQPX1rl+bl+IKISya3xOSYQY6IdVvWfUMABBLQKelmkWrngEASiCgAQAggoBOTnUmhk0/AwCUxj7QKSrWbYWuKZTOAADlMAOdrkqUrnoGACiTgE5atr2rngEAymcJR0Ms55DOAABZEdB1ntHSGQAgWwI6T/au4YPEtGgGAKgcAZ1XKhkAoCZcRAgAABEEdIm6u9pDCL3r15b6AgAANVNsmGLPEEtAAwBABAFdLpPQAEC+qJcyCejS+a0HAJBfSqZkAjoD3sYBAHmhW8onoMvirRsAkEcaphwCuly24wAA8sLmG5kQ0BnQ0ABA+tRzVgR0NjQ0AJAy9Zwht/LOTHdXe9/gaPHsXLxwSXYvDACQwVWD1j1nRUBn39CTZ6qMBgAS2XBDPWdIQFeqoWU0AJDIXnXqOVsCOnvFc3SfjAYAqD7pXAkCuuLn62RJAwBUh26uKAFdcc5gAIB6Yhs7AACIIKABACCCgAYAgAgCGgAAIghoAACIIKABACCCgAYAgAgCGgAAIghoAACIIKABACCCgAYAgAgCGgAAIghoAACIIKABACCCgAYAgAgCGgAAIghoAACIIKABACBCa8xgStE3OOobBwBUU3dXu2945QjoStHNAEDNO0RJV4KArng6L164pAJfBADggHrXr907S2R0tgR0BetZOgMANVGMkL0zWkNnSEBXpJ6lMwCQVEZr6AwJ6IzrWToDAGlmtIbOim3ssqGeAYD0M9omB5kQ0BlQzwBA+jR0VgR0udQzAJAXGjoTArosfg8CAOSRhimHgM6ACwcBgLzQLeUT0KXz1g0AyC8lUzIBXS5v4wCAfFEvZRLQAAAQQUCXyOYbAEB+2Y6jHAIaAAAiuJV3Xj28fOmB/ujU1WuqeywAAA1EQNdJNB9omJgGAMiWgK6rdD7QE2U0AEBWBHTdpvPLX0RGAwCUz0WE9V/PFXo1AIDGJKDTVYne1dAAAGWyhCNFFc1cyzkAAMphBjo51ZkkNhUNAFAaAQ0AABEEdFqqOTFsEhoAoAQCOiHVL1oNDQAQS0CnolYtq6EBAKIIaAAAiGAbuyTETgNPP27BsedePPPk06Z1zZnYvWvkmV8P/vPfbL7/rvHRkdK+euVuUlgoFG6/846/uPe7T/b2FsYKxx177BtPP+Oqy684acmJSY0EAJiiprHCcEjJuv6NxQfdXe0hYX2DoyGExQuXVD+g55z5nuOv+MOmlj1vfsZHdza3dxQ/v/Pp9U+u+MDY1oESDqBCAf3Tnz165dUf3Njft8/nW1taP/eZ66+45LJERgJAA+pdvzYvxRVCWDS/JyRDQNc+oGOnn1/7v77b0nHY0/fcNvDg/buGtrZ0HHbkm87u/o9/0DJ9xtZHHuz9wkdKO4zMG3pkZGTRa08qFAqzZ8169znnHt/T89yWLff94Psb+va8R2pqavrOHXe96Yw31HwkADQmAV0ySzjyZ+iJRzbe8eVdQy8WP9y9c8dzP/j2xK5dCz/w6VmvO2Pa7KPGXng+JGD3+O5CoXDhey/44orPdXT8Zpr805/81Aeuufre7903MTHxlVW3FhO2tiMBAKK4iDB/1v3vFZP1POmFn/zDnv9papp+zPyQjMsvvuTmG2+a7NcQQltb25dX3tjcvOfEW/PoI4mMBACYOgGdQxPjB/nDXduHQho6pnesvH7Fyz8/a+bM+XPn7Vm0PTKSwkgAgCgCusay2oa588Tf2pPWu8ZGtzxd2yOZ1Nzc3PrSlY77KIyNDQwOhhAWdPekMBIAIIqArgfN09rmnf+BEMLAP95f2k521XTvfX+9Y3hHCOGdZ74j5ZEAAPsloHOvub3jhI9/aUbPK3ft2Pb0t78a0tb3dP+1K64LIRw5u+tDV74/2ZEAAAdiF45865i38JUfvaGj+xW7tm/rXfmfR7dsCgkbGBxYftn7BgYHprW23vaVW+ccNSfNkQAAByGgc+zo3zm/5+JrmtunD/967S+//F9Hnt33jiFJGRgceM9Fy3t/+VRrS+vXbj7YFnK1HQkAcHACOpea26cv+tBnu05/+8T4+DN/+Y2nv/XViV1jIWE7d+48/9KLf7H2yZf69ZZzzzo7zZEAAIckoPOneVrbkmv/tPPE1xWef/aX//Pa7b0/C8lbccPnH/v54yGEm1be8K6zz0l2JADAIQno/Om57BOdJ75ueEPvk3/8oV3bXgjJKxQKd37r7hDCmW9ZdtH5y5MdCQAwFXbhyJnpxy04+sz/MDE+/tSXPp6Leg4hbOzvK+4c99Y3L0t5JADAVAjoGjt19Zqo8bN+6w2hqXlk04ZdL77QMn3Gy/9pbmuvzpFMXVtbW/HByKFu/lfbkQAAUyGgc6Ztztzi7nVLv/nAfv856Y9vD4mZP3feEZ2dIYQHfvRgyiMBAKbCGuicaZneEfKmubl53WNPpD8SAGAqBHTOrP/qf1//1f9e66MAAGhclnDUXuUWH6dzDA/95Mcf/tg1t9y2anx8POWRAACHZAaaihvaPnTBpRcXt8Lo7Ox83/IL0xwJADAVZqCTUNtJ6Ep/9W1DQ8V+DSFs2rQp2ZEAAFMhoKm4ecfN/cRHPtp5eOcpr196xSWXJjsSAGAqmsYKwyEl6/o3Fh90d5W4n3F19A2OhhAWL1yS4Ws+vHxpaMgV2ABA9fWuX5uX4gohLJrfE5JhBjoh1W9Z9QwAEEtAp6WaRaueAQBKIKABACCCgE5OdSaGTT8DAJTGPtApKtZtha4plM4AAOUwA52uSpSuegYAKJOATlq2vaueAQDKZwlHQyznkM4AAFkR0HWe0dIZACBbAjpP9q7hg8S0aAYAqBwBnVcqGQCgJlxECAAAEQR0ibq72kMIvevXlvoCAAA1U2yYYs8QS0ADAEAEAV0uk9AAQL6olzIJ6NL5rQcAkF9KpmQCOgPexgEAeaFbyiegy+KtGwCQRxqmHAK6XLbjAADywuYbmRDQGdDQAED61HNWBHQ2NDQAkDL1nCG38s5Md1d73+Bo8excvHBJdi8MAJDBVYPWPWdFQGff0JNnqowGABLZcEM9Z0hAV6qhZTQAkMhedeo5WwI6e8VzdJ+MBgCoPulcCQK64ufrZEkDAFSHbq4oAV1xzmAAgHpiGzsAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIIKABgCACAIaAAAiCGgAAIggoAEAIEJrzGBK0Tc46hsHAFRTd1e7b3jlCOhK0c0AQM07RElXgoCueDovXrikAl8EAOCAetev3TtLZHS2BHQF61k6AwA1UYyQvTNaQ2dIQFeknqUzAJBURmvoDAnojOtZOgMAaWa0hs6KbeyyoZ4BgPQz2iYHmRDQGVDPAED6NHRWBHS51DMAkBcaOhMCuix+DwIA5JGGKYeAzoALBwGAvNAt5RPQpfPWDQDILyVTMgFdLm/jAIB8US9lEtAAABBBQJfI5hsAQH7ZjqMcAhoAACK4lXdePbx86YH+6NTVa6p7LAAADURA10k0H2iYmAYAyJaArqt0PtATZTQAQFYEdN2m88tfREYDAJTPRYT1X88VejUAgMYkoNNVid7V0AAAZbKEI0UVzVzLOQAAymEGOjnVmSQ2FQ0AUBoBDQAAEQR0Wqo5MWwSGgCgBAI6IdUvWg0NABBLQKeiVi2roQEAoghoAACIYBu7JERNA7d0HDbnzPfMPmVZx/xXtHQctnt4aMev/t/m+1dvfeTBkr965W5SWCgUbr/zjr+497tP9vYWxgrHHXvsG08/46rLrzhpyYlJjQQAmKKmscJwSMm6/o3FB91d7SFhfYOjIYTFC5dUP6AXfvC6OcveHULYPTLc3NLaNK2t+PlN3729786bSzuACgX0T3/26JVXf3Bjf98+n29taf3cZ66/4pLLEhkJAA2od/3avBRXCGHR/J6QDAFd+4COXYW88Ko/2rVj6Lkf3jO6uT80NXXMW9hz6cdmvub0EMKTn71q2y/WJNLQIyMji157UqFQmD1r1rvPOff4np7ntmy57wff39C35z1SU1PTd+64601nvKHmIwGgMQnokgno/AV0c3vH+OjOvT/T0nHYa//0r1oPO2Lz/as3fOOLiQT0juEdC1695ML3XvDFFZ/r6OgofrJQKHzgmqvv/d59IYQz37Js9e131HwkADQmAV0yFxHmzz71vGctx84dwxue2lPSMw4LKbn84ktuvvGmyX4NIbS1tX155Y3NzXtOvDWPPpLISACAqRPQdaK5dc/1oKObnw7J6JjesfL6FS///KyZM+fPnRdC2DkyksJIAIAoArrGMtmGeUbPKw97xb+b2L174MH7a3ske2tubm5t2c82L4WxsYHBwRDCgu6eFEYCAESxjV2ONbVOazvymFm/9cZ5731/aGra8PWVI5t+s4dJyu697693DO8IIbzzzHekPBIAYL8EdC7NO/8D89571eSHLzz8t8985+s71j8Zktf3dP+1K64LIRw5u+tDV74/2ZEAAAdiCUcujY8Mj704uGv7tonx8T3ren972fFXXjvzNaeFtA0MDiy/7H0DgwPTWltv+8qtc46ak+ZIAICDMAOdS5vu/fNN9/75nlUcLa0zFpww58z3HH3m7y35b7dsuP3Gzd+7KyRpYHDgPRct7/3lU60trV+7+daD7MFc25EAAAdnBjrfJnbv2rHuiV9/7fNPf3vVnpsJXfSRlhmHh/Ts3Lnz/Esv/sXaJ1/q11vOPevsNEcCABySgK4TW/7uu3v+dba1H7bwxJCeFTd8/rGfPx5CuGnlDe86+5xkRwIAHJKArhcTE8X/Hd81FhJTKBTu/NbdxZv/XXT+8mRHAgBMhYDOmZbpM/b7+aPecu6eei6M7nzploRJ2djfV9w57q1vXpbySACAqRDQNXbq6jVR42e+7oxXXbdq9inLWjpeumt3U1P7MfN7Lv34/OUfDCE8e++f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" alt="${escapeHtml(tool.name)} 使用教程">
            <div>
              <span class="type-pill">03 使用</span>
              <h4>第一次使用</h4>
              <p>${escapeHtml(firstTask)}</p>
            </div>
          </article>
          <article class="modal-guide-card">
            <img src="data:image/png;base64,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w3rOWUBraACAhlHIZz2HEFqGigMhb5at6Nv6y56uzvqdCwAAFS16zlc9528Gepu/5dwtPAcAaFqFnNdzXmegh5mKBgDIi0L+0znHM9DDTEUDAORCoVHqOfcz0Nuchy6xMBoAoO4K21pqm+t6bpCA3kFGK2kAgNorbOcStbync6MF9I4zusS0NABAlRR2uK9DY6RzYwb0SDIaAICamdFA6dzIAT1MSQMA1MWMhuvmZgnol9DTAABVMqNxi7mpAxoAAJp6H2gAAKgxAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AABEENAAARBDQAAAQQUADAEAEAQ0AAGHk/i+CGU3+0rIs5wAAAABJRU5ErkJggg==" alt="${escapeHtml(tool.name)} 远程帮助">
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

