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

