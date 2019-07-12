# CS 160: On-Demand Food Delivery Service Project

# Install
Please see ODFDSUserGuide.pdf. 

# Database Schema
## User
```
{
    "uID": 1,
    "Email": "d@driver.com",
    "Password": "driver",
    "Type": "Driver"
}
```
## Driver
``` 
{
    "driverID": 1001,
    "uID": 1,
    "Name": "Jay",
    "License": "F1234LE",
    "Phone": "4089923434",
    "BankAccount": "1111222233334444",
    "Working": 0,
    "Notification": "OFF",
    "LocationID": 1005
}
```
## Restaurant
```
{
    "rID": 101,
    "uID": 2,
    "Name": "In n Out", 
    "Address": "435 Coleman Ave.",
    "LocationID": 1001,
    "Phone": "4082223312",
    "CreditCard": "4444333322221111"
}
```
## Location
```
{
    "LocationID": 1001,
    "Latitude": 37.3520000,
    "Longitude": -121.9598900
}
```
## Delivery
```
{
    "orderID": 10101,
    "rID": 101,
    "driverID": 1001,
    "startTime": "09:10:00",
    "endTime": NULL,
    "Date": "2019-03-14",
    "Destination": "1092 E El Camino Real",
    "Status": "Incomplete"
}
```
## Price
```
{
    "pID": 200,
    "orderID": 10101,
    "totalDistance": 3.4,
    "totalTime": 28,
    "Price": 20.53
}
```

# API Endpoints
```
GET /				Main page (redirects to /rest or /driver if already logged-in)	
POST /				Login validation
GET /rest			Restaurant dashboard (log-in required)
GET /driver			Driver dashboard (log-in required)
GET /restSignup			Restaurant's sign up page
POST /restSignup		Restaurant sign up
GET /driverSignup		Driver's signup page
POST /driverSignup		Driver sign up
GET /logout			log-out for both users

GET /rest/request		Requesting a driver page
POST /rest/request		Restaurant requests a driver
GET /rest/track			Tracking an order page
POST /rest/track		Restaurant tracks the driver
GET /rest/rHistory		Restaurant checks the order history 

GET /driver/delivery		Driver receives an order
GET /driver/deliveryInfo	Order information page
POST /driver/deliveryInfo	Driver checks order information 
GET /driver/dHistory		Driver checks the order history 

```
