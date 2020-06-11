let docsUploaded = 0;
let totalTransactions = 0;

let uploadStatement = function(files) {
    let upload = function() {
        Array.prototype.forEach.call(files, function(file) {
            const reader = new FileReader();
            reader.onload = function() {
                tdCSVParser(reader.result);
            };
            reader.readAsText(file);
        });
    };

    // Determine total docs to be uploaded (so we know when its all done)
    // There's definitely redundancy here so this can be fixed later
    totalTransactions = 0;
    let numFiles = files.length;
    Array.prototype.forEach.call(files, function(file) {
        const reader = new FileReader();
        reader.onload = function() {
            numFiles -= 1;
            let file = reader.result;
            let lines = file.split("\n");
            // NOTE: THIS ONLY WORKS FOR TD STATEMENTS! FIGURE OUT HOW TO MAKE THIS MORE GENERIC!
            lines.forEach(line => {
                let items = line.split(",");
                if (items.length > 1) {
                    totalTransactions += 1;
                }
            });
            if (numFiles === 0){
                console.log(`Transactions to upload: ${totalTransactions}`);
                upload();
            }
        };
        reader.readAsText(file);
    });

    /*


     */
};

let tdCSVParser = async function(csvDoc) {
    let csv = csvDoc.split("\n");
    let ss_map = await getSSMapObject("user_1");
    csv.forEach(transaction => {
        transaction = transaction.split(",");
        if (transaction.length > 1) {
            (async () => {
                await addTransaction("user_1", transaction[1], transaction[0], transaction[2], transaction[3], ss_map);
                totalTransactions -= 1;
            })();
        }
    })
};