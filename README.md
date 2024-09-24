This is an appointment booking app developed using Meteor with React.
In order to run this app on your computer, first install Meteor. Follow the instructions here: https://v3-docs.meteor.com/about/install
After having installed Meteor, navigate to the root directory of the project and run "meteor npm install".

In order to run the app on your local computer run the following command at your root directory: "meteor". This will start the app at http://localhost:3000/. Navigate to that link to visualize it.
At the same time - i.e., at the time of the start, two test accounts "test1" and "test2" will be created with passwords "password1" and "password2" respectively.
For each of them 20 random appointments will be created, in each case 5 out of 20 being all-day appointments.

To run the server-side tests navigate to the root directory and do "meteor npm run test".
To run client-side tests navigate to the root directory and do "meteor npm run clientTest -- imports/ui/tests".
If you prefer to run client-side tests for each component individually you can do the following:
"meteor npm run clientTest -- imports/ui/tests/AppointmentForm.tests.js"
"meteor npm run clientTest -- imports/ui/tests/AppointmentList.tests.js"
"meteor npm run clientTest -- imports/ui/tests/Login.tests.js"
