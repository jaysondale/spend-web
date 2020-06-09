const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.classify = functions.firestore
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