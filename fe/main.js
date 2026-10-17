const items = document.querySelectorAll(".faq-item");

items.forEach((item) => {
  const button = item.querySelector(".faq-q");
  const mark = item.querySelector(".faq-mark");

  button.addEventListener("click", () => {
    const open = item.classList.toggle("is-open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
    mark.textContent = open ? "−" : "+";
  });
});
