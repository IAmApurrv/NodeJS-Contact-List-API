# Contact-LIST-API


## To create a new contact : POST http://localhost:3000/contacts
## To fetch contact by id : GET http://localhost:3000/contacts/:id
## To fetch all contacts : GET http://localhost:3000/contacts
## To update a contact by id : PUT http://localhost:3000/contacts/:id
## To delete a contact by id : DELETE http://localhost:3000/contacts/:id
## To search contact : PATCH http://localhost:3000/contacts/search?term=query
## To export all contacts to CSV : GET http://localhost:3000/contacts/export/csv


### Body JSON -->


{
    "name": "Apurrv",
    "mobileNumbers": [
        "935959507849, 9422379647"
    ],
    "imageUrl": "apurrv.jpg"
}



To run the provided code, you need the following dependencies :

npm install express

npm install mysql

npm install multer

npm install csv-writer



create database nodejs;

use nodejs;

create table contacts (
    id int auto_increment primary key,
    name varchar(255) not null,
    imageUrl varchar(255),
    created_at timestamp default current_timestamp
);

create table mobileNumbers (
    id int auto_increment primary key,
    contactId int,
    mobileNumber varchar(255) not null,
    unique (mobileNumber),
    foreign key (contactId) references contacts(id) ON DELETE CASCADE
);
