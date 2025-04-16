import React, { useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  rows?: number; // Added rows property
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
  // Use the provided height directly
  const calculatedHeight = height;
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
          const content =
            outputFormat === "text"
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
        height: calculatedHeight,
        menubar: false,
        statusbar: false,
        plugins: [
          // Modern plugins compatible with current TinyMCE version
          "autolink",
          "lists",
          "advlist",
          "link",
          "image",
          "charmap",
          "searchreplace",
          "media",
          "emoticons",
          "table",
          "code",
          "codesample",
          "wordcount",
          "fullscreen",
          "insertdatetime",
          // Removed textpattern which was failing to load
          "nonbreaking",
          "pagebreak",
          "quickbars",
          "help",
        ],
        toolbar:
          "undo redo | formatselect | bold italic underline | " +
          "alignleft aligncenter alignright | bullist numlist | " +
          "link image | forecolor backcolor | removeformat | code",
        // Removed toolbar_groups as it's causing issues with the floating toolbar mode
        // Using simple toolbar configuration instead
        toolbar_location: "top",
        toolbar_sticky: true,
        // Using default toolbar mode instead of sliding to avoid compatibility issues
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; margin: 8px; line-height: 1.5; overflow-y: auto; max-height: 300px; } " +
          ".mce-content-body p { margin: 0; margin-bottom: 8px; } " +
          "img { max-width: 100%; height: auto; } " +
          "table { border-collapse: collapse; } " +
          "table td, table th { border: 1px solid #ccc; padding: 5px; } " +
          "figure { margin: 0; } " +
          "figure figcaption { color: #999; font-size: 12px; margin-top: 5px; } " +
          "hr { border: 0; height: 1px; background: #ccc; margin: 10px 0; } " +
          "blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 10px; color: #666; } " +
          "pre { background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; padding: 10px; white-space: pre-wrap; } " +
          "code { background-color: #f5f5f5; border-radius: 3px; padding: 2px 4px; font-family: monospace; } " +
          "ul, ol { margin-top: 0; margin-bottom: 8px; padding-left: 20px; } " +
          "li { margin-bottom: 4px; } " +
          "li p { display: inline; margin: 0; }",
        placeholder,
        // Removed autoresize settings since we removed the plugin
        resize: false, // Disable manual resizing
        min_height: 200, // Minimum height (5 rows)
        scrollbar_width: 10, // Width of scrollbar
        overflow_y: "auto", // Enable vertical scrolling
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
        // Cấu hình đặc biệt cho danh sách
        advlist_bullet_styles: "default", // Chỉ sử dụng kiểu bullet mặc định
        advlist_number_styles: "default", // Chỉ sử dụng kiểu số mặc định
        lists_class_name: "tinymce-list", // Thêm class cho danh sách
        convert_newlines_to_brs: false, // Không chuyển đổi xuống dòng thành <br>
        remove_trailing_brs: true, // Xóa <br> ở cuối
        // Cấu hình nâng cao cho danh sách
        valid_elements: "*[*]", // Cho phép tất cả các phần tử
        extended_valid_elements:
          "li[class|style],ul[class|style],ol[class|style]",
        end_container_on_empty_block: true, // Thoát khỏi container khi gặp block trống
        indent_use_margin: false, // Sử dụng padding thay vì margin cho indent
        indent: false, // Tắt indent tự động
        paste_as_text: false, // Cho phép dán với định dạng
        paste_merge_formats: false, // Không gộp định dạng khi dán
        paste_webkit_styles: "none", // Không sử dụng style từ webkit khi dán
        paste_remove_styles_if_webkit: true, // Xóa style từ webkit khi dán
        paste_block_drop: false, // Cho phép kéo thả block
        // Cấu hình phím tắt
        custom_shortcuts: false, // Tắt phím tắt mặc định
        // Cấu hình xử lý Enter - sử dụng paragraph để tránh vấn đề với danh sách
        enter_behavior: "p", // Sử dụng <p> khi nhấn Enter để tách đoạn văn bản rõ ràng hơn

        // Cấu hình font size và font family
        fontsize_formats:
          "8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 36pt 48pt 72pt",
        font_formats:
          "Andale Mono=andale mono,times;" +
          "Arial=arial,helvetica,sans-serif;" +
          "Arial Black=arial black,avant garde;" +
          "Book Antiqua=book antiqua,palatino;" +
          "Comic Sans MS=comic sans ms,sans-serif;" +
          "Courier New=courier new,courier;" +
          "Georgia=georgia,palatino;" +
          "Helvetica=helvetica;" +
          "Impact=impact,chicago;" +
          "Symbol=symbol;" +
          "Tahoma=tahoma,arial,helvetica,sans-serif;" +
          "Terminal=terminal,monaco;" +
          "Times New Roman=times new roman,times;" +
          "Trebuchet MS=trebuchet ms,geneva;" +
          "Verdana=verdana,geneva;" +
          "Webdings=webdings;" +
          "Wingdings=wingdings,zapf dingbats",

        // Modern color settings
        color_map: [
          "#BFEDD2",
          "Light Green",
          "#FBEEB8",
          "Light Yellow",
          "#F8CAC6",
          "Light Red",
          "#ECCAFA",
          "Light Purple",
          "#C2E0F4",
          "Light Blue",
          "#2DC26B",
          "Green",
          "#F1C40F",
          "Yellow",
          "#E03E2D",
          "Red",
          "#B96AD9",
          "Purple",
          "#3598DB",
          "Blue",
          "#169179",
          "Dark Green",
          "#E67E23",
          "Orange",
          "#BA372A",
          "Dark Red",
          "#843FA1",
          "Dark Purple",
          "#236FA1",
          "Dark Blue",
          "#000000",
          "Black",
          "#525252",
          "Dark Gray",
          "#737373",
          "Gray",
          "#A6A6A6",
          "Light Gray",
          "#FFFFFF",
          "White",
        ],
        // Modern color picker settings
        color_picker_callback: function (callback) {
          callback("#000000");
        },
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
          underline: { inline: "u" },
          strikethrough: { inline: "strike" },
          superscript: { inline: "sup" },
          subscript: { inline: "sub" },
          code: { inline: "code" },
          blockquote: { block: "blockquote", wrapper: true },
          alignleft: {
            selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
            styles: { textAlign: "left" },
          },
          aligncenter: {
            selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
            styles: { textAlign: "center" },
          },
          alignright: {
            selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
            styles: { textAlign: "right" },
          },
          alignjustify: {
            selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
            styles: { textAlign: "justify" },
          },
        },

        // Cấu hình quickbars (thanh công cụ nhanh)
        quickbars_selection_toolbar:
          "bold italic underline | formatselect | quicklink blockquote",
        quickbars_insert_toolbar: "quickimage quicktable",
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
            const content =
              outputFormat === "text"
                ? editor.getContent({ format: "text" })
                : editor.getContent();

            console.log("Current content before sending (shortcut):", content);

            // Gọi callback với nội dung hiện tại
            if (onEnterPress) {
              onEnterPress(content);
            }

            return true;
          });

          // Xử lý các sự kiện khi nút trên toolbar được nhấn
          editor.on("BeforeExecCommand", function (e) {
            const cmd = e.command;

            // Khi người dùng nhấn nút tạo danh sách
            if (cmd === "InsertUnorderedList" || cmd === "InsertOrderedList") {
              console.log("List command detected:", cmd);

              // Lấy node hiện tại
              const currentNode = editor.selection.getNode();
              console.log("Current node:", currentNode.nodeName);

              // Kiểm tra xem đang ở trong danh sách hay không
              const isInList =
                editor.queryCommandState("InsertUnorderedList") ||
                editor.queryCommandState("InsertOrderedList");

              // Nếu đang ở trong danh sách, xử lý việc thoát khỏi danh sách
              if (isInList) {
                // Ngăn chặn hành vi mặc định
                e.preventDefault();

                // Lấy node hiện tại và tìm mục danh sách chứa nó
                const currentNode = editor.selection.getNode();
                const listItem = currentNode.closest("li");

                if (listItem) {
                  // Lấy nội dung của mục danh sách hiện tại
                  const content = listItem.innerHTML;

                  // Tạo một đoạn văn bản mới với nội dung của mục danh sách hiện tại
                  const newParagraph = editor.dom.create("p", {}, content);

                  // Thay thế mục danh sách hiện tại bằng đoạn văn bản mới
                  editor.dom.replace(newParagraph, listItem);

                  // Nếu danh sách không còn mục nào, xóa danh sách
                  const parentList = listItem.parentNode;
                  if (parentList && parentList.childNodes.length === 0) {
                    editor.dom.remove(parentList);
                  }

                  // Luôn đặt con trỏ về đầu dòng hiện tại (index 0 của current row)
                  console.log("Setting cursor to beginning of new paragraph");
                  editor.selection.setCursorLocation(newParagraph, 0);
                } else {
                  // Nếu không tìm thấy mục danh sách, sử dụng cách thông thường
                  if (editor.queryCommandState("InsertUnorderedList")) {
                    editor.execCommand("InsertUnorderedList");
                  } else if (editor.queryCommandState("InsertOrderedList")) {
                    editor.execCommand("InsertOrderedList");
                  }

                  // Đặt con trỏ vào đầu đoạn văn bản mới
                  setTimeout(() => {
                    const newNode = editor.selection.getNode();
                    editor.selection.setCursorLocation(newNode, 0);
                  }, 0);
                }

                return false;
              }

              // Nếu đang ở trong một đoạn văn bản (paragraph)
              if (currentNode.nodeName === "P") {
                // Ngăn chặn hành vi mặc định
                e.preventDefault();

                // Lưu vị trí con trỏ
                const selection = editor.selection.getBookmark();

                // Kiểm tra xem đoạn văn bản có chứa thẻ <br> hay không (đã sử dụng Shift+Enter)
                const hasBr = currentNode.innerHTML.includes("<br>");
                console.log("Paragraph contains <br>:", hasBr);

                // Nếu có thẻ <br>, chỉ chuyển đổi phần văn bản sau thẻ <br> cuối cùng thành danh sách
                if (hasBr) {
                  // Tìm vị trí của thẻ <br> cuối cùng
                  const lastBrIndex = currentNode.innerHTML.lastIndexOf("<br>");
                  console.log("Last <br> index:", lastBrIndex);

                  if (lastBrIndex !== -1) {
                    // Lấy nội dung sau thẻ <br> cuối cùng
                    const contentAfterBr = currentNode.innerHTML.substring(
                      lastBrIndex + 4
                    );
                    console.log("Content after last <br>:", contentAfterBr);

                    if (contentAfterBr.trim()) {
                      // Tạo danh sách mới với nội dung sau thẻ <br>
                      if (cmd === "InsertUnorderedList") {
                        // Cập nhật HTML của đoạn văn bản
                        currentNode.innerHTML =
                          currentNode.innerHTML.substring(0, lastBrIndex + 4) +
                          "<ul><li>" +
                          contentAfterBr +
                          "</li></ul>";

                        // Tìm thẻ ul mới tạo
                        setTimeout(() => {
                          const newList =
                            currentNode.querySelector("ul:last-child");
                          if (newList) {
                            // Tìm thẻ li đầu tiên trong danh sách
                            const firstLi =
                              newList.querySelector("li:first-child");
                            if (firstLi) {
                              // Đặt con trỏ vào đầu thẻ li
                              editor.selection.setCursorLocation(firstLi, 0);
                            }
                          }
                        }, 10);
                      } else {
                        // Cập nhật HTML của đoạn văn bản
                        currentNode.innerHTML =
                          currentNode.innerHTML.substring(0, lastBrIndex + 4) +
                          "<ol><li>" +
                          contentAfterBr +
                          "</li></ol>";

                        // Tìm thẻ ol mới tạo
                        setTimeout(() => {
                          const newList =
                            currentNode.querySelector("ol:last-child");
                          if (newList) {
                            // Tìm thẻ li đầu tiên trong danh sách
                            const firstLi =
                              newList.querySelector("li:first-child");
                            if (firstLi) {
                              // Đặt con trỏ vào đầu thẻ li
                              editor.selection.setCursorLocation(firstLi, 0);
                            }
                          }
                        }, 10);
                      }

                      console.log("Created list with content after <br>");
                      return false;
                    } else {
                      // Nếu không có nội dung sau thẻ <br>, tạo một mục danh sách trống
                      if (cmd === "InsertUnorderedList") {
                        currentNode.innerHTML =
                          currentNode.innerHTML.substring(0, lastBrIndex + 4) +
                          "<ul><li>&nbsp;</li></ul>";

                        // Tìm thẻ ul mới tạo
                        setTimeout(() => {
                          const newList =
                            currentNode.querySelector("ul:last-child");
                          if (newList) {
                            // Tìm thẻ li đầu tiên trong danh sách
                            const firstLi =
                              newList.querySelector("li:first-child");
                            if (firstLi) {
                              // Đặt con trỏ vào đầu thẻ li
                              editor.selection.setCursorLocation(firstLi, 0);
                            }
                          }
                        }, 10);
                      } else {
                        currentNode.innerHTML =
                          currentNode.innerHTML.substring(0, lastBrIndex + 4) +
                          "<ol><li>&nbsp;</li></ol>";

                        // Tìm thẻ ol mới tạo
                        setTimeout(() => {
                          const newList =
                            currentNode.querySelector("ol:last-child");
                          if (newList) {
                            // Tìm thẻ li đầu tiên trong danh sách
                            const firstLi =
                              newList.querySelector("li:first-child");
                            if (firstLi) {
                              // Đặt con trỏ vào đầu thẻ li
                              editor.selection.setCursorLocation(firstLi, 0);
                            }
                          }
                        }, 10);
                      }

                      console.log("Created empty list after <br>");
                      return false;
                    }
                  }
                } else {
                  // Nếu không có thẻ <br>, xử lý như trước
                  // Tạo một đoạn văn bản mới chỉ với nội dung được chọn
                  const selectedContent =
                    editor.selection.getContent() || currentNode.innerHTML;

                  // Nếu có nội dung được chọn, chỉ chuyển đổi nội dung đó thành danh sách
                  if (editor.selection.getContent()) {
                    // Xóa nội dung được chọn
                    editor.selection.setContent("");

                    // Chèn danh sách mới với nội dung được chọn
                    if (cmd === "InsertUnorderedList") {
                      editor.execCommand(
                        "mceInsertContent",
                        false,
                        "<ul><li>" + selectedContent + "</li></ul>"
                      );
                    } else {
                      editor.execCommand(
                        "mceInsertContent",
                        false,
                        "<ol><li>" + selectedContent + "</li></ol>"
                      );
                    }
                  } else {
                    // Nếu không có nội dung được chọn, chuyển đổi toàn bộ đoạn văn bản hiện tại
                    // Lưu nội dung hiện tại
                    const content = selectedContent;

                    // Xóa nội dung hiện tại của đoạn văn bản
                    currentNode.innerHTML = "";

                    // Tạo danh sách mới tại vị trí hiện tại
                    if (cmd === "InsertUnorderedList") {
                      editor.execCommand(
                        "mceInsertContent",
                        false,
                        "<ul><li>" + content + "</li></ul>"
                      );
                    } else {
                      editor.execCommand(
                        "mceInsertContent",
                        false,
                        "<ol><li>" + content + "</li></ol>"
                      );
                    }

                    // Xóa đoạn văn bản trống
                    if (currentNode.innerHTML === "") {
                      editor.dom.remove(currentNode);
                    }
                  }
                }

                // Đặt con trỏ về đầu dòng hiện tại
                setTimeout(() => {
                  // Tìm thẻ li đầu tiên trong danh sách mới tạo
                  const newList = editor.dom.select("ul,ol")[0];
                  if (newList) {
                    const firstLi = newList.querySelector("li:first-child");
                    if (firstLi) {
                      console.log(
                        "Setting cursor to beginning of new list item"
                      );
                      editor.selection.setCursorLocation(firstLi, 0);
                    }
                  }
                }, 10);

                return false;
              }
            }
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

            // Kiểm tra xem con trỏ có đang ở đầu dòng hay không
            const isAtStartOfLine =
              editor.selection.isCollapsed() &&
              editor.selection.getNode().textContent.length === 0;

            // Xử lý phím Tab để tăng mức độ lồng của danh sách
            if (e.key === "Tab" && !e.ctrlKey && !e.altKey && isInList) {
              e.preventDefault(); // Ngăn chặn hành vi mặc định của Tab

              // Lấy node hiện tại và tìm mục danh sách chứa nó
              const currentNode = editor.selection.getNode();
              const listItem = currentNode.closest("li");

              if (listItem) {
                if (e.shiftKey) {
                  // Shift+Tab: Giảm mức độ lồng (outdent)
                  console.log("Shift+Tab detected, decreasing list indent");

                  // Kiểm tra xem mục danh sách hiện tại có phải là mục con hay không
                  const parentList = listItem.parentNode;
                  const grandParentListItem =
                    parentList.parentNode.closest("li");

                  if (grandParentListItem) {
                    // Nếu là mục con, di chuyển nó ra ngoài
                    const grandParentList = grandParentListItem.parentNode;

                    // Tìm vị trí của mục cha trong danh sách cha
                    const index = Array.from(grandParentList.children).indexOf(
                      grandParentListItem
                    );

                    // Tạo một danh sách mới cho các mục sau mục hiện tại
                    const newList = editor.dom.clone(parentList, false);

                    // Di chuyển tất cả các mục sau mục hiện tại vào danh sách mới
                    let nextSibling = listItem.nextSibling;
                    while (nextSibling) {
                      const current = nextSibling;
                      nextSibling = nextSibling.nextSibling;
                      newList.appendChild(current);
                    }

                    // Chèn mục hiện tại sau mục cha trong danh sách cha
                    if (index < grandParentList.children.length - 1) {
                      grandParentList.insertBefore(
                        listItem,
                        grandParentList.children[index + 1]
                      );
                    } else {
                      grandParentList.appendChild(listItem);
                    }

                    // Nếu danh sách mới có mục, chèn nó sau mục hiện tại
                    if (newList.childNodes.length > 0) {
                      grandParentList.insertBefore(
                        newList,
                        listItem.nextSibling
                      );
                    }

                    // Nếu danh sách cũ không còn mục nào, xóa nó
                    if (parentList.childNodes.length === 0) {
                      editor.dom.remove(parentList);
                    }

                    // Đặt con trỏ vào đầu mục hiện tại
                    editor.selection.setCursorLocation(listItem, 0);
                  }
                } else {
                  // Tab: Tăng mức độ lồng (indent)
                  console.log("Tab detected, increasing list indent");

                  // Kiểm tra xem có mục danh sách trước mục hiện tại hay không
                  const prevListItem = listItem.previousSibling;

                  if (prevListItem) {
                    // Nếu có mục trước, thêm mục hiện tại vào danh sách con của mục trước

                    // Tìm hoặc tạo danh sách con trong mục trước
                    let subList = prevListItem.querySelector("ul, ol");
                    if (!subList) {
                      // Nếu mục trước chưa có danh sách con, tạo một danh sách con mới
                      // Sử dụng cùng loại danh sách (ul hoặc ol) với danh sách cha
                      const parentList = listItem.parentNode;
                      subList = editor.dom.create(
                        parentList.nodeName.toLowerCase()
                      );
                      prevListItem.appendChild(subList);
                    }

                    // Di chuyển mục hiện tại vào danh sách con
                    subList.appendChild(listItem);

                    // Đặt con trỏ vào đầu mục hiện tại
                    editor.selection.setCursorLocation(listItem, 0);
                  }
                }

                return false;
              }
            }

            console.log(
              "Is in list:",
              isInList,
              "Is at start of line:",
              isAtStartOfLine
            );

            // Xử lý Shift+Enter để xuống dòng
            if (e.key === "Enter" && e.shiftKey) {
              console.log("Shift+Enter detected, inserting new line");

              // Kiểm tra xem có đang ở trong danh sách hay không
              if (isInList) {
                // Ngăn chặn hành vi mặc định
                e.preventDefault();

                // Lấy node hiện tại và tìm mục danh sách chứa nó
                const currentNode = editor.selection.getNode();
                const listItem = currentNode.closest("li");

                if (listItem) {
                  // Lấy vị trí con trỏ hiện tại
                  const range = editor.selection.getRng();

                  // Lấy nội dung văn bản trước và sau vị trí con trỏ
                  let beforeText = "";
                  let afterText = "";

                  if (range.startContainer.nodeType === 3) {
                    // Node.TEXT_NODE
                    // Nếu đang ở trong một node văn bản
                    const textContent = range.startContainer.textContent;
                    beforeText = textContent.substring(0, range.startOffset);
                    afterText = textContent.substring(range.startOffset);

                    // Cập nhật node văn bản hiện tại chỉ với phần trước vị trí con trỏ
                    range.startContainer.textContent = beforeText;
                  } else {
                    // Nếu không phải node văn bản, lấy toàn bộ HTML của mục danh sách
                    beforeText = listItem.innerHTML;
                    afterText = "";
                  }

                  console.log("Before text:", beforeText);
                  console.log("After text:", afterText);

                  // Tạo một đoạn văn bản mới với phần sau vị trí con trỏ
                  const newParagraph = editor.dom.create(
                    "p",
                    {},
                    afterText || "&nbsp;"
                  );

                  // Tìm danh sách cha
                  const parentList = listItem.parentNode;

                  // Tìm mục danh sách tiếp theo (nếu có)
                  const nextListItem = listItem.nextSibling;

                  if (nextListItem) {
                    // Nếu có mục danh sách tiếp theo, chèn đoạn văn bản mới vào giữa danh sách
                    // Tạo một danh sách mới cho các mục sau mục hiện tại
                    const newList = editor.dom.clone(parentList, false);

                    // Di chuyển tất cả các mục sau mục hiện tại vào danh sách mới
                    let currentSibling = nextListItem;
                    while (currentSibling) {
                      const nextSibling = currentSibling.nextSibling;
                      newList.appendChild(currentSibling);
                      currentSibling = nextSibling;
                    }

                    // Chèn đoạn văn bản mới sau danh sách hiện tại
                    editor.dom.insertAfter(newParagraph, parentList);

                    // Chèn danh sách mới sau đoạn văn bản mới
                    if (newList.childNodes.length > 0) {
                      editor.dom.insertAfter(newList, newParagraph);
                    }
                  } else {
                    // Nếu không có mục danh sách tiếp theo, chèn đoạn văn bản mới sau danh sách
                    editor.dom.insertAfter(newParagraph, parentList);
                  }

                  // Đặt con trỏ vào đầu đoạn văn bản mới
                  console.log(
                    "Setting cursor to beginning of new paragraph after Shift+Enter"
                  );
                  editor.selection.setCursorLocation(newParagraph, 0);

                  console.log(
                    "Created new paragraph after list item with Shift+Enter"
                  );
                } else {
                  // Nếu không tìm thấy mục danh sách, sử dụng cách thông thường
                  editor.execCommand("mceInsertContent", false, "<br>");
                }

                return false;
              }

              // Cho phép hành vi mặc định nếu không ở trong danh sách
              return true;
            }

            // Nếu đang ở trong danh sách, xử lý Enter để tạo mục mới hoặc thoát khỏi danh sách
            if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && isInList) {
              console.log("Enter in list detected");

              // Lấy node hiện tại và tìm mục danh sách chứa nó
              const currentNode = editor.selection.getNode();
              const listItem = currentNode.closest("li");

              if (!listItem) {
                // Nếu không tìm thấy mục danh sách, cho phép hành vi mặc định
                return true;
              }

              // Nếu đang ở đầu dòng trống trong danh sách, thoát khỏi danh sách
              if (isAtStartOfLine) {
                console.log("Empty list item detected, exiting list");

                // Ngăn chặn hành vi mặc định
                e.preventDefault();

                // Tạo một đoạn văn bản mới trống
                const newParagraph = editor.dom.create("p", {}, "&nbsp;");

                // Tìm danh sách cha
                const parentList = listItem.parentNode;

                // Chèn đoạn văn bản mới sau danh sách
                editor.dom.insertAfter(newParagraph, parentList);

                // Xóa mục danh sách trống
                editor.dom.remove(listItem);

                // Nếu danh sách không còn mục nào, xóa danh sách
                if (parentList && parentList.childNodes.length === 0) {
                  editor.dom.remove(parentList);
                }

                // Đặt con trỏ vào đầu đoạn văn bản mới
                editor.selection.setCursorLocation(newParagraph, 0);

                return false;
              }

              // Lấy vị trí con trỏ trong mục danh sách
              const selection = editor.selection.getRng();
              const listItemContent = listItem.textContent;

              // Kiểm tra xem con trỏ có đang ở cuối mục danh sách hay không
              const isAtEndOfLine =
                selection.startOffset === listItemContent.length;

              if (isAtEndOfLine) {
                console.log("At end of list item, creating new item");
                // Cho phép hành vi mặc định để tạo mục mới
                return true;
              }

              // Nếu đang ở giữa mục danh sách, chia mục thành hai phần
              console.log("In middle of list item, splitting");
              // Cho phép hành vi mặc định để chia mục
              return true;
            }

            // Xử lý Enter để gửi tin nhắn (chỉ khi không ở trong danh sách)
            if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !isInList) {
              console.log("Enter outside list detected, sending message");
              e.preventDefault();

              // Lấy nội dung hiện tại
              const content =
                outputFormat === "text"
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

