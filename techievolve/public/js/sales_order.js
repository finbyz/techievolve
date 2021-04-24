//Add searchfield to Item query
this.frm.cscript.onload = function(frm) {
    this.frm.set_query("item_code", "items", function(doc) {
    return {
        query: "techievolve.query.item_query",
        
        filters: 
            {
                'is_sales_item': 1
            }
    }	
});
}

frappe.ui.form.on('Sales Order', {
	refresh: function(frm) {
        if(!frm.doc.printout_taken){
            frm.add_custom_button(__('Print'), function(){
                frappe.db.set_value("Sales Order", frm.doc.name, "printout_taken", 1);
                frm.remove_custom_button('Print');
                cur_frm.print_doc();
            }).css({'color':'black','font-weight': 'bold','background-color':'yellow','border':'1px solid black','float':'right'});
        } 
      //  frm.refresh()
    },
})