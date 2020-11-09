# Copyright (c) 2013, Finbyz Tech Pvt Ltd and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import functools
from past.builtins import cmp
from frappe import _
from frappe.utils import flt
# import frappe

def execute(filters=None):
	columns, data = [], []
	columns = [
		{
			"fieldname": "item_group",
			"label": ("Item Group"),
			"fieldtype": "Data",
			"options": "Item Group",
			"width": 250,
		},
		{
			"label": _("Image"),
			"fieldname": "image",
			"fieldtype": "html",
			"width": 100,
		},
		{
			"label": _("Item Code"),
			"fieldname": "item_code",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"label": _("Supplier Number"),
			"fieldname": "supplier",
			"fieldtype": "Link",
			"options": "Supplier",
			"width": 170,
		},
		{
			"fieldname": "shelf_location",
			"label": ("Shelf Location"),
			"fieldtype": "Link",
			"options": "Warehouse",
			"width": 150,
		},
		{
			"fieldname": "buying_unit_price",
			"label": ("Cost"),
			"fieldtype": "Currency",
			"width": 80,
		},
		{
			"fieldname": "selling_unit_price",
			"label": ("Price"),
			"fieldtype": "Currency",
			"width": 80,
		},
		{
			"fieldname": "balance_qty",
			"label": ("Avl Qty"),
			"fieldtype": "Float",
			"width": 80,
		},
		{
			"fieldname": "new_qty",
			"label": ("Change Qty"),
			"fieldtype": "button",
			"width": 100,
		},
		{
			"fieldname": "tooltip",
			"label": ("ToolTip"),
			"fieldtype": "Float",
			"width": 80,
		},
	]
	data = get_data(filters)
	for row in data:
		if row['item_code']:
			row['new_qty'] = """
					<button style='margin-left:5px;border:none;color: #fff; background-color: #5e64ff; padding: 3px 5px;border-radius: 5px;' 
						type='button' item-code='{}' item-group='{}' balance_qty='{}' supplier='{}' warehouse='{}' buying_unit_price='{}'
						onClick='new_qty_details(this.getAttribute("item-code"),this.getAttribute("item-group"),this.getAttribute("balance_qty"),this.getAttribute("supplier"),this.getAttribute("warehouse"),this.getAttribute("buying_unit_price"))'>Change Qty</button>""".format(row.item_code,row.item_group,row.balance_qty,row.supplier_name, row.warehouse, row.buying_unit_price)

	return columns, data

def get_data(filters):
	item_group = get_item_group(filters)

	if not item_group:
		return None
	
	item_group = filter_item_group(item_group)

	out = prepare_data(item_group)
	data = get_final_out(out)

	return data

def get_group_map(out):
	sorted_out = sorted(out, key = lambda i: (i['indent'],i['parent_item_group']),reverse=True)
	item_group_map = {}		

	for row in sorted_out:
		if row.is_group ==1 and item_group_map.get(row.item_group):
			row.balance_qty = item_group_map.get(row.item_group).balance_qty
			row.balance_value = item_group_map.get(row.item_group).balance_value
		if row.parent_item_group:
			item_group_map.setdefault(row.parent_item_group, frappe._dict({
					"balance_qty": 0.0,
					"balance_value": 0.0
				}))
			item_group_dict = item_group_map[row.parent_item_group]
			item_group_dict.balance_qty += flt(row.balance_qty)
			item_group_dict.balance_value += flt(row.balance_value)
	
	return item_group_map

def get_final_out (out):
	data = []
	item_group_map = get_group_map(out)
	for row in out:
		if row.is_group and item_group_map.get(row.item_group):
			row.balance_qty = item_group_map.get(row.item_group).balance_qty
			row.balance_value = item_group_map.get(row.item_group).balance_value
		flag = 0
		if row.balance_qty > 0:
			row.valuation = flt(row.balance_value)/flt(row.balance_qty)
			flag = 1
		if row.image:
			row.image = "<div><img src='{}'></div>".format(row.image)
			flag = 1
		if row.item_code and not row.image:
			row.image = "<div><p>No Image</p></div>"
			flag = 1  
		if flag == 1:
			data.append(row)
	return data
		

