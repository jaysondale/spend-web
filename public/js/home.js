($ => {

    (async () => {
        // Populate categories from database
        let categories = await getCategories("user_1");
        categories.forEach(category => {
            $("#category-list").append(`<tr><th><a class="btn category-btn">${category}</a></th></tr>`)
        });

        // Set click operation on category buttons
        $(".category-btn").click(async function() {
            // Clear existing transactions
            $(".t-row").remove();
            let transactions = await getTransactions("user_1", $(this).text());
            transactions.forEach((t, key, map) => {
                $("#transaction-table-body").append(`<tr class="t-row"><th>${t.get("ID")}</th><th>${t.get("Date")}</th><th>${t.get("Debit")}</th><th>$${t.get("Credit")}</th></tr>`)
            });
        });
    })();

    $("#upload-statements-btn").click(() => {
        $("#statement-upload-modal").modal('show');
    })

})(jQuery);