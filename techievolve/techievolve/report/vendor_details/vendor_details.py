# Copyright (c) 2013, Finbyz Tech Pvt Ltd and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt, getdate, nowdate
from frappe.model.mapper import get_mapped_doc
from frappe import msgprint, _
from six import string_types
# from erpnext.stock.doctype.material_request.material_request import make_purchase_order_based_on_supplier

def execute(filters=None):
	columns, data = [], []
	columns = get_columns(filters)
	data  = get_data(filters)
	return columns, data

def get_data(filters):
	conditions = get_condition(filters)
	data = frappe.db.sql("""
		select
			s.name as supplier, COUNT(isr.name) as total_items, addr.email_id as contact, addr.phone as telephone,
				addr.fax
		from
			`tabSupplier` as s
			LEFT JOIN `tabItem Supplier` as isr on isr.supplier = s.name
			LEFT JOIN `tabAddress` as addr on addr.name = s.name
		group by
			s.name
	""",as_dict=1)

	po_amount_data = frappe.db.sql("""
		select 
			po.supplier, SUM(po.total) as po_amount
		from
			`tabPurchase Order` as po
		where
			po.docstatus = 1
		group by po.supplier
	""", as_dict= True)

	po_amount_dict = {}
	for po_row in po_amount_data:
		po_amount_dict[po_row.supplier] = po_row.po_amount

	mr_amount_data = frappe.db.sql("""
		select 
			mr.supplier, SUM(mr.amount) as mr_amount
		from
			`tabMaterial Request Item` as mr
			JOIN `tabMaterial Request` as m on m.name = mr.parent
		where
			m.status <> "Ordered" and mr.docstatus=1 and mr.ordered_qty < mr.qty
		group by mr.supplier
	""", as_dict= True)

	mr_amount_dict = {}
	for mr_row in mr_amount_data:
		mr_amount_dict[mr_row.supplier] = mr_row.mr_amount

	for d in data:
		if d['supplier']:

			po_amount = po_amount_dict.get(d['supplier'])
			if po_amount:
				d.po_amount = po_amount

			mr_amount = mr_amount_dict.get(d['supplier']) or None
			if mr_amount:
				d.mr_amount = mr_amount
				
			if d.mr_amount and not d.po_amount:
				d['create_po'] = f"""<button style='margin-left:5px;border:none;color: #fff; background-color: #5e64ff; padding: 3px 5px;border-radius: 5px;'
						type='button' supplier='{d['supplier']}'
						onClick=new_purchase_order(this.getAttribute('supplier'))>Create Purchase Order</button>"""
	return data

def get_condition(filters):
	conditions = ""
	if filters.get("supplier"):
		conditions += " and s.supplier= '%s'" % filters["supplier"]
	return conditions

def get_columns(filters):
	columns = [
		{
			"label": _("Vendor"),
			"fieldname": "supplier",
			"fieldtype": "Link",
			"options": "Supplier",
			"width": 150
		},
		{
			"label": _("Total Items"),
			"fieldname": "total_items",
			"fieldtype": "Int",
			"width": 130
		},
		{
			"label": _("Material Request Amount"),
			"fieldname": "mr_amount",
			"fieldtype": "Currency",
			"width": 130
		},
		{
			"label": _("Purchase Order Amount"),
			"fieldname": "po_amount",
			"fieldtype": "Currency",
			"width": 130
		},
		{
			"label": _("Telephone"),
			"fieldname": "telephone",
			"fieldtype": "Data",
			"width": 130
		},
		{
			"label": _("Fax"),
			"fieldname": "fax",
			"fieldtype": "Data",
			"width": 130
		},
		{
			"label": _("Contact"),
			"fieldname": "contact",
			"fieldtype": "Data",
			"width": 130
		},
		
		{
			"label": _("Create Purchase Order"),
			"fieldname": "create_po",
			"fieldtype": "button",
			"width": 150
		},
	]
	return columns

@frappe.whitelist()
def add_item_details(supplier):
	doc = make_purchase_order_based_on_supplier(supplier)
	# doc.schedule_date = doc.transaction_date
	# for d in doc.items:
	# 	d.schedule_date = doc.transaction_date
	doc.save()
	return doc.name

