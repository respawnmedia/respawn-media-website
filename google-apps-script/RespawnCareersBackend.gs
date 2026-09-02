/**
 * Respawn Media — Careers backend (Google Apps Script).
 *
 * Script Properties:
 *   CAREERS_API_SECRET  — shared with Vercel (never put in browser JS)
 *   RESUME_FOLDER_ID    — private Drive folder for resumes
 *   SPREADSHEET_ID      — optional if this script is not bound to the sheet
 *
 * Deploy as Web App: Execute as Me, Who has access: Anyone
 * (Vercel serverless functions call this URL server-side; the URL itself is not public.)
 */

var SETTINGS_SHEET = 'SITE_SETTINGS';
var ROLES_SHEET = 'ROLES';
var REQUIREMENTS_SHEET = 'REQUIREMENTS';
var QUESTIONS_SHEET = 'QUESTIONS';
var APPLICATIONS_SHEET = 'ALL_APPLICATIONS';

var ROLE_HEADERS = [
  'role_id', 'slug', 'title', 'category', 'department', 'location', 'work_mode',
  'schedule', 'experience', 'compensation', 'status', 'show_on_site',
  'accepting_applications', 'featured', 'sort_order', 'eyebrow',
  'short_description', 'full_description', 'created_at', 'updated_at'
];

var REQUIREMENT_HEADERS = [
  'requirement_id', 'role_id', 'requirement', 'enabled', 'highlight', 'sort_order'
];

var QUESTION_HEADERS = [
  'question_id', 'role_id', 'question_key', 'label', 'type', 'required',
  'enabled', 'placeholder', 'options', 'sort_order'
];

var APPLICATION_HEADERS = [
  'application_id', 'submitted_at', 'category', 'role_id', 'role_title',
  'full_name', 'whatsapp', 'email', 'current_city', 'instagram',
  'portfolio_urls', 'resume_url', 'years_experience', 'current_company',
  'availability', 'role_answers_json', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'utm_term', 'referrer', 'status',
  'rating', 'reviewer', 'internal_notes'
];

var UNIVERSAL_ANSWER_KEYS = {
  full_name: true,
  whatsapp: true,
  email: true,
  current_city: true,
  instagram: true,
  portfolio_urls: true,
  years_experience: true,
  current_company: true,
  availability: true
};

var ALLOWED_RESUME_EXT = { pdf: true, doc: true, docx: true };
var MAX_RESUME_BYTES = 10 * 1024 * 1024;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Respawn Careers')
    .addItem('1. Setup workbook', 'setupWorkbook')
    .addItem('2. Seed default data', 'seedDefaultCareersData')
    .addItem('3. Sync role tabs', 'syncRoleTabs')
    .addToUi();
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Set Script Property SPREADSHEET_ID or bind this script to the spreadsheet.');
}

function getScriptSecret_() {
  return PropertiesService.getScriptProperties().getProperty('CAREERS_API_SECRET') || '';
}

function setupWorkbook() {
  var ss = getSpreadsheet_();
  ensureSheet_(ss, SETTINGS_SHEET, ['key', 'value']);
  ensureSheet_(ss, ROLES_SHEET, ROLE_HEADERS);
  ensureSheet_(ss, REQUIREMENTS_SHEET, REQUIREMENT_HEADERS);
  ensureSheet_(ss, QUESTIONS_SHEET, QUESTION_HEADERS);
  ensureSheet_(ss, APPLICATIONS_SHEET, APPLICATION_HEADERS);
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var empty = existing.every(function (cell) { return cell === ''; });
  if (empty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function seedDefaultCareersData() {
  setupWorkbook();
  var ss = getSpreadsheet_();
  seedSettings_(ss);
  seedRoles_(ss);
  seedRequirements_(ss);
  seedQuestions_(ss);
}

function seedSettings_(ss) {
  var sheet = ss.getSheetByName(SETTINGS_SHEET);
  var existing = keyedRows_(sheet, 'key');
  var defaults = [
    ['hero_eyebrow', 'RESPAWN / CAREERS + COLLABORATORS'],
    ['hero_title', 'MAKE GOOD STUFF\nWITH US.'],
    ['hero_description', 'Full-time roles, paid internships and freelance collaborations for people who care about content, culture and craft.'],
    ['careers_email', 'respawnmediain@gmail.com'],
    ['instagram_handle', '@respawnmedia'],
    ['application_success_title', "GOT IT.\nWE'LL TAKE A LOOK."],
    ['application_success_message', "If your work feels like a fit, we'll get in touch."],
    ['freelance_intro', 'Respawn Media is building a dependable network of creators and production talent who can collaborate repeatedly across client projects, campaigns, shoots and content requirements. These are project collaborations, not permanent employment.']
  ];
  var toAppend = [];
  defaults.forEach(function (row) {
    if (!existing[row[0]]) toAppend.push(row);
  });
  if (toAppend.length) sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, 2).setValues(toAppend);
}

function nowIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss");
}

function seedRoles_(ss) {
  var sheet = ss.getSheetByName(ROLES_SHEET);
  var existing = keyedRows_(sheet, 'role_id');
  var ts = nowIso_();
  var roles = defaultRoles_(ts);
  var toAppend = [];
  roles.forEach(function (role) {
    if (!existing[role[0]]) toAppend.push(role);
  });
  if (toAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, ROLE_HEADERS.length).setValues(toAppend);
  }
}

