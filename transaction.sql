create database importer;


use importer; 
SET sql_mode = '';
CREATE TABLE File (
  Filename VARCHAR(255) NOT NULL UNIQUE,
  TotalNumberOfRows INT NULL,
  RowsWithErrors INT NULL,
  StartDate TIMESTAMP NULL,
  EndDate TIMESTAMP NULL,
  CreationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Filename)
) CHARSET=utf8;

select * from file order by CreationDate desc;
delete from file where Filename = 'testfile1.txt';
truncate table file;
drop table file;


CREATE TABLE Transaction (
  TransactionID INT NOT NULL UNIQUE,
  TransactionDate DATE NOT NULL,
  Amount LONG NOT NULL,
  CreationDate TIMESTAMP NOT NULL,
  EndDate TIMESTAMP NULL,
  TransactionDescriptionPK INT NOT NULL,
  FilePK VARCHAR(255) NOT NULL,
  PRIMARY KEY (TransactionID),
  FOREIGN KEY (TransactionDescriptionPK) REFERENCES TransactionDescription(TransactionDescriptionPK),
  FOREIGN KEY (FilePK) REFERENCES file(Filename)
) CHARSET=utf8;

select * from Transaction;
truncate table Transaction;
INSERT INTO Transaction (TransactionID,TransactionDate,Amount,CreationDate,EndDate,TransactionDescriptionPK,FilePK)
VALUES (6666,'2017-01-06',2300,'2016-01-02','2016-01-05',2,'testfile1.txt');

CREATE TABLE TransactionDescription (
  TransactionDescriptionPK INT NOT NULL UNIQUE AUTO_INCREMENT,
  Description VARCHAR(33) NOT NULL UNIQUE,
  CreationDate TIMESTAMP NOT NULL,
  PRIMARY KEY (TransactionDescriptionPK)
) CHARSET=utf8;

select * from TransactionDescription;
truncate table TransactionDescription;
delete from TransactionDescription where TransactionDescriptionPK = 2;
INSERT INTO TransactionDescription (Description,CreationDate)
VALUES ('testing 2',123456789);
