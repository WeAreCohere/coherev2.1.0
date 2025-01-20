// Function to count up numbers
function countUp(el, start, end, duration) {
    let current = start;
    const increment = (end - start) / (duration /20 ); // Update every 20ms
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        el.textContent = Math.floor(end); // Ensure it ends exactly at the target
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, 20);
  }
  
  // Observe when the section is in view
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Select all the counter elements within the target section
          const counters = entry.target.querySelectorAll('.vertical-counter');
          counters.forEach(counter => {
            const target = +counter.getAttribute('data-to');
            const prefix = counter.getAttribute('data-prefix') || ''; // Add prefix if available
            countUp(counter, 0, target, 2000); // Count to the target in 2 seconds
          });
          observer.disconnect(); // Disconnect after the animation has run
        }
      });
    },
    { threshold: 0.5 } // Trigger when 50% of the section is visible
  );
  
  // Apply the observer to the section with the .impact-section class
  const impactSection = document.querySelector('.impact-section');
  observer.observe(impactSection);
  