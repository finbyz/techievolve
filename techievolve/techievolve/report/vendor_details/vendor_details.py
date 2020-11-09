# Copyright (c) 2013, Finbyz Tech Pvt Ltd and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt
from erpnext.stock.doctype.material_request.material_request import make_purchase_order_based_on_supplier

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
	for d in data:
		if d['supplier']:
			po_amount = frappe.db.sql("""select SUM(po.total) as po_amount from `tabPurchase Order` as po where po.docstatus=1 and po.supplier='{}'""".format(d['supplier']))
			if po_amount:
				d['po_amount'] = po_amount[0][0]
			mr_amount = frappe.db.sql("""select SUM(mr.amount) as mr_amount from `tabMaterial Request Item` as mr JOIN `tabMaterial Request` as m on m.name = mr.parent where m.status <> "Ordered" and mr.docstatus=1 and mr.supplier ='{}'""".format(d['supplier']))
			if mr_amount:
				d['mr_amount'] = mr_amount[0][0]
			if d['mr_amount']:
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
	doc.schedule_date = doc.transaction_date
	for d in doc.items:
		d.schedule_date = doc.transaction_date
	doc.save()
	return doc.name