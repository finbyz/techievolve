# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "techievolve"
app_title = "Techievolve"
app_publisher = "Finbyz Tech Pvt Ltd"
app_description = "Custom App"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "info@finbyz.com"
app_license = "GPL 3.0"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/techievolve/css/techievolve.css"
# app_include_js = "/assets/techievolve/js/techievolve.js"
app_include_html = "/assets/techievolve/js/techievolve.js"
# include js, css files in header of web template
# web_include_css = "/assets/techievolve/css/techievolve.css"
# web_include_js = "/assets/techievolve/js/techievolve.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "techievolve.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "techievolve.install.before_install"
# after_install = "techievolve.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "techievolve.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }
app_include_css = ["assets/css/techievolve.css"]
app_include_js = "assets/js/techieevolve.min.js"

doctype_js = {
	"Supplier":"public/js/supplier.js",
	"Purchase Order":"public/js/purchase_order.js",
	"Purchase Invoice":"public/js/purchase_invoice.js",
	"Purchase Receipt":"public/js/purchase_receipt.js",
	"Sales Order":"public/js/sales_order.js",
	"Sales Invoice":"public/js/sales_invoice.js",
	"Delivery Note":"public/js/delivery_note.js",
	"Stock Entry":"public/js/stock_entry.js"
}
doc_events = {
	"Item":{
		"before_validate": "techievolve.techievolve.doc_events.item.before_validate",
		"on_update": "techievolve.techievolve.doc_events.item.on_update",
	},
	"Material Request":{
		"before_validate": "techievolve.techievolve.doc_events.material_request.before_validate"
	},
	"Quotation": {
		'before_validate': "techievolve.api.quotation_before_validate"
	}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"techievolve.tasks.all"
# 	],
# 	"daily": [
# 		"techievolve.tasks.daily"
# 	],
# 	"hourly": [
# 		"techievolve.tasks.hourly"
# 	],
# 	"weekly": [
# 		"techievolve.tasks.weekly"
# 	]
# 	"monthly": [
# 		"techievolve.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "techievolve.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "techievolve.event.get_events"
# }
override_whitelisted_methods = {
	"frappe.desk.search.search_link": "techievolve.api.search_link"
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "techievolve.task.get_dashboard_data"
# }

override_doctype_dashboards = {
	"Supplier": "techievolve.techievolve.dashboard.supplier.get_data",
}


fixtures = ["Custom Field", "Custom Script"]