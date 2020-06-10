// Global variables
const db = firebase.firestore();

const DEFAULT_CATEGORY = "Unclassified";

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

let getSSMapObject = async function(usrId) {
    let usrRef = db.collection(usrId);
    // Get current data
    return await usrRef.doc('ss_map').get().then(docSnap => {
        if (docSnap) {
            return docSnap.data();
        } else {
            return null
        }
    });
};

// Get keywords from category
let getKeywords = async function(usrID, category) {
    return await getSSMapObject(usrID).then(data => {
        let keywords = [];
        Object.keys(data).forEach(key => {
            if (data[key] === category) {
                keywords.push(key);
            }
        });
        return keywords;
    });
};

// Add new keyword to category
let addKeyword = async function(userID, category, keyword) {
    let data = await getSSMapObject(userID);

    // Ensure that the keyword doesn't already exist -> or that there are no keyword conflicts
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].includes(keyword)) {
            return keys[i];
        }
    }

    // Add new substring map
    data[keyword] = category;
    // Overwrite document
    let usrRef = db.collection(userID);
    await usrRef.doc('ss_map').set(data);
    return 0;
};

// Modify an existing keyword
let modifyKeyword = async function(userID, category, old_kw, new_kw) {
    let data = await getSSMapObject(userID);

    // Update keyword
    let newData = {};
    // This method maintains order of keywords
    Object.keys(data).forEach(key => {
        if (key === old_kw) {
            newData[new_kw] = data[old_kw];
        } else {
            newData[key] = data[key];
        }
    });
    // Update substring map document
    let usrRef = db.collection(userID);
    await usrRef.doc('ss_map').set(newData);
};

// Delete keyword
let deleteKeyword = async function (userID, category, keyword) {
    let data = await getSSMapObject(userID);
    // Delete keyword
    delete data[keyword];
    // Reset data
    let usrRef = db.collection(userID);
    await usrRef.doc('ss_map').set(data);
};