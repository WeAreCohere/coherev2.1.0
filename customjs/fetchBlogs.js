"use strict";

/**
 * Renders the Cohere "News & Blogs" page using the WordPress REST API.
 * Data source: https://blogs.wearecohere.org (WordPress + Jetpack)
 */

const WP_SITE = "https://blogs.wearecohere.org/index.php";
const POSTS_PER_PAGE = 6;
const WORDS_PER_MINUTE = 200;
const THEME_COLORS = ["teal", "marigold", "clay", "navy"];
const TOPIC_DOT_COLORS = [
  "#1D6F64",
  "#E7A94C",
  "#C8695A",
  "#16233D",
  "#8a5c1e",
];

const state = {
  page: 1,
  totalPages: 1,
  search: "",
  tag: null,
};

let tagsCache = [];

document.addEventListener("DOMContentLoaded", () => {
  const postsGrid = document.getElementById("posts-grid");
  if (postsGrid) {
    initTopicSearch();
    loadTopics();
    loadPopularPosts();
    loadPosts();
  }

  // homepage "Blogs & News" teaser section (blog-container element, unrelated to the blogs.html redesign)
  const homeBlogContainer = document.getElementById("blog-container");
  if (homeBlogContainer?.dataset?.home === "1") {
    loadHomepagePreview(homeBlogContainer);
  }
});

/* ---------------------------- homepage teaser ---------------------------- */

const loadHomepagePreview = async (element) => {
  element.innerHTML = `<p style="text-align:center; padding: 20px;">Loading blogs...</p>`;

  try {
    const url = buildApiUrl("/wp/v2/posts", { _embed: 1, per_page: 3 });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Couldn't fetch blogs");

    const posts = await response.json();
    if (!posts.length) {
      element.innerHTML = `<p style="text-align:center; padding: 20px;">No blog data available.</p>`;
      return;
    }

    const bgColors = ["#ff9343", "#72ccca", "#ff6865"];
    const html = `<div class="row">
      <div class="col-12 p-md-0">
        <ul class="blog-only-text blog-wrapper grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          ${posts
            .map((post, i) => {
              const media = post._embedded?.["wp:featuredmedia"]?.[0];
              const image = media?.source_url || "images-copy/involved.jpg";
              const terms = post._embedded?.["wp:term"] || [];
              const category =
                terms[1]?.[0]?.name || terms[0]?.[0]?.name || "Blog";
              const title = stripHtml(post.title?.rendered || "");

              return `<li class="grid-item">
                <div class="card border-radius-0px border-0 h-100 overflow-hidden" style="background-color: ${bgColors[i % bgColors.length]};">
                  <div class="card-body hover-box dark-hover p-15 lg-p-10">
                    <img src="${image}" class="hover-img" referrerpolicy="no-referrer" alt="">
                    <a href="${post.link}" class="categories-btn ms-0 bg-white text-dark-gray text-uppercase fw-600 mb-70px">${category}</a>
                    <a href="${post.link}" class="fs-13 text-uppercase d-block mb-5px text-dark-gray fw-500 mt-60px">${formatDate(post.date)}</a>
                    <a href="${post.link}" class="card-title d-block fs-22 sm-fs-20 ls-minus-05px fw-500 text-dark-gray mb-0 w-90 lg-w-100">${title}</a>
                  </div>
                </div>
              </li>`;
            })
            .join("")}
        </ul>
      </div>
    </div>`;

    element.innerHTML = "";
    element.insertAdjacentHTML("afterbegin", html);
  } catch (error) {
    console.error("Failed to load blogs:", error.message);
    element.innerHTML = `<p style="text-align:center; padding: 20px; color: red;">Failed to load blogs.</p>`;
  }
};

/* ---------------------------- helpers ---------------------------- */

const buildApiUrl = (route, params = {}) => {
  const query = new URLSearchParams({ rest_route: route });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return `${WP_SITE}?${query.toString()}`;
};

const stripHtml = (html = "") =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;|&#8212;/g, "-")
    .trim();

