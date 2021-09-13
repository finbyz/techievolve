frappe.ui.form.on('Customer', {
    onload: function(frm){
        if (!frm.doc.__islocal) {
			frm.add_custom_button(__("Create Login"), function () {
                let dialog = new frappe.ui.Dialog({
                    'title': 'Create User',
                    'fields': [
                        { fieldtype: "Data", fieldname: "user_name", label: __('User Name'),reqd:1  },
                        { fieldtype: "Password", fieldname: "password", label: __('Password'),reqd:1 },
                    ],
                });
                dialog.show();
                dialog.set_primary_action(__('Create'), function () {
                var values = dialog.get_values();
                frappe.call({
                    method: "techievolve.techievolve.doc_events.customer.create_user",
                    args: {
                        email_id: frm.doc.email_id,
                        user_name: values.user_name,
                        password: values.password,
                        first_name: frm.doc.customer_name
                    },
                    callback: (r) => {
                        if (r.message) {
                            //frappe.msgprint('Customer changed successfully');
                            dialog.hide();
                            frm.reload_doc();
                        }
                    }
                })
                });
                dialog.get_close_btn().on('click', () => {
                    dialog.hide();
                });
            });
        }   
    }   
});