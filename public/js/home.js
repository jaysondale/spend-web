($ => {

    (async () => {
        // Populate categories from database
        let categories = await getCategories("user_1");
        categories.forEach(category => {
            $("#category-list").append(`<tr><th><a class="btn category-btn">${category}</a></th></tr>`)
        });

        // Set click operation on category buttons
        $(".category-btn").click(async function() {
            let selectedCat = $(this).text();

            // Clear existing transactions
            $(".t-row").remove();
            let transactions = await getTransactions("user_1", selectedCat);
            transactions.forEach((t, key, map) => {
                $("#transaction-table-body").append(`<tr class="t-row"><th>${t.get("ID")}</th><th>${t.get("date")}</th><th>$${t.get("debit")}</th><th>$${t.get("credit")}</th></tr>`)
            });

            // Load keywords
            let keywords = await getKeywords("user_1", selectedCat);
            if (keywords != null) {
                keywords.forEach(keyword => {
                    $("#mapping-table-body").append(`<tr class=t-row><th>${keyword}</th><th><div class="btn-group"><a class="btn btn-warning">Edit</a><a class="btn btn-danger">Delete</a></div></th></tr>`);
                });
            }
        });
    })();

    $("#home-btn").click(() => {
        $("#mapping-table").hide();
        $("#transaction-table").show();
    });

    $("#upload-statements-btn").click(() => {
        $("#statement-upload-modal").modal('show');
    });

    $("#uploadBtn").click(function() {
        let files = $("#fileSelector").prop("files");
        uploadStatement(files);
        $("#statement-upload-modal").modal('hide');
    });

    $("#statement-upload-modal").on('hidden.bs.modal', () => {
        $("#fileSelector").val("");
    });

    $("#map-btn").click(() => {
        $("#mapping-table").show();
        $("#transaction-table").hide();
    })

})(jQuery);