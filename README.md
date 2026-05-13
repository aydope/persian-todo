# Persian Todo (وظیفه من)

A beautiful Persian (RTL) To-Do app with drag & drop, session management, and image export.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- Add tasks with title and description
- Categorize tasks (Personal, Work, Important)
- Mark tasks as completed
- Delete tasks
- Drag & drop to reorder
- Session storage info panel (size + item count)
- Clear session
- Export any task as PNG image
- Image preview popup before download
- Share exported images
- Watermark with project name and URL
- Smooth animations (GSAP)
- Fully responsive

---

## Tech Stack

| Tech | Usage |
|------|-------|
| HTML5 | Structure |
| TailwindCSS | Styling (internal) |
| jQuery 3.7.1 | DOM manipulation (internal) |
| GSAP 3.x | Animations (internal) |
| Bootstrap Icons | Icon set (internal) |
| Canvas API | Image generation |
| sessionStorage | Data persistence |

---

## How to Run

Clone or download, then open `index.html`. No install needed.

```bash
git clone <repo-url>
cd persian-todo
open index.html
```

---

## Notes

Tasks are saved only while the tab is open.
