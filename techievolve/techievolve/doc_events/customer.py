import frappe

@frappe.whitelist()
def create_user(email_id,user_name,password,first_name):
    if email_id and user_name and password:
        doc = frappe.new_doc("User")
        doc.email = email_id
        doc.username = user_name
        doc.new_password = password
        doc.first_name = first_name
        doc.append('roles',{
            'role': "Customer"
        })
        doc.save()
        return "User Created"
