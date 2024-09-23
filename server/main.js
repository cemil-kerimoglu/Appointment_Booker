import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import "../imports/api/appointmentsMethods";
import "../imports/api/appointmentsPublications";
import { AppointmentsCollection } from "../imports/api/appointments";
import { getRandomDate, getRandomItem } from "../imports/api/utils";
import { FIRST_NAMES, LAST_NAMES, USERS } from "../imports/api/constants";

Meteor.startup(() => {
  const users = USERS;

  const createUsers = async () => {
    for (const { username, password } of users) {
      try {
        const existingUser = await Accounts.findUserByUsername(username);

        if (!existingUser) {
          try {
            const userId = await Accounts.createUser({ username, password });
            console.log(`Created user: ${username}`);
          } catch (err) {
            console.error(`Error creating user ${username}:`, err);
          }
        } else {
          console.log(`User ${username} already exists.`);
        }
      } catch (error) {
        console.error(`Error checking user ${username}:`, error);
      }
    }
  };

  const generateFakeAppointments = async () => {
    const appointmentCount = await AppointmentsCollection.find().countAsync();
    if (appointmentCount === 0) {
      console.log("No appointments found. Generating fake appointments...");

      const firstNames = FIRST_NAMES;
      const lastNames = LAST_NAMES;

      const usersList = [];

      for (const user of users) {
        try {
          const existingUser = await Accounts.findUserByUsername(user.username);
          if (existingUser) {
            usersList.push({
              userId: existingUser._id,
              username: user.username,
            });
          } else {
            console.error(`User ${user.username} not found.`);
          }
        } catch (error) {
          console.error(`Error fetching user ${user.username}:`, error);
        }
      }

      for (const { userId, username } of usersList) {
        const usedDates = new Set();
        const allDayDates = new Set();

        for (let i = 0; i < 20; i++) {
          let date = getRandomDate();

          const isAllDay = i % 4 === 0;

          if (isAllDay) {
            // Ensure the date hasn't been used for any appointment
            while (usedDates.has(date)) {
              date = getRandomDate();
            }
            usedDates.add(date);
            allDayDates.add(date);
          } else {
            // Ensure the date doesn't have an all-day appointment
            while (allDayDates.has(date)) {
              date = getRandomDate();
            }
            usedDates.add(date);
          }

          const appointment = {
            date,
            firstName: getRandomItem(firstNames),
            lastName: getRandomItem(lastNames),
            userId,
            allDay: isAllDay,
          };

          try {
            await AppointmentsCollection.insertAsync(appointment);
          } catch (error) {
            console.error("Error inserting appointment:", error);
          }
        }
        console.log(`Generated 20 appointments for user: ${username}`);
      }
    } else {
      console.log("Appointments already exist in the database.");
    }
  };

  createUsers()
    .then(() => generateFakeAppointments())
    .catch((err) => {
      console.error("Error during server startup:", err);
    });
});
