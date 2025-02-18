'use strict'

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
    const newsBlog = document.getElementById('blog-container');
    console.log(newsBlog)
    if (newsBlog) {
        await renderBlogs(newsBlog);
    }
});

const renderBlogs = async (element = null) => {

    // Fetch blogs
    const blogs = await fetchBlogs(element);
    console.log("Blogs fetched:", blogs);

    // Clear element before inserting new content
    element.innerHTML = "";

    // Show error if fetching failed
    if (!blogs.success) {
        console.error("Failed to load blogs:", blogs.message);
        return;
    }

    const { data } = blogs?.data?.results;
    const blogsData = data || []; 

    console.log("Blogs Data:", blogsData);

    // Exit if no blogs
    if (blogsData.length === 0) {
        console.warn("No blog data available.");
        return;
    }

    const chunkSize = 3;
    const chunkArray = (arr, size) =>
        arr.reduce((acc, _, i) => {
            if (i % size === 0) acc.push(arr.slice(i, i + size));
            return acc;
        }, []);

    const blogChunks = chunkArray(blogsData, chunkSize);

    const leftPositions = ["0%", "33.3296%", "66.6529%"];



    // Render blogs
    const blogHTML = blogChunks.map((chunk, index) => {
        return `
        <div class="row">
            <div class="col-12 p-md-0">
                <ul class="blog-only-text blog-wrapper grid grid-3col xl-grid-3col lg-grid-3col md-grid-2col sm-grid-2col xs-grid-1col gutter-large">
                    <li class="grid-sizer"></li>
                    ${chunk.map((blog,j) => {
                        const left = leftPositions[j % 3];
                        const top = Math.floor((index * 3 + j) / 3) * 200;
                        console.log("Top:", top);
                        console.log("left:", left);
                        return `
                        <li class="grid-item" style="position: absolute; left: ${left}; top: ${top}px; transition: none;">
                            <div class="card border-radius-0px border-0 h-100 overflow-hidden" style="background-color: ${blog.bgColor || '#ff9343'};">
                                <div class="card-body hover-box dark-hover p-15 lg-p-10">
                                    <img src="${blog.image_url || 'images-copy/involved.jpg'}" class="hover-img" alt="">
                                    <a href="#" class="categories-btn ms-0 bg-white text-dark-gray text-uppercase fw-600 mb-70px">${blog.category || 'Branding'}</a>
                                    <a href="#" class="fs-13 text-uppercase d-block mb-5px text-dark-gray fw-500 mt-60px">${blog.author || 'Jonse Robbert'}</a>
                                    <a href="${blog.url || '#'}" class="card-title d-block fs-22 sm-fs-20 ls-minus-05px fw-500 text-dark-gray mb-0 w-90 lg-w-100">
                                        ${blog.title || 'Default Title'}
                                    </a>
                                </div>
                            </div>
                        </li>`;
                    }).join('')}
                </ul>
            </div>
        </div>`;
    }).join('');


    element.insertAdjacentHTML('afterbegin', blogHTML);
};



const filterArr = (arr, category) => {
    const returnedArray = arr
        .filter((blog) => blog.category.includes(category))
        .slice(0, 3);

    return returnedArray;
};




