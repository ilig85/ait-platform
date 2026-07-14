"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type Locale = "en" | "ru" | "ky"

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "EN" },
  { value: "ru", label: "Русский", flag: "RU" },
  { value: "ky", label: "Кыргызча", flag: "KY" },
]

type Translations = {
  // Navigation
  nav_overview: string
  nav_inbox: string
  nav_ai_tasks: string
  nav_customers: string
  nav_knowledge: string
  nav_insights: string
  nav_settings: string
  nav_help: string
  nav_logout: string
  // Common
  common_save: string
  common_cancel: string
  common_delete: string
  common_edit: string
  common_add: string
  common_search: string
  common_filter: string
  common_loading: string
  common_error: string
  common_empty: string
  common_view_all: string
  common_demo_data: string
  common_configuration_required: string
  common_approve: string
  common_reject: string
  common_retry: string
  common_send: string
  common_close: string
  common_confirm: string
  common_back: string
  common_next: string
  common_skip: string
  common_connect: string
  common_disconnect: string
  common_copy: string
  common_status: string
  common_today: string
  common_days_7: string
  common_days_30: string
  common_custom: string
  common_new: string
  // Auth
  auth_login: string
  auth_signup: string
  auth_email: string
  auth_password: string
  auth_forgot_password: string
  auth_remember_me: string
  auth_no_account: string
  auth_has_account: string
  auth_verify_email: string
  auth_reset_password: string
  auth_demo_explore: string
  auth_tagline: string
  auth_benefit_1: string
  auth_benefit_2: string
  auth_benefit_3: string
  auth_trust: string
  auth_terms: string
  auth_privacy: string
  auth_logging_in: string
  auth_invalid_credentials: string
  auth_logout_confirm: string
  auth_logout_confirm_desc: string
  // Overview
  overview_title: string
  overview_subtitle: string
  overview_customers_contacted: string
  overview_ai_resolved: string
  overview_ai_active: string
  overview_needs_human: string
  overview_conversations_by_day: string
  overview_ai_command_center: string
  overview_create_ai_task: string
  overview_channel_health: string
  overview_alerts: string
  overview_recent_escalations: string
  overview_recent_ai_activity: string
  overview_knowledge_suggestions: string
  overview_avg_first_response: string
  overview_ai_resolution_rate: string
  overview_manager_time_saved: string
  // Inbox
  inbox_title: string
  inbox_unread: string
  inbox_needs_human: string
  inbox_ai_active: string
  inbox_resolved: string
  inbox_search_conversations: string
  inbox_ai_draft: string
  inbox_approve_send: string
  inbox_regenerate: string
  inbox_take_over: string
  inbox_hand_back_ai: string
  inbox_escalate: string
  inbox_resolve: string
  inbox_internal_note: string
  inbox_reply: string
  inbox_composer_placeholder: string
  inbox_channel_not_configured: string
  inbox_no_conversations: string
  // AI Tasks
  tasks_title: string
  tasks_subtitle: string
  tasks_draft: string
  tasks_awaiting_approval: string
  tasks_scheduled: string
  tasks_running: string
  tasks_completed: string
  tasks_failed: string
  tasks_new_task: string
  tasks_describe_goal: string
  tasks_select_target: string
  tasks_select_action: string
  tasks_preview: string
  tasks_safety_warning: string
  tasks_requires_approval: string
  // Customers
  customers_title: string
  customers_search: string
  customers_add_note: string
  customers_open_conversation: string
  customers_create_task: string
  customers_assign_manager: string
  customers_last_contact: string
  customers_language: string
  customers_sentiment: string
  customers_no_customers: string
  // Knowledge
  knowledge_title: string
  knowledge_add: string
  knowledge_search: string
  knowledge_verified: string
  knowledge_draft: string
  knowledge_needs_review: string
  knowledge_outdated: string
  knowledge_archived: string
  knowledge_faq: string
  knowledge_products: string
  knowledge_prices: string
  knowledge_policies: string
  knowledge_delivery: string
  knowledge_hours: string
  knowledge_suggestions: string
  knowledge_upload_note: string
  // Insights
  insights_title: string
  insights_subtitle: string
  insights_volume: string
  insights_unique_customers: string
  insights_first_response: string
  insights_resolution_time: string
  insights_ai_rate: string
  insights_escalation_rate: string
  insights_topics: string
  insights_peak_hours: string
  insights_opportunities: string
  insights_demo_label: string
  // Settings
  settings_title: string
  settings_profile: string
  settings_business: string
  settings_channels: string
  settings_team: string
  settings_ai_behavior: string
  settings_notifications: string
  settings_security: string
  settings_save: string
  settings_saved: string
  settings_whatsapp_connect: string
  settings_invite_member: string
  // Help
  help_title: string
  help_search: string
  help_guides: string
  help_faq: string
  help_shortcuts: string
  help_contact: string
  help_status: string
  // Onboarding
  onboard_title: string
  onboard_step_language: string
  onboard_step_business: string
  onboard_step_whatsapp: string
  onboard_step_knowledge: string
  onboard_step_ai: string
  onboard_step_team: string
  onboard_whatsapp_phone: string
  onboard_whatsapp_qr: string
  onboard_skip: string
  onboard_complete: string
}

