frappe.ui.form.on('Supplier', {
	refresh: function(frm) {
        frm.add_custom_button(__('Report Vendor Item List'), function(){
            window.open(window.location.href.split("#")[0] + "#query-report/Vendor Item List" + "/?" + "supplier="+ frm.doc.supplier_name,"_blank")            
        })  
    },
})