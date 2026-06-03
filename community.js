(function () {
  const platform = window.AI_CREATOR_PLATFORM;

  if (!platform) return;

  const storageKeys = {
    user: "aiResourceCommunityUser",
    posts: "aiResourceCommunityPosts",
    videos: "aiResourceCommunityVideos",
    phoneCode: "aiResourcePhoneCode"
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
      creatorId: "demo-creator-1",
      creator: "南风电商",
      creatorPhone: "13800138001",
      audience: "电商",
      tool: "豆包 + Canva AI",
      description: "从商品卖点、标题组合、详情页结构到活动海报，一次跑完整个流程。",
      tags: ["电商", "详情页"],
      videoFileId: "",
      videoAppId: "",
      videoUrl: "",
      coverImage: "",
      status: platform.STATUS.APPROVED,
      createdAt: "2026-06-02",
      reviewedAt: "2026-06-02",
      views: 268,
      tips: 88,
      likes: 126
    },
    {
      id: "video-2",
      title: "学生论文资料整理工作流",
      creatorId: "demo-creator-2",
      creator: "AI课代表",
      creatorPhone: "13800138002",
      audience: "学生",
      tool: "Kimi + Perplexity",
      description: "演示如何检索资料线索、整理文献摘要、生成提纲，并保留人工核验步骤。",
      tags: ["学生", "论文"],
      videoFileId: "",
      videoAppId: "",
      videoUrl: "",
      coverImage: "",
      status: platform.STATUS.APPROVED,
      createdAt: "2026-06-02",
      reviewedAt: "2026-06-02",
      views: 196,
      tips: 66,
      likes: 94
    },
    {
      id: "video-3",
      title: "用Cursor读懂一个前端项目",
      creatorId: "demo-creator-3",
      creator: "代码讲师",
      creatorPhone: "13800138003",
      audience: "程序员",
      tool: "Cursor + DeepSeek",
      description: "适合刚开始用AI编程的人，重点讲怎么限定改动范围和检查AI生成代码。",
      tags: ["程序员", "AI编程"],
      videoFileId: "",
      videoAppId: "",
      videoUrl: "",
      coverImage: "",
      status: platform.STATUS.APPROVED,
      createdAt: "2026-06-02",
      reviewedAt: "2026-06-02",
      views: 322,
      tips: 108,
      likes: 151
    }
  ];

  const state = {
    activeTab: "questions",
    user: load(storageKeys.user, null),
    posts: load(storageKeys.posts, defaultPosts),
    videos: load(storageKeys.videos, window.AI_RESOURCE_DATA?.videoSubmissions || defaultVideos)
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
    authForm: document.getElementById("auth-form"),
    sendCode: document.getElementById("send-phone-code"),
    uploadProgress: document.getElementById("creator-upload-progress"),
    uploadLabel: document.getElementById("creator-upload-label"),
    uploadPercent: document.getElementById("creator-upload-percent"),
    uploadBar: document.getElementById("creator-upload-bar")
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
    }, 5200);
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
    setStatus("请先用手机号登录，再发布内容、评论、上传视频或打赏。");
    return false;
  }

  function userProfileFromForm(formData) {
    const phone = platform.normalizePhone(formData.get("phone"));
    return {
      id: `phone-${phone}`,
      name: String(formData.get("name") || "").trim(),
      phone,
      role: formData.get("role") || "创作者",
      rewardQr: String(formData.get("rewardQr") || "").trim(),
      createdAt: today()
    };
  }

  function getCloudConfig() {
    return window.AI_RESOURCE_CLOUD_CONFIG || {};
  }

  function isVodConfigured() {
    const config = getCloudConfig();
    return Boolean(config.vod?.uploadSignatureUrl && window.TcVod);
  }

  function updateUploadProgress(percent, label) {
    if (!els.uploadProgress) return;
    els.uploadProgress.hidden = false;
    els.uploadBar.value = percent;
    els.uploadPercent.textContent = `${percent}%`;
    els.uploadLabel.textContent = label;
  }

  function resetUploadProgress() {
    if (!els.uploadProgress) return;
    els.uploadProgress.hidden = true;
    els.uploadBar.value = 0;
    els.uploadPercent.textContent = "0%";
    els.uploadLabel.textContent = "等待上传";
  }

  async function simulateUpload(videoFile, coverFile) {
    const points = [12, 28, 48, 68, 86, 100];
    for (const point of points) {
      updateUploadProgress(point, point < 100 ? "本地演示上传中" : "上传完成");
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }

    return {
      fileId: `local-${Date.now()}`,
      appId: "local-demo",
      mediaUrl: URL.createObjectURL(videoFile),
      coverUrl: coverFile ? URL.createObjectURL(coverFile) : ""
    };
  }

  async function uploadWithVod(videoFile, coverFile) {
    const config = getCloudConfig();
    const TcVod = window.TcVod?.default || window.TcVod;
    const uploader = new TcVod({
      getSignature() {
        return fetch(config.vod.uploadSignatureUrl).then((response) => response.text());
      }
    });
    const task = uploader.upload({
      mediaFile: videoFile,
      coverFile: coverFile || undefined
    });

    task.on("media_progress", (info) => {
      updateUploadProgress(Math.round(Number(info.percent || 0) * 100), "腾讯云点播上传中");
    });

    const result = await task.done();
    return {
      fileId: result.fileId || result.video?.fileId || "",
      appId: config.vod.appId || result.appId || "",
      mediaUrl: result.video?.url || result.mediaUrl || result.video?.mediaUrl || "",
      coverUrl: result.cover?.url || result.coverUrl || ""
    };
  }

  async function uploadVideo(formData) {
    const videoFile = formData.get("videoFile");
    const coverFile = formData.get("coverFile");
    platform.validateVideoFile(videoFile);
    platform.validateCoverFile(coverFile && coverFile.name ? coverFile : null);
    updateUploadProgress(3, "准备上传");

    if (isVodConfigured()) {
      return uploadWithVod(videoFile, coverFile && coverFile.name ? coverFile : null);
    }

    return simulateUpload(videoFile, coverFile && coverFile.name ? coverFile : null);
  }

  function renderMember() {
    if (state.user) {
      els.memberCard.innerHTML = `
        <p class="eyebrow">已登录</p>
        <h3>${escapeHtml(state.user.name)}</h3>
        <p>${escapeHtml(state.user.role)} · ${escapeHtml(state.user.phone)}</p>
        <div class="member-actions">
          <button class="secondary-action" type="button" id="logout-button">退出登录</button>
        </div>
      `;
    } else {
      els.memberCard.innerHTML = `
        <p class="eyebrow">未登录</p>
        <h3>加入AI学习社区</h3>
        <p>手机号登录后可以提问、评论、上传视频教程和支持创作者。</p>
        <div class="member-actions">
          <button class="primary-action" type="button" id="login-button">手机号登录 / 注册</button>
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
        setStatus("已退出账号。");
      });
    }
  }

  function renderStats() {
    const comments = state.posts.reduce((total, post) => total + post.comments.length, 0);
    const publishedVideos = platform.getPublishedVideos(state.videos);
    const tips = [
      ...state.posts.map((post) => post.tips),
      ...publishedVideos.map((video) => video.tips)
    ].reduce((total, value) => total + value, 0);

    els.communityStats.innerHTML = `
      <div><span>问题</span><strong>${state.posts.length}</strong></div>
      <div><span>评论</span><strong>${comments}</strong></div>
      <div><span>公开视频</span><strong>${publishedVideos.length}</strong></div>
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

  function renderVideoThumb(video) {
    if (video.coverImage) {
      return `<img src="${escapeHtml(video.coverImage)}" alt="">`;
    }

    return `<span>▶</span>`;
  }

  function renderVideos() {
    const videos = platform.getPublishedVideos(state.videos);

    els.videoGrid.innerHTML = videos.length
      ? videos.map((video) => `
        <article class="video-card" data-video-id="${escapeHtml(video.id)}">
          <div class="video-thumb" aria-hidden="true">${renderVideoThumb(video)}</div>
          <div class="video-body">
            <div class="video-meta">
              <span class="type-pill">${escapeHtml(video.audience)}</span>
              <span>${escapeHtml(video.creator)}</span>
              <span>${escapeHtml(video.tool)}</span>
            </div>
            <h3>${escapeHtml(video.title)}</h3>
            <p>${escapeHtml(video.description)}</p>
            <div class="tip-row">
              ${video.videoUrl ? `<a class="source-link" href="${escapeHtml(video.videoUrl)}" target="_blank" rel="noreferrer">播放视频</a>` : ""}
              <button class="tip-button" type="button" data-tip-target="video" data-id="${escapeHtml(video.id)}" data-amount="6">打赏 ¥6</button>
              <button class="tip-button" type="button" data-tip-target="video" data-id="${escapeHtml(video.id)}" data-amount="18">打赏 ¥18</button>
              <button class="tip-button" type="button" data-tip-target="video" data-id="${escapeHtml(video.id)}" data-amount="66">打赏 ¥66</button>
              <span class="category-pill">已支持 ¥${video.tips}</span>
            </div>
          </div>
        </article>
      `).join("")
      : `<div class="empty-state">还没有审核通过的视频。创作者上传后，需要管理员审核通过才会展示在这里。</div>`;
  }

  function renderCreatorDashboard() {
    if (!els.creatorDashboard || !els.creatorSubmissions) return;

    if (!state.user) {
      els.creatorDashboard.innerHTML = `
        <div class="creator-empty">
          <div>
            <p class="eyebrow">创作者中心</p>
            <h3>手机号登录后上传视频</h3>
            <p>注册用户可以上传课程视频，提交后会进入管理员审核，审核通过后展示到课程合集。</p>
          </div>
          <button class="primary-action" type="button" data-open-auth>登录 / 注册</button>
        </div>
      `;
      els.creatorSubmissions.innerHTML = "";
      return;
    }

    const myVideos = platform.getCreatorVideos(state.videos, state.user);
    const totalTips = myVideos.reduce((total, video) => total + Number(video.tips || 0), 0);
    const totalLikes = myVideos.reduce((total, video) => total + Number(video.likes || 0), 0);
    const totalViews = myVideos.reduce((total, video) => total + Number(video.views || 0), 0);
    const pendingCount = myVideos.filter((video) => platform.getSubmissionStatus(video) === platform.STATUS.PENDING).length;

    els.creatorDashboard.innerHTML = `
      <div class="creator-hero">
        <div>
          <p class="eyebrow">创作者工作台</p>
          <h3>${escapeHtml(state.user.name)} 的投稿后台</h3>
          <p>上传课程视频、查看审核状态、维护打赏二维码。审核通过后，视频才会进入公开课程。</p>
        </div>
        <button class="secondary-action" type="button" data-focus-video-form>上传新视频</button>
      </div>
      <div class="creator-metrics">
        <div><span>我的投稿</span><strong>${myVideos.length}</strong></div>
        <div><span>待审核</span><strong>${pendingCount}</strong></div>
        <div><span>演示打赏</span><strong>¥${totalTips}</strong></div>
        <div><span>点赞 / 播放</span><strong>${totalLikes} / ${totalViews}</strong></div>
      </div>
      <div class="creator-next">
        <strong>审核规则</strong>
        <p>注册用户可直接上传，但视频不会自动公开；管理员通过后才会出现在课程合集和视频教程页面。</p>
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
            : `<div class="empty-state">还没有视频教程。可以先上传一个“注册 / 安装 / 基础使用”类课程。</div>`
        }
      </section>
    `;
  }

  function renderCreatorSubmission(video) {
    const status = platform.getSubmissionStatus(video);
    const note = video.reviewNote ? `<p class="review-note">审核备注：${escapeHtml(video.reviewNote)}</p>` : "";
    const tags = Array.isArray(video.tags) && video.tags.length
      ? `<div class="role-tags">${video.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
      : "";

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
          ${tags}
          ${note}
        </div>
        <div class="creator-submission-side">
          <span>${escapeHtml(video.videoFile?.name || video.videoFileId || "视频已提交")}</span>
          <span>打赏 ¥${Number(video.tips || 0)}</span>
          <span>播放 ${Number(video.views || 0)}</span>
        </div>
      </article>
    `;
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

  function sendPhoneCode() {
    try {
      const phone = platform.normalizePhone(els.authForm.elements.phone.value);
      const record = {
        phone,
        code: "123456",
        expiresAt: Date.now() + 10 * 60 * 1000
      };
      save(storageKeys.phoneCode, record);
      setStatus("验证码已发送。演示环境请输入 123456；上线后这里会调用 CloudBase 手机验证码。");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function verifyPhoneCode(phone, code) {
    const record = load(storageKeys.phoneCode, null);
    if (!record || record.phone !== phone || record.expiresAt < Date.now()) {
      return code === "123456";
    }

    return record.code === code;
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

    els.sendCode?.addEventListener("click", sendPhoneCode);

    els.authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const formData = new FormData(els.authForm);
        const user = userProfileFromForm(formData);
        const code = String(formData.get("code") || "").trim();
        if (!verifyPhoneCode(user.phone, code)) {
          setStatus("验证码不正确，请重新输入。");
          return;
        }

        state.user = user;
        save(storageKeys.user, state.user);
        closeAuthModal();
        renderAll();
        setStatus(`欢迎 ${state.user.name}，现在可以进入创作者中心上传视频。`);
        els.authForm.reset();
      } catch (error) {
        setStatus(error.message);
      }
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

    els.videoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireLogin()) return;

      const submitButton = els.videoForm.querySelector("button[type='submit']");
      submitButton.disabled = true;

      try {
        const formData = new FormData(els.videoForm);
        const uploadResult = await uploadVideo(formData);
        const backupUrl = String(formData.get("url") || "").trim();
        const submission = platform.createVideoSubmission({
          title: formData.get("title"),
          creator: state.user,
          audience: formData.get("audience"),
          tool: formData.get("tool"),
          tags: formData.get("tags"),
          description: formData.get("description"),
          videoFile: formData.get("videoFile"),
          coverFile: formData.get("coverFile"),
          vod: {
            fileId: uploadResult.fileId,
            appId: uploadResult.appId,
            mediaUrl: uploadResult.mediaUrl || backupUrl
          },
          cover: {
            url: uploadResult.coverUrl
          },
          localVideoUrl: uploadResult.mediaUrl
        });

        if (backupUrl && !submission.videoUrl) {
          submission.videoUrl = backupUrl;
        }

        state.videos.unshift(submission);
        save(storageKeys.videos, state.videos);
        els.videoForm.reset();
        resetUploadProgress();
        renderAll();
        switchTab("creator");
        setStatus("视频已上传并提交审核。管理员通过后，才会进入公开课程。");
      } catch (error) {
        setStatus(error.message || "上传失败，请稍后重试。");
      } finally {
        submitButton.disabled = false;
      }
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
