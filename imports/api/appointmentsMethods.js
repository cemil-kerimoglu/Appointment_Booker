import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { AppointmentsCollection } from "./appointments";
import {
  validateAppointmentData,
  getAuthorizedAppointment,
  checkForConflicts,
} from "./utils";

Meteor.methods({
  async "appointments.insert"(appointmentData) {
    if (!this.userId) {
      throw new Meteor.Error("Not authorized.");
    }

    validateAppointmentData(appointmentData);

    await checkForConflicts(appointmentData, null, this.userId);

    const appointment = {
      ...appointmentData,
      userId: this.userId,
    };

    try {
      const appointmentId = await AppointmentsCollection.insertAsync(
        appointment
      );
      return appointmentId;
    } catch (error) {
      throw new Meteor.Error("Database error", error.message);
    }
  },

  async "appointments.update"(_id, appointmentData) {
    check(_id, String);

    if (!this.userId) {
      throw new Meteor.Error("Not authorized");
    }

    validateAppointmentData(appointmentData);

    await getAuthorizedAppointment(_id, this.userId);

    await checkForConflicts(appointmentData, _id, this.userId);

    try {
      const result = await AppointmentsCollection.updateAsync(
        { _id },
        { $set: { ...appointmentData, userId: this.userId } }
      );
      return result;
    } catch (error) {
      throw new Meteor.Error("Database error", error.message);
    }
  },

  async "appointments.remove"(_id) {
    check(_id, String);

    if (!this.userId) {
      throw new Meteor.Error("Not authorized");
    }

    await getAuthorizedAppointment(_id, this.userId);

    try {
      const result = await AppointmentsCollection.removeAsync({ _id });
      return result;
    } catch (error) {
      throw new Meteor.Error("Database error", error.message);
    }
  },
});