const translations: Record<Locale, Translations> = {
  en: {
    nav_overview: "Overview",
    nav_inbox: "Inbox",
    nav_ai_tasks: "AI Tasks",
    nav_customers: "Customers",
    nav_knowledge: "Knowledge",
    nav_insights: "Insights",
    nav_settings: "Settings",
    nav_help: "Help & Support",
    nav_logout: "Log out",
    common_save: "Save",
    common_cancel: "Cancel",
    common_delete: "Delete",
    common_edit: "Edit",
    common_add: "Add",
    common_search: "Search",
    common_filter: "Filter",
    common_loading: "Loading...",
    common_error: "Something went wrong",
    common_empty: "Nothing here yet",
    common_view_all: "View all",
    common_demo_data: "Demo Data",
    common_configuration_required: "Configuration required",
    common_approve: "Approve",
    common_reject: "Reject",
    common_retry: "Retry",
    common_send: "Send",
    common_close: "Close",
    common_confirm: "Confirm",
    common_back: "Back",
    common_next: "Next",
    common_skip: "Skip",
    common_connect: "Connect",
    common_disconnect: "Disconnect",
    common_copy: "Copy",
    common_status: "Status",
    common_today: "Today",
    common_days_7: "7 days",
    common_days_30: "30 days",
    common_custom: "Custom",
    common_new: "New",
    auth_login: "Log in",
    auth_signup: "Sign up",
    auth_email: "Email address",
    auth_password: "Password",
    auth_forgot_password: "Forgot password?",
    auth_remember_me: "Remember me",
    auth_no_account: "Don't have an account?",
    auth_has_account: "Already have an account?",
    auth_verify_email: "Check your email",
    auth_reset_password: "Reset password",
    auth_demo_explore: "Explore demo workspace",
    auth_tagline: "AI-powered customer communication for your business",
    auth_benefit_1: "AI drafts replies, you stay in control",
    auth_benefit_2: "All WhatsApp conversations in one place",
    auth_benefit_3: "Speak to customers in Kyrgyz, Russian or English",
    auth_trust: "Your customer data is private and never shared.",
    auth_terms: "Terms of Service",
    auth_privacy: "Privacy Policy",
    auth_logging_in: "Logging in...",
    auth_invalid_credentials: "Invalid email or password",
    auth_logout_confirm: "Log out?",
    auth_logout_confirm_desc: "You will be returned to the login screen.",
    overview_title: "Overview",
    overview_subtitle: "Customer conversations, AI activity, and items that need you.",
    overview_customers_contacted: "Customers contacted",
    overview_ai_resolved: "AI resolved",
    overview_ai_active: "AI active",
    overview_needs_human: "Needs human",
    overview_conversations_by_day: "Customer conversations by day",
    overview_ai_command_center: "AI Command Center",
    overview_create_ai_task: "Create AI task",
    overview_channel_health: "Channel health",
    overview_alerts: "Alerts",
    overview_recent_escalations: "Recent escalations",
    overview_recent_ai_activity: "Recent AI activity",
    overview_knowledge_suggestions: "Knowledge suggestions",
    overview_avg_first_response: "Avg. first response",
    overview_ai_resolution_rate: "AI resolution rate",
    overview_manager_time_saved: "Est. manager time saved",
    inbox_title: "Inbox",
    inbox_unread: "Unread",
    inbox_needs_human: "Needs human",
    inbox_ai_active: "AI active",
    inbox_resolved: "Resolved",
    inbox_search_conversations: "Search conversations...",
    inbox_ai_draft: "AI draft",
    inbox_approve_send: "Approve & send",
    inbox_regenerate: "Regenerate",
    inbox_take_over: "Take over",
    inbox_hand_back_ai: "Hand back to AI",
    inbox_escalate: "Escalate",
    inbox_resolve: "Resolve",
    inbox_internal_note: "Internal note",
    inbox_reply: "Reply",
    inbox_composer_placeholder: "Write a reply...",
    inbox_channel_not_configured: "WhatsApp channel is not configured. Messages cannot be sent.",
    inbox_no_conversations: "No conversations match your filters.",
    tasks_title: "AI Tasks",
    tasks_subtitle: "Manager instructions and their execution history.",
    tasks_draft: "Draft",
    tasks_awaiting_approval: "Awaiting approval",
    tasks_scheduled: "Scheduled",
    tasks_running: "Running",
    tasks_completed: "Completed",
    tasks_failed: "Failed",
    tasks_new_task: "New AI task",
    tasks_describe_goal: "Describe the goal",
    tasks_select_target: "Select target",
    tasks_select_action: "Select action",
    tasks_preview: "Preview",
    tasks_safety_warning: "This action affects customers. Approval is required.",
    tasks_requires_approval: "Requires approval",
    customers_title: "Customers",
    customers_search: "Search customers...",
    customers_add_note: "Add note",
    customers_open_conversation: "Open conversation",
    customers_create_task: "Create task",
    customers_assign_manager: "Assign manager",
    customers_last_contact: "Last contact",
    customers_language: "Language",
    customers_sentiment: "Sentiment",
    customers_no_customers: "No customers found.",
    knowledge_title: "Knowledge",
    knowledge_add: "Add knowledge",
    knowledge_search: "Search knowledge...",
    knowledge_verified: "Verified",
    knowledge_draft: "Draft",
    knowledge_needs_review: "Needs review",
    knowledge_outdated: "Outdated",
    knowledge_archived: "Archived",
    knowledge_faq: "FAQs",
    knowledge_products: "Products & Services",
    knowledge_prices: "Prices",
    knowledge_policies: "Policies",
    knowledge_delivery: "Delivery",
    knowledge_hours: "Working hours",
    knowledge_suggestions: "AI suggestions",
    knowledge_upload_note: "Uploaded files are not automatically trusted or verified by AI.",
    insights_title: "Insights",
    insights_subtitle: "Analytics for your business conversations.",
    insights_volume: "Conversation volume",
    insights_unique_customers: "Unique customers",
    insights_first_response: "First response time",
    insights_resolution_time: "Resolution time",
    insights_ai_rate: "AI resolution rate",
    insights_escalation_rate: "Escalation rate",
    insights_topics: "Top topics",
    insights_peak_hours: "Peak contact hours",
    insights_opportunities: "Opportunities",
    insights_demo_label: "Demo Data — not from a live system",
    settings_title: "Settings",
    settings_profile: "Profile",
    settings_business: "Business",
    settings_channels: "Channels",
    settings_team: "Team & Permissions",
    settings_ai_behavior: "AI Behavior",
    settings_notifications: "Notifications",
    settings_security: "Security & Data",
    settings_save: "Save changes",
    settings_saved: "Changes saved",
    settings_whatsapp_connect: "Connect WhatsApp",
    settings_invite_member: "Invite member",
    help_title: "Help & Support",
    help_search: "Search help articles...",
    help_guides: "Guides",
    help_faq: "FAQ",
    help_shortcuts: "Keyboard shortcuts",
    help_contact: "Contact support",
    help_status: "System status",
    onboard_title: "Set up your workspace",
    onboard_step_language: "Choose language",
    onboard_step_business: "Business details",
    onboard_step_whatsapp: "Connect WhatsApp",
    onboard_step_knowledge: "Add knowledge",
    onboard_step_ai: "AI behavior",
    onboard_step_team: "Invite team",
    onboard_whatsapp_phone: "Connect with phone number",
    onboard_whatsapp_qr: "Connect with QR code",
    onboard_skip: "Skip for now",
    onboard_complete: "Complete setup",
  },
  ru: {
    nav_overview: "Обзор",
    nav_inbox: "Входящие",
    nav_ai_tasks: "ИИ-задачи",
    nav_customers: "Клиенты",
    nav_knowledge: "Знания",
    nav_insights: "Аналитика",
    nav_settings: "Настройки",
    nav_help: "Помощь и поддержка",
    nav_logout: "Выйти",
    common_save: "Сохранить",
    common_cancel: "Отмена",
    common_delete: "Удалить",
    common_edit: "Редактировать",
    common_add: "Добавить",
    common_search: "Поиск",
    common_filter: "Фильтр",
    common_loading: "Загрузка...",
    common_error: "Что-то пошло не так",
    common_empty: "Здесь пока ничего нет",
    common_view_all: "Смотреть все",
    common_demo_data: "Демо-данные",
    common_configuration_required: "Требуется настройка",
    common_approve: "Одобрить",
    common_reject: "Отклонить",
    common_retry: "Повторить",
    common_send: "Отправить",
    common_close: "Закрыть",
    common_confirm: "Подтвердить",
    common_back: "Назад",
    common_next: "Далее",
    common_skip: "Пропустить",
    common_connect: "Подключить",
    common_disconnect: "Отключить",
    common_copy: "Копировать",
    common_status: "Статус",
    common_today: "Сегодня",
    common_days_7: "7 дней",
    common_days_30: "30 дней",
    common_custom: "Период",
    common_new: "Новый",
    auth_login: "Войти",
    auth_signup: "Зарегистрироваться",
    auth_email: "Электронная почта",
    auth_password: "Пароль",
    auth_forgot_password: "Забыли пароль?",
    auth_remember_me: "Запомнить меня",
    auth_no_account: "Нет аккаунта?",
    auth_has_account: "Уже есть аккаунт?",
    auth_verify_email: "Проверьте почту",
    auth_reset_password: "Сбросить пароль",
    auth_demo_explore: "Открыть демо-пространство",
    auth_tagline: "ИИ-помощник для общения с клиентами вашего бизнеса",
    auth_benefit_1: "ИИ составляет ответы, вы контролируете",
    auth_benefit_2: "Все WhatsApp-переписки в одном месте",
    auth_benefit_3: "Общайтесь на кыргызском, русском и английском",
    auth_trust: "Данные ваших клиентов конфиденциальны и не передаются третьим лицам.",
    auth_terms: "Условия использования",
    auth_privacy: "Политика конфиденциальности",
    auth_logging_in: "Вход...",
    auth_invalid_credentials: "Неверный email или пароль",
    auth_logout_confirm: "Выйти?",
    auth_logout_confirm_desc: "Вы будете перенаправлены на страницу входа.",
    overview_title: "Обзор",
    overview_subtitle: "Переписки с клиентами, активность ИИ и задачи, требующие вашего внимания.",
    overview_customers_contacted: "Обратившихся клиентов",
    overview_ai_resolved: "Решено ИИ",
    overview_ai_active: "ИИ активен",
    overview_needs_human: "Ожидают менеджера",
    overview_conversations_by_day: "Переписки по дням",
    overview_ai_command_center: "Центр управления ИИ",
    overview_create_ai_task: "Создать ИИ-задачу",
    overview_channel_health: "Состояние канала",
    overview_alerts: "Уведомления",
    overview_recent_escalations: "Последние эскалации",
    overview_recent_ai_activity: "Активность ИИ",
    overview_knowledge_suggestions: "Предложения по знаниям",
    overview_avg_first_response: "Среднее время ответа",
    overview_ai_resolution_rate: "Процент решений ИИ",
    overview_manager_time_saved: "Сэкономлено времени менеджера",
    inbox_title: "Входящие",
    inbox_unread: "Непрочитанные",
    inbox_needs_human: "Ожидают менеджера",
    inbox_ai_active: "ИИ активен",
    inbox_resolved: "Решено",
    inbox_search_conversations: "Поиск переписок...",
    inbox_ai_draft: "Черновик ИИ",
    inbox_approve_send: "Одобрить и отправить",
    inbox_regenerate: "Пересоздать",
    inbox_take_over: "Взять управление",
    inbox_hand_back_ai: "Передать ИИ",
    inbox_escalate: "Эскалировать",
    inbox_resolve: "Завершить",
    inbox_internal_note: "Внутренняя заметка",
    inbox_reply: "Ответить",
    inbox_composer_placeholder: "Напишите ответ...",
    inbox_channel_not_configured: "Канал WhatsApp не настроен. Сообщения не могут быть отправлены.",
    inbox_no_conversations: "Нет переписок по вашему запросу.",
    tasks_title: "ИИ-задачи",
    tasks_subtitle: "Инструкции менеджера и история выполнения.",
    tasks_draft: "Черновик",
    tasks_awaiting_approval: "Ожидает одобрения",
    tasks_scheduled: "Запланировано",
    tasks_running: "Выполняется",
    tasks_completed: "Выполнено",
    tasks_failed: "Ошибка",
    tasks_new_task: "Новая ИИ-задача",
    tasks_describe_goal: "Опишите цель",
    tasks_select_target: "Выберите цель",
    tasks_select_action: "Выберите действие",
    tasks_preview: "Предпросмотр",
    tasks_safety_warning: "Это действие затрагивает клиентов. Требуется одобрение.",
    tasks_requires_approval: "Требует одобрения",
    customers_title: "Клиенты",
    customers_search: "Поиск клиентов...",
    customers_add_note: "Добавить заметку",
    customers_open_conversation: "Открыть переписку",
    customers_create_task: "Создать задачу",
    customers_assign_manager: "Назначить менеджера",
    customers_last_contact: "Последний контакт",
    customers_language: "Язык",
    customers_sentiment: "Тональность",
    customers_no_customers: "Клиенты не найдены.",
    knowledge_title: "База знаний",
    knowledge_add: "Добавить знание",
    knowledge_search: "Поиск...",
    knowledge_verified: "Проверено",
    knowledge_draft: "Черновик",
    knowledge_needs_review: "Требует проверки",
    knowledge_outdated: "Устарело",
    knowledge_archived: "Архив",
    knowledge_faq: "Часто задаваемые вопросы",
    knowledge_products: "Товары и услуги",
    knowledge_prices: "Цены",
    knowledge_policies: "Политики",
    knowledge_delivery: "Доставка",
    knowledge_hours: "Рабочие часы",
    knowledge_suggestions: "Предложения ИИ",
    knowledge_upload_note: "Загруженные файлы не проверяются ИИ автоматически.",
    insights_title: "Аналитика",
    insights_subtitle: "Аналитика переписок вашего бизнеса.",
    insights_volume: "Объём переписок",
    insights_unique_customers: "Уникальных клиентов",
    insights_first_response: "Время первого ответа",
    insights_resolution_time: "Время решения",
    insights_ai_rate: "Процент решений ИИ",
    insights_escalation_rate: "Процент эскалаций",
    insights_topics: "Топ тем",
    insights_peak_hours: "Пиковые часы",
    insights_opportunities: "Возможности",
    insights_demo_label: "Демо-данные — не из реальной системы",
    settings_title: "Настройки",
    settings_profile: "Профиль",
    settings_business: "Бизнес",
    settings_channels: "Каналы",
    settings_team: "Команда и права",
    settings_ai_behavior: "Поведение ИИ",
    settings_notifications: "Уведомления",
    settings_security: "Безопасность и данные",
    settings_save: "Сохранить изменения",
    settings_saved: "Изменения сохранены",
    settings_whatsapp_connect: "Подключить WhatsApp",
    settings_invite_member: "Пригласить участника",
    help_title: "Помощь и поддержка",
    help_search: "Поиск статей...",
    help_guides: "Руководства",
    help_faq: "Частые вопросы",
    help_shortcuts: "Горячие клавиши",
    help_contact: "Связаться с поддержкой",
    help_status: "Статус системы",
    onboard_title: "Настройте рабочее пространство",
    onboard_step_language: "Выберите язык",
    onboard_step_business: "Данные бизнеса",
    onboard_step_whatsapp: "Подключить WhatsApp",
    onboard_step_knowledge: "Добавить знания",
    onboard_step_ai: "Поведение ИИ",
    onboard_step_team: "Пригласить команду",
    onboard_whatsapp_phone: "Подключить по номеру телефона",
    onboard_whatsapp_qr: "Подключить по QR-коду",
    onboard_skip: "Пропустить",
    onboard_complete: "Завершить настройку",
  },
  ky: {
    nav_overview: "Жалпы көрүнүш",
    nav_inbox: "Кирүүчү",
    nav_ai_tasks: "ИИ тапшырмалары",
    nav_customers: "Кардарлар",
    nav_knowledge: "Билим базасы",
    nav_insights: "Аналитика",
    nav_settings: "Жөндөөлөр",
    nav_help: "Жардам жана колдоо",
    nav_logout: "Чыгуу",
    common_save: "Сактоо",
    common_cancel: "Жокко чыгаруу",
    common_delete: "Жок кылуу",
    common_edit: "Түзөтүү",
    common_add: "Кошуу",
    common_search: "Издөө",
    common_filter: "Чыпкалоо",
    common_loading: "Жүктөлүүдө...",
    common_error: "Бир нерсе туура болбоду",
    common_empty: "Азырынча эч нерсе жок",
    common_view_all: "Баарын көрүү",
    common_demo_data: "Демо маалымат",
    common_configuration_required: "Жөндөө талап кылынат",
    common_approve: "Бекитүү",
    common_reject: "Четке кагуу",
    common_retry: "Кайталоо",
    common_send: "Жөнөтүү",
    common_close: "Жабуу",
    common_confirm: "Ырастоо",
    common_back: "Артка",
    common_next: "Кийинки",
    common_skip: "Өткөрүп жиберүү",
    common_connect: "Туташтыруу",
    common_disconnect: "Ажыратуу",
    common_copy: "Көчүрүү",
    common_status: "Статус",
    common_today: "Бүгүн",
    common_days_7: "7 күн",
    common_days_30: "30 күн",
    common_custom: "Мезгил",
    common_new: "Жаңы",
    auth_login: "Кирүү",
    auth_signup: "Катталуу",
    auth_email: "Электрондук почта",
    auth_password: "Сыр сөз",
    auth_forgot_password: "Сыр сөздү унуттуңузбу?",
    auth_remember_me: "Мени эстеп кал",
    auth_no_account: "Аккаунтуңуз жокпу?",
    auth_has_account: "Аккаунтуңуз барбы?",
    auth_verify_email: "Почтаңызды текшериңиз",
    auth_reset_password: "Сыр сөздү жаңылоо",
    auth_demo_explore: "Демо иш мейкандын карап чыгуу",
    auth_tagline: "Бизнесиңиз үчүн ИИ менен кардарлар менен байланыш",
    auth_benefit_1: "ИИ жооп даярдайт, сиз башкарасыз",
    auth_benefit_2: "Бардык WhatsApp маектери бир жерде",
    auth_benefit_3: "Кыргызча, орусча жана англисче сүйлөшүңүз",
    auth_trust: "Кардарларыңыздын маалыматы купуя жана үчүнчү тараптарга берилбейт.",
    auth_terms: "Колдонуу шарттары",
    auth_privacy: "Купуялык саясаты",
    auth_logging_in: "Кирүүдө...",
    auth_invalid_credentials: "Туура эмес email же сыр сөз",
    auth_logout_confirm: "Чыгасызбы?",
    auth_logout_confirm_desc: "Кирүү барагына кайтарыласыз.",
    overview_title: "Жалпы көрүнүш",
    overview_subtitle: "Кардарлар менен маектер, ИИ активдүүлүгү жана сизди күткөн тапшырмалар.",
    overview_customers_contacted: "Байланышкан кардарлар",
    overview_ai_resolved: "ИИ чечти",
    overview_ai_active: "ИИ активдүү",
    overview_needs_human: "Менеджерди күтүүдө",
    overview_conversations_by_day: "Күн боюнча маектер",
    overview_ai_command_center: "ИИ башкаруу борбору",
    overview_create_ai_task: "ИИ тапшырма түзүү",
    overview_channel_health: "Каналдын абалы",
    overview_alerts: "Эскертүүлөр",
    overview_recent_escalations: "Акыркы эскалациялар",
    overview_recent_ai_activity: "ИИ активдүүлүгү",
    overview_knowledge_suggestions: "Билим базасы сунуштары",
    overview_avg_first_response: "Орто биринчи жооп",
    overview_ai_resolution_rate: "ИИ чечүү пайызы",
    overview_manager_time_saved: "Менеджер убактысынын үнөмдөлүшү",
    inbox_title: "Кирүүчү",
    inbox_unread: "Окулбаган",
    inbox_needs_human: "Менеджерди күтүүдө",
    inbox_ai_active: "ИИ активдүү",
    inbox_resolved: "Чечилди",
    inbox_search_conversations: "Маектерди издөө...",
    inbox_ai_draft: "ИИ долбоору",
    inbox_approve_send: "Бекитип жөнөтүү",
    inbox_regenerate: "Кайра жаратуу",
    inbox_take_over: "Башкарууну алуу",
    inbox_hand_back_ai: "ИИ-га кайтаруу",
    inbox_escalate: "Эскалациялоо",
    inbox_resolve: "Аяктоо",
    inbox_internal_note: "Ички эскертүү",
    inbox_reply: "Жооп берүү",
    inbox_composer_placeholder: "Жооп жазыңыз...",
    inbox_channel_not_configured: "WhatsApp канал жөндөлгөн эмес. Билдирүүлөр жөнөтүлбөйт.",
    inbox_no_conversations: "Сиздин суроо боюнча маектер жок.",
    tasks_title: "ИИ тапшырмалары",
    tasks_subtitle: "Менеджердин нускамалары жана аткаруу тарыхы.",
    tasks_draft: "Долбоор",
    tasks_awaiting_approval: "Бекитүүнү күтүүдө",
    tasks_scheduled: "Пландалган",
    tasks_running: "Аткарылууда",
    tasks_completed: "Аяктады",
    tasks_failed: "Ката",
    tasks_new_task: "Жаңы ИИ тапшырма",
    tasks_describe_goal: "Максатты сүрөттөңүз",
    tasks_select_target: "Максатты тандаңыз",
    tasks_select_action: "Аракетти тандаңыз",
    tasks_preview: "Алдын ала көрүү",
    tasks_safety_warning: "Бул аракет кардарларга таасир этет. Бекитүү талап кылынат.",
    tasks_requires_approval: "Бекитүү талап кылынат",
    customers_title: "Кардарлар",
    customers_search: "Кардарларды издөө...",
    customers_add_note: "Эскертүү кошуу",
    customers_open_conversation: "Маекти ачуу",
    customers_create_task: "Тапшырма түзүү",
    customers_assign_manager: "Менеджер дайындоо",
    customers_last_contact: "Акыркы байланыш",
    customers_language: "Тил",
    customers_sentiment: "Тон",
    customers_no_customers: "Кардарлар табылган жок.",
    knowledge_title: "Билим базасы",
    knowledge_add: "Билим кошуу",
    knowledge_search: "Издөө...",
    knowledge_verified: "Текшерилген",
    knowledge_draft: "Долбоор",
    knowledge_needs_review: "Текшерүү талап кылынат",
    knowledge_outdated: "Эскирген",
    knowledge_archived: "Архив",
    knowledge_faq: "Суроолор жана жооптор",
    knowledge_products: "Товарлар жана кызматтар",
    knowledge_prices: "Баалар",
    knowledge_policies: "Саясаттар",
    knowledge_delivery: "Жеткирүү",
    knowledge_hours: "Иш убактысы",
    knowledge_suggestions: "ИИ сунуштары",
    knowledge_upload_note: "Жүктөлгөн файлдар ИИ тарабынан автоматтык түрдө текшерилбейт.",
    insights_title: "Аналитика",
    insights_subtitle: "Бизнесиңиздин маек аналитикасы.",
    insights_volume: "Маек көлөмү",
    insights_unique_customers: "Уникалдуу кардарлар",
    insights_first_response: "Биринчи жооп убактысы",
    insights_resolution_time: "Чечүү убактысы",
    insights_ai_rate: "ИИ чечүү пайызы",
    insights_escalation_rate: "Эскалация пайызы",
    insights_topics: "Негизги темалар",
    insights_peak_hours: "Эң активдүү саат",
    insights_opportunities: "Мүмкүнчүлүктөр",
    insights_demo_label: "Демо маалымат — реалдуу системадан эмес",
    settings_title: "Жөндөөлөр",
    settings_profile: "Профиль",
    settings_business: "Бизнес",
    settings_channels: "Каналдар",
    settings_team: "Команда жана укуктар",
    settings_ai_behavior: "ИИ жүрүм-туруму",
    settings_notifications: "Билдирмелер",
    settings_security: "Коопсуздук жана маалымат",
    settings_save: "Өзгөртүүлөрдү сактоо",
    settings_saved: "Өзгөртүүлөр сакталды",
    settings_whatsapp_connect: "WhatsApp туташтыруу",
    settings_invite_member: "Мүчө чакыруу",
    help_title: "Жардам жана колдоо",
    help_search: "Жардам макалаларын издөө...",
    help_guides: "Колдонмолор",
    help_faq: "Жыш суроолор",
    help_shortcuts: "Баскыч айкалыштары",
    help_contact: "Колдоо кызматы",
    help_status: "Системанын абалы",
    onboard_title: "Иш мейканыңызды баштаңыз",
    onboard_step_language: "Тил тандоо",
    onboard_step_business: "Бизнес маалыматтары",
    onboard_step_whatsapp: "WhatsApp туташтыруу",
    onboard_step_knowledge: "Билим кошуу",
    onboard_step_ai: "ИИ жүрүм-туруму",
    onboard_step_team: "Команда чакыруу",
    onboard_whatsapp_phone: "Телефон номери менен туташуу",
    onboard_whatsapp_qr: "QR коду менен туташуу",
    onboard_skip: "Өткөрүп жиберүү",
    onboard_complete: "Жөндөөнү аяктоо",
  },
}

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: keyof Translations) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "ru"
  const lang = navigator.language.slice(0, 2).toLowerCase()
  if (lang === "en") return "en"
  if (lang === "ky") return "ky"
  return "ru"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru")

  useEffect(() => {
    const stored = localStorage.getItem("ait-locale") as Locale | null
    if (stored && ["en", "ru", "ky"].includes(stored)) {
      setLocaleState(stored)
    } else {
      setLocaleState(getBrowserLocale())
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("ait-locale", l)
  }, [])

  const t = useCallback(
    (key: keyof Translations): string => {
      return translations[locale][key] ?? translations.en[key] ?? key
    },
    [locale]
  )

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
