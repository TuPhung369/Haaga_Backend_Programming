import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Editor as TinyMCEEditorType } from "tinymce";

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  onEnterPress?: (content: string) => void;
  onFocus?: () => void;
  outputFormat?: "html" | "text";
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value,
  onChange,
  height = 350,
  placeholder = "Type your message here...",
  disabled = false,
  onEnterPress,
  onFocus,
  outputFormat = "html",
}) => {
  const calculatedHeight = height;
  const editorRef = useRef<TinyMCEEditorType | null>(null);

  // Chúng ta sẽ xử lý Ctrl+Enter trực tiếp trong setup của TinyMCE
  // thay vì sử dụng document.addEventListener

  return (
    <Editor
      apiKey="jjngo8rmbcc8mtstxmg2z2hv2b6vvl8zano0j2j3is0paqd3"
      onInit={(evt, editor) => {
        editorRef.current = editor;

        editor.on("focus", () => {
          if (onFocus) {
            onFocus();
          }
        });
      }}
      value={value}
      onEditorChange={(newValue, editor) => {
        if (outputFormat === "text" && editor) {
          const textContent = editor.getContent({ format: "text" });
          onChange(textContent);
        } else {
          const htmlContent = editor ? editor.getContent() : newValue;
          onChange(htmlContent);
        }
      }}
      disabled={disabled}
      init={{
        height: calculatedHeight,
        menubar: true,
        statusbar: false,
        plugins: [
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
          "nonbreaking",
          "pagebreak",
          "quickbars",
          "help",
          "visualblocks",
          "visualchars",
          "preview",
          "anchor",
          "importcss",
          "directionality",
        ],
        toolbar:
          "undo redo | formatselect fontfamily fontsize | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image table | forecolor backcolor | removeformat code",
        toolbar_location: "top",
        toolbar_sticky: true,
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; margin: 8px; line-height: 1.5; overflow-y: auto; max-height: 350px; } " +
          ".mce-content-body p { margin: 0; margin-bottom: 8px; } " +
          "img { max-width: 100%; height: auto; } " +
          "table { border-collapse: collapse; } " +
          "table td, table th { border: 1px solid #333; padding: 5px; } " +
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
        resize: false,
        min_height: 200,
        scrollbar_width: 10,
        overflow_y: "auto",
        skin: "oxide",
        keep_styles: true,
        keep_selection: true,
        entity_encoding: "raw",
        convert_urls: false,
        cleanup: false,
        verify_html: false,
        visual: true,
        preserve_cdata: true,
        preserve_elements: "ul,ol,li",
        lists_indent_on_tab: true,
        forced_root_block: "p",
        browser_spellcheck: true,
        advlist_bullet_styles: "default",
        advlist_number_styles: "default",
        lists_class_name: "tinymce-list",
        convert_newlines_to_brs: false,
        remove_trailing_brs: true,
        // Removed duplicate statusbar and menubar properties
        elementpath: false,
        toolbar_mode: "floating",
        auto_focus: "tinymce", // Changed from false to a string value
        // Removed duplicate toolbar_sticky and toolbar_location
        // Removed deprecated paste options (TinyMCE 7.0 migration)
        paste_webkit_styles: "color font-size",
        valid_elements: "*[*]",
        extended_valid_elements:
          "li[class|style],ul[class|style],ol[class|style]",
        end_container_on_empty_block: true,
        indent_use_margin: true,
        indent: true,
        paste_as_text: false,
        paste_merge_formats: false,
        // Removed duplicate paste_webkit_styles
        paste_remove_styles_if_webkit: true,
        paste_block_drop: false,
        custom_shortcuts: true,
        enter_behavior: "p",

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
        font_family_formats:
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
          "Verdana=verdana,geneva;",

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
        color_picker_callback: function (callback) {
          callback("#000000");
        },
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
        style_formats: [
          { title: "Paragraph", format: "p" },
          { title: "Heading 1", format: "h1" },
          { title: "Heading 2", format: "h2" },
          { title: "Heading 3", format: "h3" },
          { title: "Heading 4", format: "h4" },
          { title: "Heading 5", format: "h5" },
          { title: "Heading 6", format: "h6" },
          { title: "Blockquote", format: "blockquote" },
          { title: "Code", format: "code" },
          { title: "Pre", format: "pre" },
        ],
        block_formats:
          "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Blockquote=blockquote; Pre=pre",

        quickbars_selection_toolbar:
          "bold italic underline | formatselect | quicklink blockquote",
        quickbars_insert_toolbar: false,

        // Đăng ký phím tắt Ctrl+Enter để gửi tin nhắn
        setup: (editor) => {
          // Xử lý Ctrl+Enter thông qua sự kiện keydown
          editor.on("keydown", function (e) {
            // Kiểm tra nếu là Ctrl+Enter
            if (e.keyCode === 13 && e.ctrlKey) {
              console.log("TinyMCE: Ctrl+Enter keydown event detected");
              e.preventDefault();

              const htmlContent = editor.getContent();
              const content =
                outputFormat === "text"
                  ? editor.getContent({ format: "text" })
                  : htmlContent;

              console.log(
                "TinyMCE: Content to send:",
                content.substring(0, 50) + "..."
              );
              console.log(
                "TinyMCE: onEnterPress function exists:",
                !!onEnterPress
              );

              if (onEnterPress && content.trim()) {
                console.log("TinyMCE: Calling onEnterPress function");

                // IMPORTANT: Get the current selected contact from Redux store
                // This ensures we're using the most up-to-date contact information
                import("../store/store")
                  .then(({ default: store }) => {
                    const state = store.getState();
                    const selectedContact = state.chat.selectedContact;
                    const groups = state.chat.groups || [];

                    console.log(
                      "TinyMCE: Current Redux store selectedContact:",
                      selectedContact
                    );

                    // Check if the selected contact is a group
                    const isGroup =
                      selectedContact &&
                      groups.some((group) => group.id === selectedContact.id);
                    console.log("TinyMCE: Is group message:", isGroup);

                    // Pass both the content and a flag indicating if this is a group message
                    onEnterPress(content);

                    console.log(
                      "TinyMCE: onEnterPress function called successfully"
                    );

                    // Clear the editor content after sending
                    editor.setContent("");
                  })
                  .catch((error) => {
                    console.error("TinyMCE: Error getting store:", error);

                    // Fallback to original behavior if there's an error
                    onEnterPress(content);
                    editor.setContent("");
                  });
              }

              return false;
            }
          });

          // Vẫn giữ lại shortcut để đảm bảo tương thích
          // Nhưng chúng ta sẽ vô hiệu hóa nó vì chúng ta đã xử lý Ctrl+Enter thông qua sự kiện keydown
          editor.addShortcut("ctrl+13", "Send message", function () {
            console.log("TinyMCE: Ctrl+Enter shortcut triggered - DISABLED");
            // Không làm gì cả, vì chúng ta đã xử lý Ctrl+Enter thông qua sự kiện keydown
            return true;
          });

          // Xử lý phím Tab trong danh sách
          editor.on("keydown", function (e) {
            if (e.keyCode === 9) {
              const node = editor.selection.getNode();
              const isInList =
                node.nodeName === "LI" || node.closest("li") !== null;

              if (isInList) {
                e.preventDefault();

                setTimeout(() => {
                  if (e.shiftKey) {
                    editor.execCommand("Outdent");
                  } else {
                    editor.execCommand("Indent");
                  }
                }, 0);

                return false;
              }
            }
          });
        },
      }}
    />
  );
};

export default TinyMCEEditor;

