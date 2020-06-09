// Global variables
const db = firebase.firestore();

const DEFAULT_CATEGORY = "unclassified";

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

let addTransaction = async function(usrID, ID, date, debit, credit) {
    // Get user ref
    let usrRef = db.collection(usrID);

    // Check to ensure numbers are formatted
    if (typeof debit === "string") {
        if (debit === "") {
            debit = 0;
        } else {
            debit = parseFloat(debit);
        }
    }

    if (typeof credit === "string") {
        if (credit === "") {
            credit = 0;
        } else {
            credit = parseFloat(credit);
        }
    }

    // Add to unclassified category
    await usrRef.doc("categories").collection(DEFAULT_CATEGORY).add({
        date: date,
        ID: ID,
        debit: debit,
        credit: credit
    }).then(function() {
        console.log("Transaction uploaded");
    }).catch(function(er) {
        console.log("Error adding transaction to database: " + er);
    })
};