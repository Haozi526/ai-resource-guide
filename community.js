(function () {
  const storageKeys = {
    user: "aiResourceCommunityUser",
    posts: "aiResourceCommunityPosts",
    videos: "aiResourceCommunityVideos"
  };

  const defaultPosts = [
    {
      id: "post-1",
      title: "刚入门AI，学生写论文应该先学哪个工具？",
      tag: "新手提问",
      author: "小林",
      role: "学生",
      body: "我想用AI帮忙找资料、整理文献和生成提纲，但不想直接复制。有没有适合新手的学习顺序？",
      createdAt: "2026-06-02",
      tips: 18,
      comments: [
        { author: "资料整理员", role: "职场", body: "建议先用AI搜索找资料线索，再用长文本工具整理摘要，最后自己改提纲和引用。" },
        { author: "AI课代表", role: "创作者", body: "先学提示词公式：角色、任务、材料、标准。这个比纠结工具更重要。" }
      ]
    },
    {
      id: "post-2",
      title: "电商详情页文案，豆包和通义千问哪个更适合？",
      tag: "工具选择",
      author: "南风电商",
      role: "电商",
      body: "主要做淘宝和小红书素材，想批量生成标题、卖点、详情页模块和短视频脚本。",
      createdAt: "2026-06-02",
      tips: 36,
      comments: [
        { author: "运营阿舟", role: "运营", body: "可以两个都用：一个产出卖点方向，一个做标题组合，再人工筛选。" }
      ]
    },
    {
      id: "post-3",
      title: "有没有适合职场人的AI周报模板？",
      tag: "岗位用法",
      author: "周报困难户",
      role: "职场",
      body: "每周工作很多但写出来很散，想让AI帮我整理成果、问题和下周计划。",
      createdAt: "2026-06-02",
      tips: 12,
      comments: [
        { author: "效率教练", role: "创作者", body: "把工作记录按项目、结果、数据、风险四列整理，再让AI转成报告。" }
      ]
    }
  ];

  const defaultVideos = [
    {
      id: "video-1",
      title: "15分钟学会用AI做电商详情页",
      creator: "南风电商",
      audience: "电商",
      tool: "豆包 + Canva AI",
      description: "从商品卖点、标题组合、详情页结构到活动海报，一次跑完整个流程。",
      url: "",
      status: "已发布",
      createdAt: "2026-06-02",
      views: 268,
      tips: 88,
      likes: 126
    },
    {
      id: "video-2",
      title: "学生论文资料整理工作流",
      creator: "AI课代表",
      audience: "学生",
      tool: "Kimi + Perplexity",
      description: "演示如何检索资料线索、整理文献摘要、生成提纲，并保留人工核验步骤。",
      url: "",
      status: "已发布",
      createdAt: "2026-06-02",
      views: 196,
      tips: 66,
      likes: 94
    },
    {
      id: "video-3",
      title: "用Cursor读懂一个前端项目",
      creator: "代码讲师",
      audience: "程序员",
      tool: "Cursor + DeepSeek",
      description: "适合刚开始用AI编程的人，重点讲怎么限定改动范围和检查AI生成代码。",
      url: "",
      status: "已发布",
      createdAt: "2026-06-02",
      views: 322,
      tips: 108,
      likes: 151
    }
  ];

  const state = {
    activeTab: "questions",
    user: load(storageKeys.user, null),
    posts: load(storageKeys.posts, defaultPosts),
    videos: load(storageKeys.videos, defaultVideos)
  };

  const els = {
    memberCard: document.getElementById("member-card"),
    communityStats: document.getElementById("community-stats"),
    communityStatus: document.getElementById("community-status"),
    feed: document.getElementById("community-feed"),
    videoGrid: document.getElementById("video-grid"),
    creatorDashboard: document.getElementById("creator-dashboard"),
    creatorSubmissions: document.getElementById("creator-submissions"),
    questionForm: document.getElementById("question-form"),
    videoForm: document.getElementById("video-form"),
    authModal: document.getElementById("auth-modal"),
    authForm: document.getElementById("auth-form")
  };

  if (!els.memberCard) return;

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message) {
    els.communityStatus.textContent = message;
    window.setTimeout(() => {
      if (els.communityStatus.textContent === message) {
        els.communityStatus.textContent = "";
      }
    }, 4200);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function currentName() {
    return state.user?.name || "游客";
  }

  function requireLogin() {
    if (state.user) return true;
    openAuthModal();
    setStatus("请先登录或注册一个演示账号，再发布内容、评论或打赏。");
    return false;
  }

  function renderMember() {
    if (state.user) {
      els.memberCard.innerHTML = `
        <p class="eyebrow">已登录</p>
        <h3>${escapeHtml(state.user.name)}</h3>
        <p>${escapeHtml(state.user.role)} · ${escapeHtml(state.user.email)}</p>
        <div class="member-actions">
          <button class="secondary-action" type="button" id="logout-button">退出登录</button>
        </div>
      `;
    } else {
      els.memberCard.innerHTML = `
        <p class="eyebrow">未登录</p>
        <h3>加入AI学习社区</h3>
        <p>登录后可以提问、回复、发布视频教程和支持创作者。</p>
        <div class="member-actions">
          <button class="primary-action" type="button" id="login-button">登录 / 注册</button>
        </div>
      `;
    }

    const loginButton = document.getElementById("login-button");
    const logoutButton = document.getElementById("logout-button");
    if (loginButton) loginButton.addEventListener("click", openAuthModal);
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        state.user = null;
        localStorage.removeItem(storageKeys.user);
        renderAll();
        setStatus("已退出演示账号。");
      });
    }
  }

  function renderStats() {
    const comments = state.posts.reduce((total, post) => total + post.comments.length, 0);
    const tips = [
      ...state.posts.map((post) => post.tips),
      ...state.videos.map((video) => video.tips)
    ].reduce((total, value) => total + value, 0);

    els.communityStats.innerHTML = `
      <div><span>问题</span><strong>${state.posts.length}</strong></div>
      <div><span>评论</span><strong>${comments}</strong></div>
      <div><span>视频</span><strong>${state.videos.length}</strong></div>
      <div><span>演示打赏</span><strong>¥${tips}</strong></div>
    `;
  }

  function renderPosts() {
    els.feed.innerHTML = state.posts.map((post) => `
      <article class="question-card" data-post-id="${escapeHtml(post.id)}">
        <div class="post-meta">
          <span class="type-pill">${escapeHtml(post.tag)}</span>
          <span>${escapeHtml(post.author)} · ${escapeHtml(post.role)}</span>
          <span>${escapeHtml(post.createdAt)}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body)}</p>
        <div class="post-actions">
          <button class="tip-button" type="button" data-tip-target="post" data-id="${escapeHtml(post.id)}" data-amount="6">打赏 ¥6</button>
          <button class="tip-button" type="button" data-tip-target="post" data-id="${escapeHtml(post.id)}" data-amount="18">打赏 ¥18</button>
          <span class="category-pill">已支持 ¥${post.tips}</span>
        </div>
        <div class="comment-list">
          ${post.comments.map((comment) => `
            <div class="comment-item">
              <div class="comment-meta">${escapeHtml(comment.author)} · ${escapeHtml(comment.role)}</div>
              <p>${escapeHtml(comment.body)}</p>
            </div>
          `).join("")}
        </div>
        <form class="comment-form" data-post-id="${escapeHtml(post.id)}">
          <label>
            <span class="sr-only">评论内容</span>
            <input name="comment" type="text" placeholder="写下你的经验或追问" required>
          </label>
          <button class="small-action" type="submit">评论</button>
        </form>
      </article>
    `).join("");
  }

  function renderVideos() {
    els.videoGrid.innerHTML = state.videos.map((video) => `
      <article class="video-card" data-video-id="${escapeHtml(video.id)}">
        <div class="video-thumb" aria-hidden="true"><span>▶</span></div>
        <div class="video-body">
          <div class="video-meta">
            <span class="type-pill">${escapeHtml(video.audience)}</span>
            <span>${escapeHtml(video.creator)}</span>
            <span>${escapeHtml(video.tool)}</span>
          </div>
          <h3>${escapeHtml(video.title)}</h3>
          <p>${escapeHtml(video.description)}</p>
          <div class="tip-row">
            ${video.url ? `<a class="source-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">打开视频</a>` : ""}
            <button class="tip-button" type="button" data-tip-target="video" data-id="${escapeHtml(video.id)}" data-amount="6">打赏 ¥6</button>
            <button class="tip-button" type="button" data-tip-target="video" data-id="${escapeHtml(video.id)}" data-amount="18">打赏 ¥18</button>
            <button class="tip-button" type="button" data-tip-target="video" data-id="${escapeHtml(video.id)}" data-amount="66">打赏 ¥66</button>
            <span class="category-pill">已支持 ¥${video.tips}</span>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderCreatorDashboard() {
    if (!els.creatorDashboard || !els.creatorSubmissions) return;

    if (!state.user) {
      els.creatorDashboard.innerHTML = `
        <div class="creator-empty">
          <div>
            <p class="eyebrow">创作者中心</p>
            <h3>登录后查看投稿状态</h3>
            <p>投稿人发布视频教程后，可以在这里看到审核状态、数据、打赏演示和下一步建议。</p>
          </div>
          <button class="primary-action" type="button" data-open-auth>登录 / 注册</button>
        </div>
      `;
      els.creatorSubmissions.innerHTML = "";
      return;
    }

    const myVideos = state.videos.filter((video) => video.creator === state.user.name);
    const totalTips = myVideos.reduce((total, video) => total + Number(video.tips || 0), 0);
    const totalLikes = myVideos.reduce((total, video) => total + Number(video.likes || 0), 0);
    const totalViews = myVideos.reduce((total, video) => total + Number(video.views || 0), 0);
    const pendingCount = myVideos.filter((video) => getVideoStatus(video) === "待审核").length;

    els.creatorDashboard.innerHTML = `
      <div class="creator-hero">
        <div>
          <p class="eyebrow">创作者工作台</p>
          <h3>${escapeHtml(state.user.name)} 的投稿后台</h3>
          <p>这里模拟投稿人投稿后看到的界面：状态、表现、打赏和后续服务都集中管理。</p>
        </div>
        <button class="secondary-action" type="button" data-focus-video-form>继续投稿</button>
      </div>
      <div class="creator-metrics">
        <div><span>我的投稿</span><strong>${myVideos.length}</strong></div>
        <div><span>待审核</span><strong>${pendingCount}</strong></div>
        <div><span>演示打赏</span><strong>¥${totalTips}</strong></div>
        <div><span>点赞 / 播放</span><strong>${totalLikes} / ${totalViews}</strong></div>
      </div>
      <div class="creator-next">
        <strong>下一步</strong>
        <p>真实上线后，这里可以接入审核结果、收益提现、远程帮助订单和创作者等级。</p>
      </div>
    `;

    els.creatorSubmissions.innerHTML = `
      <section class="creator-list">
        <div class="creator-list-heading">
          <h3>我的投稿</h3>
          <span>${myVideos.length ? "按最新投稿排序" : "还没有投稿"}</span>
        </div>
        ${
          myVideos.length
            ? myVideos.map(renderCreatorSubmission).join("")
            : `<div class="empty-state">还没有视频教程。可以先发布一个“注册/安装/基础使用”类教程。</div>`
        }
      </section>
    `;
  }

  function renderCreatorSubmission(video) {
    const status = getVideoStatus(video);
    return `
      <article class="creator-submission-card">
        <div>
          <div class="post-meta">
            <span class="type-pill">${escapeHtml(status)}</span>
            <span>${escapeHtml(video.audience || "通用")}</span>
            <span>${escapeHtml(video.createdAt || "今天")}</span>
          </div>
          <h3>${escapeHtml(video.title)}</h3>
          <p>${escapeHtml(video.description)}</p>
        </div>
        <div class="creator-submission-side">
          <span>打赏 ¥${Number(video.tips || 0)}</span>
          <span>点赞 ${Number(video.likes || 0)}</span>
          <span>播放 ${Number(video.views || 0)}</span>
        </div>
      </article>
    `;
  }

  function getVideoStatus(video) {
    return video.status || "待审核";
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll("[data-community-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.communityTab === tabName);
    });
    document.querySelectorAll(".community-view").forEach((view) => {
      view.classList.toggle("is-active", view.id === `community-view-${tabName}`);
    });
  }

  function getCommunityTabFromHash() {
    const tabByHash = {
      "#creator-center": "creator",
      "#community-videos": "videos",
      "#community-questions": "questions"
    };
    return tabByHash[window.location.hash] || null;
  }

  function openLinkedCommunityTab(tabName, targetHash) {
    switchTab(tabName);
    if (targetHash && window.location.hash !== targetHash) {
      history.pushState(null, "", targetHash);
    }

    const target = targetHash === "#creator-center" ? document.getElementById("creator-center") : document.getElementById("community");
    requestAnimationFrame(() => {
      target?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function openAuthModal() {
    els.authModal.hidden = false;
    document.body.classList.add("modal-open");
    els.authForm.elements.name.focus();
  }

  function closeAuthModal() {
    els.authModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function addTip(targetType, id, amount) {
    if (!requireLogin()) return;
    const list = targetType === "post" ? state.posts : state.videos;
    const item = list.find((entry) => entry.id === id);
    if (!item) return;
    item.tips += amount;
    save(targetType === "post" ? storageKeys.posts : storageKeys.videos, list);
    renderAll();
    setStatus(`${currentName()} 已模拟打赏 ¥${amount}。真实上线时这里会进入支付订单流程。`);
  }

  function bindEvents() {
    document.querySelectorAll("[data-community-tab]").forEach((button) => {
      button.addEventListener("click", () => switchTab(button.dataset.communityTab));
    });

    document.querySelectorAll("[data-community-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openLinkedCommunityTab(link.dataset.communityLink, link.getAttribute("href"));
      });
    });

    window.addEventListener("hashchange", () => {
      const tabName = getCommunityTabFromHash();
      if (tabName) switchTab(tabName);
    });

    document.querySelectorAll("[data-close-auth]").forEach((button) => {
      button.addEventListener("click", closeAuthModal);
    });

    els.authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(els.authForm);
      state.user = {
        name: formData.get("name").trim(),
        email: formData.get("email").trim(),
        role: formData.get("role")
      };
      save(storageKeys.user, state.user);
      closeAuthModal();
      renderAll();
      setStatus(`欢迎 ${state.user.name}，现在可以参与社区互动了。`);
      els.authForm.reset();
    });

    els.questionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!requireLogin()) return;
      const formData = new FormData(els.questionForm);
      state.posts.unshift({
        id: `post-${Date.now()}`,
        title: formData.get("title").trim(),
        tag: formData.get("tag"),
        author: state.user.name,
        role: state.user.role,
        body: formData.get("body").trim(),
        createdAt: today(),
        tips: 0,
        comments: []
      });
      save(storageKeys.posts, state.posts);
      els.questionForm.reset();
      renderAll();
      switchTab("questions");
      setStatus("问题已发布到问答广场。");
    });

    els.videoForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!requireLogin()) return;
      const formData = new FormData(els.videoForm);
      state.videos.unshift({
        id: `video-${Date.now()}`,
        title: formData.get("title").trim(),
        creator: state.user.name,
        audience: formData.get("audience"),
        tool: "创作者投稿",
        description: formData.get("description").trim(),
        url: formData.get("url").trim(),
        status: "待审核",
        createdAt: today(),
        views: 0,
        tips: 0,
        likes: 0
      });
      save(storageKeys.videos, state.videos);
      els.videoForm.reset();
      renderAll();
      switchTab("creator");
      setStatus("投稿已提交，当前为待审核状态。");
    });

    els.feed.addEventListener("submit", (event) => {
      if (!event.target.matches(".comment-form")) return;
      event.preventDefault();
      if (!requireLogin()) return;
      const post = state.posts.find((item) => item.id === event.target.dataset.postId);
      if (!post) return;
      const input = event.target.elements.comment;
      post.comments.push({
        author: state.user.name,
        role: state.user.role,
        body: input.value.trim()
      });
      save(storageKeys.posts, state.posts);
      renderAll();
      setStatus("评论已发布。");
    });

    document.getElementById("community").addEventListener("click", (event) => {
      const authButton = event.target.closest("[data-open-auth]");
      if (authButton) {
        openAuthModal();
        return;
      }

      const focusButton = event.target.closest("[data-focus-video-form]");
      if (focusButton) {
        els.videoForm.scrollIntoView({ block: "start", behavior: "smooth" });
        els.videoForm.elements.title.focus();
        return;
      }

      const tipButton = event.target.closest("[data-tip-target]");
      if (!tipButton) return;
      addTip(tipButton.dataset.tipTarget, tipButton.dataset.id, Number(tipButton.dataset.amount));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.authModal.hidden) {
        closeAuthModal();
      }
    });
  }

  function renderAll() {
    renderMember();
    renderStats();
    renderPosts();
    renderVideos();
    renderCreatorDashboard();
    switchTab(state.activeTab);
  }

  bindEvents();
  const initialTab = getCommunityTabFromHash();
  if (initialTab) state.activeTab = initialTab;
  renderAll();
})();