function defaultRoles_(ts) {
  return [
    roleRow_('social-media-manager', 'social-media-manager', 'Social Media Manager', 'FULL-TIME', 'CONTENT', 'Chennai', 'Work from office', 'Mon–Sat', '2+ years', '₹20,000–₹35,000/month depending on skill and experience', 'OPEN', 'TRUE', 'TRUE', 'TRUE', 10, 'FULL-TIME', 'Own the social strategy. Lead the work.', 'Own social media strategy, monthly content plans, reel and content IPs, shoots, and coordination with creators, videographers and editors. This role is for people who already think about brands — not only views — and who can take ownership in a work-from-office Chennai team. Freshers are not the target.', ts),
    roleRow_('video-editor-ft', 'video-editor', 'Video Editor', 'FULL-TIME', 'EDITING', 'Chennai', 'Work from office', 'Mon–Sat', 'Around 2–3 years', '', 'OPEN', 'TRUE', 'TRUE', 'TRUE', 20, 'FULL-TIME', 'Editors who track how the internet actually cuts.', 'Professional editing with a strong music sense, pacing, and storytelling instinct. You notice how hooks, rhythms and styles change week to week, and you evolve your own cut accordingly. Portfolio quality is a major evaluation criterion.', ts),
    roleRow_('video-editor-intern', 'video-editor-intern', 'Video Editor Intern', 'INTERNSHIP', 'EDITING', 'Chennai', 'Work from office', 'Mon–Sat', 'Paid internship', 'Paid', 'OPEN', 'TRUE', 'TRUE', 'FALSE', 30, 'INTERNSHIP', 'Learn the cut beside the desk.', 'Paid internship in Chennai. Comfortable with professional video editing, Premiere Pro knowledge, and some proof of previous work. Eager to learn alongside the senior editor and team.', ts),
    roleRow_('content-creative-intern', 'content-creative-intern', 'Content + Creative Intern', 'INTERNSHIP', 'CONTENT', 'Chennai', 'Work from office', 'Mon–Sat', 'Paid internship', 'Paid', 'OPEN', 'TRUE', 'TRUE', 'FALSE', 40, 'INTERNSHIP', 'Curiosity, proof of trying, writing instincts.', 'Paid internship for people with some previous content creation, strong writing instincts, and a feel for hooks, reels and internet culture. You do not need to already know everything. Curiosity and evidence of trying things matter. Own page or proof of work is a major advantage.', ts),
    roleRow_('gen-ai-meta-ads-intern', 'gen-ai-meta-ads-intern', 'Gen AI + Meta Ads Intern', 'INTERNSHIP', 'AI + PERFORMANCE', 'Chennai', 'Work from office', 'Mon–Sat', 'Paid internship', 'Paid', 'OPEN', 'TRUE', 'TRUE', 'FALSE', 50, 'INTERNSHIP', 'Experiment first. Claim expertise later.', 'Paid internship for people who already use AI, try generative tools, and can show things they have actually built. Interest in Meta Ads, performance marketing, numbers and metrics. Curiosity and experimentation matter more than claiming expertise.', ts),
    roleRow_('creative-director-events-weddings', 'creative-director', 'Creative Director — Events + Weddings', 'FREELANCE', 'PRODUCTION', 'Chennai', 'Project basis', 'Project / day', 'Portfolio-led', '', 'ALWAYS_OPEN', 'TRUE', 'TRUE', 'FALSE', 60, 'FREELANCE', 'Own the story. Do not only shoot footage.', 'Freelance / project collaboration. Creatively own wedding and event content: storytelling, emotional moments, visual judgement, Vox Pops, post-event content, and reels people actually want to watch. Strong wedding or event portfolio is a major advantage. This is not a permanent employment role.', ts),
    roleRow_('iphone-videographer', 'iphone-videographer', 'iPhone Videographer', 'FREELANCE', 'PRODUCTION', 'Chennai', 'Project basis', 'Project / day', 'Portfolio-led', '', 'ALWAYS_OPEN', 'TRUE', 'TRUE', 'FALSE', 70, 'FREELANCE', 'Social-first footage. Recurring collaboration.', 'Freelance / project basis for wedding content, events, lifestyle coverage and storytelling-led shoots. Understands moments, emotion, framing and social-first capture. Dependable execution. Owning an expensive phone is not enough on its own.', ts),
    roleRow_('professional-videographer', 'pro-videographer', 'Professional Videographer', 'FREELANCE', 'PRODUCTION', 'Chennai', 'Project basis', 'Project / day', 'Portfolio-led', '', 'ALWAYS_OPEN', 'TRUE', 'TRUE', 'FALSE', 80, 'FREELANCE', 'DSLR / professional kit. Brand-aware shoots.', 'Freelance / project basis for brand shoots, campaigns, commercial productions and events. Strong camera knowledge, composition, briefs, and collaborative work with a creative team. Interested in recurring collaboration. Strong portfolio is a major advantage.', ts),
    roleRow_('ugc-creator', 'ugc-creator', 'UGC Creator', 'FREELANCE', 'CREATOR', 'India', 'Project basis', 'Project / day', 'Portfolio-led', '', 'ALWAYS_OPEN', 'TRUE', 'TRUE', 'FALSE', 90, 'FREELANCE', 'Make products feel native on social.', 'Freelance / project basis across FMCG, tech, lifestyle and food. Demos, reviews, aesthetic product videos and lifestyle-led content with real hooks — not ads wearing a costume. Strong existing product-led content is a major advantage.', ts),
    roleRow_('video-editor-freelance', 'video-editor-freelance', 'Freelance Video Editor', 'FREELANCE', 'EDITING', 'Remote / Chennai', 'Project basis', 'Project / turnaround', 'Portfolio-led', '', 'ALWAYS_OPEN', 'TRUE', 'TRUE', 'FALSE', 100, 'FREELANCE', 'Adapt the cut across brands and formats.', 'Freelance / project basis. Strong portfolio, pacing, music sense and contemporary editing styles. Can adapt across brands and formats. This is not the full-time Chennai desk role and does not inherit that role’s language or tenure requirements.', ts)
  ];
}

