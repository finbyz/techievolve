import frappe
import json
from erpnext.shopping_cart.cart import update_cart
from frappe.desk.search import search_widget
from frappe.utils import flt,cstr, unique, cint
from frappe import _
from erpnext.shopping_cart.cart import _get_cart_quotation, get_cart_quotation, apply_cart_settings, get_shopping_cart_menu
from erpnext.stock.utils import get_incoming_rate
from frappe.client import get_password

@frappe.whitelist()
def update_cart_custom(item_data=[],ignore_permissions=True):
	item_list = json.loads(item_data)
	for d in item_list:
		result = update_cart(d['item_code'],flt(d['qty']))
	return result


def quotation_before_validate(self,method):
	get_price_list(self)

def get_price_list(self):
	for row in self.items:
		row.price_list_rate = flt(row.stock_qty) * flt(frappe.db.get_value("Item Price",{'item_code':row.item_code,'price_list':self.selling_price_list,'selling':1},'price_list_rate'))

@frappe.whitelist()
def search_link(doctype, txt, query=None, filters=None, page_length=20, searchfield=None, reference_doctype=None, ignore_user_permissions=False):
	search_widget(doctype, txt, query, searchfield=searchfield, page_length=page_length, filters=filters, reference_doctype=reference_doctype, ignore_user_permissions=ignore_user_permissions)
	if frappe.response["values"]:
		frappe.response['results'] = build_for_autosuggest(frappe.response["values"])
		del frappe.response["values"]

def build_for_autosuggest(res):
	results = []
	description = []
	for r in res:
		for idx, value in enumerate(r):
			if idx == 0:
				out = {"value": value}
			elif str(value).find("<img") != -1:
				out.update({"image": value})
			else:
				description.append(value)
			out.update({"description": ", ".join(unique(cstr(d) for d in description if d))})
		results.append(out)
	return results


@frappe.whitelist()
def update_cart(item_code, qty, additional_notes=None, with_items=False):
	quotation = _get_cart_quotation()
	
	empty_card = False
	qty = flt(qty)
	if qty == 0:
		quotation_items = quotation.get("items", {"item_code": ["!=", item_code]})
		if quotation_items:
			quotation.set("items", quotation_items)
			quotation.save()
		else:
			empty_card = True
			quotation.delete()
			quotation = None
	else:
		quotation_items = quotation.get("items", {"item_code": item_code})
		if not quotation_items:
			if not quotation.name:
				quotation.append("items", {
					"doctype": "Quotation Item",
					"item_code": item_code,
					"qty": qty,
					"stock_qty": qty,
					"additional_notes": additional_notes
				})
				quotation.flags.ignore_permissions = True
				quotation.save()
			else:
				item_args = {"item_code":item_code,'qty':qty,"company":quotation.company}
				rate = get_incoming_rate(item_args) 
				qcitem_name = frappe.generate_hash("",10)
				if not frappe.db.exists("Quotation Item",qcitem_name):
					frappe.db.sql("insert into `tabQuotation Item` (name,owner,docstatus,parent,parentfield,parenttype,item_code,item_name,qty,rate,amount,additional_notes) values ('{}','{}',{},'{}','{}','{}','{}','{}',{},{},{},'{}')".format(qcitem_name,frappe.session.user,0,quotation.name,"items","Quotation",item_code,frappe.db.get_value("Item",item_code,'item_name'),qty,rate,flt(rate*qty),additional_notes))
				else:
					qcitem_name = frappe.generate_hash("",10)
				quotation.append("items", {
					"doctype": "Quotation Item",
					"item_code": item_code,
					"qty": qty,
					"stock_qty": qty,
					"additional_notes": additional_notes
				})
			
		else:
			quotation_items[0].db_set('qty', qty)
			quotation_items[0].db_set('amount', flt(qty*quotation_items[0].rate))
			quotation_items[0].db_set('additional_notes', additional_notes)

	apply_cart_settings(quotation=quotation)

	# quotation.flags.ignore_permissions = True
	# quotation.payment_schedule = []
	# if not empty_card:
	# 	quotation.save()
	# else:
	# 	quotation.delete()
	# 	quotation = None

	set_cart_count(quotation)

	context = get_cart_quotation(quotation)

	if cint(with_items):
		return {
			"items": frappe.render_template("templates/includes/cart/cart_items.html",
				context),
			"taxes": frappe.render_template("templates/includes/order/order_taxes.html",
				context),
		}
	else:
		return {
			'name': quotation.name,
			'shopping_cart_menu': get_shopping_cart_menu(context)
		}

