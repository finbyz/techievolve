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