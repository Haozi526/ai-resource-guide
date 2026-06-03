(function () {
  const STATUS = {
    PENDING: "待审核",
    APPROVED: "已发布",
    REJECTED: "已驳回",
    OFFLINE: "已下架"
  };

  const VIDEO_LIMIT_BYTES = 500 * 1024 * 1024;
  const COVER_LIMIT_BYTES = 8 * 1024 * 1024;

  function nowDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function slugify(value) {
    return String(value || "video")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || `video-${Date.now()}`;
  }

  function normalizePhone(value) {
    const phone = String(value || "").replace(/\s+/g, "");
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error("请输入正确的中国大陆手机号");
    }
    return phone;
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    return String(value || "")
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function validateVideoFile(file) {
    if (!file) {
      throw new Error("请选择要上传的视频文件");
    }

    const name = String(file.name || "");
    const type = String(file.type || "");
    const isMp4 = type === "video/mp4" || /\.mp4$/i.test(name);

    if (!isMp4) {
      throw new Error("当前版本只支持 MP4 视频");
    }

    if (Number(file.size || 0) > VIDEO_LIMIT_BYTES) {
      throw new Error("单个视频不能超过 500MB");
    }

    return {
      name,
      size: Number(file.size || 0),
      type: type || "video/mp4"
    };
  }

  function validateCoverFile(file) {
    if (!file) return null;

    const name = String(file.name || "");
    const type = String(file.type || "");
    const isImage = /^image\//.test(type) || /\.(png|jpe?g|webp)$/i.test(name);

    if (!isImage) {
      throw new Error("封面只支持 PNG、JPG 或 WebP 图片");
    }

    if (Number(file.size || 0) > COVER_LIMIT_BYTES) {
      throw new Error("封面图片不能超过 8MB");
    }

    return {
      name,
      size: Number(file.size || 0),
      type: type || "image/png"
    };
  }

  function createVideoSubmission(input) {
    const creator = input.creator || {};
    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();
    const tool = String(input.tool || "").trim() || "创作者投稿";
    const audience = String(input.audience || "").trim() || "通用";
    const vod = input.vod || {};
    const cover = input.cover || {};
    const videoMeta = validateVideoFile(input.videoFile);
    const coverMeta = validateCoverFile(input.coverFile);
    const creatorPhone = creator.phone ? normalizePhone(creator.phone) : "";

    if (!title) throw new Error("请填写视频标题");
    if (!description) throw new Error("请填写视频简介");
    if (!vod.fileId && !vod.mediaUrl && !input.localVideoUrl) {
      throw new Error("视频上传完成后才能提交审核");
    }

    return {
      id: input.id || `video-${Date.now()}`,
      title,
      creatorId: creator.id || creatorPhone || creator.name || "guest",
      creator: creator.name || "创作者",
      creatorPhone,
      creatorRole: creator.role || "创作者",
      audience,
      tool,
      tags: normalizeTags(input.tags),
      description,
      videoFileId: vod.fileId || "",
      videoAppId: vod.appId || "",
      videoUrl: vod.mediaUrl || input.localVideoUrl || "",
      localVideoUrl: input.localVideoUrl || "",
      coverImage: cover.url || "",
      videoFile: videoMeta,
      coverFile: coverMeta,
      status: STATUS.PENDING,
      reviewNote: "",
      reviewer: "",
      createdAt: input.createdAt || nowDate(),
      submittedAt: input.submittedAt || nowIso(),
      reviewedAt: "",
      views: Number(input.views || 0),
      tips: Number(input.tips || 0),
      likes: Number(input.likes || 0)
    };
  }

  function getSubmissionStatus(video) {
    return video?.status || STATUS.PENDING;
  }

  function getPublishedVideos(videos) {
    return (videos || []).filter((video) => getSubmissionStatus(video) === STATUS.APPROVED);
  }

  function getCreatorVideos(videos, creator) {
    if (!creator) return [];
    const creatorId = creator.id || creator.phone || creator.name;
    return (videos || []).filter((video) => {
      return (
        video.creatorId === creatorId ||
        video.creatorPhone === creator.phone ||
        video.creator === creator.name
      );
    });
  }

  function approveVideoSubmission(video, review) {
    return {
      ...video,
      status: STATUS.APPROVED,
      reviewer: review?.reviewer || "admin",
      reviewNote: review?.note || "审核通过",
      reviewedAt: nowIso()
    };
  }

  function rejectVideoSubmission(video, review) {
    return {
      ...video,
      status: STATUS.REJECTED,
      reviewer: review?.reviewer || "admin",
      reviewNote: review?.note || "内容需要修改后重新提交",
      reviewedAt: nowIso()
    };
  }

  function offlineVideoSubmission(video, review) {
    return {
      ...video,
      status: STATUS.OFFLINE,
      reviewer: review?.reviewer || "admin",
      reviewNote: review?.note || "已下架",
      reviewedAt: nowIso()
    };
  }

  function createTutorialFromApprovedVideo(video) {
    if (getSubmissionStatus(video) !== STATUS.APPROVED) {
      throw new Error("只有审核通过的视频才能生成课程");
    }

    return {
      id: `creator-${slugify(video.title)}-${String(video.id || Date.now()).replace(/^video-/, "")}`,
      type: "创作者视频",
      level: "入门到进阶",
      title: video.title,
      audience: [video.audience || "通用"],
      tools: [video.tool || "AI工具"],
      duration: "视频课程",
      videoUrl: video.videoUrl || "",
      videoFileId: video.videoFileId || "",
      videoAppId: video.videoAppId || "",
      coverImage: video.coverImage || "",
      creatorName: video.creator || "创作者",
      status: "published",
      summary: video.description || "",
      steps: [
        "先看完整视频，了解工具、岗位场景和最终产出。",
        "按视频中的操作准备账号、素材或业务资料。",
        "跟随演示完成一次完整练习，并记录卡住的步骤。",
        "把结果保存下来，对照课程建议继续优化。"
      ],
      updatedAt: nowDate(),
      sourceName: "创作者投稿审核通过"
    };
  }

  function mergeApprovedVideosIntoTutorials(existingTutorials, submissions) {
    const tutorials = Array.isArray(existingTutorials) ? [...existingTutorials] : [];
    const existingIds = new Set(tutorials.map((item) => item.videoFileId || item.id));

    getPublishedVideos(submissions).forEach((video) => {
      const key = video.videoFileId || video.id;
      if (!existingIds.has(key)) {
        tutorials.unshift(createTutorialFromApprovedVideo(video));
        existingIds.add(key);
      }
    });

    return tutorials;
  }

  window.AI_CREATOR_PLATFORM = {
    STATUS,
    VIDEO_LIMIT_BYTES,
    COVER_LIMIT_BYTES,
    normalizePhone,
    normalizeTags,
    validateVideoFile,
    validateCoverFile,
    createVideoSubmission,
    getSubmissionStatus,
    getPublishedVideos,
    getCreatorVideos,
    approveVideoSubmission,
    rejectVideoSubmission,
    offlineVideoSubmission,
    createTutorialFromApprovedVideo,
    mergeApprovedVideosIntoTutorials
  };
})();