def get_item_group(filters):
	item_group = frappe.db.sql("""
		select 
			name, parent_item_group, 1 as is_group
		from
			`tabItem Group`
		order by lft""", as_dict=True)

	item = frappe.db.sql(f"""
		select 
			su.supplier_part_no as supplier, su.supplier as supplier_name,i.image ,i.name, i.name as item_code,i.item_name,i.shelf_location, i.item_group as parent_item_group, 0 as is_group
		from
			`tabItem` as i
			LEFT JOIN `tabItem Supplier` as su ON su.parent = i.name
			LEFT JOIN `tabItem Default` as d ON d.parent = i.name
		""", as_dict=True)
	
	item_map = get_item_map(filters)
	for data in item:
		data.balance_qty, data.balance_value, data.warehouse = item_map.get(data.name) or (0, 0,'')
		buy = frappe.db.get_value("Item Price",{"item_code":data.item_code,"buying":1},"price_list_rate")
		sell = frappe.db.get_value("Item Price",{"item_code":data.item_code,"selling":1},"price_list_rate")
		if buy:
			data.buying_unit_price = buy 
		if sell:
			data.selling_unit_price = sell
	
	return (item_group + item)
	

def get_item_map(filters):
	data = frappe.db.sql(f"""
		select b.item_code, sum(actual_qty) as qty, sum(stock_value) as value, b.warehouse
		from `tabBin` as b JOIN `tabWarehouse` as w on w.name = b.warehouse
		group by b.item_code
	""", as_dict = 1)

	item_map = {}

	for row in data:
		item_map[row.item_code] = [row.qty, row.value, row.warehouse]
		
		
	return item_map

def filter_item_group(item_group, depth=10):
	parent_children_map = {}
	item_group_by_name = {}
	
	for d in item_group:
		item_group_by_name[d.name] = d
		parent_children_map.setdefault(d.parent_item_group or None, []).append(d)
	
	non_unique_filtered_item_group = []
	filtered_item_group = []

	def add_to_list(parent, level):

		if level < depth:
			children = parent_children_map.get(parent) or []
			sort_item_group(children, is_root=True if parent==None else False)

			for child in children:
				child.indent = level
				if child.get('name') not in non_unique_filtered_item_group:
					filtered_item_group.append(child)
					non_unique_filtered_item_group.append(child.name)
				add_to_list(child.name, level + 1)

	add_to_list(None, 0)

	return filtered_item_group

def sort_item_group(item_group, is_root=False, key="name"):

	def compare_item_groups(a, b):
		return cmp(a[key], b[key]) or 1

	item_group.sort(key = functools.cmp_to_key(compare_item_groups))

def prepare_data(item_group):
	data = []

	for d in item_group:
		# add to output
		row = frappe._dict({
			"image":d.image,
			"item_group": _(d.item_name or d.name),
			"parent_item_group": _(d.parent_item_group),
			"indent": flt(d.indent),
			"item_code":d.item_code,
			"supplier":d.supplier,
			"balance_qty": flt(d.balance_qty),
			"balance_value": flt(d.balance_value),
			"shelf_location":d.shelf_location,
			"buying_unit_price":d.buying_unit_price,
			"selling_unit_price":d.selling_unit_price,
			"is_group": d.is_group,
			"supplier_name":d.supplier_name,
			"warehouse":d.warehouse
		})
		data.append(row)
	return data

def filter_out_zero_value_rows(data, parent_children_map, show_zero_values=False):
	data_with_value = []
	for d in data:
		if show_zero_values or d.get("has_value"):
			data_with_value.append(d)
		else:
			# show group with zero balance, if there are balances against child
			children = [child.name for child in parent_children_map.get(d.get("item_group")) or []]
			if children:
				for row in data:
					if row.get("account") in children and row.get("has_value"):
						data_with_value.append(d)
						break

	return data_with_value

@frappe.whitelist()
def create_stock_entry(warehouse,supplier,item_code,balance_qty,buying_unit_price,new_qty):
	if float(new_qty) < 0:
		frappe.throw("Please Don't Enter Negative Qty")
	elif float(balance_qty) > float(new_qty):
		se_qty = abs(float(balance_qty) - float(new_qty))
		se = frappe.new_doc("Stock Entry")
		se.stock_entry_type = "Material Issue"
		se.posting_date = frappe.utils.nowdate()
		se.posting_time = frappe.utils.nowtime()
		se.from_warehouse = warehouse
		se.append("items",{
			"item_code":item_code,
			"s_warehouse":warehouse,
			"qty":se_qty,
		})
		se.save()
		se.submit()
		return se.name
	elif float(balance_qty) < float(new_qty):
		se_qty = abs(float(balance_qty) - float(new_qty))
		se = frappe.new_doc("Stock Entry")
		se.stock_entry_type = "Material Receipt"
		se.posting_date = frappe.utils.nowdate()
		se.posting_time = frappe.utils.nowtime()
		se.append("items",{
			"item_code":item_code,
			"t_warehouse":warehouse,
			"qty":se_qty,
			"basic_rate":buying_unit_price
		})
		se.save()
		se.submit()
		return se.name
