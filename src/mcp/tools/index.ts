import type { ToolSpec } from "../types.js";

// aiplacement
import { aiplacement_courseassist_tools } from "./aiplacement/courseassist.js";
import { aiplacement_editor_tools } from "./aiplacement/editor.js";

// block
import { block_recentlyaccesseditems_tools } from "./block/recentlyaccesseditems.js";
import { block_starredcourses_tools } from "./block/starredcourses.js";

// core
import { core_admin_tools } from "./core/admin.js";
import { core_ai_tools } from "./core/ai.js";
import { core_auth_tools } from "./core/auth.js";
import { core_backup_tools } from "./core/backup.js";
import { core_badges_tools } from "./core/badges.js";
import { core_block_tools } from "./core/block.js";
import { core_blog_tools } from "./core/blog.js";
import { core_calendar_tools } from "./core/calendar.js";
import { core_check_tools } from "./core/check.js";
import { core_cohort_tools } from "./core/cohort.js";
import { core_comment_tools } from "./core/comment.js";
import { core_competency_tools } from "./core/competency.js";
import { core_completion_tools } from "./core/completion.js";
import { core_contentbank_tools } from "./core/contentbank.js";
import { core_course_tools } from "./core/course.js";
import { core_courseformat_tools } from "./core/courseformat.js";
import { core_create_tools } from "./core/create.js";
import { core_customfield_tools } from "./core/customfield.js";
import { core_enrol_tools } from "./core/enrol.js";
import { core_fetch_tools } from "./core/fetch.js";
import { core_files_tools } from "./core/files.js";
import { core_filters_tools } from "./core/filters.js";
import { core_get_tools } from "./core/get.js";
import { core_grades_tools } from "./core/grades.js";
import { core_grading_tools } from "./core/grading.js";
import { core_group_tools } from "./core/group.js";
import { core_h5p_tools } from "./core/h5p.js";
import { core_message_tools } from "./core/message.js";
import { core_moodlenet_tools } from "./core/moodlenet.js";
import { core_my_tools } from "./core/my.js";
import { core_notes_tools } from "./core/notes.js";
import { core_payment_tools } from "./core/payment.js";
import { core_question_tools } from "./core/question.js";
import { core_rating_tools } from "./core/rating.js";
import { core_reportbuilder_tools } from "./core/reportbuilder.js";
import { core_role_tools } from "./core/role.js";
import { core_search_tools } from "./core/search.js";
import { core_sms_tools } from "./core/sms.js";
import { core_tag_tools } from "./core/tag.js";
import { core_update_tools } from "./core/update.js";
import { core_user_tools } from "./core/user.js";
import { core_webservice_tools } from "./core/webservice.js";
import { core_xapi_tools } from "./core/xapi.js";

// customfield
import { customfield_number_tools } from "./customfield/number.js";

// editor
import { editor_tiny_tools } from "./editor/tiny.js";

// enrol
import { enrol_guest_tools } from "./enrol/guest.js";
import { enrol_manual_tools } from "./enrol/manual.js";
import { enrol_meta_tools } from "./enrol/meta.js";
import { enrol_self_tools } from "./enrol/self.js";

// gradereport
import { gradereport_grader_tools } from "./gradereport/grader.js";
import { gradereport_overview_tools } from "./gradereport/overview.js";
import { gradereport_singleview_tools } from "./gradereport/singleview.js";
import { gradereport_user_tools } from "./gradereport/user.js";

// gradingform
import { gradingform_guide_tools } from "./gradingform/guide.js";
import { gradingform_rubric_tools } from "./gradingform/rubric.js";

// helpers
import { helpers_tools } from "./helpers/upload.js";

// message
import { message_airnotifier_tools } from "./message/airnotifier.js";
import { message_popup_tools } from "./message/popup.js";

// mod
import { mod_assign_tools } from "./mod/assign.js";
import { mod_bigbluebuttonbn_tools } from "./mod/bigbluebuttonbn.js";
import { mod_book_tools } from "./mod/book.js";
import { mod_choice_tools } from "./mod/choice.js";
import { mod_coursecertificate_tools } from "./mod/coursecertificate.js";
import { mod_data_tools } from "./mod/data.js";
import { mod_feedback_tools } from "./mod/feedback.js";
import { mod_folder_tools } from "./mod/folder.js";
import { mod_forum_tools } from "./mod/forum.js";
import { mod_glossary_tools } from "./mod/glossary.js";
import { mod_h5pactivity_tools } from "./mod/h5pactivity.js";
import { mod_imscp_tools } from "./mod/imscp.js";
import { mod_label_tools } from "./mod/label.js";
import { mod_lesson_tools } from "./mod/lesson.js";
import { mod_lti_tools } from "./mod/lti.js";
import { mod_page_tools } from "./mod/page.js";
import { mod_quiz_tools } from "./mod/quiz.js";
import { mod_resource_tools } from "./mod/resource.js";
import { mod_scorm_tools } from "./mod/scorm.js";
import { mod_subcourse_tools } from "./mod/subcourse.js";
import { mod_supervideo_tools } from "./mod/supervideo.js";
import { mod_url_tools } from "./mod/url.js";
import { mod_wiki_tools } from "./mod/wiki.js";
import { mod_workshop_tools } from "./mod/workshop.js";

// paygw
import { paygw_paypal_tools } from "./paygw/paypal.js";

// qbank
import { qbank_columnsortorder_tools } from "./qbank/columnsortorder.js";
import { qbank_editquestion_tools } from "./qbank/editquestion.js";
import { qbank_managecategories_tools } from "./qbank/managecategories.js";
import { qbank_tagquestion_tools } from "./qbank/tagquestion.js";
import { qbank_viewquestiontext_tools } from "./qbank/viewquestiontext.js";

