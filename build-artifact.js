#!/usr/bin/env node
// Собирает artifact.html для публикации как Claude Artifact:
// контент страницы без <!DOCTYPE>/<html>/<head>/<body> (их добавляет платформа),
// box-geometry.js вшит инлайном. Запуск: node build-artifact.js

const fs = require("fs");
const path = require("path");

const dir = __dirname;
let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const engine = fs.readFileSync(path.join(dir, "box-geometry.js"), "utf8");

html = html
  .replace(/^<!DOCTYPE html>\s*/i, "")
  .replace(/<html[^>]*>\s*/i, "")
  .replace(/<\/html>\s*$/i, "")
  .replace(/<\/?head>\s*/gi, "")
  .replace(/<\/?body>\s*/gi, "")
  .replace(/<meta[^>]*>\s*/gi, "")
  .replace('<script src="box-geometry.js"></script>', "<script>\n" + engine + "</script>");

html = '<style>html { color-scheme: light; }</style>\n' + html;

fs.writeFileSync(path.join(dir, "artifact.html"), html);
console.log("OK: artifact.html", html.length, "bytes");
