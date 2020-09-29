import frappe

def before_validate(self, method):
	if not self.uoms:
		self.uoms = []

	case_flag = True
	master_case_flag = True

	for x in self.uoms:
		if x.uom == "Case":
			case_flag = False
			x.conversion_factor = self.case_qty
		
		if x.uom == "Master Case":
			master_case_flag = False
			x.conversion_factor = self.master_case_qty
	
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