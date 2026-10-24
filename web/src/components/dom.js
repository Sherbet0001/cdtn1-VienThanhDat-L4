// Tạo phần tử DOM an toàn: nội dung luôn là văn bản (textContent), dữ liệu từ API không thể chèn mã HTML.

/**
 * @param {string} tag
 * @param {Record<string, any>} [thuocTinh] on* là trình xử lý sự kiện; class, value... là thuộc tính.
 * @param {...(Node|string|null|false)} con
 */
export function h(tag, thuocTinh = {}, ...con) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(thuocTinh)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...con.filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}
