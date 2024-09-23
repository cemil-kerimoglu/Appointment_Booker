import { Meteor } from "meteor/meteor";
import { AppointmentsCollection } from "./appointments";

Meteor.publish("appointments", function () {
  if (!this.userId) {
    return this.ready();
  }

  return AppointmentsCollection.find({ userId: this.userId });
});
