document.addEventListener("DOMContentLoaded",()=>{let p=location.pathname.split("/").pop().toLowerCase()||"index.html";document.querySelectorAll(".links a").forEach(a=>{let x=a.getAttribute("href").split("/").pop().split("?")[0].split("#")[0].toLowerCase();a.classList.toggle("active",x===p);if(x===p)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")})});
// ==========================================
// DUNE FUTURE - DISCORD INVITE
// ==========================================

const DISCORD_INVITE = "https://discord.gg/j5vbakqmg";

document.querySelectorAll(
  'a[href*="discord.gg"], a[href*="discord.com/invite"]'
).forEach(link => {
  link.href = DISCORD_INVITE;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});
