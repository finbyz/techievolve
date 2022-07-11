import frappe
from frappe.utils import flt
from techievolve.techievolve.report.item_groupwise_stock_balance.item_groupwise_stock_balance import create_stock_entry
def before_validate(self, method):
	if not self.uoms:
		self.uoms = []

	case_flag = True
	master_case_flag = True

	for x in self.uoms:
		if x.uom == "Case":
			case_flag = False
			if self.stock_uom == "Nos":
				x.conversion_factor = self.case_qty
			elif self.stock_uom == "Case":
				x.conversion_factor = 1
		
		if x.uom == "Master Case":
			master_case_flag = False
			if self.stock_uom == "Nos":
				x.conversion_factor = self.master_case_qty
			elif self.stock_uom == "Case":
				x.conversion_factor = self.master_case_qty / self.case_qty


	if self.stock_uom == "Case":
		if case_flag:
			self.append('uoms',{
				'uom':'Case',
				'conversion_factor':1
			})
		if master_case_flag:
			self.append('uoms',{
				'uom':'Master Case',
				'conversion_factor':self.master_case_qty / self.case_qty			
			})

	elif self.stock_uom == 'Nos':
		if case_flag:
			self.append('uoms', {
				'uom': 'Case',
				'conversion_factor': self.case_qty
			})

		if master_case_flag:
			self.append('uoms', {
				'uom': 'Master Case',
				'conversion_factor': self.master_case_qty
			})

def validate(self,method):
	if self.supplier_items:
		self.supplier = frappe.db.get_value("Item Supplier",{'parent':self.name},"supplier")
	else:
		self.supplier = ""
	calculate_buying_price(self)

def calculate_buying_price(self):
	if self.unit_buying_price and self.case_qty and flt(self.unit_buying_price * self.case_qty) != flt(self.buying_price):
		self.buying_price = flt(self.unit_buying_price * self.case_qty)
		
def on_update(self,method):
	create_item_price(self)

def create_item_price(self):
	if self.buying_price:
		buying_price_list = frappe.db.get_single_value('Buying Settings', 'buying_price_list')
		if frappe.db.exists("Item Price",{"item_code":self.item_code,"price_list": buying_price_list}):
			name = frappe.db.get_value("Item Price",{"item_code":self.item_code,"price_list": buying_price_list},'name')
			frappe.db.set_value("Item Price",name,"price_list_rate",self.buying_price)
		else:
			item_price = frappe.new_doc("Item Price")
			item_price.price_list = buying_price_list
			item_price.buying = 1
			item_price.item_code = self.item_code
			item_price.price_list_rate= self.buying_price
				
			item_price.save()

@frappe.whitelist()
def get_stock_qty(item_code, warehouse):
	if not warehouse:
		frappe.throw("Please Define Warehouse in Auto Reorder Section")
		
	stock_qty = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty")
	return flt(stock_qty) or 0

@frappe.whitelist()
def change_qty(item_code, new_qty):
	warehouse = frappe.db.get_value('Item Reorder', { "parent": item_code, "parenttype": "Item" }, 'warehouse')
	if not warehouse:
		frappe.throw("Please Define Warehouse in Auto Reorder Section")

	buying_unit_price = frappe.db.get_value("Item Price",{"item_code": item_code,"buying":1},"price_list_rate")
	if not buying_unit_price:
		frappe.throw("Please Define Item Price For Buying Unit")
	
	stock_qty = get_stock_qty(item_code, warehouse)
	
	if flt(stock_qty) != flt(new_qty):
		create_stock_entry(warehouse, None, item_code, stock_qty, buying_unit_price, new_qty)
		stock_qty = get_stock_qty(item_code, warehouse)
		frappe.db.set_value("Item", item_code, "stock_qty", stock_qty)