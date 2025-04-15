import React, { useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  disabled?: boolean;
  onEnterPress?: (content: string) => void; // Callback for when Enter is pressed, now with content
  onFocus?: () => void;
  outputFormat?: "html" | "text";
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value,
  onChange,
  height = 300,
  placeholder = "Type your message here...",
  disabled = false,
  onEnterPress,
  onFocus,
  outputFormat = "html",
}) => {
  // Sử dụng any vì TinyMCE editor instance không có kiểu TypeScript cụ thể
  const editorRef = useRef<any>(null);

  // Sử dụng useEffect để xử lý phím Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý Ctrl+Enter
      if (
        e.key === "Enter" &&
        e.ctrlKey &&
        editorRef.current &&
        document.activeElement === editorRef.current.getElement()
      ) {
        console.log("Global Ctrl+Enter detected");
        e.preventDefault();

        // Lấy nội dung hiện tại
        if (editorRef.current) {
          const content = outputFormat === "text"
            ? editorRef.current.getContent({ format: "text" })
            : editorRef.current.getContent();
          
          console.log("Current content:", content);
          
          // Gọi callback với nội dung hiện tại
          if (onEnterPress) {
            onEnterPress(content);
          }
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEnterPress, onChange, outputFormat]);

  return (
    <Editor
      // Sử dụng CDN thay vì self-hosted
      apiKey="jjngo8rmbcc8mtstxmg2z2hv2b6vvl8zano0j2j3is0paqd3" // Giá trị giả để tránh lỗi
      onInit={(evt, editor) => {
        editorRef.current = editor;

        // Add focus handler
        editor.on("focus", () => {
          if (onFocus) {
            onFocus();
          }
        });
      }}
      value={value}
      onEditorChange={(newValue, editor) => {
        // Xử lý định dạng đầu ra dựa trên thuộc tính outputFormat
        if (outputFormat === "text" && editor) {
          // Nếu cần văn bản thuần, lấy nội dung dưới dạng văn bản
          const textContent = editor.getContent({ format: "text" });
          onChange(textContent);
        } else {
          // Mặc định trả về HTML
          onChange(newValue);
        }
      }}
      disabled={disabled}
      init={{
        height,
        menubar: false,
        statusbar: false,
        plugins: [
          "autoresize",
          "autolink",
          "lists",
          "advlist", // Thêm plugin advlist để cải thiện danh sách
          "link",
          "image",
          "charmap",
          "searchreplace",
          "media",
          "emoticons",
          "paste", // Thêm plugin paste để xử lý dán nội dung tốt hơn
        ],
        toolbar:
          "bold italic | bullist numlist indent outdent | link image | emoticons",
        toolbar_location: "top",
        toolbar_sticky: true,
        toolbar_mode: "sliding",
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; margin: 8px; }",
        placeholder,
        autoresize_bottom_margin: 10,
        autoresize_min_height: 80,
        autoresize_max_height: 300,
        skin: "oxide",
        // Giữ vị trí con trỏ khi cập nhật nội dung
        keep_styles: true,
        keep_selection: true,
        // Cấu hình xử lý nội dung
        entity_encoding: "raw",
        convert_urls: false,
        cleanup: false,
        verify_html: false,
        visual: true,
        // Cấu hình danh sách
        lists_indent_on_tab: true,
        forced_root_block: "p",
        browser_spellcheck: true,
        // Cấu hình phím tắt
        custom_shortcuts: false, // Tắt phím tắt mặc định
        // Cấu hình xử lý Enter
        enter_behavior: "br", // Sử dụng <br> thay vì <p> khi nhấn Enter
        // Cấu hình định dạng
        formats: {
          p: { block: "p" },
          h1: { block: "h1" },
          h2: { block: "h2" },
          h3: { block: "h3" },
          h4: { block: "h4" },
          h5: { block: "h5" },
          h6: { block: "h6" },
          bold: { inline: "strong" },
          italic: { inline: "em" },
        },
        // Custom setup to handle key events
        setup: (editor) => {
          // Lưu vị trí con trỏ trước khi cập nhật nội dung
          let bookmark;

          editor.on("BeforeSetContent", function () {
            // Lưu vị trí con trỏ hiện tại
            if (editor.selection) {
              bookmark = editor.selection.getBookmark(2, true);
            }
          });

          editor.on("SetContent", function () {
            // Khôi phục vị trí con trỏ sau khi nội dung được cập nhật
            if (bookmark && editor.selection) {
              editor.selection.moveToBookmark(bookmark);
              bookmark = null;
            }
          });

          // Đăng ký phím tắt Ctrl+Enter để gửi tin nhắn
          editor.addShortcut("ctrl+13", "Send message", function () {
            console.log("Ctrl+Enter shortcut triggered");

            // Lấy nội dung hiện tại
            const content = outputFormat === "text" 
              ? editor.getContent({ format: "text" }) 
              : editor.getContent();
            
            console.log("Current content before sending (shortcut):", content);
            
            // Gọi callback với nội dung hiện tại
            if (onEnterPress) {
              onEnterPress(content);
            }
            
            return true;
          });

          // Xử lý tất cả các sự kiện phím trong một trình xử lý duy nhất
          editor.on("keydown", function (e) {
            console.log(
              "Key pressed:",
              e.key,
              "Ctrl:",
              e.ctrlKey,
              "Shift:",
              e.shiftKey
            );

            // Kiểm tra xem có đang ở trong danh sách hay không
            const isInList =
              editor.queryCommandState("InsertUnorderedList") ||
              editor.queryCommandState("InsertOrderedList");

            console.log("Is in list:", isInList);

            // Xử lý Shift+Enter để xuống dòng
            if (e.key === "Enter" && e.shiftKey) {
              console.log("Shift+Enter detected, inserting new line");
              // Cho phép hành vi mặc định
              return true;
            }

            // Nếu đang ở trong danh sách, cho phép Enter tạo mục mới trong danh sách
            if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && isInList) {
              console.log("Enter in list detected, creating new list item");
              // Cho phép hành vi mặc định của Enter trong danh sách
              return true;
            }

            // Xử lý Enter để gửi tin nhắn (chỉ khi không ở trong danh sách)
            if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !isInList) {
              console.log("Enter outside list detected, sending message");
              e.preventDefault();

              // Lấy nội dung hiện tại
              const content = outputFormat === "text"
                ? editor.getContent({ format: "text" })
                : editor.getContent();
              
              console.log("Current content before sending:", content);
              
              // Gọi callback với nội dung hiện tại
              if (onEnterPress) {
                onEnterPress(content);
              }
              
              return false;
            }
          });
        },
      }}
    />
  );
};

export default TinyMCEEditor;

