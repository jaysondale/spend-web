($ => {

    (async () => {
        // Populate categories from database
        let categories = await getCategories("user_1");
        categories.forEach(category => {
            $("#category-list").append(`<tr><th><a class="btn category-btn">${category}</a></th></tr>`)
        });

        // Set click operation on category buttons
        $(".category-btn").click(async function() {
            $('.selected-category').removeClass('selected-category');
            let selectedCat = $(this).text();
            $(this).addClass('selected-category');
            await loadCategory(selectedCat);

        });
    })();

    let loadCategory = async function(category) {
        // Clear existing transactions
        $(".t-row").remove();
        let transactions = await getTransactions("user_1", category);
        transactions.forEach((t, key, map) => {
            $("#transaction-table-body").append(`<tr class="t-row"><th>${t.get("ID")}</th><th>${t.get("date")}</th><th>$${t.get("debit")}</th><th>$${t.get("credit")}</th></tr>`)
        });

        // Load keywords
        let keywords = await getKeywords("user_1", category);
        if (keywords != null) {
            keywords.forEach(keyword => {
                $("#mapping-table-body").append(`<tr class="t-row"><th class="keyword">${keyword}</th><th><div class="btn-group"><a class="btn btn-warning edit-btn">Edit</a><a class="btn btn-danger delete-btn">Delete</a></div></th></tr>`);
            });
        }

        // Activate edit button
        $(".edit-btn").click(function() {
            // Get selected keyword
            let keyword_el = $(this).parent().parent().parent().children(".keyword");
            let keyword = keyword_el.text();
            keyword_el.text(""); // Reset text
            keyword_el.append(`<input class="form-control edit-keyword" value="${keyword}">`);

            // Change action buttons
            let parent = $(this).parent();
            parent.children('.btn').remove();
            parent.append(`<a class="btn btn-success save-keyword-btn">Save</a><a class="btn btn-outline-warning cancel-btn">Cancel</a>`);

            // Enable save button
            $(".save-keyword-btn").click(async function() {
                // Get updated keyword
                let new_keyword = $(this).parent().parent().parent().children('.keyword').children('.edit-keyword').val();
                await modifyKeyword("user_1", category, keyword, new_keyword);
                await loadCategory(category); // Reload view
            });

            // Enable cancel button
            $('.cancel-btn').click(function() {
                loadCategory(category);
            })
        });

        // Activate delete button
        $(".delete-btn").click(async function() {
            let keyword = $(this).parent().parent().parent().children('.keyword').text();
            await deleteKeyword("user_1", category, keyword);
            await loadCategory(category);
        });

        // Add button at the bottom of list
        $("#mapping-table-body").append(`<tr class="t-row"><th><input class="form-control" type="text" id="new-keyword" placeholder="New Keyword"></th><th><a id="add-btn" class="btn btn-success">Add</a></th></tr>`)
        $("#add-btn").click(async () => {
            let new_keyword = $("#new-keyword").val();
            let result = await addKeyword("user_1", category, new_keyword);
            console.log(result);
            if (result !== 0) {
                alert(`Keyword is conflicting with "${result}"! Try another keyword.`);
            } else {
                await loadCategory(category);
            }
        })
    };

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