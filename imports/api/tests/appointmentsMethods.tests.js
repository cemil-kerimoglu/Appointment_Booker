import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { assert } from "chai";
import { AppointmentsCollection } from "../appointments";
import "../appointmentsMethods";

if (Meteor.isServer) {
  describe("Appointments Methods", function () {
    beforeEach(async function () {
      await AppointmentsCollection.removeAsync({});
    });

    it("allows a logged-in user to insert an appointment", async function () {
      const userId = Random.id();
      const date = "2024-10-10";
      const appointmentData = {
        date,
        firstName: "John",
        lastName: "Doe",
        allDay: false,
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      await appointmentsInsert.apply(context, [appointmentData]);

      const insertedAppointment = await AppointmentsCollection.findOneAsync({
        userId,
      });
      assert.equal(insertedAppointment.firstName, "John");
      assert.equal(insertedAppointment.lastName, "Doe");
      assert.equal(insertedAppointment.date, date);
      assert.equal(insertedAppointment.allDay, false);
    });

    it("does not allow an unauthenticated user to insert an appointment", async function () {
      const date = "2024-10-10";
      const appointmentData = {
        date,
        firstName: "John",
        lastName: "Doe",
        allDay: false,
      };

      const context = {}; // Not authenticated user

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(err.message, /Not authorized/);
      }
    });

    it("does not allow a user to delete another user's appointment", async function () {
      const userId = Random.id();
      const otherUserId = Random.id();
      const date = "2024-10-10";

      const appointmentId = await AppointmentsCollection.insertAsync({
        date,
        firstName: "John",
        lastName: "Doe",
        allDay: false,
      });

      const context = { userId: otherUserId };

      const appointmentsRemove =
        Meteor.server.method_handlers["appointments.remove"];

      try {
        await appointmentsRemove.apply(context, [appointmentId]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(
          err.message,
          /You cannot modify or remove this appointment/
        );
      }

      // Ensure the appointment still exists
      const appointment = await AppointmentsCollection.findOneAsync(
        appointmentId
      );
      assert.isNotNull(appointment);
    });

    it("does not allow a user to edit another user's appointment", async function () {
      const userId = Random.id();
      const otherUserId = Random.id();
      const date = "2024-10-10";

      const appointmentId = await AppointmentsCollection.insertAsync({
        date,
        firstName: "John",
        lastName: "Doe",
        allDay: false,
      });

      const updateData = {
        date,
        firstName: "Jane",
        lastName: "Doe",
        allDay: false,
      };

      const context = { userId: otherUserId };

      const appointmentsUpdate =
        Meteor.server.method_handlers["appointments.update"];

      try {
        await appointmentsUpdate.apply(context, [appointmentId, updateData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.match(
          err.message,
          /You cannot modify or remove this appointment/
        );
      }

      // Ensure the appointment was not modified
      const appointment = await AppointmentsCollection.findOneAsync(
        appointmentId
      );
      assert.equal(appointment.firstName, "John");
    });

    it("prevents inserting an appointment on a date where there is an all-day appointment", async function () {
      const userId = Random.id();
      const date = "2024-10-10";

      // Existing all-day appointment
      await AppointmentsCollection.insertAsync({
        date,
        firstName: "Existing",
        lastName: "Appointment",
        allDay: true, // All-day appointment
        userId,
      });

      const appointmentData = {
        date,
        firstName: "John",
        lastName: "Doe",
        allDay: false, // Attempting to insert a regular appointment
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(
          err.message,
          /There is already an all-day appointment on this date/
        );
      }
    });

    it("prevents inserting an all-day appointment on a date with existing appointments", async function () {
      const userId = Random.id();
      const date = "2024-10-10";

      // Existing regular appointment
      await AppointmentsCollection.insertAsync({
        date,
        firstName: "Existing",
        lastName: "Appointment",
        allDay: false,
        userId,
      });

      const appointmentData = {
        date,
        firstName: "John",
        lastName: "Doe",
        allDay: true, // Attempting to insert an all-day appointment
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(
          err.message,
          /There is already another appointment on this date/
        );
      }
    });

    it("prevents inserting an appointment with a date in the past", async function () {
      const userId = Random.id();
      const pastDate = "2023-01-01";
      const appointmentData = {
        date: pastDate,
        firstName: "John",
        lastName: "Doe",
        allDay: false,
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(err.message, /Date cannot be in the past/);
      }
    });

    it("prevents inserting an appointment without a date", async function () {
      const userId = Random.id();
      const appointmentData = {
        date: "",
        firstName: "John",
        lastName: "Doe",
        allDay: false,
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(err.message, /Date is required/);
      }
    });

    it("prevents inserting an appointment without a first name", async function () {
      const userId = Random.id();
      const appointmentData = {
        date: "2024-10-10",
        firstName: "",
        lastName: "Doe",
        allDay: false,
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(err.message, /First name is required/);
      }
    });

    it("prevents inserting an appointment without a last name", async function () {
      const userId = Random.id();
      const appointmentData = {
        date: "2024-10-10",
        firstName: "John",
        lastName: "",
        allDay: false,
      };

      const context = { userId };

      const appointmentsInsert =
        Meteor.server.method_handlers["appointments.insert"];

      try {
        await appointmentsInsert.apply(context, [appointmentData]);
        assert.fail("Expected error was not thrown");
      } catch (err) {
        assert.instanceOf(err, Meteor.Error);
        assert.match(err.message, /Last name is required/);
      }
    });
  });
}
