document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".links a");

  // Ambil nama halaman yang sedang dibuka
  let currentPage = window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();

  // GitHub Pages root = Home
  if (currentPage === "" || currentPage === "/") {
    currentPage = "index.html";
  }

  navLinks.forEach((link) => {
    const linkPage = link
      .getAttribute("href")
      .split("/")
      .pop()
      .toLowerCase();

    link.classList.remove("active");

    if (linkPage === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
});