function roleRow_(id, slug, title, category, dept, loc, mode, schedule, exp, comp, status, show, accept, featured, sort, eyebrow, shortD, fullD, ts) {
  return [id, slug, title, category, dept, loc, mode, schedule, exp, comp, status, show, accept, featured, sort, eyebrow, shortD, fullD, ts, ts];
}

function seedRequirements_(ss) {
  var sheet = ss.getSheetByName(REQUIREMENTS_SHEET);
  var existing = keyedRows_(sheet, 'requirement_id');
  var rows = defaultRequirements_();
  var toAppend = [];
  rows.forEach(function (row) {
    if (!existing[row[0]]) toAppend.push(row);
  });
  if (toAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, REQUIREMENT_HEADERS.length).setValues(toAppend);
  }
}

function req_(id, roleId, text, highlight, order) {
  return [id, roleId, text, 'TRUE', highlight ? 'TRUE' : 'FALSE', order];
}

function defaultRequirements_() {
  var r = [];
  var n = 0;
  function add(roleId, items) {
    items.forEach(function (item, i) {
      var highlight = item.charAt(0) === '*';
      var text = highlight ? item.slice(1) : item;
      n += 1;
      r.push(req_(roleId + '-r' + String(i + 1), roleId, text, highlight, (i + 1) * 10));
    });
  }
  add('social-media-manager', [
    '*2+ years relevant experience',
    'Own social media strategy',
    'Create monthly content plans',
    'Conceptualise reels and content IPs',
    'Lead shoots',
    'Coordinate creators, videographers and editors',
    'Understand Instagram and internet culture',
    'Spot emerging trends',
    'Think about brands rather than simply chasing views',
    'Use AI intelligently inside the workflow',
    'Take ownership',
    'Communicate well and work collaboratively',
    '*Freshers are not the target for this role'
  ]);
  add('video-editor-ft', [
    '*Professional video editing experience',
    '*Approximately 2–3 years experience',
    'Comfortable understanding Hindi content',
    'Comfortable understanding English content',
    'Comfortable understanding Tamil content',
    'Strong music sense',
    'Strong understanding of pacing',
    'Strong storytelling instinct',
    'Sharp observation skills',
    'Tracks how editing styles change',
    'Tracks changes in hooks',
    'Tracks changes in pacing and rhythms',
    'Understands that editing trends evolve weekly and monthly',
    'Actively evolves their own editing style',
    '*Strong previous work is a major advantage',
    '*Portfolio quality is a major evaluation criterion'
  ]);
  add('video-editor-intern', [
    'Comfortable with professional video editing',
    'Premiere Pro knowledge',
    '*Some proof of previous editing work',
    'Eager to learn',
    'Comfortable learning alongside the senior editor/team'
  ]);
  add('content-creative-intern', [
    'Some previous content creation',
    'Strong writing instincts',
    'Understands hooks',
    'Can visualise reels and shots',
    'Follows pop culture',
    'Understands internet culture',
    'Spots trends early',
    'Analyses why content works',
    'Interested in storytelling and content craft',
    'Interested in understanding the difference between views-first content and brand content',
    '*Own page or proof of work is a major advantage',
    'Curiosity and evidence of trying things matter more than already knowing everything'
  ]);
  add('gen-ai-meta-ads-intern', [
    'Uses AI regularly',
    'Experiments with generative AI tools',
    'Has tried AI image generation',
    '*Can show things they have actually built using AI',
    'Follows new AI models and tools',
    'Learns quickly because AI changes constantly',
    'Interested in Meta Ads',
    'Interested in performance marketing',
    'Comfortable with numbers',
    'Interested in data and metrics',
    '*Curiosity and experimentation matter more than claiming expertise'
  ]);
  add('creative-director-events-weddings', [
    '*Creatively own wedding and event content',
    'Not simply shoot footage',
    'Understands storytelling',
    'Understands emotional moments',
    'Strong visual/aesthetic judgement',
    'Understands current social trends',
    'Understands Vox Pops',
    'Understands post-event content',
    'Can conceptualise reels',
    'Can identify moments worth capturing',
    'Can turn events into content people actually want to watch',
    'Can create content that feels emotional, rich and rewatchable',
    '*Strong wedding or event portfolio is a major advantage'
  ]);
  add('iphone-videographer', [
    'Understands moments',
    'Understands emotion',
    'Understands framing',
    'Understands storytelling',
    'Can capture social-first footage',
    'Can capture spontaneous moments',
    'Dependable execution',
    'Interested in recurring collaboration',
    'Owning an expensive phone alone is not enough'
  ]);
  add('professional-videographer', [
    '*Strong camera knowledge',
    'Understands creative briefs',
    'Understands visual storytelling',
    'Strong composition',
    'Dependable execution',
    'Can work within brand requirements',
    'Works collaboratively with a creative team',
    '*Strong portfolio is a major advantage',
    'Interested in recurring collaboration'
  ]);
  add('ugc-creator', [
    'Can make products feel natural on social media',
    'Comfortable creating demos',
    'Comfortable creating reviews',
    'Can create aesthetic product videos',
    'Can create lifestyle-led content',
    'Understands hooks',
    'Strong presentation ability',
    'Understands product storytelling',
    'Avoids making every video feel obviously like an advertisement',
    '*Strong existing product-led content is a major advantage'
  ]);
  add('video-editor-freelance', [
    '*Strong editing portfolio',
    'Strong pacing',
    'Strong music sense',
    'Strong storytelling ability',
    'Aware of contemporary editing styles',
    'Can adapt editing style across different brands and content formats'
  ]);
  return r;
}

