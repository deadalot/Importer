alter table Transaction drop foreign key transaction_ibfk_1;
alter table Transaction drop foreign key transaction_ibfk_2;
drop table TransactionDescription;
drop table file;
drop table Transaction;


select * from TransactionDescription;
select * from Transaction;
select * from file order by CreationDate desc;



CREATE TABLE File (
  Filename VARCHAR(255) NOT NULL UNIQUE,
  TotalNumberOfRows INT NULL,
  RowsWithErrors INT NULL,
  StartDate TIMESTAMP NULL,
  EndDate TIMESTAMP NULL,
  CreationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Filename)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;


CREATE TABLE TransactionDescription (
  TransactionDescriptionPK INT NOT NULL UNIQUE AUTO_INCREMENT,
  Description VARCHAR(33) NOT NULL UNIQUE,
  CreationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  
  PRIMARY KEY (TransactionDescriptionPK)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

CREATE TABLE Transaction (
  TransactionID INT NOT NULL UNIQUE,
  TransactionDate DATE NOT NULL,
  Amount LONG NOT NULL,
  CreationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,    
  TransactionDescriptionPK INT NOT NULL,
  FilePK VARCHAR(255) NOT NULL,
  PRIMARY KEY (TransactionID),
  FOREIGN KEY (TransactionDescriptionPK) REFERENCES TransactionDescription(TransactionDescriptionPK),
  FOREIGN KEY (FilePK) REFERENCES file(Filename)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;