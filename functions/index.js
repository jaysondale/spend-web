const functions = require('firebase-functions');
const admin = require('firebase-admin');
const DEFAULT_CATEGORY = "Unclassified";

admin.initializeApp();
const db = admin.firestore();

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
        let oldCategory = "";

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
            // Case 3: Keyword is removed
            for (let i = 0; i < beforeKeys.length; i++) {
                if (!(afterKeys.includes(beforeKeys[i]))) {
                    console.log("\"" + beforeKeys[i] + "\" keyword has been deleted");
                    key = beforeKeys[i];
                    oldCategory = before[key];
                    break;
                }
            }
            category = DEFAULT_CATEGORY;
        }

        // Helper function for moving transactions
        let moveTransaction = async function(docID, current, next) {
            console.log("Moving " + docID + " from " + current + " to " + next);
            let usrRef = db.collection(userID);

            // Get document data
            let docRef = await usrRef.doc('categories').collection(current).doc(docID).get();
            let docData = docRef.data();

            // Delete document
            await usrRef.doc('categories').collection(current).doc(docID).delete();

            // Create new document in next category
            await usrRef.doc('categories').collection(next).doc(docID).set(docData);
        };

        console.log(`Change identified: ${key}: ${category}`);

        // Iterate through all transactions and move them to new category
        (async () => {
            let usrRef = db.collection(userID);

            if (oldCategory === "") {
                // Iterate through category names
                let categoriesSnap = await usrRef.doc('categories').get();
                let catData = categoriesSnap.data();
                let catNames = catData['names'];
                for (let i = 0; i < catNames.length; i++) {
                    // eslint-disable-next-line no-await-in-loop,no-loop-func,promise/always-return
                    usrRef.doc('categories').collection(catNames[i]).get().then(querySnap => {
                        querySnap.forEach(docSnap => {
                            let doc_id = docSnap.id;
                            let data = docSnap.data();
                            let newCat = "";
                            // Iterate through substrings and see if transaction should be moved
                            if (catNames[i] === category) {
                                console.log("Using full substring map");
                                // Use full substring map
                                let ss_map = after; // For clarity
                                let ss_keys = afterKeys;

                                for (let j = 0; j < ss_keys.length; j++) {
                                    console.log(data["ID"]);
                                    if (data["ID"].includes(ss_keys[j])) {
                                        newCat = ss_map[ss_keys[j]];
                                        break;
                                    }
                                }
                                // If category is not found, move to unclassified
                                if (newCat === "") {
                                    newCat = "Unclassified";
                                }
                            } else {
                                console.log("Only using single mapping");
                                // Only use the new substring map
                                if (data["ID"].includes(key)) {
                                    newCat = category;
                                }
                            }
                            // Move the transaction
                            if (newCat !== catNames[i] && newCat !== "") {

                                // eslint-disable-next-line no-await-in-loop
                                (async () => {
                                    await moveTransaction(doc_id, catNames[i], newCat);
                                })();
                            }
                        })
                        // eslint-disable-next-line no-loop-func
                    }).catch(er => {
                        console.log(er);
                    });
                }
            } else {
                // If mapping was removed, only look in old category
                // eslint-disable-next-line promise/catch-or-return
                usrRef.doc("categories").collection(oldCategory).get().then(querySnap => {
                    // eslint-disable-next-line promise/always-return
                    if (querySnap) {
                        if (querySnap.docs.length > 0) {
                            querySnap.forEach(docSnap => {
                                let data = docSnap.data();
                                if (data["ID"].includes(key)) {
                                    (async () => {
                                        await moveTransaction(docSnap.id, oldCategory, category);
                                    })();
                                }
                            })
                        }
                    }
                })
            }
        })();
});