function q_(id, roleId, key, label, type, required, placeholder, options, order) {
  return [id, roleId, key, label, type, required ? 'TRUE' : 'FALSE', 'TRUE', placeholder || '', options || '', order];
}

function seedQuestions_(ss) {
  var sheet = ss.getSheetByName(QUESTIONS_SHEET);
  var existing = keyedRows_(sheet, 'question_id');
  var rows = defaultQuestions_();
  var toAppend = [];
  rows.forEach(function (row) {
    if (!existing[row[0]]) toAppend.push(row);
  });
  if (toAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, QUESTION_HEADERS.length).setValues(toAppend);
  }
}

function defaultQuestions_() {
  var rows = [];
  rows.push(q_('all-full-name', 'ALL', 'full_name', 'Full name', 'text', true, 'Your name', '', 10));
  rows.push(q_('all-whatsapp', 'ALL', 'whatsapp', 'WhatsApp number', 'tel', true, '+91', '', 20));
  rows.push(q_('all-email', 'ALL', 'email', 'Email address', 'email', true, 'you@email.com', '', 30));
  rows.push(q_('all-city', 'ALL', 'current_city', 'Current city', 'text', true, 'Chennai', '', 40));
  rows.push(q_('all-instagram', 'ALL', 'instagram', 'Instagram / profile URL', 'url', false, 'https://instagram.com/', '', 50));
  rows.push(q_('all-portfolio', 'ALL', 'portfolio_urls', 'Portfolio URL(s)', 'textarea', false, 'One URL per line', '', 60));
  rows.push(q_('all-resume', 'ALL', 'resume', 'Resume', 'file', true, 'PDF, DOC or DOCX. Max 10 MB.', '', 70));
  rows.push(q_('all-years', 'ALL', 'years_experience', 'Years of experience', 'text', true, 'e.g. 2', '', 80));
  rows.push(q_('all-company', 'ALL', 'current_company', 'Current occupation / company', 'text', false, '', '', 90));
  rows.push(q_('all-availability', 'ALL', 'availability', 'Availability / start date', 'text', true, '', '', 100));
  rows.push(q_('all-else', 'ALL', 'anything_else', 'Anything else we should know?', 'textarea', false, '', '', 110));

  rows.push(q_('smm-workplaces', 'social-media-manager', 'previous_workplaces', 'Previous workplaces', 'textarea', true, '', '', 10));
  rows.push(q_('smm-prev-ctc', 'social-media-manager', 'previous_ctc', 'Previous CTC', 'text', false, '', '', 20));
  rows.push(q_('smm-cur-ctc', 'social-media-manager', 'current_ctc', 'Current CTC if applicable', 'text', false, '', '', 30));
  rows.push(q_('smm-join', 'social-media-manager', 'join_timeline', 'How soon can you join?', 'text', true, '', '', 40));
  rows.push(q_('smm-wfo', 'social-media-manager', 'chennai_wfo_confirm', 'Confirm Chennai work-from-office availability', 'select', true, '', 'Yes|No', 50));
  rows.push(q_('smm-campaigns', 'social-media-manager', 'favourite_campaigns', 'Favourite Indian brand campaigns and why', 'textarea', true, '', '', 60));
  rows.push(q_('smm-why', 'social-media-manager', 'why_respawn', 'Why do you want to join Respawn Media?', 'textarea', true, '', '', 70));
  rows.push(q_('smm-links', 'social-media-manager', 'portfolio_social_links', 'Portfolio / social profile links', 'textarea', true, 'One URL per line', '', 80));

  rows.push(q_('veft-lang', 'video-editor-ft', 'languages_understood', 'Which languages can you comfortably understand while editing?', 'multiselect', true, '', 'Hindi|English|Tamil|Other', 10));
  rows.push(q_('veft-soft', 'video-editor-ft', 'editing_software', 'Which editing software do you use?', 'text', true, '', '', 20));
  rows.push(q_('veft-edits', 'video-editor-ft', 'strongest_edits', 'Share your 3 strongest edits', 'textarea', true, 'Links', '', 30));
  rows.push(q_('veft-port', 'video-editor-ft', 'editor_portfolio', 'Share your portfolio', 'textarea', true, '', '', 40));
  rows.push(q_('veft-best', 'video-editor-ft', 'content_type_best', 'What kind of content do you edit best?', 'text', true, '', '', 50));
  rows.push(q_('veft-style', 'video-editor-ft', 'recent_style_noticed', 'Share one edit or editing style you have noticed recently that you think is particularly good and explain why', 'textarea', true, '', '', 60));
  rows.push(q_('veft-wfo', 'video-editor-ft', 'chennai_wfo_confirm', 'Confirm Chennai work-from-office availability', 'select', true, '', 'Yes|No', 70));

  rows.push(q_('vei-pr', 'video-editor-intern', 'premiere_pro_experience', 'Premiere Pro experience', 'textarea', true, '', '', 10));
  rows.push(q_('vei-tools', 'video-editor-intern', 'other_editing_tools', 'Other editing tools used', 'text', false, '', '', 20));
  rows.push(q_('vei-port', 'video-editor-intern', 'portfolio_links', 'Portfolio links', 'textarea', true, 'Allow multiple work examples', '', 30));
  rows.push(q_('vei-ig', 'video-editor-intern', 'instagram_if_relevant', 'Instagram profile if relevant', 'url', false, '', '', 40));
  rows.push(q_('vei-city', 'video-editor-intern', 'intern_current_city', 'Current city', 'text', true, '', '', 50));
  rows.push(q_('vei-wfo', 'video-editor-intern', 'chennai_office', 'Can you work from the Chennai office?', 'select', true, '', 'Yes|No', 60));
  rows.push(q_('vei-join', 'video-editor-intern', 'join_timeline', 'How soon can you join?', 'text', true, '', '', 70));
  rows.push(q_('vei-examples', 'video-editor-intern', 'work_examples', 'Additional work examples', 'textarea', false, 'Multiple links welcome', '', 80));

  rows.push(q_('cci-created', 'content-creative-intern', 'something_created', 'Share something you have created', 'textarea', true, '', '', 10));
  rows.push(q_('cci-page', 'content-creative-intern', 'creator_page', 'Share your creator page if you have one', 'url', false, '', '', 20));
  rows.push(q_('cci-write', 'content-creative-intern', 'writing_examples', 'Share writing / content examples', 'textarea', true, '', '', 30));
  rows.push(q_('cci-consume', 'content-creative-intern', 'content_consumed', 'What kind of content do you consume most?', 'textarea', true, '', '', 40));
  rows.push(q_('cci-early', 'content-creative-intern', 'early_format', 'Tell us about a recent reel / content format you noticed early', 'textarea', true, '', '', 50));
  rows.push(q_('cci-why', 'content-creative-intern', 'why_learn_respawn', 'Why do you want to learn at Respawn?', 'textarea', true, '', '', 60));

  rows.push(q_('gai-tools', 'gen-ai-meta-ads-intern', 'ai_tools', 'Which AI tools do you use regularly?', 'textarea', true, '', '', 10));
  rows.push(q_('gai-built', 'gen-ai-meta-ads-intern', 'built_with_ai', 'Share something you have built using AI', 'textarea', true, '', '', 20));
  rows.push(q_('gai-img', 'gen-ai-meta-ads-intern', 'image_gen_examples', 'Share image-generation examples if available', 'textarea', false, '', '', 30));
  rows.push(q_('gai-release', 'gen-ai-meta-ads-intern', 'recent_ai_release', 'What recent AI release / tool interested you and why?', 'textarea', true, '', '', 40));
  rows.push(q_('gai-meta', 'gen-ai-meta-ads-intern', 'meta_ads_experience', 'Have you worked with Meta Ads before?', 'select', true, '', 'Yes|No|A little', 50));
  rows.push(q_('gai-metrics', 'gen-ai-meta-ads-intern', 'ad_metrics_understanding', 'Describe your understanding of basic ad metrics', 'textarea', true, '', '', 60));
  rows.push(q_('gai-why', 'gen-ai-meta-ads-intern', 'why_ai', 'Why does AI interest you?', 'textarea', true, '', '', 70));

  rows.push(q_('cd-work', 'creative-director-events-weddings', 'strongest_work', 'Share your strongest wedding / event work', 'textarea', true, '', '', 10));
  rows.push(q_('cd-role', 'creative-director-events-weddings', 'role_in_projects', 'Describe your role in those projects', 'textarea', true, '', '', 20));
  rows.push(q_('cd-dir', 'creative-director-events-weddings', 'has_creatively_directed', 'Have you creatively directed event content before?', 'select', true, '', 'Yes|No', 30));
  rows.push(q_('cd-port', 'creative-director-events-weddings', 'cd_portfolio', 'Portfolio', 'textarea', true, '', '', 40));
  rows.push(q_('cd-ig', 'creative-director-events-weddings', 'cd_instagram', 'Instagram / profile', 'url', false, '', '', 50));
  rows.push(q_('cd-avail', 'creative-director-events-weddings', 'cd_availability', 'Availability', 'text', true, '', '', 60));
  rows.push(q_('cd-city', 'creative-director-events-weddings', 'cd_city', 'City', 'text', true, '', '', 70));
  rows.push(q_('cd-rate', 'creative-director-events-weddings', 'expected_commercials', 'Expected project / day commercials', 'text', true, '', '', 80));

  rows.push(q_('iph-device', 'iphone-videographer', 'device', 'Which iPhone / device do you shoot on?', 'text', true, '', '', 10));
  rows.push(q_('iph-work', 'iphone-videographer', 'strongest_work', 'Share your strongest work', 'textarea', true, '', '', 20));
  rows.push(q_('iph-ig', 'iphone-videographer', 'ig_profile', 'Instagram / profile', 'url', false, '', '', 30));
  rows.push(q_('iph-exp', 'iphone-videographer', 'wedding_event_experience', 'Wedding / event experience', 'textarea', true, '', '', 40));
  rows.push(q_('iph-chn', 'iphone-videographer', 'chennai_availability', 'Chennai availability', 'select', true, '', 'Yes|Sometimes|No', 50));
  rows.push(q_('iph-typ', 'iphone-videographer', 'typical_availability', 'Typical availability', 'text', true, '', '', 60));
  rows.push(q_('iph-rate', 'iphone-videographer', 'expected_commercials', 'Expected project / day commercials', 'text', true, '', '', 70));

  rows.push(q_('pv-kit', 'professional-videographer', 'camera_kit', 'Camera setup / kit', 'textarea', true, '', '', 10));
  rows.push(q_('pv-port', 'professional-videographer', 'pv_portfolio', 'Portfolio', 'textarea', true, '', '', 20));
  rows.push(q_('pv-best', 'professional-videographer', 'best_3_shoots', 'Best 3 shoots', 'textarea', true, '', '', 30));
  rows.push(q_('pv-brand', 'professional-videographer', 'commercial_brand_experience', 'Commercial / brand experience', 'textarea', true, '', '', 40));
  rows.push(q_('pv-chn', 'professional-videographer', 'chennai_availability', 'Chennai availability', 'select', true, '', 'Yes|Sometimes|No', 50));
  rows.push(q_('pv-rate', 'professional-videographer', 'expected_commercials', 'Expected day / project commercials', 'text', true, '', '', 60));
  rows.push(q_('pv-typ', 'professional-videographer', 'typical_availability', 'Typical availability', 'text', true, '', '', 70));

  rows.push(q_('ugc-ig', 'ugc-creator', 'social_profiles', 'Instagram / social profiles', 'textarea', true, '', '', 10));
  rows.push(q_('ugc-cat', 'ugc-creator', 'content_categories', 'Which content categories do you create for?', 'multiselect', true, '', 'FMCG|Tech|Lifestyle|Food|Beauty|Fashion|Other', 20));
  rows.push(q_('ugc-work', 'ugc-creator', 'strongest_ugc', 'Share your strongest UGC videos', 'textarea', true, '', '', 30));
  rows.push(q_('ugc-cam', 'ugc-creator', 'on_camera', 'Comfortable appearing on camera?', 'select', true, '', 'Yes|No|Depends', 40));
  rows.push(q_('ugc-lang', 'ugc-creator', 'languages', 'Languages', 'text', true, '', '', 50));
  rows.push(q_('ugc-city', 'ugc-creator', 'ugc_city', 'Current city', 'text', true, '', '', 60));
  rows.push(q_('ugc-rate', 'ugc-creator', 'expected_commercials', 'Expected commercials', 'text', true, '', '', 70));

  rows.push(q_('vef-port', 'video-editor-freelance', 'freelance_portfolio', 'Portfolio', 'textarea', true, '', '', 10));
  rows.push(q_('vef-edits', 'video-editor-freelance', 'strongest_edits', '3 strongest edits', 'textarea', true, '', '', 20));
  rows.push(q_('vef-soft', 'video-editor-freelance', 'editing_software', 'Editing software', 'text', true, '', '', 30));
  rows.push(q_('vef-types', 'video-editor-freelance', 'content_types', 'Types of content edited', 'textarea', true, '', '', 40));
  rows.push(q_('vef-lang', 'video-editor-freelance', 'languages', 'Languages understood', 'text', false, '', '', 50));
  rows.push(q_('vef-turn', 'video-editor-freelance', 'turnaround', 'Typical turnaround time', 'text', true, '', '', 60));
  rows.push(q_('vef-avail', 'video-editor-freelance', 'current_availability', 'Current availability', 'text', true, '', '', 70));
  rows.push(q_('vef-rate', 'video-editor-freelance', 'expected_commercials', 'Expected commercials', 'text', true, '', '', 80));

  return rows;
}

