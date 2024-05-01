const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

const app = express();
const port = 8000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'nodejs'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to MySQL.');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

// create new contact
app.post('/contacts', upload.single('image'), (req, res) => {
    const { name, imageUrl, mobileNumbers } = req.body;
    // const imageUrl = req.file ? req.file.path : null;

    const insertContactQuery = 'INSERT INTO contacts (name, imageUrl) VALUES (?, ?)';
    db.query(insertContactQuery, [name, imageUrl], (err, result) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        const contactId = result.insertId;
        const insertMobileNumbersQuery = 'INSERT INTO mobileNumbers (contactId, mobileNumber) VALUES ?';
        const values = mobileNumbers.map(mobileNumber => [contactId, mobileNumber]);
        db.query(insertMobileNumbersQuery, [values], (err) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(201).send('Contact successfully created.');
        });
    });
});

// fetch contact by id
app.get('/contacts/:id', (req, res) => {
    const contactId = req.params.id;
    const fetchContactQuery = `
    SELECT contacts.id, contacts.name, contacts.imageUrl, GROUP_CONCAT(mobileNumbers.mobileNumber) AS mobileNumbers
    FROM contacts
    LEFT JOIN mobileNumbers ON contacts.id = mobileNumbers.contactId
    WHERE contacts.id = ?
    GROUP BY contacts.id, contacts.name`;
    db.query(fetchContactQuery, contactId, (err, contact) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!contact[0]) {
            return res.status(404).send('Contact id is incorrect.');
        }
        res.send(contact[0]);
    });
});

// fetch all contacts
app.get('/contacts', (req, res) => {
    const fetchContactsQuery = `
    SELECT contacts.id, contacts.name, contacts.imageUrl, GROUP_CONCAT(mobileNumbers.mobileNumber) AS mobileNumbers
    FROM contacts
    LEFT JOIN mobileNumbers ON contacts.id = mobileNumbers.contactId
    GROUP BY contacts.id, contacts.name`;

    db.query(fetchContactsQuery, (err, contacts) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send(contacts);
    });
});


// update contact
app.put('/contacts/:id', (req, res) => {
    const contactId = req.params.id;
    const { name, imageUrl, mobileNumbers } = req.body;

    const updateContactQuery = 'UPDATE contacts SET name = ?, imageUrl = ? WHERE id = ?';
    db.query(updateContactQuery, [name, imageUrl, contactId], (err) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        // delete existing mobile number
        const deleteMobileNumbersQuery = 'DELETE FROM mobileNumbers WHERE contactId = ?';
        db.query(deleteMobileNumbersQuery, contactId, (err) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            // insert new mobile number
            const insertMobileNumbersQuery = 'INSERT INTO mobileNumbers (contactId, mobileNumber) VALUES ?';
            const values = mobileNumbers.map(mobileNumber => [contactId, mobileNumber]);
            db.query(insertMobileNumbersQuery, [values], (err) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.send('Contact successfully updated.');
            });
        });
    });
});


// delete contact
app.delete('/contacts/:id', (req, res) => {
    const contactId = req.params.id;
    const deleteContactQuery = 'DELETE FROM contacts WHERE id = ?';
    db.query(deleteContactQuery, contactId, (err, result) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send('Contact successfully deleted.');
    });
});

// search contact by name or mobile number
app.patch('/contacts/search', (req, res) => {
    const searchTerm = req.query.term;
    const searchQuery = `
    SELECT contacts.id, contacts.name, GROUP_CONCAT(mobileNumbers.mobileNumber) AS mobileNumbers
    FROM contacts
    LEFT JOIN mobileNumbers ON contacts.id = mobileNumbers.contactId
    WHERE contacts.name LIKE ? OR mobileNumbers.mobileNumber LIKE ?
    GROUP BY contacts.id, contacts.name`;
    const term = `%${searchTerm}%`;
    db.query(searchQuery, [term, term], (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send(results);
    });
});


// export all contacts to CSV
app.get('/contacts/export/csv', (req, res) => {
    const fetchContactsQuery = `
      SELECT contacts.name, contacts.imageUrl, mobileNumbers.mobileNumber
      FROM contacts
      LEFT JOIN mobileNumbers ON contacts.id = mobileNumbers.contactId`;

    db.query(fetchContactsQuery, (err, contacts) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        const csvWriterInstance = csvWriter({
            path: 'contacts.csv',
            header: [
                { id: 'name', title: 'Name' },
                { id: 'mobileNumber', title: 'Mobile Number' },
                { id: 'imageUrl', title: 'Image URL' }
            ]
        });
        csvWriterInstance.writeRecords(contacts)
            .then(() => {
                res.download('contacts.csv', 'contacts.csv', (err) => {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    // Delete the CSV file after download
                    // fs.unlinkSync('contacts.csv');
                });
            })
            .catch(err => res.status(500).send(err.message));
    });
});

app.listen(port, () => {
    console.log(`Server : ${port}`);
});



// {
//     "name": "Apurrv",
//     "mobileNumbers": [
//         "935959507849, 9422379647"
//     ],
//     "imageUrl": "apurrv.jpg"
// }