@frappe.whitelist()
def _update_cart(item_code, item_name, uom, qty, rate, amount, additional_notes=None):
	quotation = _get_cart_quotation()
	empty_card = False
	qty = flt(qty)
	if qty == 0:
		quotation_items = quotation.get("items", {"item_code": ["!=", item_code]})
		if quotation_items:
			quotation.set("items", quotation_items)
			frappe.db.sql("SET SQL_SAFE_UPDATES = 0")
			frappe.db.sql("delete from `tabQuotation Item` where item_code = '{}'".format(item_code))
			#quotation.save()
		else:
			empty_card = True
			quotation.delete()
			quotation = None
	else:
		quotation_items = quotation.get("items", {"item_code": item_code})
		if not quotation_items:
			if not quotation.name:
				quotation.append("items", {
					"doctype": "Quotation Item",
					"item_code": item_code,
					"qty": qty,
					"stock_qty": qty,
					"additional_notes": additional_notes
				})
				quotation.flags.ignore_permissions = True
				quotation.save()
			else:
				# item_args = {"item_code":item_code,'qty':qty,"company":quotation.company}
				# rate = get_incoming_rate(item_args) 
				item_idx = cstr(len(quotation.get("items")) + 1)
				qcitem_name = frappe.generate_hash("",10)
				if not frappe.db.exists("Quotation Item",qcitem_name):
					frappe.db.sql("insert into `tabQuotation Item` (idx,name,owner,docstatus,parent,parentfield,parenttype,item_code,item_name,qty,uom,description,rate,amount,additional_notes) values ('{}','{}','{}',{},'{}','{}','{}','{}','{}',{},'{}','{}',{},{},'{}')".format(item_idx,qcitem_name,frappe.session.user,0,quotation.name,"items","Quotation",item_code,item_name,qty,uom,item_name,flt(rate),flt(amount),additional_notes))
				else:
					qcitem_name = frappe.generate_hash("",10)
				quotation.append("items", {
					"doctype": "Quotation Item",
					"item_code": item_code,
					"qty": qty,
					"stock_qty": qty,
					"additional_notes": additional_notes
				})
			
		else:
			quotation_items[0].db_set('qty', qty)
			quotation_items[0].db_set('amount', flt(qty*quotation_items[0].rate))
			quotation_items[0].db_set('additional_notes', additional_notes)

	# apply_cart_settings(quotation=quotation)

	set_cart_count(quotation)

	return quotation.name
	# context = get_cart_quotation(quotation)
	# if cint(with_items):
	# 	return {
	# 		"items": frappe.render_template("templates/includes/cart/cart_items.html",
	# 			context),
	# 		"taxes": frappe.render_template("templates/includes/order/order_taxes.html",
	# 			context),
	# 	}
	# else:
	# 	return {
	# 		'name': quotation.name,
	# 		'shopping_cart_menu': get_shopping_cart_menu(context)
	# 	}

def set_cart_count(quotation=None):
	if not quotation:
		quotation = _get_cart_quotation()
	cart_count = cstr(len(quotation.get("items")))

	if hasattr(frappe.local, "cookie_manager"):
		frappe.local.cookie_manager.set_cookie("cart_count", cart_count)

@frappe.whitelist()
def place_order(payment_method=None):
	
	from erpnext.utilities.product import get_qty_in_stock
	
	quotation = _get_cart_quotation()
	cart_settings = frappe.db.get_value("Shopping Cart Settings", None,
		["company", "allow_items_not_in_stock"], as_dict=1)
	quotation.company = cart_settings.company
	# finbyz changes
	quotation.order_type = ""
	quotation.order_type = "Shopping Cart"
	quotation.flags.ignore_permissions = True
	quotation.save()
	# finbyz changes end
	quotation.submit()

	if quotation.quotation_to == 'Lead' and quotation.party_name:
		# company used to create customer accounts
		frappe.defaults.set_user_default("company", quotation.company)

	if not (quotation.shipping_address_name or quotation.customer_address):
		frappe.throw(_("Set Shipping Address or Billing Address"))

	from erpnext.selling.doctype.quotation.quotation import _make_sales_order
	sales_order = frappe.get_doc(_make_sales_order(quotation.name, ignore_permissions=True))
	sales_order.payment_schedule = []
	sales_order.payment_method = payment_method

	if not cint(cart_settings.allow_items_not_in_stock):
		for item in sales_order.get("items"):
			item.reserved_warehouse, is_stock_item = frappe.db.get_value("Item",
				item.item_code, ["website_warehouse", "is_stock_item"])

			if is_stock_item:
				item_stock = get_qty_in_stock(item.item_code, "website_warehouse")
				if not cint(item_stock.in_stock):
					frappe.throw(_("{0} Not in Stock").format(item.item_code))
				if item.qty > item_stock.stock_qty[0][0]:
					frappe.throw(_("Only {0} in Stock for item {1}").format(item_stock.stock_qty[0][0], item.item_code))

	sales_order.flags.ignore_permissions = True
	sales_order.insert()
	sales_order.submit()

	if hasattr(frappe.local, "cookie_manager"):
		frappe.local.cookie_manager.delete_cookie("cart_count")

	return sales_order.name