function keyedRows_(sheet, keyHeader) {
  var map = {};
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return map;
  var headers = data[0];
  var idx = headers.indexOf(keyHeader);
  if (idx === -1) return map;
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][idx] || '').trim();
    if (key) map[key] = true;
  }
  return map;
}

function sheetObjects_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      var val = data[i][c];
      obj[headers[c]] = val;
      if (val !== '' && val !== null) empty = false;
    }
    if (!empty) out.push(obj);
  }
  return out;
}

function isTrue_(val) {
  if (val === true || val === 1) return true;
  var s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === 'YES' || s === '1';
}

function publicStatus_(status) {
  return String(status || '').trim().toUpperCase();
}

function syncRoleTabs() {
  setupWorkbook();
  var ss = getSpreadsheet_();
  var roles = sheetObjects_(ss.getSheetByName(ROLES_SHEET));
  roles.forEach(function (role) {
    if (!role.role_id) return;
    var name = roleTabName_(role);
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    var formula = '=IFERROR(QUERY(' + APPLICATIONS_SHEET + '!A:Z,"select * where D = \'' + String(role.role_id).replace(/'/g, "''") + '\'",1),"No applications yet")';
    sheet.getRange(1, 1).setFormula(formula);
    sheet.setFrozenRows(1);
  });
}

function roleTabName_(role) {
  var raw = String(role.title || role.role_id || 'ROLE').toUpperCase();
  raw = raw.replace(/[^A-Z0-9 +]/g, ' ').replace(/\s+/g, ' ').trim();
  if (raw.length > 31) raw = raw.slice(0, 31).trim();
  if (!raw) raw = String(role.role_id).slice(0, 31);
  return raw;
}

function doGet(e) {
  try {
    if (!authorize_(e)) {
      return jsonResponse_({ ok: false, error: 'unauthorized' });
    }
    return jsonResponse_({ ok: true, data: getPublicCareersConfig_() });
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'config_unavailable' });
  }
}

