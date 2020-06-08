// Global variables
const db = firebase.firestore();

// Get transactions for given user and category
let getTransactions = async function(usrID, category) {
    // Get user ref
    let usrRef = db.collection(usrID);

    // Get transactions
    return await usrRef.doc("categories").collection(category).get().then(async snap => {
        let transactions = new Map();
        snap.forEach(doc => {
            let tData = doc.data();
            let transaction = new Map();
            for (let [key, value] of Object.entries(tData)) {
                transaction.set(key, value);
            }
            transactions.set(doc.id, transaction);
        });
        console.log(transactions);
        return transactions;
    });
};

// Get category list
let getCategories = async function(usrID) {
    // Get user ref
    let usrRef = db.collection(usrID);

    // Get category names
    return await usrRef.doc("categories").get().then(async docSnap => {
        if (docSnap) {
            return docSnap.data()["names"];
        }
    })
};