from frappe.website.utils import is_signup_enabled
from frappe.utils import escape_html

@frappe.whitelist(allow_guest=True)
def sign_up(email, full_name, tax_id, redirect_to):
	if not is_signup_enabled():
		frappe.throw(_('Sign Up is disabled'), title='Not Allowed')

	user = frappe.db.get("User", {"email": email})
	if user:
		if user.disabled:
			return 0, _("Registered but disabled")
		else:
			return 0, _("Already Registered")
	else:
		if frappe.db.sql("""select count(*) from tabUser where
			HOUR(TIMEDIFF(CURRENT_TIMESTAMP, TIMESTAMP(modified)))=1""")[0][0] > 300:

			frappe.respond_as_web_page(_('Temporarily Disabled'),
				_('Too many users signed up recently, so the registration is disabled. Please try back in an hour'),
				http_status_code=429)

		from frappe.utils import random_string
		user = frappe.get_doc({
			"doctype":"User",
			"email": email,
			"first_name": escape_html(full_name),
			"enabled": 1,
			"new_password": random_string(10),
			"bio": tax_id
		})
		user.flags.ignore_permissions = True
		user.flags.ignore_password_policy = True
		user.insert()

		# set default signup role as per Portal Settings
		default_role = frappe.db.get_value("Portal Settings", None, "default_role")
		if default_role:
			user.add_roles(default_role)

		if redirect_to:
			frappe.cache().hset('redirect_after_login', user.name, redirect_to)

		from erpnext.shopping_cart.cart import get_debtors_account
		from frappe.utils.nestedset import get_root_of
		from erpnext.shopping_cart.doctype.shopping_cart_settings.shopping_cart_settings import get_shopping_cart_settings

		user = frappe.get_doc("User",{'email':email,'first_name':escape_html(full_name)})
		
		if frappe.db.get_value('User', user.name, 'user_type') != 'Website User':
			return

		user_roles = frappe.get_roles()
		portal_settings = frappe.get_single('Portal Settings')
		default_role = 'Customer' #finbyz change
		if default_role not in ['Customer', 'Supplier']:
			return

		# create customer / supplier if the user has that role
		# if portal_settings.default_role:
		# 	doctype = portal_settings.default_role
		# else:
		# 	doctype = None

		# if not doctype:
		# 	return
		doctype = "Customer" # finbyz chnage

		fullname = frappe.utils.get_fullname(user.name)
		if party_exists(doctype, user.name):
			return

		party = frappe.new_doc(doctype)

		if doctype == 'Customer':
			cart_settings = get_shopping_cart_settings()

			if cart_settings.enable_checkout:
				debtors_account = get_debtors_account(cart_settings)
			else:
				debtors_account = ''

			party.update({
				"customer_name": fullname,
				"customer_type": "Individual",
				"customer_group": cart_settings.default_customer_group,
				"territory": get_root_of("Territory"),
				"tax_id": user.bio
			})

			if debtors_account:
				party.update({
					"accounts": [{
						"company": cart_settings.company,
						"account": debtors_account
					}]
				})
		else:
			party.update({
				"supplier_name": fullname,
				"supplier_group": "All Supplier Groups",
				"supplier_type": "Individual"
			})

		party.flags.ignore_mandatory = True
		party.insert(ignore_permissions=True)
		if frappe.db.exists("Contact",{'user':user.name}):
			contact = frappe.get_doc("Contact",{'user':user.name})
		else:
			contact = frappe.new_doc("Contact")
		contact.update({
			"first_name": fullname,
			"user": user.name #finbyz
		})
		#finbyz change
		if contact.email_ids[0].email_id != user.name:
			contact.append('email_ids',dict(email_id=user.name))
		contact.append('links', dict(link_doctype=doctype, link_name=party.name))
		contact.flags.ignore_mandatory = True
		contact.insert(ignore_permissions=True)
		user.flags.email_sent = 1
		if user.flags.email_sent:
			return 1, _("Please check your email for verification")
		else:
			return 2, _("Please ask your administrator to verify your sign-up")

