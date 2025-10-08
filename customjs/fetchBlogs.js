"use strict";

/**
 * Fetches blogs from a remote server
 * @param {HTMLElement} element
 * @returns JSON
 */

const fetchBlogs = async (element = null) => {
  // loadMessage("Loading...🚀", element);
  try {
    const response = await fetch("https://reframe-api.herokuapp.com/news");
    if (!response.ok) {
      throw new Error("Couldn't fetch blogs'");
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const newsBlog = document.getElementById("blog-container");
  const paginate = newsBlog?.dataset?.home === "1";
  if (newsBlog) {
    await renderBlogs_(newsBlog, paginate);
  }
});

const renderBlogs_ = async (element = null, paginate = false) => {
  if (!element) return;

  // Show loading text
  element.innerHTML = `<p style="text-align:center; padding: 20px;">Loading blogs...</p>`;

  const blogs = await processBlogs(paginate);

  if (!blogs.success) {
    console.error("Failed to load blogs:", blogs.message);
    element.innerHTML = `<p style="text-align:center; padding: 20px; color: red;">Failed to load blogs.</p>`;
    return;
  }

  const blogsData = blogs?.data ?? [];

  if (blogsData.length === 0) {
    console.warn("No blog data available.");
    element.innerHTML = `<p style="text-align:center; padding: 20px;">No blog data available.</p>`;
    return;
  }

  const chunkSize = 3;
  const chunkArray = (arr, size) =>
    arr.reduce((acc, _, i) => {
      if (i % size === 0) acc.push(arr.slice(i, i + size));
      return acc;
    }, []);

  const blogChunks = chunkArray(blogsData, chunkSize);

  const bgColors = ["#ff9343", "#72ccca", "#ff6865"];

  const blogHTML = blogChunks
    .map((chunk, index) => {
      return `
              <div class="row" style="margin-top: 30px;">
    <div class="col-12 p-md-0">
        <ul class="blog-only-text blog-wrapper grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                  ${chunk
                    .map((blog, j) => {
                      const bgColor = bgColors[j % bgColors.length];

                      return `
                              <li class="grid-item">
                <div class="card border-radius-0px border-0 h-100 overflow-hidden" style="background-color: ${bgColor};">
                    <div class="card-body hover-box dark-hover p-15 lg-p-10">
                        <img src="${
                          blog?.image === ""
                            ? "images-copy/involved.jpg"
                            : blog?.image
                        }" class="hover-img" referrerpolicy="no-referrer" alt="">
                        <a href="${
                          blog?.link
                        }" class="categories-btn ms-0 bg-white text-dark-gray text-uppercase fw-600 mb-70px">${
                        blog?.category
                      }</a>
                        <a href="${
                          blog?.link
                        }" class="fs-13 text-uppercase d-block mb-5px text-dark-gray fw-500 mt-60px">${formatDate(
                        blog?.date ?? null
                      )}</a>
                        <a href="${
                          blog?.link
                        }" class="card-title d-block fs-22 sm-fs-20 ls-minus-05px fw-500 text-dark-gray mb-0 w-90 lg-w-100">${
                        blog?.description
                      }</a>
                    </div>
                </div>
            </li>`;
                    })
                    .join("")}
              </ul>
          </div>
      </div>`;
    })
    .join("");

  element.innerHTML = "";
  element.insertAdjacentHTML("afterbegin", blogHTML);
};

const formatDate = (dateString) => {
  if (dateString === null) return "";
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const filterArr = (arr, category) => {
  const returnedArray = arr
    .filter((blog) => blog.category.includes(category))
    .slice(0, 3);

  return returnedArray;
};

const fetchBlogs2 = async () => {
  try {
    const response = await fetch(
      "https://blogs.wearecohere.org/index.php?rest_route=/wp/v2/posts&_embed"
    );
    if (!response.ok) {
      throw new Error("Couldn't fetch blogs'");
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const processBlogs = async (paginate = false) => {
  try {
    const { data: blogs } = await fetchBlogs2();

    let data = blogs.map((blog, i) => {
      // Better handling of featured media
      let featuredImage = "";

      if (blog?._embedded?.["wp:featuredmedia"]?.[0]) {
        const media = blog._embedded["wp:featuredmedia"][0];

        // Try different image sizes in order of preference
        if (media.media_details?.sizes?.large?.source_url) {
          featuredImage = media.media_details.sizes.large.source_url;
        } else if (media.media_details?.sizes?.medium?.source_url) {
          featuredImage = media.media_details.sizes.medium.source_url;
        } else if (media.source_url) {
          featuredImage = media.source_url;
        }
      }

      return {
        description: blog?.title?.rendered ?? "",
        date: blog?.date,
        link: blog?.link,
        category: "blog",
        image: featuredImage,
      };
    });

    if (paginate) {
      data = data.slice(0, 3);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};
