create database PaymentServiceDB
go
use PaymentServiceDB

create table UserTypes(
	Id int primary key identity,
	Type nvarchar(50) not null
)
insert into UserTypes(Type)
values
('Normal User'),
('Business User')

create table Products(
	Id int primary key identity,
	ImgURL varchar(500) default 'https://media.istockphoto.com/id/1217632489/photo/computer-of-technology-sense-and-colorful-image.webp?s=170667a&w=0&k=20&c=3p2oJMWl3SHeNQxfw4iaqVtjgCao_nsBnPM-QEyis3g=',
	Name nvarchar(100) not null,
	Price decimal(20,2)not null,
	Quantity int not null,
	Description text
)

create table Business(
	Id int primary key identity,
	Name nvarchar(255) not null,
	ImgURL varchar(500) default 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?auto=compress&cs=tinysrgb&w=1600&lazy=load',
	Description text not null,

)
create table Users(
	Id int primary key identity,
	FirstName nvarchar(255) not null,
	LastName nvarchar(255) not null,
	Email nvarchar(255) not null,
	Password text not null,
	UserTypeId int foreign key references UserTypes(Id) not null
)
create table BusinessProducts(
	BusinessId int references Business(Id),
	ProductsId int references Products(Id),
	primary key (BusinessId, ProductsId)
)

create table UsersBusineses(
	UsersId int references Users(Id),
	BusinessId int references Business(Id),
	primary key (UsersId, BusinessId)
)

create table Payments(
	Id int primary key identity,
	SessionId int not null,
	UserId int foreign key references Users(Id)not null,
	ProductId int foreign key references Products(Id)not null,
	Quantity int not null,
	Date datetime2 default GETDATE() not null,
	Completed bit default 0
)

insert into Payments(SessionId, UserId, ProductId, Quantity)
values
('tset',1,1,1)