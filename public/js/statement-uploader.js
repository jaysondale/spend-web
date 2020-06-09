let uploadStatement = function(files) {

    Array.prototype.forEach.call(files, function(file) {
        const reader = new FileReader();
        reader.onload = function() {
            tdCSVParser(reader.result);
        };
        reader.readAsText(file);
    });

};

let tdCSVParser = function(csv) {
    csv = csv.split("\n");
    csv.forEach(transaction => {
        transaction = transaction.split(",");
        if (transaction.length > 1) {
            (async () => {
                await addTransaction("user_1", transaction[1], transaction[0], transaction[2], transaction[3]);
            })();
        }
    })
};