//Add searchfield to Item query
this.frm.cscript.onload = function(frm) {
    this.frm.set_query("item_code", "items", function(doc) {
    return {
        query: "techievolve.query.item_query",
        
        filters: 
            {
                'is_purchase_item': 1,
                'supplier': doc.supplier
            }
    }	
});
}
frappe.ui.form.on('Purchase Receipt Item', {
    unit_buying_price: function(frm,cdt,cdn){
        let d = locals[cdt][cdn]
        frappe.model.set_value(d.doctype, d.name, 'rate', flt(d.unit_buying_price * d.case_qty))
    }
});