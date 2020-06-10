const functions = require('firebase-functions');
const admin = require('firebase-admin');
const DEFAULT_CATEGORY = "Unclassified";

admin.initializeApp();
const db = admin.firestore();

exports.classifyNewTransaction = functions.firestore
    .document('{userID}/categories/unclassified/{transaction}')
    .onCreate((snap, context) => {

        // Get user's substring map
        let userID = context.params.userID;
        let trans_doc_id = context.params.transaction;
        let transaction = snap.data();

        (async () => {
            let ss_map = await db.collection(userID).doc("ss_map").get();
            ss_map = ss_map.data();
            let transactionId = transaction['ID'];
            console.log(transactionId);
            console.log(ss_map);
            console.log(transactionId in ss_map);

            let keySet = Object.keys(ss_map);
            let keyFound = null;
            for (let i = 0; i < keySet.length; i++) {
                if (keySet[i] in transactionId) {
                    keyFound = keySet[i];
                    break;
                }
            }

            if (keyFound !== null) {
                // Delete document in unclassified
                let catRef = db.collection(userID).doc('categories');
                await catRef.collection('unclassified').doc(trans_doc_id).delete();
                console.log(trans_doc_id + " deleted!");

                // Create new document in desired category
                let newCat = ss_map[transactionId];
                await catRef.collection(newCat).doc(trans_doc_id).set({
                    ID: transactionId,
                    date: transaction["date"],
                    debit: transaction["debit"],
                    credit: transaction["credit"]
                });
                console.log("Transaction " + trans_doc_id + " successfully moved to " + newCat);
            } else {
                console.log("No substring map found. Transaction not being moved");
            }

        })().catch(er => {
            console.log(er);
        });
});

exports.classify = functions.firestore
    .document("{userID}/ss_map")
    .onUpdate((change, context) => {
        let userID = context.params.userID;
        // Get change
        let before = change.before.data();
        let after = change.after.data();

        // Key and category to scan
        let key = "";
        let category = "";

        // Case 1 and 2: new Keyword is added or keyword is changed
        let beforeKeys = Object.keys(before);
        let afterKeys = Object.keys(after);
        if (afterKeys.length >= beforeKeys.length) {
            // Find new key
            for (let i = 0; i < afterKeys.length; i++) {
                if (!(afterKeys[i] in beforeKeys)) {
                    key = afterKeys[i];
                    break;
                }
            }
            // If key difference wasn't found, look for category difference
            for (let i = 0; i < afterKeys.length; i++) {
                if (after[afterKeys[i]] !== before[afterKeys[i]]) {
                    key = afterKeys[i];
                }
            }
            // Get newly mapped category
            category = after[key];
        } else {
            // Case 2: Keyword is changed
            for (let i = 0; i < beforeKeys.length; i++) {
                if (!(beforeKeys[i] in afterKeys)) {
                    key = afterKeys[i];
                    break;
                }
            }
            category = DEFAULT_CATEGORY;
        }

        // Helper function for moving transactions
        let moveTransaction = async function(docID, current, next) {
            let usrRef = db.collection(userID);

            // Get document data
            let docRef = await usrRef.doc('categories').collection(current).doc(docID).get();
            let docData = docRef.data();

            // Delete document
            await usrRef.doc('categories').collection(current).doc(docID).delete();

            // Create new document in next category
            await usrRef.doc('categories').collection(next).doc(docID).set(docData);
        };

        // Iterate through all transactions and move them to new category
        (async () => {
            let usrRef = db.collection(userID);
            // Iterate through category names
            let categoriesSnap = await usrRef.doc('categories').get();
            let catData = categoriesSnap.data();
            let catNames = catData['names'];
            for (let i = 0; i < catNames.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                let querySnap = await usrRef.doc('categories').collection(catNames[i]).get();
                for (const docSnap of querySnap) {
                    let doc_id = docSnap.ID;
                    let data = docSnap.data();
                    // Iterate through substrings and see if transaction should be moved
                    if (catNames[i] === category) {
                        // Use full substring map
                        let ss_map = after; // For clarity
                        let ss_keys = afterKeys;
                        let newCat = "";
                        for (let j = 0; j < ss_keys.length; j++) {
                            if (data["ID"].includes(ss_keys[j])) {
                                newCat = ss_map[ss_keys[j]];
                                break;
                            }
                        }
                        // If category is not found, move to unclassified
                        newCat = "unclassified";
                    }
                }
            }
        })();
});