// quizaccess
import { quizaccess_seb_tools } from "./quizaccess/seb.js";

// report
import { report_competency_tools } from "./report/competency.js";
import { report_insights_tools } from "./report/insights.js";

// tool
import { tool_admin_tools } from "./tool/admin.js";
import { tool_analytics_tools } from "./tool/analytics.js";
import { tool_behat_tools } from "./tool/behat.js";
import { tool_certificate_tools } from "./tool/certificate.js";
import { tool_dataprivacy_tools } from "./tool/dataprivacy.js";
import { tool_lp_tools } from "./tool/lp.js";
import { tool_mobile_tools } from "./tool/mobile.js";
import { tool_moodlenet_tools } from "./tool/moodlenet.js";
import { tool_policy_tools } from "./tool/policy.js";
import { tool_tcpdffonts_tools } from "./tool/tcpdffonts.js";
import { tool_templatelibrary_tools } from "./tool/templatelibrary.js";
import { tool_usertours_tools } from "./tool/usertours.js";
import { tool_xmldb_tools } from "./tool/xmldb.js";

export const ALL_TOOLS: ToolSpec[] = [
  // ...aiplacement_courseassist_tools,
  // ...aiplacement_editor_tools,
  // ...block_recentlyaccesseditems_tools,
  // ...block_starredcourses_tools,
  // ...core_admin_tools,
  // ...core_ai_tools,
  // ...core_auth_tools,
  // ...core_backup_tools,
  // ...core_badges_tools,
  // ...core_block_tools,
  // ...core_blog_tools,
  ...core_calendar_tools,
  // ...core_check_tools,
  // ...core_cohort_tools,
  // ...core_comment_tools,
  // ...core_competency_tools,
  // ...core_completion_tools,
  // ...core_contentbank_tools,
  // ...core_course_tools,
  // ...core_courseformat_tools,
  // ...core_create_tools,
  // ...core_customfield_tools,
  // ...core_enrol_tools,
  // ...core_fetch_tools,
  // ...core_files_tools,
  // ...core_filters_tools,
  // ...core_get_tools,
  // ...core_grades_tools,
  // ...core_grading_tools,
  // ...core_group_tools,
  // ...core_h5p_tools,
  // ...core_message_tools,
  // ...core_moodlenet_tools,
  // ...core_my_tools,
  // ...core_notes_tools,
  // ...core_payment_tools,
  // ...core_question_tools,
  // ...core_rating_tools,
  // ...core_reportbuilder_tools,
  // ...core_role_tools,
  // ...core_search_tools,
  // ...core_sms_tools,
  // ...core_tag_tools,
  // ...core_update_tools,
  // ...core_user_tools,
  ...core_webservice_tools,
  // ...core_xapi_tools,
  // ...customfield_number_tools,
  // ...editor_tiny_tools,
  // ...enrol_guest_tools,
  // ...enrol_manual_tools,
  // ...enrol_meta_tools,
  // ...enrol_self_tools,
  // ...gradereport_grader_tools,
  // ...gradereport_overview_tools,
  // ...gradereport_singleview_tools,
  // ...gradereport_user_tools,
  // ...gradingform_guide_tools,
  // ...gradingform_rubric_tools,
  // ...helpers_tools,
  // ...message_airnotifier_tools,
  // ...message_popup_tools,
  // ...mod_assign_tools,
  // ...mod_bigbluebuttonbn_tools,
  // ...mod_book_tools,
  // ...mod_choice_tools,
  // ...mod_coursecertificate_tools,
  // ...mod_data_tools,
  // ...mod_feedback_tools,
  // ...mod_folder_tools,
  // ...mod_forum_tools,
  // ...mod_glossary_tools,
  // ...mod_h5pactivity_tools,
  // ...mod_imscp_tools,
  // ...mod_label_tools,
  // ...mod_lesson_tools,
  // ...mod_lti_tools,
  // ...mod_page_tools,
  // ...mod_quiz_tools,
  // ...mod_resource_tools,
  // ...mod_scorm_tools,
  // ...mod_subcourse_tools,
  // ...mod_supervideo_tools,
  // ...mod_url_tools,
  // ...mod_wiki_tools,
  // ...mod_workshop_tools,
  // ...paygw_paypal_tools,
  // ...qbank_columnsortorder_tools,
  // ...qbank_editquestion_tools,
  // ...qbank_managecategories_tools,
  // ...qbank_tagquestion_tools,
  // ...qbank_viewquestiontext_tools,
  // ...quizaccess_seb_tools,
  // ...report_competency_tools,
  // ...report_insights_tools,
  // ...tool_admin_tools,
  // ...tool_analytics_tools,
  // ...tool_behat_tools,
  // ...tool_certificate_tools,
  // ...tool_dataprivacy_tools,
  // ...tool_lp_tools,
  // ...tool_mobile_tools,
  // ...tool_moodlenet_tools,
  // ...tool_policy_tools,
  // ...tool_tcpdffonts_tools,
  // ...tool_templatelibrary_tools,
  // ...tool_usertours_tools,
  // ...tool_xmldb_tools,
];

export function createToolMap(tools: ToolSpec[]) {
  const map = new Map<string, ToolSpec>();
  for (const t of tools) {
    if (map.has(t.name)) throw new Error(`Duplicate tool name: ${t.name}`);
    map.set(t.name, t);
  }
  return map;
}