function doPost(e) {
  try {
    var payload = parsePost_(e);
    if (!authorizePayload_(payload, e)) {
      return jsonResponse_({ ok: false, error: 'unauthorized' });
    }
    return jsonResponse_(submitApplication_(payload));
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'submit_failed' });
  }
}

function authorize_(e) {
  var expected = getScriptSecret_();
  if (!expected) return false;
  var token = '';
  if (e && e.parameter) token = e.parameter.token || e.parameter.secret || '';
  return token && token === expected;
}

function authorizePayload_(payload, e) {
  var expected = getScriptSecret_();
  if (!expected) return false;
  var token = (payload && payload.api_secret) || '';
  if (!token && e && e.parameter) token = e.parameter.token || '';
  return token && token === expected;
}

function parsePost_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }
  return e.parameter || {};
}

function getPublicCareersConfig_() {
  var ss = getSpreadsheet_();
  var settingsRows = sheetObjects_(ss.getSheetByName(SETTINGS_SHEET));
  var settings = {};
  settingsRows.forEach(function (row) {
    if (row.key) settings[String(row.key)] = row.value;
  });

  var reqs = sheetObjects_(ss.getSheetByName(REQUIREMENTS_SHEET)).filter(function (r) {
    return isTrue_(r.enabled);
  });
  var questions = sheetObjects_(ss.getSheetByName(QUESTIONS_SHEET)).filter(function (q) {
    return isTrue_(q.enabled);
  });

  var reqByRole = {};
  reqs.forEach(function (r) {
    var id = String(r.role_id);
    if (!reqByRole[id]) reqByRole[id] = [];
    reqByRole[id].push({
      requirement_id: r.requirement_id,
      requirement: r.requirement,
      highlight: isTrue_(r.highlight),
      sort_order: Number(r.sort_order) || 0
    });
  });
  Object.keys(reqByRole).forEach(function (id) {
    reqByRole[id].sort(function (a, b) { return a.sort_order - b.sort_order; });
  });

  var qPublic = questions.map(function (q) {
    return {
      question_id: q.question_id,
      role_id: q.role_id,
      question_key: q.question_key,
      label: q.label,
      type: String(q.type || 'text').toLowerCase(),
      required: isTrue_(q.required),
      placeholder: q.placeholder || '',
      options: String(q.options || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean),
      sort_order: Number(q.sort_order) || 0
    };
  }).sort(function (a, b) { return a.sort_order - b.sort_order; });

  var universalQuestions = qPublic.filter(function (q) { return String(q.role_id).toUpperCase() === 'ALL'; });
  var qByRole = {};
  qPublic.forEach(function (q) {
    if (String(q.role_id).toUpperCase() === 'ALL') return;
    var id = String(q.role_id);
    if (!qByRole[id]) qByRole[id] = [];
    qByRole[id].push(q);
  });

  var roles = sheetObjects_(ss.getSheetByName(ROLES_SHEET))
    .filter(function (role) {
      if (!isTrue_(role.show_on_site)) return false;
      var st = publicStatus_(role.status);
      if (st === 'PAUSED') return false;
      return st === 'OPEN' || st === 'ALWAYS_OPEN' || st === 'CLOSED';
    })
    .map(function (role) {
      var st = publicStatus_(role.status);
      var accepting = isTrue_(role.accepting_applications) && (st === 'OPEN' || st === 'ALWAYS_OPEN');
      return {
        role_id: role.role_id,
        slug: role.slug || role.role_id,
        title: role.title,
        category: role.category,
        department: role.department,
        location: role.location,
        work_mode: role.work_mode,
        schedule: role.schedule,
        experience: role.experience,
        compensation: role.compensation || '',
        status: st,
        accepting_applications: accepting,
        featured: isTrue_(role.featured),
        sort_order: Number(role.sort_order) || 0,
        eyebrow: role.eyebrow || '',
        short_description: role.short_description || '',
        full_description: role.full_description || '',
        requirements: reqByRole[role.role_id] || [],
        questions: qByRole[role.role_id] || []
      };
    })
    .sort(function (a, b) { return a.sort_order - b.sort_order; });

  return {
    settings: settings,
    roles: roles,
    universalQuestions: universalQuestions
  };
}

