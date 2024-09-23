import { Meteor } from "meteor/meteor";
import expect from "expect";
import { AppointmentsCollection } from "../appointments";
import "../appointmentsPublications";

describe("Appointments Publications", function () {
  const appointmentOne = {
    _id: "testId1",
    date: "2024-10-10",
    firstName: "John",
    lastName: "Doe",
    allDay: false,
    userId: "userId1",
  };

  const appointmentTwo = {
    _id: "testId2",
    date: "2024-10-11",
    firstName: "Jane",
    lastName: "Doe",
    allDay: false,
    userId: "userId1",
  };

  const appointmentThree = {
    _id: "testId3",
    date: "2024-10-11",
    firstName: "Jane",
    lastName: "Smith",
    allDay: false,
    userId: "userId2",
  };

  const appointmentFour = {
    _id: "testId4",
    date: "2024-10-12",
    firstName: "John",
    lastName: "Smith",
    allDay: false,
    userId: "userId2",
  };

  const appointmentFive = {
    _id: "testId5",
    date: "2024-10-12",
    firstName: "David",
    lastName: "Jackson",
    allDay: false,
    userId: "userId2",
  };

  beforeEach(async function () {
    await AppointmentsCollection.removeAsync({});
    await AppointmentsCollection.insertAsync(appointmentOne);
    await AppointmentsCollection.insertAsync(appointmentTwo);
    await AppointmentsCollection.insertAsync(appointmentThree);
    await AppointmentsCollection.insertAsync(appointmentFour);
    await AppointmentsCollection.insertAsync(appointmentFive);
  });

  it("publishes appointments only belonging to the logged-in user", async function () {
    const res = Meteor.server.publish_handlers["appointments"].apply({
      userId: "userId1",
    });
    const appointments = await res.fetchAsync();
    expect(appointments.length).toBe(2);
    expect(appointments[0]).toEqual(appointmentOne);
  });

  it("publishes appointments only belonging to a different logged-in user", async function () {
    const res = Meteor.server.publish_handlers["appointments"].apply({
      userId: "userId2",
    });
    const appointments = await res.fetchAsync();
    expect(appointments.length).toBe(3);
    expect(appointments[0]).toEqual(appointmentThree);
  });

  it("publishes no appointments when the logged-in user has none", async function () {
    const res = Meteor.server.publish_handlers["appointments"].apply({
      userId: "userId3",
    });
    const appointments = await res.fetchAsync();
    expect(appointments.length).toBe(0);
  });
});