const estimateReadTime = (html = "") => {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const formatViews = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ---------------------------- posts ---------------------------- */

const fetchPosts = async (options) => {
  const { page, search, tag } = options;
  try {
    const url = buildApiUrl("/wp/v2/posts", {
      _embed: 1,
      per_page: POSTS_PER_PAGE,
      page,
      search,
      tags: tag,
    });
    const response = await fetch(url);

    if (!response.ok) {
      // page number is out of range once a filter reduces the result set, so reset to page 1
      if (response.status === 400 && page > 1) {
        return fetchPosts({ ...options, page: 1 });
      }
      throw new Error("Couldn't fetch blogs");
    }

    const data = await response.json();
    const totalPages = Number(response.headers.get("X-WP-TotalPages")) || 1;
    return { success: true, data, totalPages, page };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const renderPost = (post, index) => {
  const embedded = post._embedded || {};
  const author = embedded.author?.[0]?.name || "Cohere team";
  const media = embedded["wp:featuredmedia"]?.[0];
  const image =
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.source_url ||
    "images-copy/involved.jpg";
  const terms = embedded["wp:term"] || [];
  const tags = terms[1] || [];
  const categories = terms[0] || [];
  const topicLabel = tags[0]?.name || categories[0]?.name || "Blog";
  const theme = THEME_COLORS[index % THEME_COLORS.length];
  const readTime = estimateReadTime(post.content?.rendered);
  const title = stripHtml(post.title?.rendered || "");
  const excerpt = stripHtml(post.excerpt?.rendered || "");

  return `
    <a href="${post.link}" class="card theme-${theme}">
      <div class="card-thumb">
        <span class="thumb-tag">${topicLabel}</span>
        <img src="${image}" alt="${title}" referrerpolicy="no-referrer" loading="lazy">
      </div>
      <div class="card-body">
        <h3>${title}</h3>
        <p class="excerpt">${excerpt}</p>
        <div class="byline">
          <div class="avatar">${initials(author)}</div>
          <div class="byline-meta">
            <span class="name">${author}</span>
            <span class="date">${formatDate(post.date)}</span>
          </div>
          <div class="read-time">${readTime} min read</div>
        </div>
      </div>
    </a>`;
};

const loadPosts = async () => {
  const grid = document.getElementById("posts-grid");
  const pagination = document.getElementById("pagination");
  if (!grid) return;

  grid.innerHTML = `<p class="blog-loading">Loading blogs...</p>`;
  if (pagination) pagination.innerHTML = "";

  const result = await fetchPosts(state);

  if (!result.success) {
    console.error("Failed to load blogs:", result.message);
    grid.innerHTML = `<p class="blog-loading">Failed to load blogs.</p>`;
    return;
  }

  if (!result.data.length) {
    grid.innerHTML = `<p class="blog-loading">No blog posts found.</p>`;
    return;
  }

  state.page = result.page;
  state.totalPages = result.totalPages;

  grid.innerHTML = result.data.map(renderPost).join("");
  renderPagination();
};

/* ---------------------------- pagination ---------------------------- */

const getPageWindow = (current, total) => {
  const pages = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) pages.push(p);
  }
  const withEllipsis = [];
  let previous = 0;
  pages.forEach((p) => {
    if (previous && p - previous > 1) withEllipsis.push("...");
    withEllipsis.push(p);
    previous = p;
  });
  return withEllipsis;
};

const renderPagination = () => {
  const el = document.getElementById("pagination");
  if (!el) return;

  const { page, totalPages } = state;
  if (totalPages <= 1) {
    el.innerHTML = "";
    return;
  }

  const pageBtn = (
    label,
    targetPage,
    { active = false, disabled = false, nav = false } = {},
  ) =>
    `<button type="button" class="page-btn${nav ? " nav" : ""}${active ? " is-active" : ""}" data-page="${targetPage}" ${disabled ? "disabled" : ""}>${label}</button>`;

  let html = pageBtn("&#8592; Prev", page - 1, {
    nav: true,
    disabled: page === 1,
  });
  getPageWindow(page, totalPages).forEach((p) => {
    html +=
      p === "..."
        ? `<span class="page-btn" style="cursor:default;border:none;">…</span>`
        : pageBtn(p, p, { active: p === page });
  });
  html += pageBtn("Next &#8594;", page + 1, {
    nav: true,
    disabled: page === totalPages,
  });

  el.innerHTML = html;
  el.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = Number(btn.dataset.page);
      if (
        !targetPage ||
        targetPage < 1 ||
        targetPage > state.totalPages ||
        targetPage === state.page
      )
        return;
      state.page = targetPage;
      loadPosts();
      document
        .getElementById("posts-grid")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
};

/* ---------------------------- topics (search by topic) ---------------------------- */

const loadTopics = async () => {
  try {
    const url = buildApiUrl("/wp/v2/tags", {
      per_page: 8,
      orderby: "count",
      order: "desc",
      hide_empty: 1,
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Couldn't fetch topics");

    tagsCache = (await response.json()).filter((tag) => tag.count > 0);
    renderTopics();
  } catch (error) {
    console.error("Failed to load topics:", error.message);
  }
};

const renderTopics = () => {
  const el = document.getElementById("topic-list");
  if (!el) return;

  const allRow = `<div class="topic-row${state.tag === null ? " is-active" : ""}" data-tag="">
      <span class="label"><span class="dot" style="background:${TOPIC_DOT_COLORS[3]}"></span>All topics</span>
    </div>`;

  const tagRows = tagsCache
    .map(
      (tag, i) => `
      <div class="topic-row${state.tag === tag.id ? " is-active" : ""}" data-tag="${tag.id}">
        <span class="label"><span class="dot" style="background:${TOPIC_DOT_COLORS[i % TOPIC_DOT_COLORS.length]}"></span>${tag.name}</span>
        <span class="count">${tag.count}</span>
      </div>`,
    )
    .join("");

  el.innerHTML = allRow + tagRows;

  el.querySelectorAll("[data-tag]").forEach((row) => {
    row.addEventListener("click", () => {
      const tagId = row.dataset.tag ? Number(row.dataset.tag) : null;
      if (tagId === state.tag) return;
      state.tag = tagId;
      state.page = 1;
      renderTopics();
      loadPosts();
    });
  });
};

const initTopicSearch = () => {
  const input = document.getElementById("topic-search-input");
  if (!input) return;

  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.search = input.value.trim();
      state.page = 1;
      loadPosts();
    }, 400);
  });
};

