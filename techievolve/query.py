from __future__ import unicode_literals
import frappe
from frappe.desk.reportview import get_match_cond, get_filters_cond
from frappe.utils import nowdate

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def item_query(doctype, txt, searchfield, start, page_len, filters, as_dict=False):
	conditions = []
	
	#Get searchfields from meta and use in Item Link field query
	meta = frappe.get_meta("Item", cached=True)
	searchfields = meta.get_search_fields()

	if "description" in searchfields:
		searchfields.remove("description")

	columns = ''
	extra_searchfields = [field for field in searchfields
		if not field in ["name", "item_group", "description"]]

	if extra_searchfields:
		columns = ", " + ", ".join(extra_searchfields)

	searchfields = searchfields + [field for field in[searchfield or "name", "item_code", "item_group", "item_name"]
		if not field in searchfields]
	searchfields = " or ".join([field + " like %(txt)s" for field in searchfields])

	description_cond = ''
	if frappe.db.count('Item', cache=True) < 50000:
		# scan description only if items are less than 50000
		description_cond = 'or tabItem.description LIKE %(txt)s'

	where_condition = ''
	if filters.get('supplier'):
		where_condition =  "and tabItem.name in (select parent from `tabItem Supplier` where supplier = '{}')".format(filters.get('supplier'))

	items = frappe.db.sql("""select tabItem.name, tabItem.image,bin.actual_qty,
		tabItem.case_qty, tabItem.master_case_qty,
		if(length(tabItem.item_name) > 40,
			concat(substr(tabItem.item_name, 1, 40), "..."), item_name) as item_name,
		tabItem.item_group
		{columns}
		from tabItem
		LEFT JOIN (
		  SELECT b.item_code as item, round(sum(b.actual_qty),2) as actual_qty
		  FROM `tabBin` as b
		  GROUP BY b.item_code
		) as bin ON (tabItem.name = bin.item and tabItem.is_stock_item = 1) 

		where tabItem.docstatus < 2
			and tabItem.has_variants=0
			and tabItem.disabled=0
			and (tabItem.end_of_life > %(today)s or ifnull(tabItem.end_of_life, '0000-00-00')='0000-00-00')
			{where_condition}
			and ({scond} or tabItem.item_code IN (select parent from `tabItem Barcode` where barcode LIKE %(txt)s)
				{description_cond})
			 {mcond}
		order by
			if(locate(%(_txt)s, tabItem.name), locate(%(_txt)s, tabItem.name), 99999),
			if(locate(%(_txt)s, item_name), locate(%(_txt)s, item_name), 99999),
			tabItem.idx desc,
			tabItem.name, item_name
		 """.format(
			columns=columns,
			where_condition = where_condition,
			scond=searchfields,
			# fcond=get_filters_cond(doctype, filters, conditions).replace('%', '%%'),
			mcond=get_match_cond(doctype).replace('%', '%%'),
			description_cond = description_cond),
			{
				"today": nowdate(),
				"txt": "%%%s%%" % txt,
				"_txt": txt.replace("%", ""),
				"start": start,
				"page_len": page_len
			}, as_list=True)

	if items:
		for item in items:
			if item[1]:
				item[1] = f"<img class='float-left' height='50' width='70' src='{item[1]}'>"
		items = tuple(items)
		return items


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def item_query_custom(doctype, txt, searchfield, start, page_len, filters, as_dict=False):
	conditions = []
	
	#Get searchfields from meta and use in Item Link field query
	meta = frappe.get_meta("Item", cached=True)
	searchfields = meta.get_search_fields()

	if "description" in searchfields:
		searchfields.remove("description")

	columns = ''
	extra_searchfields = [field for field in searchfields
		if not field in ["name", "item_group", "description"]]

	if extra_searchfields:
		columns = ", " + ", ".join(extra_searchfields)

	searchfields = searchfields + [field for field in[searchfield or "name", "item_code", "item_group", "item_name"]
		if not field in searchfields]
	searchfields = " or ".join([field + " like %(txt)s" for field in searchfields])

	description_cond = ''
	if frappe.db.count('Item', cache=True) < 50000:
		# scan description only if items are less than 50000
		description_cond = 'or tabItem.description LIKE %(txt)s'

	where_condition = ''
	if filters.get('supplier'):
		where_condition =  "and tabItem.name in (select parent from `tabItem Supplier` where supplier = '{}')".format(filters.get('supplier'))
	
	if filters.get('item_code'):
		where_condition += " and tabItem.name not in {}".format("(" + ", ".join([f'"{l}"' for l in filters.get('item_code')[-1]]) + ")")

	items = frappe.db.sql("""select tabItem.name, tabItem.image,bin.actual_qty,
		tabItem.case_qty, tabItem.master_case_qty,
		if(length(tabItem.item_name) > 40,
			concat(substr(tabItem.item_name, 1, 40), "..."), item_name) as item_name,
		tabItem.item_group
		{columns}
		from tabItem
		LEFT JOIN (
		  SELECT b.item_code as item, round(sum(b.actual_qty),2) as actual_qty
		  FROM `tabBin` as b
		  GROUP BY b.item_code
		) as bin ON (tabItem.name = bin.item and tabItem.is_stock_item = 1) 

		where tabItem.docstatus < 2
			and tabItem.has_variants=0
			and tabItem.disabled=0
			and (tabItem.end_of_life > %(today)s or ifnull(tabItem.end_of_life, '0000-00-00')='0000-00-00')
			{where_condition}
			and ({scond} or tabItem.item_code IN (select parent from `tabItem Barcode` where barcode LIKE %(txt)s)
				{description_cond})
			 {mcond}
		order by
			if(locate(%(_txt)s, tabItem.name), locate(%(_txt)s, tabItem.name), 99999),
			if(locate(%(_txt)s, item_name), locate(%(_txt)s, item_name), 99999),
			tabItem.idx desc,
			tabItem.name, item_name
		limit %(start)s, %(page_len)s """.format(
			columns=columns,
			where_condition = where_condition,
			scond=searchfields,
			fcond=get_filters_cond(doctype, filters, conditions).replace('%', '%%'),
			mcond=get_match_cond(doctype).replace('%', '%%'),
			description_cond = description_cond),
			{
				"today": nowdate(),
				"txt": "%%%s%%" % txt,
				"_txt": txt.replace("%", ""),
				"start": start,
				"page_len": page_len
			}, as_list=True)

	if items:
		for item in items:
			if item[1]:
				item[1] = f"<img class='float-left' height='50' width='70' src='{item[1]}'>"
		items = tuple(items)
		return items