def create_customer_or_supplier():
	pass
# 	'''Based on the default Role (Customer, Supplier), create a Customer / Supplier.
# 	Called on_session_creation hook.
# 	'''
# 	from erpnext.shopping_cart.cart import get_debtors_account
# 	from frappe.utils.nestedset import get_root_of
# 	from erpnext.shopping_cart.doctype.shopping_cart_settings.shopping_cart_settings import get_shopping_cart_settings

# 	user = frappe.session.user

# 	if frappe.db.get_value('User', user, 'user_type') != 'Website User':
# 		return

# 	user_roles = frappe.get_roles()
# 	portal_settings = frappe.get_single('Portal Settings')
# 	default_role = portal_settings.default_role

# 	if default_role not in ['Customer', 'Supplier']:
# 		return

# 	# create customer / supplier if the user has that role
# 	if portal_settings.default_role and portal_settings.default_role in user_roles:
# 		doctype = portal_settings.default_role
# 	else:
# 		doctype = None

# 	if not doctype:
# 		return

# 	if party_exists(doctype, user):
# 		return

# 	party = frappe.new_doc(doctype)
# 	fullname = frappe.utils.get_fullname(user)

# 	if doctype == 'Customer':
# 		cart_settings = get_shopping_cart_settings()

# 		if cart_settings.enable_checkout:
# 			debtors_account = get_debtors_account(cart_settings)
# 		else:
# 			debtors_account = ''

# 		party.update({
# 			"customer_name": fullname,
# 			"customer_type": "Individual",
# 			"customer_group": cart_settings.default_customer_group,
# 			"territory": get_root_of("Territory"),
# 			"tax_id": frappe.db.get_value("User",user,'bio')
# 		})

# 		if debtors_account:
# 			party.update({
# 				"accounts": [{
# 					"company": cart_settings.company,
# 					"account": debtors_account
# 				}]
# 			})
# 	else:
# 		party.update({
# 			"supplier_name": fullname,
# 			"supplier_group": "All Supplier Groups",
# 			"supplier_type": "Individual"
# 		})

# 	party.flags.ignore_mandatory = True
# 	party.insert(ignore_permissions=True)

# 	contact = frappe.new_doc("Contact")
# 	contact.update({
# 		"first_name": fullname,
# 		"email_id": user
# 	})
# 	contact.append('links', dict(link_doctype=doctype, link_name=party.name))
# 	contact.flags.ignore_mandatory = True
# 	contact.insert(ignore_permissions=True)

# 	return party


def party_exists(doctype, user):
	contact_name = frappe.db.get_value("Contact", {"email_id": user})

	if contact_name:
		contact = frappe.get_doc('Contact', contact_name)
		doctypes = [d.link_doctype for d in contact.links]
		return doctype in doctypes

	return False

def po_validate(self,method):
	for item in self.items:
		item.barcode = frappe.db.get_value("Item Barcode",{"parent":item.item_code},"barcode")

def add_preload_headers(response):
	pass

@frappe.whitelist()
def get_category_item(item_group, discontinued=0, search_box_data=None):
	conditions = ""
	
	conditions += f" and I.discontinued = '{discontinued}'"

	if search_box_data:
		conditions += f" and (I.item_name LIKE '%{search_box_data}%' or I.item_code LIKE '%{search_box_data}%' or c.supplier_part_no LIKE '%{search_box_data}%')"

	if discontinued not in [1,"1",True]:
		conditions += f" and I.item_group = '{item_group}'"
	
	return frappe.db.sql(f"""
			SELECT 
				c.supplier_part_no,
				I.item_name,I.item_code,I.image,I.sort_ord,I.unit_selling_price,I.disabled,
				I.valuation_rate,I.stock_uom,I.master_case_qty,I.unit_buying_price,
				I.case_qty,I.shelf_location,b.actual_qty,I.item_group,I.supplier,I.website_warehouse
			from 
				`tabItem Supplier` as c
				left join `tabItem` as I on I.name=c.parent
				left join `tabBin` as b on I.name=b.item_code
				where 1 = 1 {conditions}
				group by I.item_name
			""",as_dict=1)
			
