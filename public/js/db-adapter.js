// Global variables
const db = firebase.firestore();

// Get transactions for given user and category
let getTransactions = async function(usrID, category) {
    // Get user ref
    let usrRef = db.collection(usrID);

    // Get maps
    return await usrRef.doc("id_map").get().then(async docSnap => {
        if (docSnap) {
            let id_map = docSnap.data();
            // Get transactions
            return await usrRef.doc("transactions").get().then(docSnap => {
                let transactions = docSnap.data();
                let filteredTransactions = new Map();
                // Filter out transactions
                for (let [key, value] of Object.entries(transactions)) {
                    let id = value["ID"];
                    if (id in id_map){
                        if (id_map[id] === category) {
                            filteredTransactions.set(key, value);
                        }
                    }
                }
                return filteredTransactions;
            })
        } else {
            return -1;
        }
    })
};

(async () => [
    console.log(await getTransactions("user_1", "Food"))
])();