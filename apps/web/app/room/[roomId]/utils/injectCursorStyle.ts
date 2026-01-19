export function injectCursorStyle(
  userId: string,
  color: string
) {
  const id = `cursor-style-${userId}`;
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;

  style.innerHTML = `
    .cursor-${userId} {
      color: ${color};
      border-left: 2px solid ${color};
    }
  `;

  document.head.appendChild(style);
}
