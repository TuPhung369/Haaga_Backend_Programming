const fs = require("fs-extra");
const path = require("path");

// Đường dẫn đến thư mục node_modules/tinymce
const tinymcePath = path.join(__dirname, "node_modules", "tinymce");

// Đường dẫn đến thư mục public/tinymce
const publicTinymcePath = path.join(__dirname, "public", "tinymce");

// Sao chép tất cả các tài nguyên từ node_modules/tinymce sang public/tinymce
fs.copySync(tinymcePath, publicTinymcePath, {
  filter: (src) => {
    // Bỏ qua các thư mục không cần thiết để giảm kích thước
    return !src.includes("node_modules") && !src.includes(".git");
  },
});

console.log("TinyMCE resources copied to public/tinymce");
