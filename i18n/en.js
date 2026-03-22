var i18n_en = {
  page_title: "Dashboard",
  page_title_admin: "Administration — doc-survival-kit",

  // Panel titles
  panel_taches_title: "myTasks",
  panel_notes_title: "myNotes",
  panel_liens_title: "myLinks",

  // mesTaches
  taches_subtitle: "everything I need to do",
  taches_input_placeholder: "New task…",
  taches_priority_normal: "Normal",
  taches_priority_urgent: "Urgent",
  taches_priority_later: "Later",
  taches_filter_all: "All",
  taches_filter_todo: "To do",
  taches_filter_done: "Done",
  taches_filter_urgent: "Urgent",
  taches_filter_normal: "Normal",
  taches_filter_later: "Later",
  taches_empty: "Nothing here yet.",
  taches_delete_title: "Delete",

  // mesNotes
  notes_subtitle: "everything I need to remember",
  notes_btn_edit_mode: "enter edit mode",
  notes_btn_quit_edit_mode: "exit edit mode",
  notes_btn_add: "+ new note",
  notes_empty: "No notes yet.",
  notes_btn_copy: "copy",
  notes_btn_copied: "copied ✓",
  notes_btn_edit_bloc: "edit",
  notes_btn_add_bloc: "+ add a block",
  notes_btn_edit_note: "edit",

  // mesLiens
  liens_subtitle: "everything I don't want to lose",
  liens_btn_edit_mode: "enter edit mode",
  liens_btn_quit_edit_mode: "exit edit mode",
  liens_btn_add_cat: "+ new category",
  liens_add_link_title: "Add a link",
  liens_del_cat_title: "Delete category",
  liens_edit_link_title: "Edit link",
  liens_del_link_title: "Delete link",

  // Colors
  color_green: "Green",
  color_violet: "Violet",
  color_amber: "Amber",
  color_sky: "Sky blue",
  color_rose: "Rose",
  color_teal: "Teal",

  // Common modals
  cancel: "Cancel",
  irreversible: "This action is irreversible.",
  irreversible_delete: "Delete",

  // Modal category
  modal_cat_title: "New category",
  modal_cat_label_name: "Name",
  modal_cat_placeholder_name: "e.g. Reading list…",
  modal_cat_label_color: "Color",
  modal_cat_btn_add: "Add",

  // Modal link
  modal_lien_title: "New link",
  modal_lien_label_name: "Name",
  modal_lien_placeholder_name: "e.g. Figma",
  modal_lien_label_desc: "Description",
  modal_lien_placeholder_desc: "e.g. UI design tool",
  modal_lien_label_url: "URL",
  modal_lien_btn_add: "Add",

  // Modal edit link
  modal_edit_lien_title: "Edit link",
  modal_edit_lien_btn_save: "Save",

  // Modal confirm delete link
  modal_suppr_lien_title: "Delete this link?",

  // Modal confirm delete category
  modal_suppr_cat_title: "Delete this category?",
  modal_suppr_cat_msg:
    "All links in this category will also be deleted. This action is irreversible.",

  // Modal note
  modal_note_title: "New note",
  modal_note_label_titre: "Title",
  modal_note_placeholder: "e.g. Git shortcuts…",
  modal_note_label_color: "Color",
  modal_note_btn_create: "Create",

  // Modal edit note
  modal_edit_note_title: "Edit note",
  modal_edit_note_btn_save: "Save",

  // Modal confirm delete note
  modal_suppr_note_title: "Delete this note?",
  modal_suppr_note_msg:
    "All blocks in this note will also be deleted. This action is irreversible.",

  // Modal block
  modal_bloc_label_type: "Type",
  modal_bloc_type_b: "Title",
  modal_bloc_type_p: "Text",
  modal_bloc_type_pre: "Code",
  modal_bloc_type_ul: "Bullet list",
  modal_bloc_type_table: "Table",
  modal_bloc_label_content: "Content",
  modal_bloc_new: "New block",
  modal_bloc_edit: "Edit block",
  modal_bloc_placeholder_ul: "One item per line…",
  modal_bloc_placeholder_pre: "Code…",
  modal_bloc_placeholder_b: "Title…",
  modal_bloc_placeholder_p: "Text…",
  modal_bloc_placeholder_table: "Header 1 | Header 2 | Header 3\nValue A | Value B | Value C\nValue D | Value E | Value F",
  modal_bloc_btn_save: "Save",

  // Modal confirm delete block
  modal_suppr_bloc_title: "Delete this block?",

  // Diagrams
  diag_page_title: "Diagrams",
  diag_btn_new: "+ New",
  diag_my_diagrams: "My diagrams",
  diag_new_diagram: "New diagram",
  diag_tool_select:  "Select / Move",
  diag_tool_rect:    "Rectangle",
  diag_tool_rounded: "Rounded rectangle",
  diag_tool_db:      "Database",
  diag_tool_cloud:   "External service / Cloud",
  diag_tool_text:    "Free text",
  diag_tool_arrow:   "Arrow (click source → click target, or drag from a connection dot)",
  diag_tool_delete:  "Delete selection (Del)",
  diag_edit_text: "Edit text",

  // Auto-save indicator
  save_indicator: "Saved",

  // Admin
  admin_subtitle: "data management",
  admin_why_title: "Auto-save",
  admin_why_p1:
    "The application automatically saves your data to the browser's <strong>localStorage</strong> on every change.",
  admin_why_p2:
    "This data <strong>persists</strong> even when closing the browser. Use JSON export to create an external backup.",
  admin_why_p3:
    "<strong>Warning:</strong> clearing localStorage is irreversible. Export your data first if you want to keep it.",
  admin_export_title: "Export / Import",
  admin_export_btn: "Export (JSON)",
  admin_export_desc: "Download all your data (tasks, notes, links, diagrams) as a JSON file.",
  admin_import_btn: "Import (JSON)",
  admin_import_desc: "Restore your data from a previously exported JSON file.",
  admin_import_confirm: "Import will replace all current data. Continue?",
  admin_import_success: "Import successful! The page will reload.",
  admin_import_error: "Error during import. Please check that the file is valid.",
  admin_reset_title: "Reset",
  admin_ls_label: "Clear localStorage",
  admin_ls_desc:
    "Deletes all tasks, notes, links and diagrams. The application will restart with default data.",
  admin_execute_btn: "clear data",
  admin_feedback_ls: "localStorage cleared.",
  admin_feedback_return: "Return to the dashboard to see the changes.",
  admin_lang_title: "Langue / Language",
  admin_lang_applied: "Language applied.",
};
