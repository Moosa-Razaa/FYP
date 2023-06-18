### FINAL YEAR PROJECT
##

This repo contains partial code of our backend APIs for our university's Health Management System.

## Users.js
This file contains the signup and login implementation of users. This files interacts with the database to authenticate and authorize users. JSON Web Toke(JWT) is used to authenticate user. The token is send and received in the header.

Following details are implemented here:

1. Creation of user.
2. Verification of its email.
3. Forgot password.
4. Authentication of its user.

## Main.py
This file contains the web scrapping logic of reports from websites of renowned laboratories in Karachi.

Following details are implemented here:

1. Verification of login credentials of user.
2. Identifying the reports that are not downloaded yet.
3. Downloading of the reports from lab portals.


## Dashboard.js
This file contains all the information that user will preview on the dashboard. All the reports and its results can be previewed.

Following details are implemented here:

1. Supplying the actual PDF of the report to the frontend.
2. Extracting and parsing values from reports' PDF and fetching the attributes name as well as their ranges.
3. Requesting to download new reports from laboratories portals.
4. Handling the disconnection of the database and creating that again.

## Mailer.js
This file contains the logic of sending mail to the users. 

## Middlewares
This folder contains the middlewares that are used for authentication and authorization of APIs.
There is also PDF extraction written in it.

## Functions
This folder contains the formats of the reports values that needs to be extracted from the reports.
