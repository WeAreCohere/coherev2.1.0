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

const renderBlogs = async (element = null) => {
    let html = ``;
    let colors;

    // fetch blogs
    const blogs = await fetchBlogs(element);

    //show error if it fails
    if (!blogs.success) {
        //   loadMessage(`${blogs.message}  🚩`, element);
        return;
    }

    const { data } = blogs?.data?.results;

    // Limit to only 3 blogs
    let firstThreeArticles;
    if (element.classList.contains("c-news")) {
        firstThreeArticles = filterArr(data, "news");
    } else if (element.classList.contains("c-jobs")) {
        firstThreeArticles = filterArr(data, "jobs");
    }


    firstThreeArticles.forEach((el, index) => {

        const timestamp = el?.date;

        // Remove the " UTC" part as it is not recognized by the Date object
        const formattedTimestamp = timestamp.replace(" UTC", "");

        // Create a Date object
        const date = new Date(formattedTimestamp);

        // Extract the month and day
        const month = date.getMonth(); // getMonth() returns 0-11, so add 1
        const day = date.getDate();

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];


        html += `<div class="col-xl-4 col-md-6">
                    <div class="blog-item blog-item--two">
                        <div class="blog-item__img">
                            <img style="height:17rem" src="${el?.image}" referrerpolicy="no-referrer" alt="Blog">
                        </div>
                        <div class="blog-item__content">
                            <div class="post-date-two">
                                <b>${day}</b>
                                <span>${monthNames[month]}</span>
                            </div>

                            <p style="font-weight: 700; color: black; font-size: 20px;"><a href="https://news.wearecohere.org${el?.permalink}">${el?.name}</a></p>
                                <p style="display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                ${el?.description}
                                </p>
                            <a href="https://news.wearecohere.org${el?.permalink}" class="read-more">Read More</a>
                        </div>
                    </div>
                </div>`;
    });

    element.innerHTML = "";
    // insert blogs under the news div
    element.insertAdjacentHTML("afterbegin", html);

    // lazyLoadBlog();
};

const filterArr = (arr, category) => {
    const returnedArray = arr
        .filter((blog) => blog.category.includes(category))
        .slice(0, 3);

    return returnedArray;
};


const newsBlog = document.querySelectorAll('.news__blog');

newsBlog.forEach(async el => {
    await renderBlogs(el);
})


