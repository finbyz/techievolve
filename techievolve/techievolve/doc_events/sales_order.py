import frappe
from frappe.utils import cstr, flt, getdate, cint, nowdate, add_days, get_link_to_form, strip_html
from frappe.model.mapper import get_mapped_doc
from frappe import _
from six import string_types
#from erpnext.selling.doctype.sales_order.sales_order import make_purchase_order_for_default_supplier

def on_submit(self,method):
	create_po(self)

def create_po(self):
	selected_items =  [row for row in self.items if frappe.db.get_value("Item",row.item_code,'delivered_by_supplier')]
	make_purchase_order_for_default_supplier(source_name=self.name,selected_items=selected_items)
	# create dict with supplier name key and value is in list of item code where supplier is same
	# Output like:
	# item_dict : {'DOLLAR KING': ['28575DK', '51103DK'], 'BLUE CROSS': ['00464BC']}

	# item_dict = {}
	# for row in doc.items:
	# 	supplier = frappe.db.get_value("Item Supplier",{'parent': row.item_code},'supplier')
	# 	if supplier:
	# 		if supplier in item_dict.keys():
	# 			item_dict[supplier].append(row.item_code)
	# 		else:
	# 			item_dict[supplier] = [row.item_code]

	# if item_dict:
	# 	for supplier, items in item_dict.items():
	# 		po = frappe.new_doc("Purchase Order")
	# 		po.supplier = supplier
	# 		po.transaction_date = self.transaction_date
	# 		po.schedule_date = self.transaction_date
	# 		for item in items:
	# 			po.append("items",{
	# 				'item_code': 
	# 			})

def make_purchase_order_for_default_supplier(source_name, selected_items=None, target_doc=None):
	if not selected_items: return

	if isinstance(selected_items, string_types):
		selected_items = json.loads(selected_items)

	def set_missing_values(source, target):
		target.supplier = supplier
		target.apply_discount_on = ""
		target.additional_discount_percentage = 0.0
		target.discount_amount = 0.0
		target.inter_company_order_reference = ""
		target.schedule_date = source.delivery_date or source.transaction_date

		default_price_list = frappe.get_value("Supplier", supplier, "default_price_list")
		if default_price_list:
			target.buying_price_list = default_price_list

		if any( item.delivered_by_supplier==1 for item in source.items):
			if source.shipping_address_name:
				target.shipping_address = source.shipping_address_name
				target.shipping_address_display = source.shipping_address
			else:
				target.shipping_address = source.customer_address
				target.shipping_address_display = source.address_display

			target.customer_contact_person = source.contact_person
			target.customer_contact_display = source.contact_display
			target.customer_contact_mobile = source.contact_mobile
			target.customer_contact_email = source.contact_email

		else:
			target.customer = ""
			target.customer_name = ""

		target.run_method("set_missing_values")
		target.run_method("calculate_taxes_and_totals")

	def update_item(source, target, source_parent):
		target.schedule_date = source.delivery_date or source_parent.transaction_date
		target.qty = flt(source.qty) - (flt(source.ordered_qty) / flt(source.conversion_factor))
		target.stock_qty = (flt(source.stock_qty) - flt(source.ordered_qty))
		target.project = source_parent.project

	suppliers = [item.get('supplier') for item in selected_items if item.get('supplier') and item.get('supplier')]
	suppliers = list(set(suppliers))

	items_to_map = [item.get('item_code') for item in selected_items if item.get('item_code') and item.get('item_code')]
	items_to_map = list(set(items_to_map))

	if not suppliers:
		frappe.throw(_("Please set a Supplier against the Items to be considered in the Purchase Order."))

	for supplier in suppliers:
		po = frappe.get_list("Purchase Order", filters={"sales_order":source_name, "supplier":supplier, "docstatus": ("<", "2")})
		if len(po) == 0:
			doc = get_mapped_doc("Sales Order", source_name, {
				"Sales Order": {
					"doctype": "Purchase Order",
					"field_no_map": [
						"address_display",
						"contact_display",
						"contact_mobile",
						"contact_email",
						"contact_person",
						"taxes_and_charges",
						"shipping_address",
						"terms"
					],
					"validation": {
						"docstatus": ["=", 1]
					}
				},
				"Sales Order Item": {
					"doctype": "Purchase Order Item",
					"field_map":  [
						["name", "sales_order_item"],
						["parent", "sales_order"],
						["stock_uom", "stock_uom"],
						["uom", "uom"],
						["conversion_factor", "conversion_factor"],
						["delivery_date", "schedule_date"]
			 		],
					"field_no_map": [
						"rate",
						"price_list_rate",
						"item_tax_template",
						"discount_percentage",
						"discount_amount",
						"pricing_rules"
					],
					"postprocess": update_item,
					"condition": lambda doc: doc.ordered_qty < doc.stock_qty and doc.supplier == supplier and doc.item_code in items_to_map
				}
			}, target_doc, set_missing_values)

			doc.insert()
			doc.submit()
		else:
			suppliers =[]
	if suppliers:
		frappe.db.commit()
		return doc
	else:
		frappe.msgprint(_("Purchase Order already created for all Sales Order items"))