function submitApplication_(payload) {
  var answers = payload.answers || {};
  var check = validateApplication_(payload, answers);
  if (!check.ok) return check;

  var resumeUrl = '';
  if (payload.resume && payload.resume.base64) {
    var saved = saveResume_(payload.resume, answers.full_name || 'candidate', check.role.role_id);
    if (!saved.ok) return saved;
    resumeUrl = saved.url;
  } else if (hasRequiredFile_(check.role, payload)) {
    return { ok: false, error: 'resume_required' };
  }

  var applicationId = generateApplicationId_();
  appendApplication_({
    application_id: applicationId,
    submitted_at: nowIso_(),
    category: check.role.category,
    role_id: check.role.role_id,
    role_title: check.role.title,
    full_name: str_(answers.full_name),
    whatsapp: str_(answers.whatsapp),
    email: str_(answers.email),
    current_city: str_(answers.current_city),
    instagram: str_(answers.instagram),
    portfolio_urls: str_(answers.portfolio_urls),
    resume_url: resumeUrl,
    years_experience: str_(answers.years_experience),
    current_company: str_(answers.current_company),
    availability: str_(answers.availability),
    role_answers_json: JSON.stringify(roleOnlyAnswers_(answers)),
    utm_source: str_(payload.utm_source),
    utm_medium: str_(payload.utm_medium),
    utm_campaign: str_(payload.utm_campaign),
    utm_content: str_(payload.utm_content),
    utm_term: str_(payload.utm_term),
    referrer: str_(payload.referrer),
    status: 'NEW',
    rating: '',
    reviewer: '',
    internal_notes: ''
  });

  return { ok: true, application_id: applicationId };
}

