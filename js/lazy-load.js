"use strict";
import { imgObserver } from "./lazyLoading.min.js";

// Placeholder image (1x1 transparent pixel)
// Darker gray placeholder
const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM5OTk5OTkiLz48L3N2Zz4=";

// Function to convert regular images to lazy-loaded images
const prepareLazyImages = () => {
  const allImages = document.querySelectorAll("img:not([data-src])");

  allImages.forEach((img) => {
    // Skip if image is already processed or has no src
    if (img.hasAttribute("data-lazy-processed") || !img.src) return;

    // Store original src in data-src
    const originalSrc = img.src;
    img.dataset.src = originalSrc;

    // Replace with placeholder
    img.src = PLACEHOLDER;

    // Add lazy loading classes
    img.classList.add("lazy-image");

    // Mark as processed
    img.setAttribute("data-lazy-processed", "true");
  });
};

// Function to initialize lazy loading
const initLazyLoading = () => {
  // Prepare existing images for lazy loading
  prepareLazyImages();

  // Get all images with data-src (including newly prepared ones)
  const imgTargets = document.querySelectorAll("img[data-src]");

  if (imgTargets.length > 0) {
    imgTargets.forEach((img) => {
      imgObserver.observe(img);

      // Handle failed images with fallback
      img.onerror = (e) => {
        if (img.dataset.src && img.src !== PLACEHOLDER) {
          console.warn(`Failed to load image: ${img.dataset.src}`);
          img.classList.add("lazy-error");
          img.classList.remove("lazy-loading");
          // Keep placeholder on error
          img.src = PLACEHOLDER;
        }
      };
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLazyLoading);
} else {
  initLazyLoading();
}

// Re-initialize for dynamically added images
export const reinitLazyLoading = () => {
  prepareLazyImages();
  const newImgTargets = document.querySelectorAll(
    "img[data-src]:not([data-observed])"
  );

  newImgTargets.forEach((img) => {
    img.setAttribute("data-observed", "true");
    imgObserver.observe(img);
  });
};
