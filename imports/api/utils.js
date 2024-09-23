import { check } from "meteor/check";
import { AppointmentsCollection } from "./appointments";

export const getRandomDate = () => {
  const today = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  const randomTime =
    today.getTime() +
    Math.random() * (oneMonthFromNow.getTime() - today.getTime());
  const randomDate = new Date(randomTime);
  return randomDate.toISOString().substring(0, 10);
};

export const getRandomItem = (array) =>
  array[Math.floor(Math.random() * array.length)];

export const validateAppointmentData = (appointmentData) => {
  check(appointmentData, {
    date: String,
    firstName: String,
    lastName: String,
    allDay: Boolean,
  });

  const appointmentDate = appointmentData.date;
  const today = new Date();
  const todayString = today.toISOString().substring(0, 10);

  if (!appointmentData.date.trim()) {
    throw new Meteor.Error("Invalid date", "Date is required.");
  }

  if (appointmentDate < todayString) {
    throw new Meteor.Error("Invalid date", "Date cannot be in the past.");
  }

  if (!appointmentData.firstName.trim()) {
    throw new Meteor.Error("Invalid first name", "First name is required.");
  }

  if (!appointmentData.lastName.trim()) {
    throw new Meteor.Error("Invalid last name", "Last name is required.");
  }
};

export const getAuthorizedAppointment = async (_id, userId) => {
  let appointment;
  try {
    appointment = await AppointmentsCollection.findOneAsync({ _id });
  } catch (error) {
    throw new Meteor.Error("Database error", error.message);
  }

  if (!appointment) {
    throw new Meteor.Error("Appointment not found");
  }

  if (appointment.userId !== userId) {
    throw new Meteor.Error(
      "Not authorized",
      "You cannot modify or remove this appointment"
    );
  }
};

export const checkForConflicts = async (
  appointmentData,
  appointmentId,
  userId
) => {
  const appointmentDate = appointmentData.date;

  const query = {
    date: appointmentDate,
    userId,
    _id: { $ne: appointmentId || null },
  };

  const appointmentsOnDate = await AppointmentsCollection.find(query).fetch();

  const hasAllDayAppointment = appointmentsOnDate.some((appt) => appt.allDay);
  const hasOtherAppointments = appointmentsOnDate.length > 0;

  if (appointmentData.allDay && hasOtherAppointments) {
    throw new Meteor.Error(
      "Conflict",
      "There is already another appointment on this date"
    );
  } else if (!appointmentData.allDay && hasAllDayAppointment) {
    throw new Meteor.Error(
      "Conflict",
      "There is already an all-day appointment on this date"
    );
  }
};