/* ---------------------------- most read this month ---------------------------- */

const renderPopular = (items) => {
  const el = document.getElementById("popular-list");
  if (!el) return;

  if (!items.length) {
    el.innerHTML = `<p class="blog-loading" style="padding:0;">No posts to show.</p>`;
    return;
  }

  el.innerHTML = items
    .map(
      (item, i) => `
      <div class="popular-item${i < 2 ? " top" : ""}">
        <span class="rank">${String(i + 1).padStart(2, "0")}</span>
        <img class="popular-thumb" src="${item.image || "images-copy/involved.jpg"}" alt="" referrerpolicy="no-referrer">
        <div class="popular-meta">
          <h4><a href="${item.link}">${item.title}</a></h4>
          ${item.stat ? `<span class="views">${item.stat}</span>` : ""}
        </div>
      </div>`,
    )
    .join("");
};

// Tries the WordPress Popular Posts plugin (real view counts) and falls back to recent posts if it isn't installed
const loadPopularPosts = async () => {
  try {
    const url = buildApiUrl("/wordpress-popular-posts/v1/popular-posts", {
      limit: 4,
      range: "last30days",
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error("plugin not available");

    const data = await response.json();
    renderPopular(
      data.map((post) => ({
        title: stripHtml(post.title || ""),
        link: post.url,
        image: post.image?.src,
        stat:
          post.stats?.views != null
            ? `${formatViews(post.stats.views)} views`
            : "",
      })),
    );
  } catch (error) {
    await loadRecentAsPopularFallback();
  }
};

const loadRecentAsPopularFallback = async () => {
  const heading = document.getElementById("popular-heading");
  if (heading) heading.textContent = "Editor's picks";

  try {
    const url = buildApiUrl("/wp/v2/posts", {
      _embed: 1,
      per_page: 4,
      orderby: "date",
      order: "desc",
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Couldn't fetch recent posts");

    const data = await response.json();
    renderPopular(
      data.map((post) => ({
        title: stripHtml(post.title?.rendered || ""),
        link: post.link,
        image: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
        stat: "",
      })),
    );
  } catch (error) {
    console.error("Failed to load popular posts fallback:", error.message);
  }
};