function hasRequiredFile_(role, payload) {
  return !(payload.resume && payload.resume.base64);
}

function validateApplication_(payload, answers) {
  var config = getPublicCareersConfig_();
  var role = null;
  config.roles.forEach(function (r) {
    if (r.role_id === payload.role_id || r.slug === payload.role_id) role = r;
  });
  if (!role) return { ok: false, error: 'unknown_role' };
  if (!role.accepting_applications) return { ok: false, error: 'role_closed' };

  var questions = (config.universalQuestions || []).concat(role.questions || []);
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (!q.required) continue;
    if (q.type === 'file') continue;
    var val = answers[q.question_key];
    if (q.type === 'checkbox') {
      if (!(val === true || val === 'true' || val === 'Yes' || val === 'on')) {
        return { ok: false, error: 'missing_field', field: q.question_key };
      }
    } else if (q.type === 'multiselect') {
      if (!val || (Array.isArray(val) && !val.length) || (typeof val === 'string' && !String(val).trim())) {
        return { ok: false, error: 'missing_field', field: q.question_key };
      }
    } else if (val === undefined || val === null || String(val).trim() === '') {
      return { ok: false, error: 'missing_field', field: q.question_key };
    }
    if (q.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
      return { ok: false, error: 'invalid_email' };
    }
    if (q.type === 'url' && val && !/^https?:\/\//i.test(String(val).trim())) {
      return { ok: false, error: 'invalid_url', field: q.question_key };
    }
  }
  return { ok: true, role: role };
}

function saveResume_(resume, candidateName, roleId) {
  var folderId = PropertiesService.getScriptProperties().getProperty('RESUME_FOLDER_ID');
  if (!folderId) return { ok: false, error: 'upload_failed' };

  var filename = String(resume.filename || 'resume.pdf');
  var ext = filename.split('.').pop().toLowerCase();
  if (!ALLOWED_RESUME_EXT[ext]) return { ok: false, error: 'invalid_file_type' };

  var bytes;
  try {
    bytes = Utilities.base64Decode(resume.base64);
  } catch (err) {
    return { ok: false, error: 'upload_failed' };
  }
  if (!bytes || bytes.length > MAX_RESUME_BYTES) return { ok: false, error: 'file_too_large' };
  if (!bytes.length) return { ok: false, error: 'upload_failed' };

  var safeName = sanitizeFilename_(candidateName);
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyy-MM-dd');
  var original = sanitizeFilename_(filename.replace(/\.[^.]+$/, '')) + '.' + ext;
  var storedName = date + '_' + safeName + '_' + sanitizeFilename_(roleId) + '_' + original;

  var mime = resume.mimeType || mimeForExt_(ext);
  var blob = Utilities.newBlob(bytes, mime, storedName);
  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile(blob);
  file.setName(storedName);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  return { ok: true, url: file.getUrl() };
}

function mimeForExt_(ext) {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'doc') return 'application/msword';
  return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

function sanitizeFilename_(name) {
  var s = String(name || 'file').toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 60) || 'file';
}

function generateApplicationId_() {
  var d = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyyMMdd');
  var rand = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'RM-' + d + '-' + rand;
}

function roleOnlyAnswers_(answers) {
  var out = {};
  Object.keys(answers || {}).forEach(function (key) {
    if (!UNIVERSAL_ANSWER_KEYS[key] && key !== 'resume') out[key] = answers[key];
  });
  return out;
}

function appendApplication_(row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(APPLICATIONS_SHEET);
    var values = APPLICATION_HEADERS.map(function (h) { return row[h] != null ? row[h] : ''; });
    sheet.appendRow(values);
  } finally {
    lock.releaseLock();
  }
}

function str_(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