@frappe.whitelist()
def update_ietm_shelf_location(item_list):
	item_list = json.loads(item_list)
	for each in item_list:
		if each.get('item_code'):
			frappe.db.set_value("Item",each.get('item_code'),'shelf_location',each.get('shelf_location'))
			frappe.db.set_value("Item",each.get('item_code'),'sort_ord',each.get('sort_ord') or 0)

@frappe.whitelist()
def get_item_group():
	return frappe.get_all('Item Group', filters={'is_group': 0})


@frappe.whitelist()
def change_item_group(item_group,item):
	item_list = json.loads(item)
	for each_item in item_list:
		doc = frappe.get_doc("Item",each_item)
		doc.item_group=item_group
		doc.save()

@frappe.whitelist()
def get_groupwise_items():
	root_item = frappe.db.sql("""
			SELECT name,parent_item_group, lft
			FROM `tabItem Group`
			ORDER BY lft
			""",as_dict=1)
	group_itmes= []
	count = {'All Item Groups':0}
	for group in root_item:
		if group.parent_item_group in count:
			count.update({group.name : count.get(group.parent_item_group) + 1})
			group.count = count.get(group.parent_item_group) + 1
			item = "&#160;"*group.count*2 + str(group.name)
			group_itmes.append(item)
		else:
			count.update({group.name:0})
	
	return group_itmes
	# item_group_map={}
	# child_map={}
	# child_items = frappe.db.get_values('Item Group', {'is_group': 0},['name','parent_item_group'],as_dict=1)
	# for item in child_items:
	# 	if item.parent_item_group in child_map.keys() and item.get('name'):
	# 		child_map[item['parent_item_group']].append(item['name'])
	# 	else:
	# 		a=[]
	# 		a.append(item.name)
	# 		child_map[item.parent_item_group] = list(a)

	# child_parent_items=frappe.db.sql("""
	# 		SELECT name,parent_item_group
	# 		FROM `tabItem Group`
	# 		WHERE is_group=1 and NULLIF(parent_item_group,'') IS NOT NULL 
	# 		""",as_dict=1)
	# root_item = frappe.db.sql("""
	# 		SELECT name,parent_item_group
	# 		FROM `tabItem Group`
	# 		WHERE is_group=1 and NULLIF(parent_item_group,'') IS NULL 
	# 		""",as_dict=1)

	# for each in root_item:
	# 	item_group_map[each['name']]=[]
		
		






# for each_child in child_parent_items:	
# 	print(child_map[each_child['name']])
# 	item_group_map[child_map[each_child['parent_item_group']]].append([child_map[each_child['name']]])

# def get_child_nodes(item_group,item_group_map):
# 	node=frappe.db.sql("""
# 		SELECT name
# 		FROM `tabItem Group`
# 		WHERE is_group=1 and parent_item_group={}
# 		""".format(each['name']),as_dict=1)

@frappe.whitelist()
def get_reorder_qty(item):
	return frappe.db.get_value('Item Reorder', { "parent": item, "parenttype": "Item" }, 'warehouse_reorder_qty')

@frappe.whitelist()
def get_supplier_number(item):
	return frappe.db.get_value('Item Supplier', {"parent": item,"parenttype": "Item" }, 'supplier_part_no')

@frappe.whitelist()
def get_supplier_number_and_reorder_details(item):
	supplier_part_no = frappe.db.get_value('Item Supplier', {"parent": item,"parenttype": "Item" }, 'supplier_part_no')
	warehouse_reorder_level = frappe.db.get_value('Item Reorder', { "parent": item, "parenttype": "Item" }, 'warehouse_reorder_level')
	warehouse_reorder_qty = frappe.db.get_value('Item Reorder', { "parent": item, "parenttype": "Item" }, 'warehouse_reorder_qty')
	return [supplier_part_no, warehouse_reorder_level, warehouse_reorder_qty]

@frappe.whitelist()
def get_default_password(field):
	return get_password('Global Defaults','Global Defaults',field)
	
@frappe.whitelist()
def get_sales_order_count():
	return frappe.db.count("Sales Order",{'custom_status': 'New'})
