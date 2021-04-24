import frappe

def before_submit(self,method):
	so_list = []
	if not self.printout_taken:
		frappe.throw("Printout Taken is mandatory.")
	
	so_list = list(set([d.against_sales_order for d in self.items]))

	for row in so_list:
		frappe.db.set_value("Sales Order",row,'printout_taken', self.printout_taken)