@frappe.whitelist()
def make_purchase_order_based_on_supplier(source_name, target_doc=None):
	if target_doc:
		if isinstance(target_doc, string_types):
			import json
			target_doc = frappe.get_doc(json.loads(target_doc))
		target_doc.set("items", [])

	material_requests, supplier_items = get_material_requests_based_on_supplier(source_name)

	def postprocess(source, target_doc):
		target_doc.supplier = source_name
		if getdate(target_doc.schedule_date) < getdate(nowdate()):
			target_doc.schedule_date = getdate(nowdate())
		# target_doc.set("items", [d for d in target_doc.get("items")
		# 	if d.get("item_code") in supplier_items and d.get("qty") > 0])

		set_missing_values(source, target_doc)

	target_doc = frappe.new_doc("Purchase Order")
	target_doc.supplier = source_name

	for mr in material_requests:

		child_data = get_mapped_doc("Material Request Item", mr.child_name, {
			"Material Request Item": {
				"doctype": "Purchase Order Item",
				"field_map": [
					["name", "material_request_item"],
					["parent", "material_request"],
					["uom", "stock_uom"],
					["uom", "uom"],
				],
				"postprocess": update_item,
			},
		})

		# target_doc = get_mapped_doc("Material Request", mr.name, {
		# 	"Material Request": {
		# 		"doctype": "Purchase Order",
		# 	},
		# 	# "Material Request Item": {
		# 	# 	"doctype": "Purchase Order Item",
		# 	# 	"field_map": [
		# 	# 		["name", "material_request_item"],
		# 	# 		["parent", "material_request"],
		# 	# 		["uom", "stock_uom"],
		# 	# 		["uom", "uom"]
		# 	# 	],
		# 	# 	"postprocess": update_item,
		# 	# 	"condition": lambda doc: doc.name == mr.child_name
		# 	# }
		# }, target_doc)

		new_dict = child_data.__dict__

		for k in ["__islocal","dont_update_if_missing","print_templates","hide_in_print_layout","_meta",
						"__onload","idx","docstatus","parenttype","parentfield","parent","modified_by","modified","creation","owner",
							"flags","_default_new_docs","name","doctype"]:
			try:
				new_dict.pop(k)
			except:
				pass

		target_doc.append("items",new_dict)
	postprocess(source_name, target_doc)

	return target_doc

def get_material_requests_based_on_supplier(supplier):
	supplier_items = [d.parent for d in frappe.db.get_all("Item Default",
		{"default_supplier": supplier, "parenttype": "Item"}, 'parent')]
	if not supplier_items:
		frappe.throw(_("{0} is not the default supplier for any items.".format(supplier)))

	material_requests = frappe.db.sql("""select mr.name, mr_item.name as child_name
		from `tabMaterial Request` mr, `tabMaterial Request Item` mr_item, `tabItem` as item
		where mr.name = mr_item.parent
			and item.name = mr_item.item_code
			and mr_item.item_code in ({0})
			and mr_item.ordered_qty < mr_item.qty
			and mr_item.qty > 0
			and item.disabled = 0
			and mr.material_request_type = 'Purchase'
			and mr.per_ordered < 99.99
			and mr.docstatus = 1
			and mr.status != 'Stopped'
		order by mr_item.item_code ASC""".format(', '.join(['%s']*len(supplier_items))),
		tuple(supplier_items),as_dict= True)

	return material_requests, supplier_items

def set_missing_values(source, target_doc):
	if target_doc.doctype == "Purchase Order" and getdate(target_doc.schedule_date) <  getdate(nowdate()):
		target_doc.schedule_date = getdate(nowdate())
	target_doc.run_method("set_missing_values")
	target_doc.run_method("calculate_taxes_and_totals")

def update_item(obj, target, source_parent):
	target.conversion_factor = obj.conversion_factor
	target.qty = flt(flt(obj.stock_qty) - flt(obj.ordered_qty))/ target.conversion_factor
	target.stock_qty = (target.qty * target.conversion_factor)
	if getdate(target.schedule_date) < getdate(nowdate()):
		target.schedule_date = getdate(nowdate())